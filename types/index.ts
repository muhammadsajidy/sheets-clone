// Represents a user in the system, used for both authentication and presence tracking
export interface User {
  uid: string
  displayName: string
  color: string
  email: string
}

// This is the shape of the document stored in Firestore for each sheet
// Doesn't store the cell data directly, instead we store it in a separate collection for scalability
// and to prevent write collisions when multiple users are editing the same sheet
// this way, only the changed cell travels over the network instead of the entire sheet
// Cell data is stored in a subcollection at documents/{id}/cells/
export interface SheetDocument {
  id: string
  title: string
  ownerId: string
  collaborators: string[]
  createdAt: number
  updatedAt: number
}

// Represents an individual cell in the grid. The values for raw and computed
// are same for plain values and differ only when there is a formula
// Both are stored in firestore to ensure immediate access to the computed value immediately 
// without re-runninf the formula parser on the other users' end
export interface Cell {
  raw: string
  computed: string
}

// Uses an index signature — keys are dynamic cell IDs like "A1", "B3"
// Only filled cells exist in this map. A missing key = empty cell.
export interface CellMap {
  [cellId: string]: Cell
}

// Represents the information of users currently accessing the sheet.
// This is stored in real time database instead of Firestore and is temporary,
// meaning it doesn't persist when users disconnect. 
export interface PresenceUser {
  uid: string
  displayName: string
  color: string
  activeCell: string
  sessionId: string // handles the case when the same user has multiple tabs open, allowing us to track each session separately
}