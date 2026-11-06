# SchoolRide product spec

## What it is

Uber-style live tracking, repurposed for school transport. Schools license the service, and the team configures it for each school: its routes, its academic calendar, and thresholds such as exam pickup gaps. Transport operators and drivers are set up per school by the SchoolRide team.

Tracking runs in the background on the child's school tablet. A later feature lets the child view tuckshop items and specials on that tablet.

## Two apps, one backend

| | Ride (parent + driver) | Console (school admin) |
|---|---|---|
| Users | Parents and drivers: one app, role chosen at login | School transport coordinators and the SchoolRide team |
| Job | "Where is the ride right now?" | Set up the roster, routes, exam timetables and per-school settings |
| Form | Mobile-first, real-time, minimal | Desktop-first, forms and tables |
| Changes | Constantly (location, status) | Occasionally (each term, exam weeks) |

Admin features never go inside Ride. The two apps have different reliability needs and different security models.

## Parent app (this prototype)

- **Track**
  - Large ETA and the next stop.
  - A live map card; tapping it opens the full map.
  - The driver, with a one-tap call.
  - The route as a transit line: passed stops solid, the next stop ringed, later stops dotted.
- **Schedule.** A month calendar with each child's exam days. The detail card shows the adjusted pickup time, why it changed, and "Running late?".
- **History.** Each child's pickups and drop-offs.
- **Account**
  - Personal details, including linked children (read-only, school-verified).
  - Login and security: change password, optional recovery email.
  - Location.
  - Payment (planned).
- **Notifications**, from the header bell. Each item is tagged with a child, and tapping one switches to that child and opens the relevant screen. Preferences:
  - Pickup and drop-off: on by default.
  - Exam-day changes: on by default.
  - Route or driver changes: on by default.
  - Shared-ETA activity: off by default.
- **FAB** shortcuts: call, full route, exam day, share live ETA with another linked guardian (today only).
- **Onboarding**
  1. Phone number given to the school.
  2. 6-digit code. On success the boxes ring in turn, fan into a deck, merge into one box and show a check.
  3. "You're linked to": the children, each marked "verified by school".
  4. A notification soft-ask.

## Route and exam rules

- **Base route.** The order is fixed by home distance from the school. Mornings run farthest child first and closest last; afternoons run closest first and farthest last.
- **Exam days.**
  - Children writing exams travel together in the morning, timed by the earliest seating time. The seating buffer (e.g. seated 30 minutes before the start) is configurable per school.
  - Afternoon pickups are grouped by exam end time. Sort the end times, then chain consecutive children while each gap is within the school's threshold (default 120 minutes).
  - Each group is one trip, picked up at the group's latest end time.
  - A gap over the threshold starts a new trip, so the earliest finishers go home first and the vehicle comes back for the rest.
  - Example (threshold 120 min): end times 9:00, 9:45, 11:30 and 11:50 make one trip at 11:50, because no single gap is over 2 hours.
  - Overrides are computed once when the timetable is submitted, not on every location update. They apply to that date only, then the base route resumes.
  - Exam timetables are entered manually for now; automating that is planned.

## Privacy and security

- **Scoping in the backend.** A parent's token must make it structurally impossible to read another child's data, enforced in the query layer rather than the UI. Every parent query goes through `guardian_child_links`.
- **Linking.** Links are created and verified by the school at enrolment, never self-added.
- **Separate auth.** Admins (Console) and parents/drivers (Ride) use separate auth realms.
- **Short-lived live connections.** Live location connections use short-lived tokens scoped to one parent and one child.
- **Retention.** Raw location pings are kept for a short window (e.g. 7 to 30 days). Trip events are kept longer as the audit trail.
- **Compliance.** POPIA (South Africa) applies: the data is minors' locations.
- **Internal tools** follow the same scoping rules. No "god mode".

## Speed

- Drivers' phones publish location over MQTT or WebSocket, not polling.
- Parents subscribe only to their own child's vehicle channel.
- The location pipeline stays minimal: no clustering or business logic on each ping.
- Routing uses Google's official Directions/Routes API, not scraping. Mapbox or OpenRouteService are cost alternatives.

## Data model

| Table | Key fields | Notes |
|---|---|---|
| schools | id, name, academic_calendar_id, license_tier, custom_settings (jsonb) | Per-school thresholds and buffers live in custom_settings |
| routes | id, school_id, vehicle_id, driver_id, name, active | |
| vehicles | id, school_id, plate_number, capacity | |
| drivers | id, name, phone, auth_id, employed_by | Employed by the transport operator, not the school |
| guardians | id, name, phone, auth_id | |
| children | id, school_id, route_id, name, home_address, home_distance_km, grade | |
| **guardian_child_links** | guardian_id, child_id, relationship, verified_by, verified_at | The privacy boundary. Written by the school only |
| exam_entries | id, child_id, subject, exam_date, start_time, end_time, seated_buffer_min | Raw input from the school |
| exam_trip_overrides | id, route_id, exam_date, cluster_group, pickup_time, child_ids[] | Derived once, read by driver and parent apps |
| location_pings | vehicle_id, lat, lng, timestamp | Hot path, short retention |
| trip_events | id, child_id, route_id, date, event_type, timestamp, recorded_by | Picked up / dropped off / no-show; long retention |
| notifications | guardian_id, child_id, type, sent_at | Delivery log |
| licenses | school_id, plan, seats, renewal_date, billing_contact | Business layer, never visible to parents or drivers |

When a school edits an exam entry, recompute the overrides. Flag changes that affect a route already under way rather than silently reshuffling it.
