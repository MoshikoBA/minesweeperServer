function createBoard(rows, cols, flags) {
    const board = [];
    var flagsAdded = 0;

    // init board with zeros
    for (i = 0; i < rows; i++) {
        board[i] = [];
        for(j = 0; j < cols; j++) {
            board[i][j] = 0;
        }
    }

    // put flags
    while (flagsAdded < flags) {
        var randRow = Math.floor(Math.random() * Math.floor(rows));
        var randCol = Math.floor(Math.random() * Math.floor(cols));

        if (board[randRow][randCol] === 0) {
          board[randRow][randCol] = -1;
          flagsAdded ++;
        }
    }

    // fill the other cells
    for (i = 0; i < rows; i++) {
        for (j = 0; j < cols; j++) {
            if (board[i][j] != -1) {
                board[i][j] = findValue(i, j, board, rows, cols);
            }
        }
    }

    return board;
}

function findValue(row, col, board, numOfRows, numOfCols) {
    var value = 0

    // row above
    if (row - 1 >= 0) {
        if (col - 1 >= 0 && board[row - 1][col - 1] === -1) {
            value ++;
        }

        if (board[row - 1][col] === -1) {
            value ++;
        }

        if (col + 1 < numOfCols && board[row - 1][col+ 1] === -1) {
            value ++;
        }
    }

    // same row
    if (col - 1 >= 0 && board[row][col - 1] == -1) {
        value ++
    }

    if (col + 1 < numOfCols && board[row][col + 1] === -1) {
      value ++;
    }

    //row below
    if (row + 1 < numOfRows) {
        if (col - 1 >= 0 && board[row + 1][col - 1] === -1) {
            value ++;
        }

        if (board[row + 1][col] === -1) {
            value ++;
        }

        if (col + 1 < numOfCols && board[row + 1][col+ 1] === -1) {
            value ++;
        }
    }

    return value
}

exports.createBoard = createBoard;
