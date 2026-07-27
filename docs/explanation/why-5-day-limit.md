# Why a 5-Day Limit?

The live (non-archived) data always covers a 5-day rolling window. Here's
why.

## It's a hard NASA FIRMS API constraint

FIRMS's area API caps a single request at a 5-day window
(`DAY_RANGE = 5` in `scripts/fetch-firms.mjs`) — there's no way to ask for
more in one call. Each satellite (Suomi NPP, NOAA-20, NOAA-21) is queried
separately, but each query is still capped at 5 days.

## It's also a reasonable UX default

- ✅ Long enough to see recent fire activity patterns
- ✅ Recent enough for actionable data
- ✅ Fast to load and interact with in the browser
- ✅ Easy timeline to reason about with the time slider

## Want more history?

The 5-day cap only applies to the _live_ window. The project accumulates
history beyond it in a local archive (up to 90 days), populated by the
3-hour cron and reachable via the time slider or a manual backfill — see
[Work with archives](../how-to/work-with-archives.md).

## Technical implementation

See `scripts/fetch-firms.mjs`:

```javascript
const DAY_RANGE = 5
```

This constant is a NASA FIRMS API limit, not something you can freely
increase — requesting more than 5 days per call is rejected by the API
itself. `FIRMS_BACKFILL_DAYS=<n> npm run fetch-firms` works around this by
walking backwards in `DAY_RANGE`-sized chunks to populate the archive.
