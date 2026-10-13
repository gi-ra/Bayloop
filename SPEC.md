# Bayloop — Product Spec

Oct 1, 2026 · @Gira

## Overview

Bayloop is one web system with three sides — customer, technician and admin — that matches everything Australian workshop software already does, then beats it on customer experience, speed for technicians, and owner insight.

### Who uses it

| Role | Device | Main job |
|---|---|---|
| Customer | Phone (no app download) | Book, approve work, track the car live, pay |
| Technician | Tablet or phone in the bay | Run job cards, inspect, photograph, log time and parts |
| Admin / front desk | Desktop | Bookings, quotes, invoices, parts, customer comms |
| Owner | Desktop or phone | Profit, productivity, cash flow, approvals |

### What "better than the market" means here

1. The customer never has to phone to ask "is my car ready?" — every stage updates them automatically.
2. A technician can do their whole job one-handed on a tablet with greasy gloves: big buttons, voice notes, photo-first.
3. The owner sees true profit per job (actual parts cost and actual tech hours vs what was quoted), not just revenue.
4. Approvals happen in minutes, with photo and video proof, while the car is still on the hoist.

## Market baseline

These are table stakes: every feature below already exists in at least one leading product, so ours must have all of them before anything extra.

| Feature | Seen in |
|---|---|
| Online bookings, drag-and-drop diary, tech allocation | Workshop Software, MechanicDesk |
| Quotes convert to jobs and invoices in one click | MechanicDesk |
| Digital vehicle inspections with photos and video, approval by text | Tekmetric, Shopmonkey |
| Default inspection template applied to every vehicle | Tekmetric |
| Two-way SMS, replies land against the job | Workshop Software, Shopmonkey |
| Digital signatures on job cards and authorisations | MechanicDesk |
| Service and rego reminders by SMS or email | MechanicDesk |
| Stock control, low-stock alerts, barcode scanners and label printers | MechanicDesk |
| Parts ordering from Repco and Burson | Workshop Software, WorkshopOS |
| Labour time guides inside the quote | Shopmonkey |
| Actual vs billable tech hours | Shopmonkey |
| Live workflow board (estimate, in progress, waiting on parts, ready) | Shopmonkey |
| Integrated payments and buy now, pay later | Tekmetric |
| Point of sale, technician time clocks | MechanicDesk, Tekmetric |
| Xero / MYOB sync | Workshop Software |
| Multi-site management | MechanicDesk |
| AI phone receptionist, review responder, lapsed-customer campaigns | WorkshopOS |

## Customer portal

Customers get a public website plus a phone-friendly portal, with login by a one-time SMS code instead of a password.

### Public website

- Services and fixed-price menu (logbook service, brakes, tyres, aircon, safety certificate)
- Instant quote estimator: enter rego, pick a service, see a price range
- Online booking with live availability, drop-off and pickup times
- Reviews, location map, opening hours, contact form

### Logged-in portal

- My vehicles: each car with its full service history, invoices and inspection reports
- Live job tracker showing the current stage, with a timeline of updates and photos
- Approve or decline each quote line separately, with photos and video of the issue
- "Declined for now" items saved, with a reminder when they're due
- Pay invoices online (card, Apple Pay, Google Pay, buy now pay later)
- Rebook in two taps from a past service
- Upload photos or a video of the problem before drop-off (e.g. a noise recording)
- Choose how to be contacted: SMS, email or both, and opt out of marketing

## Technician app

Technicians use a tablet-first web app (installable to the home screen) built for speed in the bay: large buttons, photo-first, minimal typing.

- **My jobs today**: assigned jobs in order, with bay number, vehicle, customer notes and promised time
- **Status buttons**: Start job, On the lift, Waiting on parts, Road test, Done. Each tap timestamps the job and can trigger a customer message
- **Digital inspection**: default checklist per service type, each item rated Good / Monitor / Urgent, with photos, video and measurements (tyre tread, brake pad mm)
- **Voice notes**: speak findings; the system turns them into text for the quote
- **Scan to start**: scan the rego plate or VIN with the camera to open the vehicle
- **Request parts**: add a part from the job card; it goes to the admin parts queue
- **Time clock**: clock on and off each job automatically from the status buttons
- **Before and after photos**: required at check-in and on completion, to protect against damage disputes
- **Works offline**: if Wi-Fi drops in the workshop, entries save and sync when it's back

## Admin / front desk

The front desk runs the whole workshop from one live screen: a board of every car by stage, plus the diary.

