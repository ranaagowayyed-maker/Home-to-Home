# From Home To Home (من البيت للبيت) — Product Requirements Document

## 1. Project Identity

| Field | Value |
|---|---|
| Project Name | From Home To Home (من البيت للبيت) |
| Project ID | PRD-001 |
| Version | v1.0 |
| Status | Draft |
| Priority | High |
| Created Date | 2026-10-10 |
| Last Updated | 2026-10-10 |
| Owner | Rana |
| Team Members | Frontend Dev, Backend Dev, Designer, QA |
| Tech Stack | React 18, TypeScript, Tailwind CSS; .NET 10, C#, ASP.NET Core Web API, Entity Framework Core; PostgreSQL, Redis; Vercel, Railway; GitHub Actions |
| Repository | [TBD] |
| Git Branch Prefix | NNN-feature-name |
| PRD File Path | docs/PRD.md |

## 2. Problem & Purpose

### Problem Statement
Mothers who cook well at home have no simple way to earn money from their meals, and customers lack access to affordable, authentic homemade food. Existing delivery platforms list only restaurants, so homemade food is not served by any mainstream channel.

### Purpose
From Home To Home is a web application where mothers showcase homemade meals, customers browse and order them, and delivery personnel view ready orders and accept delivery requests. The product follows the familiar food-delivery model, replacing restaurants with home cooks. The MVP is deliberately minimal: three roles, one ordering flow, cash on delivery.

### Business Value
- Increases revenue for home cooks by giving them a storefront with no setup cost.
- Earns a commission per order (commission collection is deferred to v2; v1 records the data needed to calculate it).
- Opens an unserved market segment: customers who prefer home-cooked food.

### Opportunity
Restaurant-focused delivery apps leave homemade food unserved. A simple, role-based marketplace can capture this segment, create income for home cooks and delivery personnel, and provide a foundation for payments, ratings and expansion in v2.

## 3. Goals & Objectives

### Primary Goal
Let mothers list homemade meals so customers can order them and delivery personnel can pick up and deliver them, live within 8 weeks of kickoff (2026-10-10 to 2026-12-05).

### Objectives
1. Deliver role-based sign-up and login for customers, mothers and delivery personnel by end of Phase 1 (2026-10-24).
2. Enable a mother to publish a meal in under 2 minutes and a customer to place an order in under 3 minutes by launch.
3. Enable delivery personnel to see and accept a delivery request in under 3 taps by launch.
4. Provide order status tracking (status refresh within 15 seconds) for all three roles by end of Phase 2 (2026-11-07).
5. Reach at least 100 delivered orders within 30 days of public launch.

### Success Definition
The MVP is successful when an order can travel end to end (placed, prepared, picked up, delivered) with all three roles using only the web app, and the launch metrics in Section 12 are met at the 30-day review.

### Non-Goals
- Online payment of any kind (cash on delivery only).
- Ratings and reviews.
- Live map tracking.
- Native mobile app.
- Analytics dashboards and reporting.
- Admin panel.

## 4. Scope

### In Scope
- Sign-up and login for three roles: customer, mother, delivery person.
- Mother meal listings (create, edit, hide, archive) with photo.
- Customer meal browsing and ordering from one mother per order, cash on delivery.
- Delivery request visibility and acceptance by delivery personnel.
- Order status tracking for all three roles.
- P1 features listed in Section 6 (search and filters, order history, in-app notifications, mother availability toggle, profile editing).

### Out of Scope
- Online payment, ratings and reviews, live map tracking, native mobile app, analytics, third-party integrations (other than product analytics and photo storage), admin panel. All deferred to v2.

### Assumptions
- The MVP launches in a single city or area [TBD], so no geographic routing logic is required.
- Currency is a single configured currency [TBD]; prices are stored in minor units.
- Delivery fee is a flat amount set by an environment variable.
- Users self-register without manual approval; moderation is handled manually by the owner outside the product in v1.
- Delivery personnel use their own vehicles and collect cash from customers.
- Cash collected is settled between the delivery person and mother outside the product in v1.

### Constraints
- 8-week delivery window with a fixed team of Frontend Dev, Backend Dev, Designer and QA.
- Web only; responsive design required because most users are expected to use phones.
- No payment gateway, no maps API, no admin UI in v1.

### Dependencies
- Third-party service availability: Vercel, Railway, object storage for meal photos, PostHog or Mixpanel.
- Design assets readiness (logo, color palette, meal placeholder image) by end of Phase 1.
- Stakeholder review availability for the approval gates in Section 15.

## 5. Users & Personas

### Primary User
Customer who orders homemade meals 2–3 times a week to get affordable, authentic home-cooked food.

### Secondary Users
Mothers (home cooks) who publish and prepare meals; delivery personnel who deliver them; an operations viewer who monitors overall order status.

### Persona 1 — Sara (Primary)
- **Name:** Sara
- **Role:** Customer
- **Goal:** Find and order a homemade meal in a few taps.
- **Pain Point:** Restaurant apps do not offer homemade food, and there is no trusted way to find it.
- **Tech Level:** Medium
- **Frequency:** 2–3 times per week
- **Success Definition:** Sara places an order, knows its status at all times, and receives the meal at her door.

### Persona 2 — Fatima
- **Name:** Fatima
- **Role:** Mother (home cook)
- **Goal:** Earn income by selling meals she already cooks, on her own schedule.
- **Pain Point:** No simple channel to reach customers beyond her neighborhood; posting on social media is manual and unreliable.
- **Tech Level:** Low–Medium
- **Frequency:** Daily
- **Success Definition:** Fatima publishes a meal in minutes, receives orders, and hands them to a delivery person without phone calls to coordinate.

### Persona 3 — Omar
- **Name:** Omar
- **Role:** Delivery person
- **Goal:** See which orders need delivery and accept the ones he can complete.
- **Pain Point:** Orders are arranged through scattered phone calls and messages; he cannot see what is available.
- **Tech Level:** Medium
- **Frequency:** Daily, in peak meal hours
- **Success Definition:** Omar accepts a request, picks up the order, delivers it, and marks it delivered without ambiguity about who owns the delivery.

