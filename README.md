# Coy Discover

A standalone Part B take-home submission. Discover shows one fictional profile at a time. Swipe right to like or left to pass on mobile, or use the action buttons. A match is revealed only when both sides have liked each other.

## Run locally

Requires Node.js 24 or later. The app starts with a single demo user and automatically seeds 30 fictional profiles. No credentials are required.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Home is a blank placeholder and Matches lists mutual matches.

```sh
npm test
npm run build
npm start
```

The app uses `.data/discover.sqlite` by default. To start a fresh demo while keeping existing progress, launch with a new path, for example `COY_DB_PATH=.data/demo-2.sqlite npm run dev`. For a hosted demo, run the Node server with a persistent writable volume mounted at the database location. State belongs to the single demo user, so every visitor to a shared deployment would share that user's progress.

## Walk through the demo

1. **Pass on Anika Rao.** The first card leaves and Rohan appears.
2. **Like Rohan Mehta.** Discover advances to Meera with no match reveal.
3. **Like Meera Nair.** The match dialog opens.
4. **View matches and reload.** Meera remains in Matches. Return to Discover and the first three profiles stay out of the deck.

## API

| Method | Path | Result |
| --- | --- | --- |
| GET | `/feed` | `{ profiles }` containing only unswiped public profile fields |
| POST | `/swipe` | Accepts `{ profileId, decision }`, where decision is `like` or `pass`. Returns `{ recordedDecision, createdMatch, match }`. |
| GET | `/matches` | `{ matches }` containing reciprocal likes and their match timestamps |

Malformed swipes return `400` and unknown profile IDs return `404`. The first decision for a profile is final. A repeated request returns the stored decision and sets `createdMatch` to false. Each non-null match contains `profile` and `matchedAt`.

## Backend design

- SQLite enforces one swipe per actor and target. In one transaction the server records the swipe and checks for a reciprocal like.
- Matches are derived from the two stored likes. This keeps the swipe and match state in sync and prevents duplicate match records.
- Only server modules load incoming likes. The feed selects display fields explicitly, and the match endpoints only return match details for reciprocal likes.
- The automated tests cover feed privacy, matching outcomes, persistence after reopening SQLite, duplicate submissions, invalid inputs, and an exhausted deck.

All profile names and bios are fictional. Portraits are generated placeholders served locally.