- **Workflow board**: cards for each car in columns (Booked, Checked in, Inspecting, Awaiting approval, On the lift, Waiting on parts, Ready, Paid). Drag to move; the customer is updated
- **Diary and bay planner**: bookings by day and by bay, technician capacity shown in hours, double-booking blocked
- **Customer and vehicle records**: rego and VIN lookup to auto-fill make, model and engine; full history; notes; marketing consent
- **Quotes**: canned jobs (e.g. "Logbook service, 4-cyl") with preset parts and labour; labour times; markup rules on parts
- **Invoices**: quote to job to invoice in one click; GST calculated; part payments and deposits
- **Inbox**: two-way SMS and email, every message attached to the right job
- **Parts queue**: part requests from technicians, order status, received, and supplier invoice matching
- **Stock**: on-hand quantities, low-stock alerts, barcode scanning, stocktake
- **Courtesy cars**: who has which loan car, fuel and damage check
- **Staff and permissions**: roles control who can see prices, give discounts or delete records; every change is logged

## Owner dashboard, finance and reporting

The owner's dashboard answers one question first: did each job make money, and why or why not.

- **True job profit**: quoted price vs actual parts cost (from supplier invoices) vs actual tech hours (from the time clock)
- **Technician productivity**: hours billed vs hours clocked per tech, per week
- **Approval rate**: share of recommended work customers approve, by tech and by service type
- **Comeback rate**: cars returning for the same fault within 30 days
- **Cash position**: unpaid invoices by age, deposits held, upcoming supplier bills
- **Xero sync**: invoices, payments, supplier bills and contacts flow into Xero, mapped to the right accounts, with GST coded
- **Exports**: every report downloads to Excel

## Notifications and live status

Every status change a technician or admin makes sends the customer an automatic SMS with a link to their live tracker, so nobody needs to phone in.

| Trigger | Message to customer |
|---|---|
| Booking made | Confirmation, drop-off time, address |
| Day before | Reminder with "Reply C to confirm, R to reschedule" |
| Car checked in | "We've got your car" + check-in photos |
| On the lift | "Your car is on the hoist now — we'll send findings shortly" |
| Inspection done | Findings with photos and an approve/decline link |
| Waiting on parts | Part name and expected arrival |
| Ready for pickup | Total, pay-online link, pickup hours |
| After pickup | Thank you + review request |
| Service due | Reminder by date or estimated kilometres |

- SMS provider: ClickSend (Australian) or Twilio; replies come back into the admin inbox
- Customers can turn off non-essential messages; marketing messages need opt-in
- Messages are templates the admin can edit, with the workshop's name and the customer's first name filled in
- The technician's status taps drive the texts; "On the lift" gets its own message so the customer knows work has started

## Parts ordering

Parts ordering is built in two stages, because Burson and Repco connect only with approved workshop systems, not with any custom site.

### Stage 1 — build now

- Technician requests a part from the job card; it lands in the admin parts queue
- Admin clicks "Order", which opens Burson EzyParts or Repco Navigator Pro with the vehicle details copied ready to paste
- Admin enters the supplier, part number, cost and expected arrival; the job moves to "Waiting on parts" and the customer is told
- On delivery, the part is ticked off and the supplier invoice matched to the job, so job profit uses the real cost
- Price comparison log: record each supplier's quoted price, so over time the system shows who is cheapest for what

### Stage 2 — apply for direct integration

- Contact Burson and Repco about becoming an integration partner (a business application, not code)
- Look at parts marketplaces with open APIs as an alternative
- Once approved, Claude Code can connect search, stock check and ordering directly into the job card

## Features that beat the competition

These are the features to build after the baseline; each targets a gap where existing products are weak or charge extra.

| Feature | Why it's better |
|---|---|
| Live car tracker page (like a food-delivery tracker) | Customer sees stage, photos and ETA without logging in to anything |
| Video walk-throughs | Tech records a 30-second clip of the problem; approval rates rise when customers can see it |
| Line-by-line approval with "Good / Better / Best" options | Customer picks a parts tier (budget vs premium) on each repair |
| Ask a question on any quote line | Customer taps a line to ask "Is this urgent?"; reply goes back by SMS |
| AI assistant for the front desk | Drafts quotes from tech voice notes, summarises vehicle history, answers "when's my car ready?" texts |
| Vehicle health score | One simple rating per car, updated each visit, shown to the customer |
| Predictive reminders | Uses past odometer readings to estimate when the next service is due, not just the date |
| Fleet accounts | Businesses with several vehicles get one login, monthly statements and approval limits |
| Comeback tracking | Flags repeat faults so quality problems are caught early |
| Loyalty and referrals | Points or a discount for each referred customer |
| Built-in Xero mapping for an accountant | Clean GST coding and job-level profit, designed by someone who does the books |

## Australian compliance, privacy and security

A custom system means the workshop owns the risk, so these are requirements from day one, not extras.

