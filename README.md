# Coy Discover

A standalone, mobile-first swipe discovery demo built for the Coy SDE Intern assignment.

## Features

- 30 seeded mock profiles with name, age, photo, bio, city and interests.
- One profile displayed at a time.
- Like and pass buttons for desktop.
- Drag left to pass and drag right to like on touch/pointer devices.
- Keyboard support: left arrow = pass, right arrow = like.
- Mutual matching: a match is created only when both sides have liked each other.
- Dedicated Matches view.
- Empty feed state after all profiles have been swiped.
- Persistent swipes and matches stored in a local JSON database file.
- Backend never sends incoming-like information to the frontend.
- Reset demo button for repeatable demonstrations.

## Tech stack

- Frontend: HTML, CSS and vanilla JavaScript
- Backend: Node.js and Express
- Persistence: JSON file store (permitted by the assignment)

## Requirements

- Node.js 18 or newer
- npm

## Run locally on Windows

1. Extract the project folder.
2. Open the folder in VS Code.
3. Open Terminal > New Terminal.
4. Install dependencies:

   ```powershell
   npm install
   ```

5. Start the server:

   ```powershell
   npm run dev
   ```

6. Open <http://localhost:3000>.

To run without auto-restart:

```powershell
npm start
```

## Demo matching

A handful of seeded profiles have already liked the demo user. Their incoming-like state is stored only on the server and is never returned by `GET /feed`. Like one of those profiles to trigger the mutual-match screen.

The app does not reveal incoming likes, and passing on a profile never creates a match.

## API

### `GET /feed`

Returns profiles the demo user has not swiped on. It deliberately omits the internal `likedUser` field.

### `POST /swipe`

Request body:

```json
{
  "profileId": "p03",
  "action": "like"
}
```

`action` must be `like` or `pass`. The response includes `matched: true` only when a like completes a mutual match.

### `GET /matches`

Returns mutual matches only.

### `GET /api/health`

Health check endpoint.

### `POST /api/demo/reset`

Resets the local demo data to the original 30 seeded profiles. This is provided for assessment demonstrations; remove or protect it before any public production deployment.

## Persistence

The server creates `data/store.json` on first launch. Swipes and matches are written to that file, so they survive page reloads and server restarts. The file is git-ignored because it contains local demo state.

## Tests

Run the included matching-rule tests:

```powershell
npm test
```

## Notes and limitations

- This is an assignment demo with one simulated logged-in user; it does not implement real authentication.
- Profile photos use remote placeholder image URLs and require an internet connection. If an image does not load, the rest of the profile remains usable.
- The JSON store is appropriate for a small single-user assessment demo. A production multi-user service should use a transactional database, authentication, rate limiting, moderation, consent flows and stronger access controls.
- The public demo reset endpoint is for local assessment use only and must be disabled or protected before deployment.
