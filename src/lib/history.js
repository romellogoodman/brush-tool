// Undo/redo history of canvas snapshots.
//
// Snapshots are stored *post-action*: the stack always holds committed states,
// and its top is the state currently shown on the canvas. The first entry is
// the blank baseline pushed at startup.
//
//   push(snap) - commit a new state (clears the redo stack)
//   undo()     - step back one state, returns the state to display (or null)
//   redo()     - step forward one state, returns the state to display (or null)
//
// `max` caps the number of retained states; the oldest are dropped first.
export function createHistory(max = 20) {
  const past = [];
  let future = [];

  return {
    push(snap) {
      past.push(snap);
      if (past.length > max) past.shift();
      future = [];
    },
    undo() {
      // Keep at least the baseline so the canvas never goes empty.
      if (past.length <= 1) return null;
      future.push(past.pop());
      return past[past.length - 1];
    },
    redo() {
      if (future.length === 0) return null;
      const snap = future.pop();
      past.push(snap);
      return snap;
    },
    get past() {
      return past;
    },
    get future() {
      return future;
    },
  };
}
