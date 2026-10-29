import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import { applyProblemToForm, problemOf, ProblemDetails } from './problem-details';

describe('problem details', () => {
  const problem: ProblemDetails = {
    type: 'about:blank',
    title: 'Validation failed',
    status: 422,
    code: 'validation_failed',
    errors: { Name: ['Name is too short.'], priceMinor: ['Price must be greater than 0.'] },
  };

  it('extracts the problem body from an HTTP error', () => {
    const error = new HttpErrorResponse({ status: 422, error: problem });
    expect(problemOf(error)?.code).toBe('validation_failed');
    expect(problemOf(new HttpErrorResponse({ status: 0, error: 'offline' }))).toBeNull();
  });

  it('maps field errors onto controls, honoring aliases', () => {
    const form = new FormGroup({ name: new FormControl('ab'), price: new FormControl('0') });

    expect(applyProblemToForm(form, problem, { priceMinor: 'price' })).toBeTrue();
    expect(form.controls.name.errors).toEqual({ server: 'Name is too short.' });
    expect(form.controls.price.errors).toEqual({ server: 'Price must be greater than 0.' });
    expect(form.controls.name.touched).toBeTrue();
  });

  it('reports when nothing could be mapped', () => {
    const form = new FormGroup({ email: new FormControl('') });
    expect(applyProblemToForm(form, problem)).toBeFalse();
    expect(applyProblemToForm(form, null)).toBeFalse();
  });
});
