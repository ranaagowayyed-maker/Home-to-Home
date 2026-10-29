import { Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  catchError,
  EMPTY,
  map,
  merge,
  Observable,
  of,
  scan,
  startWith,
  switchMap,
  takeWhile,
  timer,
} from 'rxjs';

export const POLL_INTERVAL_MS = 15_000;

export type Polled<T> = { ok: true; value: T } | { ok: false; error: unknown };

export interface PollOptions<T> {
  /** Each emission refetches immediately and restarts the interval. */
  reload$?: Observable<unknown>;
  /** Values obtained elsewhere (e.g. an action's response); shown at once, polling resumes after one interval. */
  push$?: Observable<T>;
  /** Stop polling once a value satisfies this (e.g. a terminal order status). */
  stopWhen?: (value: T) => boolean;
  /** Stop polling after an error that will not go away (e.g. 403). */
  stopOnError?: (error: unknown) => boolean;
  intervalMs?: number;
}

/** `timer` + `switchMap` polling that never errors: failures arrive as `{ ok: false }`. */
export function pollStream<T>(
  fetch: () => Observable<T>,
  options: PollOptions<T> = {},
): Observable<Polled<T>> {
  const interval = options.intervalMs ?? POLL_INTERVAL_MS;
  const stops = (result: Polled<T>): boolean =>
    result.ok ? !!options.stopWhen?.(result.value) : !!options.stopOnError?.(result.error);

  const run = (delay: number): Observable<Polled<T>> =>
    timer(delay, interval).pipe(
      switchMap(() =>
        fetch().pipe(
          map((value): Polled<T> => ({ ok: true, value })),
          catchError((error: unknown) => of<Polled<T>>({ ok: false, error })),
        ),
      ),
      takeWhile((result) => !stops(result), true),
    );

  const seeds = merge(
    (options.reload$ ?? EMPTY).pipe(
      startWith(null),
      map(() => null),
    ),
    (options.push$ ?? EMPTY).pipe(map((value): Polled<T> => ({ ok: true, value }))),
  );

  return seeds.pipe(
    switchMap((seed) => {
      if (seed === null) {
        return run(0);
      }
      return stops(seed) ? of(seed) : run(interval).pipe(startWith(seed));
    }),
  );
}

export interface PollState<T> {
  /** Latest successful value; kept when a later poll fails. */
  value: T | null;
  /** Error of the latest poll, or null when it succeeded. */
  error: unknown;
  loading: boolean;
}

/** Bridges a poll stream to a signal. Must be called in an injection context. */
export function toPollState<T>(stream: Observable<Polled<T>>): Signal<PollState<T>> {
  const initial: PollState<T> = { value: null, error: null, loading: true };
  return toSignal(
    stream.pipe(
      scan(
        (state: PollState<T>, result: Polled<T>): PollState<T> =>
          result.ok
            ? { value: result.value, error: null, loading: false }
            : { value: state.value, error: result.error, loading: false },
        initial,
      ),
    ),
    { initialValue: initial },
  );
}