- **Data stays in Australia**: host the database in the Sydney region
- **Spam Act**: marketing SMS and email only with consent, and every one includes an unsubscribe option; job updates are service messages
- **Privacy**: a privacy policy on the site, collect only what's needed, let customers request their data
- **Payments**: card details are handled by the payment provider (Stripe or Square) and never stored in our database
- **GST**: tax invoices show ABN, GST amount and the words "Tax invoice"
- **Logins**: two-factor login for staff; customers log in by one-time SMS code
- **Permissions**: every database table protected by role rules, so a customer can only ever see their own cars
- **Audit log**: who changed what and when, especially prices, discounts and deletions
- **Backups**: automatic daily backups, with a tested restore
- **Safety certificates (QLD)**: only if the workshop is an Approved Inspection Station; confirm before offering it online

This isn't legal advice — have the privacy policy and terms checked before launch.

## Tech stack and data model

One Next.js project on Vercel, with Supabase for the database, logins and file storage, keeps everything in one place a beginner can manage.

| Part | Choice | Why |
|---|---|---|
| Website and all three apps | Next.js + Tailwind | One codebase; pages for /, /portal, /tech, /admin |
| Database, logins, photo storage | Supabase (Sydney region) | Role-based security rules built in |
| Hosting | Vercel | Deploys automatically from GitHub |
| SMS | ClickSend or Twilio | Two-way messages, cheap per text |
| Email | Resend | Booking and invoice emails |
| Payments | Stripe or Square | Card, Apple Pay, BNPL |
| Accounting | Xero API | Invoices, payments, bills |
| Rego / VIN lookup | Third-party vehicle data service | Auto-fill make, model, engine |

### Main database tables

- profiles (every user, with a role: customer, technician, admin, owner)
- customers, vehicles (rego, VIN, make, model, odometer)
- bookings, bays
- jobs (status, assigned tech, timestamps for each stage)
- inspections, inspection_items (rating, notes, photos, video)
- quotes, quote_lines (part or labour, tier, approved / declined)
- invoices, payments
- parts_requests, purchase_orders, suppliers, stock_items
- time_entries (tech, job, start, stop)
- messages (SMS and email, linked to job)
- audit_log

## Build phases and Claude Code prompts

Build in eight phases, testing each one with the workshop before starting the next; give Claude Code this whole document first, then one phase at a time.

**Before Phase 1** — save this spec as `SPEC.md` in the project folder, start Claude Code there, and send:

> Read SPEC.md. This is the full spec for a mechanic workshop system. Don't write code yet. Propose the folder structure, the full database schema with role-based security rules, and confirm the phase plan. I'm a beginner: explain each step and each command before you run it.

1. **Foundations** — Next.js project, Supabase connection, logins for all four roles, role-based security, staff two-factor
   - Prompt: Build Phase 1 from SPEC.md: project setup, Supabase auth with roles (customer, technician, admin, owner), and security rules so each role only sees its own data. Add tests that prove a customer cannot see another customer's vehicle.
2. **Customers, vehicles, bookings** — public site, booking form with live availability, admin diary and bay planner
3. **Jobs and technician app** — workflow board, status buttons, time clock, before and after photos
4. **Notifications** — SMS and email on each status change, including "On the lift", two-way inbox, live tracker page
5. **Inspections, quotes, approvals** — digital inspection checklist, photo and video, line-by-line customer approval with Good / Better / Best
6. **Invoices, payments, Xero** — invoice from job, online payment, Xero sync
7. **Parts and stock** — parts queue, supplier ordering (Stage 1), stock control, job profit using real costs
8. **Owner dashboard and extras** — profit, productivity and approval reports, AI front-desk assistant, predictive reminders, fleet accounts

**After every phase**, ask Claude Code: Review this phase for security problems and bugs, run the tests, and list anything I need to check by hand.

- [x] Phase 1 Foundations
- [x] Phase 2 Customers, vehicles, bookings
- [x] Phase 3 Jobs and technician app
- [x] Phase 4 Notifications
- [x] Phase 5 Inspections, quotes, approvals
- [x] Phase 6 Invoices, payments, Xero (Xero sync deferred — optional per phase plan)
- [x] Phase 7 Parts and stock
- [x] Phase 8 Owner dashboard (reports built; AI assistant, predictive reminders, fleet accounts deferred as follow-ups)

## Sources

- Workshop Software on the Xero App Store
- Workshop Software vs MechanicDesk
- Workshop Software parts integrations
- MechanicDesk features
- MechanicDesk home
- Tekmetric
- Tekmetric digital vehicle inspection
- Tekmetric default inspections
- Shopmonkey pricing and features
- Shopmonkey labour guide
- Shopmonkey workflow board
- WorkshopOS
- Burson EzyParts
