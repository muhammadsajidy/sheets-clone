# Sheetly

A real-time collaborative spreadsheet built with Next.js, TypeScript, Tailwind CSS, and Firebase.

## Deployed Link
https://sheets-clone-eta.vercel.app/

## Demo Video


---

## Features

- **Real-time sync** — changes appear instantly across all open sessions via Firestore `onSnapshot`
- **Presence system** — see who's online, their avatar, and which cell they're on in real time
- **Formula support** — `=SUM`, `=AVERAGE`, `=MIN`, `=MAX`, arithmetic operators, cross-cell references
- **Write-state indicator** — visual feedback showing Saving / Saved / Error status
- **Authentication** — Google sign-in and email/password via Firebase Auth
- **Identity** — display name and presence color set on first login, visible to all collaborators
- **Keyboard navigation** — Arrow keys, Tab, Enter navigate between cells

---

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Firebase** — Firestore, Realtime Database, Auth

---

## Architecture Decisions

### Data Structure
Cell data is stored in a Firestore subcollection at `documents/{id}/cells/{cellId}` rather than as a nested object on the document itself.

**Why:** Firestore delivers changes at the document level. If cells were stored as a nested object, every keystroke from any user would send the entire sheet to all listeners. With per-cell documents, only the changed cell travels over the network. Concurrent writes to different cells can never collide — each cell is an independent document.

### Real-time Sync
Sync is handled via Firestore's `onSnapshot` listener rather than WebSockets or a dedicated server.

**Why:** `onSnapshot` provides sub-second sync across all connected clients with zero server infrastructure. Firebase handles connection management, reconnection logic, and offline write queuing automatically. When a user goes offline, writes are queued locally and synced when the connection is restored.

### Presence
User presence (online status, active cell) is stored in Firebase Realtime Database rather than Firestore.

**Why:** RTDB is optimized for ephemeral, high-frequency data. The `onDisconnect().remove()` API automatically removes a user's presence entry the moment their connection drops — whether they close the tab, lose network, or their browser crashes. This is impossible to replicate reliably in Firestore. Each browser tab gets a unique `sessionId` (`uid_randomString`) so the same user in multiple tabs is handled correctly — closing one tab doesn't remove the other's presence.

### Contention Handling
Concurrent edits to the same cell use a **last-write-wins** strategy. The last debounced write to reach Firestore wins.

**Why this was chosen over alternatives:**
- **Optimistic locking** — prevents silent data loss but still doesn't merge changes. Adds complexity without solving the core problem.
- **Operational Transformation (OT)** — what Google Docs uses. Merges changes correctly but requires a dedicated server to sequence operations, and is enormously complex to implement correctly. Out of scope for this project.

For a spreadsheet where users typically work in different cells simultaneously, last-write-wins is a pragmatic and honest v1 solution. Users are visually warned when another user is on the same cell via a colored border and floating name tag, reducing the likelihood of simultaneous edits.

### Formula Parser
Built from scratch without external libraries. Supports:
- `=SUM(A1:A3)` — range sum
- `=AVERAGE(A1:A3)` — range average
- `=MIN(A1:A3)` — range minimum
- `=MAX(A1:A3)` — range maximum
- Arithmetic: `=A1+B2*3/C1`
- Cross-cell references: `=A1*2`
- Error states: `#CIRC` (circular reference), `#DIV/0!`, `#ERROR`, `#VALUE`

Circular references are detected by passing a `computing` Set through recursive calls — if the same cellId appears twice in the call chain, `#CIRC` is returned immediately.

`Function()` is used instead of `eval()` for expression evaluation — it runs in strict mode and has a slightly smaller attack surface.

### Debouncing
Writes to Firestore are debounced per cell (1000ms). Each cell has its own independent timer so editing A1 then B1 quickly saves both correctly. A global debounce would cancel A1's save when B1 is edited.

---

## What I Chose Not To Build

These are deliberate omissions, not oversights:

| Feature | Reason |
|---|---|
| Operational transformation | Requires dedicated server, weeks of complexity |
| Undo/redo history | Would need operation log per cell, out of scope |
| Cell formatting (bold, italic) | Bonus feature, prioritised core functionality |
| Column/row resize | Bonus feature |
| Nested formula functions | e.g. `=SUM(SUM(...))` — adds parser complexity with minimal real-world value |
| Copy/paste across cells | Out of scope for v1 |
| Virtualized rendering | Grid is capped at 26×200 rows, fast enough without virtualisation |

---

## Running Locally

1. Clone the repo
   ```bash
   git clone https://github.com/yourusername/sheets-clone.git
   cd sheets-clone
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create `.env.local` from the example
   ```bash
   cp .env.local.example .env.local
   ```

4. Fill in your Firebase config in `.env.local`
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=
   ```

5. Run the development server
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

---

## Known Limitations

- Same-cell concurrent edits use last-write-wins — one user's change may be silently overwritten
- No offline indicator in the UI (writes queue automatically but the save indicator stays "Saving...")
- Formula parser does not support nested functions
- No row/column resize or cell formatting

---

## Project Structure

```
├── app/
│   ├── page.tsx              # Login page
│   ├── onboarding/page.tsx   # Display name + color setup
│   ├── dashboard/page.tsx    # Document list
│   └── doc/[id]/page.tsx     # Sheet editor
├── components/
│   ├── Grid.tsx              # Spreadsheet grid
│   ├── FormulaBar.tsx        # Formula input bar
│   └── PresenceBar.tsx       # Online users avatar stack
├── hooks/
│   ├── useSheet.ts           # Cell state + formula computation
│   ├── useSync.ts            # Firestore real-time sync
│   └── usePresence.ts        # RTDB presence
├── lib/
│   ├── firebase.ts           # Firebase initialization
│   └── formulaParser.ts      # Formula engine
├── context/
│   └── AuthContext.tsx       # Auth state + functions
└── types/
    └── index.ts              # Shared TypeScript interfaces
```