### Persona 4 — Karim (Secondary, Operations Viewer)
- **Name:** Karim
- **Role:** Operations viewer (owner's team)
- **Goal:** Visibility into status and results.
- **Pain Point:** No single place to see the current state of orders.
- **Tech Level:** Low–Medium
- **Frequency:** Weekly
- **Success Definition:** Karim can read order counts and statuses at the 1-week, 2-week and 30-day reviews. (No dedicated interface in v1; data is read through the product analytics tool and read-only database queries.)

## 6. MoSCoW Prioritization

### Must Have — P0

| ID | Feature | Status | Description | Assigned To | Sprint |
|---|---|---|---|---|---|
| P0-F001 | Role-Based Authentication | TODO | Register, log in and log out as customer, mother or delivery person with session refresh | Backend Dev, Frontend Dev | Sprint 1 |
| P0-F002 | Mother Meal Listing Management | TODO | Mothers create, edit, hide and archive meals with price and photo | Backend Dev, Frontend Dev, Designer | Sprint 1 |
| P0-F003 | Browse Meals & Place Order | TODO | Customers browse available meals, build a single-mother cart and place a cash-on-delivery order | Backend Dev, Frontend Dev | Sprint 2 |
| P0-F004 | Delivery Request Acceptance | TODO | Delivery personnel view open delivery requests and accept one | Backend Dev, Frontend Dev | Sprint 2 |
| P0-F005 | Order Status Tracking | TODO | Role-restricted status transitions and a status timeline visible to all parties on the order | Backend Dev, Frontend Dev, QA | Sprint 2 |

### Should Have — P1

| ID | Feature | Status | Description | Assigned To | Sprint |
|---|---|---|---|---|---|
| P1-F001 | Meal Search & Filters | TODO | Search meals by name and filter by category and maximum price | Backend Dev, Frontend Dev | Sprint 3 |
| P1-F002 | Order History | TODO | Role-scoped list of past and current orders with status filter | Backend Dev, Frontend Dev | Sprint 3 |
| P1-F003 | In-App Order Notifications | TODO | Notification bell with unread count for order events | Backend Dev, Frontend Dev | Sprint 3 |
| P1-F004 | Mother Availability Toggle | TODO | Mothers pause and resume accepting orders | Backend Dev, Frontend Dev | Sprint 3 |
| P1-F005 | Profile Editing | TODO | Users edit name, phone, address and role-specific profile fields | Backend Dev, Frontend Dev | Sprint 3 |

### Could Have — P2

| ID | Feature | Status | Description | Assigned To | Sprint |
|---|---|---|---|---|---|
| P2-F001 | Dark Mode | TODO | Theme toggle with persisted preference | Frontend Dev, Designer | Backlog |
| P2-F002 | Keyboard Shortcuts | TODO | Shortcuts for common actions on mother and delivery screens | Frontend Dev | Backlog |
| P2-F003 | Bulk Actions | TODO | Hide or show multiple meals at once | Backend Dev, Frontend Dev | Backlog |

### Won't Have — P3

| ID | Feature | Status | Description | Assigned To | Sprint |
|---|---|---|---|---|---|
| P3-F001 | Online Payment | SKIPPED | Card or wallet payment; v1 is cash on delivery only | — | v2 |
| P3-F002 | Ratings & Reviews | SKIPPED | Customer ratings of meals, mothers and delivery | — | v2 |
| P3-F003 | Live Map Tracking | SKIPPED | Real-time delivery location on a map | — | v2 |
| P3-F004 | Native Mobile App | SKIPPED | iOS and Android apps | — | v2 |
| P3-F005 | Admin Panel | SKIPPED | Back-office user, order and commission management | — | v2 |

## 7. Functional Requirements

### P0-F001 — Role-Based Authentication
- **Description:** Users register with name, email, phone, password and a role (customer, mother, delivery person). Mothers also enter a kitchen name. Login issues a short-lived access token and a rotating refresh token. Every API endpoint except register, login and refresh requires a valid token and enforces role permissions.
- **User Story:** As Sara, a customer, I want to create an account and log in so that I can order meals. As Fatima, I want my own account so that only I can manage my meals. As Omar, I want a delivery account so that I can see delivery requests.
- **Trigger:** An unauthenticated user opens the app or clicks Sign up / Log in.
- **Pre-conditions:** The email is not already registered (for sign-up); the account exists (for login).
- **Post-conditions:** An account with the chosen role exists; a session is active; the user lands on their role home (customer: Browse Meals; mother: My Meals; delivery: Available Deliveries).
- **Main Flow:**
  1. The user opens the landing page and clicks Sign up.
  2. The user selects a role and fills name, email, phone, password (and kitchen name for mothers).
  3. The client validates fields inline.
  4. The user submits; the system creates the account and issues tokens.
  5. The system redirects to the role home and shows "Welcome, {name}".
  6. On later visits, the user logs in with email and password and lands on the role home.
  7. The user logs out from the header menu; the system revokes the refresh token and returns to the landing page.
- **Alternate Flows:**
  - A1: Email already registered → inline error "This email is already registered. Log in instead."
  - A2: Wrong credentials → generic error "Email or password is incorrect"; after 5 failed attempts in 15 minutes the account is rate-limited for 15 minutes.
  - A3: Access token expired → client silently refreshes; if refresh fails, the user is redirected to login with "Your session expired."
  - A4: A user opens a page outside their role → redirected to their role home with "You don't have access to that page."
- **UX States:**
  - Validation: inline field errors (email format, password ≥ 8 characters with a letter and a number, phone format, required fields).
  - Loading: submit button shows a spinner and is disabled during requests.
  - Error: field-level errors for validation; banner for server or network errors with Retry.
  - Success: redirect to role home with a welcome toast.
- **Acceptance Criteria:**
  - [ ] A user can register with each of the three roles and receives the matching role home.
  - [ ] Registering with an existing email returns 409 and shows the inline error.
  - [ ] Passwords are stored hashed; plaintext is never returned or logged.
  - [ ] Access tokens expire in 15 minutes; refresh tokens rotate on every use and the old token is rejected.
  - [ ] A protected endpoint called without a token returns 401; called with the wrong role returns 403.
  - [ ] After 5 failed logins in 15 minutes, further attempts return 429.
  - [ ] Logout invalidates the refresh token.

### P0-F002 — Mother Meal Listing Management
- **Description:** Mothers create meals with name, description, category, price and photo; edit them; hide or show them; and archive them. Hidden and archived meals do not appear in customer browsing.
- **User Story:** As Fatima, I want to list the meals I cook with a photo and price so that customers can find and order them.
- **Trigger:** Fatima opens My Meals and clicks New Meal, or selects an existing meal.
- **Pre-conditions:** Fatima is logged in with the mother role.
- **Post-conditions:** The meal is stored and, if visible, appears in customer browsing.
- **Main Flow:**
  1. Fatima opens My Meals (empty state: "No meals yet. Add your first meal.").
  2. She clicks New Meal.
  3. She fills name (3–80 characters), description (up to 500), category, price (greater than 0), and uploads a photo (JPEG or PNG, up to 5 MB).
  4. She clicks Save; the system validates and stores the meal.
  5. The system shows "Meal 'Stuffed Grape Leaves' published" and returns to the list.
  6. Fatima can later edit a meal, toggle Visible/Hidden, or archive it.
- **Alternate Flows:**
  - A1: Photo upload fails or exceeds 5 MB → field error; the meal can still be saved with the placeholder image.
  - A2: Archiving a meal that is in an open order → meal is archived; existing orders keep their price and name snapshot.
  - A3: A mother tries to edit another mother's meal → 403 and "You can only edit your own meals."
- **UX States:**
  - Validation: inline errors for name length, price greater than 0, and photo type or size.
  - Loading: skeleton list while loading; Save shows a spinner and disables the form.
  - Error: banner "Couldn't save the meal. Try again." with a Retry button; form data is preserved.
  - Success: toast confirmation after every save, archive or visibility change.
- **Acceptance Criteria:**
  - [ ] A mother can create a meal with all required fields and see it in My Meals.
  - [ ] A visible meal from an available mother appears in customer browsing on the next refresh.
  - [ ] A hidden or archived meal never appears in customer browsing and cannot be added to a cart.
  - [ ] Price must be greater than 0 and name 3–80 characters; invalid input is rejected client- and server-side.
  - [ ] A mother cannot view the edit form of or modify another mother's meal (403).
  - [ ] Archiving a meal does not change existing orders' item names or prices.

### P0-F003 — Browse Meals & Place Order
- **Description:** Customers browse available meals, open a meal, add quantities to a cart that holds meals from one mother only, enter delivery details, review the total (subtotal plus flat delivery fee) and place a cash-on-delivery order.
- **User Story:** As Sara, I want to browse homemade meals and order one so that dinner arrives at my door and I pay in cash.
- **Trigger:** Sara opens Browse Meals after login.
- **Pre-conditions:** Sara is logged in as a customer; at least one visible meal from an available mother exists.
- **Post-conditions:** An order exists with status PLACED, with item name and price snapshots; the cart is cleared.
- **Main Flow:**
  1. Sara lands on Browse Meals and sees meal cards (photo, name, price, kitchen name).
  2. She opens a meal and sets the quantity (1–10).
  3. She clicks Add to cart; the cart badge updates.
  4. She opens the cart, reviews items, subtotal, delivery fee and total.
  5. She clicks Checkout and confirms the delivery address, phone and optional notes (prefilled from her profile).
  6. The page states "Payment: cash on delivery".
  7. She clicks Place Order; the system creates the order.
  8. Sara sees "Order #1042 placed" and is taken to the order tracking page.
- **Alternate Flows:**
  - A1: The cart contains meals from mother A and Sara adds one from mother B → the system asks "Start a new cart? Your current cart has meals from another kitchen." and replaces the cart on confirmation.
  - A2: A meal becomes hidden or its mother unavailable before checkout → order is rejected with 409; the cart highlights unavailable items for removal.
  - A3: The cart is empty → Checkout is disabled and the page shows "Your cart is empty. Browse meals."
  - A4: Network failure on Place Order → error with Retry; the same request cannot create duplicate orders (idempotency key).
- **UX States:**
  - Validation: address and phone required; quantity 1–10; inline errors.
  - Loading: skeleton cards on browse; Place Order shows a spinner and is disabled.
  - Error: banner with Retry; unavailable items flagged in the cart.
  - Success: confirmation message with the order number and a link to tracking.
- **Acceptance Criteria:**
  - [ ] Browse shows only visible meals from available mothers.
  - [ ] A cart can hold meals from only one mother; adding another prompts to replace the cart.
  - [ ] Total equals the sum of item price × quantity plus the flat delivery fee, matching what the server stores.
  - [ ] Placing an order creates an order with status PLACED and stores item name and price snapshots.
  - [ ] Double-clicking Place Order creates exactly one order.
  - [ ] An order containing an unavailable meal is rejected with 409 and no order is created.
  - [ ] Only customers can place orders (mother and delivery roles receive 403).

### P0-F004 — Delivery Request Acceptance
- **Description:** When a mother marks an order ready for pickup, a delivery request opens. Delivery personnel see open requests (kitchen name and area, customer area, item count, delivery fee) and accept one. Acceptance is exclusive and atomic.
- **User Story:** As Omar, a delivery person, I want to see open delivery requests and accept one so that I can earn by delivering it.
- **Trigger:** Omar opens Available Deliveries.
- **Pre-conditions:** Omar is logged in as a delivery person and has fewer than 3 active deliveries; an open request exists.
- **Post-conditions:** The request is ACCEPTED by Omar; the order is assigned to him; the customer and mother can see his name and phone; he can see the full address and phone of the customer and the mother's pickup address.
- **Main Flow:**
  1. Omar opens Available Deliveries and sees open requests (empty state: "No deliveries right now. Check back soon.").
  2. He opens a request to see details.
  3. He clicks Accept Delivery.
  4. The system atomically assigns the request to him.
  5. Omar sees "Delivery accepted" and the order appears in My Deliveries with the pickup and dropoff details.
- **Alternate Flows:**
  - A1: Another delivery person accepts first → 409 and "This delivery was just taken." The list refreshes.
  - A2: Omar already has 3 active deliveries → Accept is disabled with "Finish an active delivery first."
  - A3: The order was cancelled or the request closed meanwhile → "This request is no longer available."
- **UX States:**
  - Validation: active-delivery limit shown inline on the Accept button.
  - Loading: skeleton list; Accept button spinner and disabled.
  - Error: banner with Retry for network errors; specific message for conflicts.
  - Success: toast "Delivery accepted" and navigation to My Deliveries.
- **Acceptance Criteria:**
  - [ ] Only requests with status OPEN appear in Available Deliveries.
  - [ ] Two simultaneous accept calls result in exactly one success and one 409.
  - [ ] After acceptance, the order's delivery person equals the accepting user and the request is no longer listed for others.
  - [ ] A delivery person with 3 active deliveries cannot accept a fourth.
  - [ ] The customer's full address and phone are visible to the delivery person only after acceptance.
  - [ ] Only delivery personnel can list or accept requests (403 for other roles).

### P0-F005 — Order Status Tracking
- **Description:** Orders move through a fixed lifecycle. Each role can perform only its allowed transitions. All parties on the order see the current status and a timeline, refreshed every 15 seconds.
- **User Story:** As Sara, I want to see where my order is so that I know when to expect it. As Fatima, I want to update the order status so that delivery can be arranged.
- **Trigger:** A user opens an order page or performs a status action.
- **Pre-conditions:** The order exists and the user is its customer, its mother, or its assigned delivery person.
- **Post-conditions:** The order status and timeline are updated; a delivery request opens when the status becomes READY_FOR_PICKUP.
- **Main Flow:**
  1. The order is created as PLACED and appears in the mother's incoming orders.
  2. Fatima clicks Accept & Start Preparing → PREPARING.
  3. Fatima clicks Mark Ready → READY_FOR_PICKUP, and a delivery request opens.
  4. After Omar accepts (P0-F004), he clicks Picked Up → OUT_FOR_DELIVERY.
  5. Omar clicks Delivered → DELIVERED.
  6. Sara sees the timeline update at each step ("Order #1042 is out for delivery").
- **Alternate Flows:**
  - A1: Fatima clicks Reject on a PLACED order → REJECTED; the customer sees "Fatima's kitchen couldn't take this order."
  - A2: Sara cancels while the order is PLACED → CANCELLED; cancel is not offered after PREPARING starts.
  - A3: A role attempts a transition not allowed for it or from the current status → 409 or 403, status unchanged.
- **UX States:**
  - Validation: only valid next actions are rendered as buttons; the server enforces the same rules.
  - Loading: action buttons show a spinner and are disabled; the timeline polls every 15 seconds.
  - Error: banner "Couldn't update the status. Try again."
  - Success: timeline entry with timestamp and a toast confirming the change.
- **Acceptance Criteria:**
  - [ ] Allowed transitions: PLACED→PREPARING and PLACED→REJECTED (mother); PLACED→CANCELLED (customer); PREPARING→READY_FOR_PICKUP (mother); READY_FOR_PICKUP→OUT_FOR_DELIVERY and OUT_FOR_DELIVERY→DELIVERED (assigned delivery person only).
  - [ ] Any other transition returns an error and does not change the order.
  - [ ] Marking READY_FOR_PICKUP creates exactly one OPEN delivery request.
  - [ ] Each transition records a timestamp visible on the timeline.
  - [ ] Only the order's customer, mother and assigned delivery person can read the order (403 for others).
  - [ ] The customer view reflects a status change within 15 seconds.

### P1-F001 — Meal Search & Filters
- **Description:** Customers search meals by name and filter by category and maximum price; results can be sorted by newest or price.
- **User Story:** As Sara, I want to search and filter meals so that I can find what I want quickly.
- **Trigger:** Sara types in the search box or selects a filter on Browse Meals.
- **Pre-conditions:** Sara is logged in as a customer.
- **Post-conditions:** The list shows only matching visible meals.
- **Main Flow:**
  1. Sara types "grape leaves" in the search box.
  2. The list updates after a 300 ms pause.
  3. She selects category Main Dish and sets a maximum price.
  4. She selects sort by price ascending.
  5. The list and result count update.
- **Alternate Flows:**
  - A1: No results → empty state "No meals match your search. Clear filters."
  - A2: Request fails → previous results stay and an error banner with Retry appears.
- **UX States:**
  - Validation: maximum price must be a positive number.
  - Loading: result list shows skeletons.
  - Error: banner with Retry.
  - Success: result count displayed, e.g. "12 meals".
- **Acceptance Criteria:**
  - [ ] Search matches meal name case-insensitively.
  - [ ] Category and price filters combine with search (AND).
  - [ ] Results exclude hidden meals, archived meals and meals of unavailable mothers.
  - [ ] Clearing filters restores the full list.

### P1-F002 — Order History
- **Description:** Each role sees a list of its orders (customer: orders placed; mother: orders received; delivery: orders delivered or in progress), with a status filter and a detail view.
- **User Story:** As Sara, I want to see my past orders so that I can check details and reorder.
- **Trigger:** The user opens Orders from the main navigation.
- **Pre-conditions:** The user is logged in.
- **Post-conditions:** None (read-only).
- **Main Flow:**
  1. Sara opens Orders.
  2. The system lists her orders newest first with number, date, kitchen, total and status.
  3. She filters by status.
  4. She opens an order to see items and the timeline.
- **Alternate Flows:**
  - A1: No orders → empty state "No orders yet. Browse meals."
  - A2: Load failure → error banner with Retry.
- **UX States:**
  - Validation: not applicable (read-only filter from a fixed list).
  - Loading: skeleton rows; pagination loads 20 per page.
  - Error: banner with Retry.
  - Success: list rendered with counts.
- **Acceptance Criteria:**
  - [ ] A user sees only orders they are a party to.
  - [ ] Orders are sorted newest first and paginated at 20.
  - [ ] The status filter returns only orders with the selected status.
  - [ ] The detail view shows item names and prices as at order time.

### P1-F003 — In-App Order Notifications
- **Description:** Users see a bell with an unread count and a list of notifications for order events. The client polls every 30 seconds.
- **User Story:** As Fatima, I want to be alerted when a new order arrives so that I can start preparing it.
- **Trigger:** An order event occurs, or the user opens the bell.
- **Pre-conditions:** The user is logged in.
- **Post-conditions:** Notifications exist for the affected users; opening one marks it read.
- **Main Flow:**
  1. Sara places Order #1042; the system creates a notification for Fatima ("New order #1042").
  2. Fatima's bell shows an unread count at the next poll.
  3. She opens the bell, clicks the notification, and lands on the order.
  4. The notification is marked read.
- **Alternate Flows:**
  - A1: No notifications → empty state "You're all caught up."
  - A2: Poll fails → silent retry on the next interval; an error is shown only if the user opens the bell.
- **UX States:**
  - Validation: not applicable (no user input).
  - Loading: bell list shows a spinner on first open.
  - Error: inline "Couldn't load notifications. Retry."
  - Success: unread count clears when notifications are read.
- **Acceptance Criteria:**
  - [ ] Notifications are created for: order placed (mother), status changes (customer), delivery request opened (all delivery personnel), delivery accepted (mother and customer).
  - [ ] A user can read only their own notifications.
  - [ ] Opening a notification marks it read and decreases the unread count.
  - [ ] The unread count refreshes within 30 seconds of the event.

### P1-F004 — Mother Availability Toggle
- **Description:** A mother pauses or resumes accepting orders with a single toggle. While paused, her meals are hidden from browsing and new orders to her are rejected.
- **User Story:** As Fatima, I want to pause orders when I am busy so that I do not receive orders I cannot prepare.
- **Trigger:** Fatima flips "Accepting orders" on My Meals.
- **Pre-conditions:** Fatima is logged in as a mother.
- **Post-conditions:** Her availability flag is updated.
- **Main Flow:**
  1. Fatima flips the toggle off.
  2. The system saves it and shows "You're paused. Customers can't see your meals."
  3. Later she flips it on and the meals reappear in browsing.
- **Alternate Flows:**
  - A1: Save fails → the toggle reverts and an error toast appears.
  - A2: A customer checks out a cart of a mother who just paused → 409 with "This kitchen is not taking orders right now."
- **UX States:**
  - Validation: not applicable (boolean toggle).
  - Loading: the toggle shows a spinner while saving.
  - Error: toggle reverts with an error toast.
  - Success: status label and toast confirm.
- **Acceptance Criteria:**
  - [ ] When off, none of the mother's meals appear in customer browsing.
  - [ ] When off, order creation containing her meals returns 409.
  - [ ] Orders already in progress are unaffected by the toggle.
  - [ ] Only the mother herself can change her availability.

### P1-F005 — Profile Editing
- **Description:** Users edit name, phone, address and city; mothers also edit kitchen name and bio. Email and role cannot be changed.
- **User Story:** As Sara, I want to save my address so that checkout is prefilled.
- **Trigger:** The user opens Profile from the header menu.
- **Pre-conditions:** The user is logged in.
- **Post-conditions:** Profile fields are updated and used to prefill checkout and mother listings.
- **Main Flow:**
  1. Sara opens Profile.
  2. She edits her address and phone.
  3. She clicks Save.
  4. The system validates and saves; "Profile updated" is shown.
- **Alternate Flows:**
  - A1: Validation errors → inline field errors; nothing is saved.
  - A2: Network failure → error banner with Retry; form values are kept.
- **UX States:**
  - Validation: phone format, required name, kitchen name 3–60 characters for mothers.
  - Loading: Save shows a spinner.
  - Error: banner with Retry.
  - Success: toast confirmation.
- **Acceptance Criteria:**
  - [ ] Email and role are read-only and rejected if sent in an update.
  - [ ] Updated address and phone prefill the next checkout.
  - [ ] Mothers can edit kitchen name and bio; other roles cannot.
  - [ ] Invalid phone or empty name is rejected with field-level errors.

## 8. Non-Functional Requirements

- **Performance:** Page load < 2s on a standard mobile connection; API p95 < 500ms; list endpoints paginated.
- **Security:** Authentication on all endpoints except register, login and refresh; role-based authorization on every route; all inputs validated server-side; passwords hashed with the ASP.NET Core password hasher; login rate limiting; AES-256 encryption at rest; TLS 1.3 in transit; photo uploads restricted to JPEG or PNG up to 5 MB; contact details exposed only to parties on an order.
- **Availability:** 99.9% uptime; daily backups with 30-day retention.
- **Scalability:** Stateless API behind a load balancer; Redis for rate limiting and caching; designed for 1,000 daily orders in v1 with horizontal scaling headroom.
- **Accessibility:** WCAG 2.1 AA.
- **Compatibility:** Chrome 100+, Safari 15+, Firefox 100+; responsive from 360 px width.
- **Data & Compliance:** GDPR applies if EU users; otherwise standard data-protection practices. Personal data is limited to name, email, phone and address; users can request deletion by contacting the owner in v1.
- **Observability:** Structured JSON logs with request IDs; alert when error rate > 1%; uptime check on a health endpoint.

## 9. Technical Architecture

- **Frontend:** React 18, TypeScript, Tailwind CSS; single-page app with role-based routing and responsive layouts; hosted on Vercel.
- **Backend:** .NET 10, C#, ASP.NET Core Web API (controllers, application services, dependency injection); REST API under /api/v1/ with OpenAPI documentation; containerized and hosted on Railway.
- **Database:** PostgreSQL (primary data, accessed through Entity Framework Core with the Npgsql provider) and Redis (rate limiting, caching of browse queries); EF Core migrations for schema changes.
- **Auth & Authorization:** ASP.NET Core JWT bearer authentication with access tokens (15 minutes) and rotating refresh tokens; role claim (CUSTOMER, MOTHER, DELIVERY) enforced by authorization policies; ownership checks on every resource.
- **Infrastructure & Deployment:** Vercel (frontend), Railway (API container, PostgreSQL, Redis); GitHub Actions CI/CD running lint, frontend tests (Vitest), backend build and tests (xUnit), and deploying to staging and production; environment variables for secrets and the flat delivery fee.
- **External Integrations:** S3-compatible object storage for meal photos (pre-signed uploads); PostHog or Mixpanel for product analytics. No payment, maps or SMS integrations in v1.
- **Testing:** Vitest and React Testing Library (frontend), xUnit (backend unit tests), WebApplicationFactory with a real PostgreSQL for backend integration tests, and QA end-to-end checks of the full order lifecycle.

## 10. Implementation Phases

### Phase 1 — Foundation
- **Goal:** Authentication, data model and the first core P0 feature (meal listings) working end to end.
- **Duration:** 2 weeks (2026-10-10 to 2026-10-24)
- [ ] Set up repository, CI/CD, staging environment and linting
- [ ] Create EF Core entities and migrations for the entities in Section 11.4
- [ ] P0-F001: Role-based authentication (API and UI)
- [ ] P0-F002: Meal listing management (API, UI, photo upload)
- [ ] Design system basics: layout, forms, buttons, toasts, role navigation
- [ ] Spike: atomic delivery acceptance and idempotent order creation
- [ ] **Validation:** A mother can register, log in and publish a meal on staging; QA signs off on P0-F001 and P0-F002 acceptance criteria.

### Phase 2 — Core Features
- **Goal:** Complete the order lifecycle across all three roles.
- **Duration:** 2 weeks (2026-10-24 to 2026-11-07)
- [ ] P0-F003: Browse meals, cart, checkout, place order
- [ ] P0-F005: Order status lifecycle, timeline and role-restricted transitions
- [ ] P0-F004: Delivery requests and atomic acceptance
- [ ] Mother incoming orders screen and delivery My Deliveries screen
- [ ] End-to-end test of the full lifecycle
- [ ] **Validation:** An order travels from PLACED to DELIVERED with three test users on staging; QA signs off on P0-F003, P0-F004 and P0-F005.

### Phase 3 — Polish & P1s
- **Goal:** Deliver the P1 features and polish the experience.
- **Duration:** 2 weeks (2026-11-07 to 2026-11-21)
- [ ] P1-F001: Meal search and filters
- [ ] P1-F002: Order history
- [ ] P1-F003: In-app order notifications
- [ ] P1-F004: Mother availability toggle
- [ ] P1-F005: Profile editing
- [ ] Empty, loading and error states reviewed on every screen
- [ ] Accessibility pass (WCAG 2.1 AA)
- [ ] **Validation:** All P1 acceptance criteria pass; internal beta users complete a full order without assistance.

### Phase 4 — Launch Hardening
- **Goal:** Testing, performance, security, monitoring and launch.
- **Duration:** 2 weeks (2026-11-21 to 2026-12-05)
- [ ] Regression and cross-browser testing (Chrome 100+, Safari 15+, Firefox 100+)
- [ ] Load test: API p95 < 500ms at expected peak
- [ ] Security review: authorization on every endpoint, rate limits, input validation
- [ ] Monitoring, alerting (error rate > 1%) and daily backups verified
- [ ] Analytics events instrumented (PostHog or Mixpanel)
- [ ] Beta launch (2026-11-28) with invited mothers and delivery personnel
- [ ] Public launch (2026-12-05)
- [ ] **Validation:** All P0 and P1 criteria pass in production; no open critical or high bugs; approvers sign off on launch.

## 11. System Design Details

### 11.1 User Flows
1. **Fatima publishes a meal:** Fatima opens the landing page → clicks Sign up → selects Mother and enters kitchen name "Fatima's Kitchen" → lands on My Meals (empty state) → clicks New Meal → enters "Stuffed Grape Leaves", category Main Dish, price and photo → clicks Save → sees "Meal 'Stuffed Grape Leaves' published".
2. **Sara places an order:** Sara logs in → lands on Browse Meals → opens "Stuffed Grape Leaves" → sets quantity 2 → Add to cart → opens the cart and sees the total with delivery fee → Checkout → confirms her address → Place Order → sees "Order #1042 placed" and the tracking page showing PLACED.
3. **Fatima handles the order:** Fatima's bell shows 1 unread → she opens Incoming Orders → opens Order #1042 → clicks Accept & Start Preparing → later clicks Mark Ready → sees "Waiting for a delivery person".
4. **Omar delivers:** Omar logs in → lands on Available Deliveries → opens the request for Order #1042 → clicks Accept Delivery → sees the pickup address in My Deliveries → clicks Picked Up → travels to Sara → clicks Delivered → sees "Order #1042 delivered".
5. **Sara tracks and receives:** Sara opens Order #1042 → the timeline moves from Preparing to Ready to Out for delivery → Omar's name and phone appear after acceptance → status becomes Delivered and Sara pays cash to Omar.
6. **Sara cancels:** Sara opens Order #1043 while it is PLACED → clicks Cancel Order → confirms in a dialog → sees "Order #1043 cancelled" and Fatima is notified.

### 11.2 Edge Cases
- Invalid input (empty name, price ≤ 0, malformed email) → request rejected with 422 → inline field errors.
- Empty states (no meals, no orders, no open deliveries, no notifications) → empty list returned → friendly empty-state text with a next action.
- Network or API failure during an action → request fails; form data preserved → banner "Something went wrong. Try again." with Retry.
- Order placed twice by double-click or retry → same idempotency key returns the original order → single order, no duplicate confirmation.
- Two delivery persons accept the same request → first wins atomically, second receives 409 → "This delivery was just taken."
- Meal hidden or mother paused after being added to a cart → checkout rejected with 409 → unavailable items flagged in the cart.
- Mother archives a meal that is in an open order → meal archived; order keeps its snapshot → order unaffected.
- Unauthorized access (customer calls a mother endpoint, user opens another user's order) → 403 → "You don't have access to that."
- Expired or revoked token → 401; refresh attempted once → silent refresh or redirect to login with "Your session expired."
- Customer cancels after PREPARING → transition rejected with 409 → Cancel button is not shown; message "The kitchen already started preparing this order."
- Duplicate email on registration → 409 → inline "This email is already registered."
- Photo over 5 MB or wrong type → upload rejected → field error; the meal can be saved with the placeholder image.
- Delivery person abandons an accepted delivery before pickup → v1 has no unassign flow; the owner reassigns manually in the database → documented in the operations runbook.

### 11.3 API Design

| Method | Endpoint | Purpose | Feature ID |
|---|---|---|---|
| POST | /api/v1/auth/register | Create an account with a role | P0-F001 |
| POST | /api/v1/auth/login | Log in and receive tokens | P0-F001 |
| POST | /api/v1/auth/refresh | Rotate refresh token and issue a new access token | P0-F001 |
| POST | /api/v1/auth/logout | Revoke the refresh token | P0-F001 |
| GET | /api/v1/auth/me | Return the current user and role | P0-F001 |
| POST | /api/v1/meals/upload-url | Get a pre-signed photo upload URL (mother) | P0-F002 |
| POST | /api/v1/meals | Create a meal (mother) | P0-F002 |
| GET | /api/v1/meals/mine | List the mother's own meals | P0-F002 |
| PATCH | /api/v1/meals/:id | Edit, hide/show or archive a meal (owner mother) | P0-F002 |
| GET | /api/v1/meals | Browse visible meals (customer); supports q, category, maxPrice, sort | P0-F003, P1-F001 |
| GET | /api/v1/meals/:id | Meal detail | P0-F003 |
| POST | /api/v1/orders | Place a cash-on-delivery order (customer, idempotency key) | P0-F003 |
| GET | /api/v1/orders/:id | Order detail and timeline (parties on the order) | P0-F005 |
| PATCH | /api/v1/orders/:id/status | Perform an allowed status transition | P0-F005 |
| GET | /api/v1/delivery-requests | List open delivery requests (delivery) | P0-F004 |
| POST | /api/v1/delivery-requests/:id/accept | Accept a request atomically (delivery) | P0-F004 |
| GET | /api/v1/delivery-requests/mine | List the delivery person's accepted deliveries | P0-F004 |
| GET | /api/v1/orders | Role-scoped order list with status filter and pagination | P1-F002 |
| GET | /api/v1/notifications | List the user's notifications and unread count | P1-F003 |
| POST | /api/v1/notifications/:id/read | Mark a notification read | P1-F003 |
| PATCH | /api/v1/mothers/me/availability | Toggle accepting orders (mother) | P1-F004 |
| GET | /api/v1/users/me | Read profile | P1-F005 |
| PATCH | /api/v1/users/me | Update profile | P1-F005 |

### 11.4 Data Model

**User**
- id: uuid (PK)
- name: string
- email: string (unique)
- phone: string
- passwordHash: string
- role: enum (CUSTOMER, MOTHER, DELIVERY)
- address: string (nullable)
- city: string (nullable)
- createdAt: timestamp

**MotherProfile** (one-to-one with User, role MOTHER)
- userId: uuid (PK, FK → User)
- kitchenName: string
- bio: string (nullable)
- isAvailable: boolean (default true)

**RefreshToken**
- id: uuid (PK)
- userId: uuid (FK → User)
- tokenHash: string
- expiresAt: timestamp
- revokedAt: timestamp (nullable)

**Meal**
- id: uuid (PK)
- motherId: uuid (FK → MotherProfile.userId)
- name: string
- description: string
- category: enum (MAIN_DISH, APPETIZER, DESSERT, PASTRY, DRINK, OTHER)
- priceMinor: integer
- photoUrl: string (nullable)
- isVisible: boolean (default true)
- isArchived: boolean (default false)
- createdAt: timestamp

**Order**
- id: uuid (PK)
- number: integer (unique, sequential, e.g. 1042)
- customerId: uuid (FK → User)
- motherId: uuid (FK → MotherProfile.userId)
- deliveryPersonId: uuid (FK → User, nullable)
- status: enum (PLACED, PREPARING, READY_FOR_PICKUP, OUT_FOR_DELIVERY, DELIVERED, REJECTED, CANCELLED)
- deliveryAddress: string
- customerPhone: string
- notes: string (nullable)
- subtotalMinor: integer
- deliveryFeeMinor: integer
- totalMinor: integer
- paymentMethod: enum (CASH_ON_DELIVERY)
- idempotencyKey: string (unique)
- createdAt: timestamp

**OrderItem**
- id: uuid (PK)
- orderId: uuid (FK → Order)
- mealId: uuid (FK → Meal)
- nameSnapshot: string
- unitPriceMinor: integer
- quantity: integer

**OrderStatusEvent**
- id: uuid (PK)
- orderId: uuid (FK → Order)
- status: enum (same values as Order.status)
- actorId: uuid (FK → User)
- createdAt: timestamp

**DeliveryRequest** (one-to-one with Order)
- id: uuid (PK)
- orderId: uuid (FK → Order, unique)
- status: enum (OPEN, ACCEPTED, CLOSED)
- acceptedById: uuid (FK → User, nullable)
- acceptedAt: timestamp (nullable)

**Notification**
- id: uuid (PK)
- userId: uuid (FK → User)
- orderId: uuid (FK → Order, nullable)
- type: enum (ORDER_PLACED, STATUS_CHANGED, DELIVERY_REQUEST_OPEN, DELIVERY_ACCEPTED)
- message: string
- readAt: timestamp (nullable)
- createdAt: timestamp

**Relationships:** User 1—1 MotherProfile; MotherProfile 1—N Meal; User (customer) 1—N Order; MotherProfile 1—N Order; User (delivery) 1—N Order; Order 1—N OrderItem; Order 1—N OrderStatusEvent; Order 1—1 DeliveryRequest; User 1—N Notification; User 1—N RefreshToken.

### 11.5 UX Rules
- Inline validation on every form with field-level error messages.
- Every server action shows a loading state (spinner and disabled control) and prevents double submission.
- Every successful save, status change or deletion shows a confirmation toast.
- Every list has a designed empty state with a next action, and every failed request shows a banner with Retry.
- Destructive actions (cancel order, reject order, archive meal) require a confirmation dialog.
- Mobile-first layouts; primary actions reachable with one thumb; touch targets at least 44 px.
- Order statuses use consistent labels, colors and icons in every role's view.
- Money is displayed in the configured currency with two decimals.

## 12. Success Metrics & KPIs

| Category | Metric | Target | Measurement Method |
|---|---|---|---|
| Business | Delivered orders in first 30 days after public launch | ≥ 100 | Count of orders with status DELIVERED in PostgreSQL |
| Business | Active mothers (≥ 1 visible meal) at 30 days | ≥ 20 | Count of mothers with at least one visible meal |
| Product | Customer activation: first order within 7 days of sign-up | > 60% | Funnel of sign-up to order placed in PostHog or Mixpanel |
| Product | Task completion: orders reaching DELIVERED out of orders placed (excluding customer cancellations) | > 80% | Order status counts in PostgreSQL |
| Product | Median time from READY_FOR_PICKUP to delivery acceptance | < 15 minutes | Timestamps from OrderStatusEvent and DeliveryRequest |
| Technical | API p95 response time | < 500 ms | APM / request logs |
| Technical | Error rate | < 0.1% | Error count over total requests in monitoring |
| Technical | Uptime | ≥ 99.9% | Uptime monitor on the health endpoint |
| User Satisfaction | Customer satisfaction score from a short survey sent to customers after 30 days | ≥ 4.0 / 5 | Survey responses (external form linked from email) |

- **Tracking Tool:** PostHog or Mixpanel
- **Review Frequency:** 1 week, 2 weeks and 30 days post-launch
- **Owner:** Rana

## 13. Timeline & Milestones

- **Start:** 2026-10-10
- **Launch:** 2026-12-05
- **Duration:** 8 weeks

| Milestone | Description | Due Date | Status | Owner |
|---|---|---|---|---|
| Kickoff | Team aligned, environments requested | 2026-10-10 | Planned | Rana |
| PRD Approved | Product Owner and Engineering Lead approve v1.0 | 2026-10-10 | Planned | Rana |
| Phase 1 Done | Auth, data model and meal listings on staging | 2026-10-24 | Planned | Backend Dev |
| Phase 2 Done | Full order lifecycle works end to end | 2026-11-07 | Planned | Backend Dev |
| Phase 3 Done | P1 features complete and polished | 2026-11-21 | Planned | Frontend Dev |
| Beta Launch | Invited mothers and delivery personnel | 2026-11-28 | Planned | Rana |
| Phase 4 Done | Hardening complete, production ready | 2026-12-04 | Planned | QA |
| Public Launch | Open registration | 2026-12-05 | Planned | Rana |

## 14. Risk Register

| ID | Description | Likelihood | Impact | Score | Mitigation | Owner |
|---|---|---|---|---|---|---|
| R-001 | Marketplace cold start: too few mothers or delivery personnel at launch, so orders go unfulfilled | High | High | 9 | Recruit a first cohort of mothers and delivery personnel before the beta; launch in a single area; open browsing only once at least 5 mothers are live | Rana |
| R-002 | Scope creep from adding features beyond MoSCoW | Medium | High | 6 | Enforce MoSCoW; changes require owner approval and a PRD revision | Rana |
| R-003 | No delivery person accepts requests, leaving orders stuck in READY_FOR_PICKUP | Medium | High | 6 | Notify all delivery personnel on new requests; owner monitors the 15-minute acceptance KPI and reassigns manually | Rana |
| R-004 | Food safety or trust concerns with unvetted home cooks | Medium | High | 6 | Display kitchen name and contact; owner reviews mothers during beta; ratings and an admin panel prioritized for v2 | Rana |
| R-005 | Technical unknowns (atomic acceptance, idempotent orders, polling load, hosting .NET 10 on Railway) | Medium | Medium | 4 | Spike in Phase 1 including a containerized deploy of the API; load test in Phase 4 | Backend Dev |
| R-006 | Key-person dependency on a single developer per area | Medium | Medium | 4 | Document everything; pair on core flows; keep README and runbook current | Engineering Lead |
| R-007 | Cash handling disputes between customer, delivery person and mother | Medium | Medium | 4 | Show total clearly at checkout and on the delivery screen; record status timestamps; online payment planned for v2 | Rana |
| R-008 | Design assets or stakeholder reviews delayed | Low | Medium | 2 | Use placeholder assets; schedule review slots at the start of each phase | Designer |

## 15. Stakeholders & Approvals

| Name | Role | Involvement | Contact |
|---|---|---|---|
| Rana | Owner / PM | Defines scope, prioritizes, approves releases | [TBD] |
| [TBD] | Product Owner | Approves PRD and launch | [TBD] |
| [TBD] | Engineering Lead | Approves PRD, architecture and launch | [TBD] |
| [TBD] | Frontend Dev | Builds the web UI | [TBD] |
| [TBD] | Backend Dev | Builds the API and data layer | [TBD] |
| [TBD] | Designer | UX and visual design | [TBD] |
| [TBD] | QA | Test planning and sign-off | [TBD] |

| Gate | Approver | Required By | Status |
|---|---|---|---|
| PRD Approval | Product Owner, Engineering Lead | 2026-10-10 | Pending |
| Phase 2 Review (order lifecycle demo) | Product Owner | 2026-11-07 | Pending |
| Beta Launch Approval | Product Owner, Engineering Lead | 2026-11-28 | Pending |
| Public Launch Approval | Product Owner, Engineering Lead | 2026-12-05 | Pending |

## 16. References & Links

- **Design files:** [TBD]
- **Repository:** [TBD]
- **API docs:** [TBD]
- **Architecture diagrams:** [TBD]
- **Staging:** [TBD]
- **Production:** [TBD]
- **CI/CD:** GitHub Actions [TBD]
- **Monitoring:** [TBD]
- **Related PRDs:** [TBD]
- **Slack channel:** [TBD]
- **Meeting notes:** [TBD]

## 17. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| v1.0 | 2026-10-10 | Rana | Initial PRD created. |
