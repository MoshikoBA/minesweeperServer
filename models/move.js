const MoveType = {
  REGULAR: "Regular",
  FLAG: "Flag",
  FUTILITY: "Futility"
}

class Move {
  selectedCell
  moveType
  cellsToOpen
}

module.exports = {
    MoveType,
    Move
};
