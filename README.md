# BusCompare

Compare bus fares from **redBus, AbhiBus, MakeMyTrip, IntrCity, Goibibo, Cleartrip,
FlixBus, EaseMyTrip, Paytm and ixigo** in one search.
The user enters source, destination, date, departure time and number of seats; the
server queries every platform in parallel, matches the same bus across platforms and
shows which platform is cheapest after discounts.

## Run

Requires Node.js 18+. There are no dependencies to install.

```bash
npm start
```

Open http://localhost:3000

## Project layout

```
server.js                  HTTP server, input validation, /api/search and /api/cities
providers/index.js         Queries all platforms in parallel and merges offers per bus
providers/<platform>.js    One adapter per platform (redbus, abhibus, makemytrip, intrcity,
                           goibibo, cleartrip, flixbus, easemytrip, paytm, ixigo)
providers/demoProvider.js  Demo adapter factory (deterministic fake fares)
providers/inventory.js     Shared demo bus inventory per route/date
public/                    Web page (HTML, CSS, JS)
```

## Adding a platform

1. Copy an existing adapter in `providers/` and change its `id`, `name`, `color` and settings.
2. Add it to the `PROVIDERS` list in `providers/index.js`.
3. Add the same `id`, `name` and `color` to `PLATFORMS` in `public/app.js`.

## Demo data vs live data

These platforms do not publish open APIs, and scraping their sites is against their
terms of use. Every adapter therefore returns **demo data** for now. Prices, seats and
offer codes are generated, not real.

To connect a real platform, replace that platform's `search(query)` with a call to its
partner or affiliate API (or an aggregator you have a contract with) and return offers
in the shape documented in `providers/demoProvider.js`. Nothing else needs to change.

`query` contains `{ from, to, date, time, departAfterMin, seats }`.
