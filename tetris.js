/*
 * generic function to make new objects that inherit from another object o
 */
Object.create = function object(o) {
	function F() {}
	F.prototype = o;
	return new F();
};

/*
 * Prototypes
 */

Square = {
	x: 0,
	y: 0,
	color: "#FFFFFF"
};

makeSquare = function(x, y, color) {
	var newSquare = Object.create(Square);
	newSquare.x = x;
	newSquare.y = y;
	newSquare.color = color;
	return newSquare;
};

Piece = {
	squares: []
};

makePiece = function(x, y, type) {
	var squares, rowNum, colNum;
	var newPiece = Object.create(Piece);

	// Otherwise all pieces share the same Piece.squares array. We want each piece to have it's own array of squares.
	newPiece.squares = [];

  squares = rotations[type][0];
	for(rowNum = 0; rowNum < squares.length; rowNum++) {
		for(colNum = 0; colNum < squares[rowNum].length; colNum++) {
			if(squares[rowNum][colNum] === type) {
				newPiece.squares.push(makeSquare(x + colNum, y + rowNum, pieceColors[type]));	
			}
		}
	}
	
	return newPiece;
};

/*
 * Globals
 */

currentPiece = null;
placedSquares = [];
numRows =  20;
numCols = 10;
fps = 30;
canvas = null;
context = null;
cellWidth = -1;
cellHeight = -1;
pieceTypes = ["I", "J", "L", "O", "T", "S", "Z"];
pieceColors = {
	"X": "#000000",
	"I": "#FF0000",
	"J": "#00FF00",
	"L": "#0000FF",
	"O": "#FF00FF",
	"T": "#FFFF00",
	"S": "#00FFFF",
	"Z": "#FFFFFF"
};
rotations = {
	"I": [
		 [["X", "X", "X", "X"],
		  ["X", "X", "X", "X"],
		  ["I", "I", "I", "I"],
		  ["X", "X", "X", "X"]],

		 [["X", "X", "I", "X"],
		  ["X", "X", "I", "X"],
		  ["X", "X", "I", "X"],
		  ["X", "X", "I", "X"]]
		 ],
	"J": [
		 [["X","X","J"],
		  ["J","J","J"],
		  ["X","X","X"]],

		 [["J","J","X"],
		  ["X","J","X"],
		  ["X","J","X"]],

		 [["J","J","J"],
		  ["J","X","X"],
		  ["X","X","X"]],

		 [["X","J","X"],
		  ["X","J","X"],
		  ["X","J","J"]]
		 ],
	"L": [
		 [["L","X","X"],
		  ["L","L","L"],
		  ["X","X","X"]],

		 [["X","L","X"],
		  ["X","L","X"],
		  ["L","L","X"]],

		 [["L","L","L"],
		  ["X","X","L"],
		  ["X","X","X"]],

		 [["X","L","L"],
		  ["X","L","X"],
		  ["X","L","X"]]
		 ],
	"O": [
		 [["O", "O"],
		  ["O", "O"]]
		 ],
	"T": [
		 [["X","T","X"],
		  ["T","T","T"],
		  ["X","X","X"]],

		 [["X","T","X"],
		  ["T","T","X"],
		  ["X","T","X"]],

		 [["T","T","T"],
		  ["X","T","X"],
		  ["X","X","X"]],

		 [["X","T","X"],
		  ["X","T","T"],
		  ["X","T","X"]]
		 ],
	"S": [
		 [["S","S","X"],
		  ["X","S","S"],
		  ["X","X","X"]],

		 [["X","X","S"],
		  ["X","S","S"],
		  ["X","S","X"]]
		 ],
	"Z": [
		 [["X","Z","Z"],
		  ["Z","Z","X"],
		  ["X","X","X"]],

		 [["Z","X","X"],
		  ["Z","Z","X"],
		  ["X","Z","X"]]
		 ]
};

/*
 * Input object
 */

 keys = {
	_pressed: {},

	SPACE: 32,
	UP: 38,
	LEFT: 37,
	DOWN: 40,
	RIGHT: 39,
	ENTER: 13,
  I: 73,
  J: 74,
  L: 76,
  O: 79,
  T: 84,
  S: 83,
  Z: 90,

	keyDown: function(ev) {
		keys._pressed[ev.keyCode] = true;
	},

	keyUp: function(ev) {
		keys._pressed[ev.keyCode] = false;
	},

	isPressed: function(keyCode) {
		return keys._pressed[keyCode] || false;
	},

	clearInputs: function() {
		keys._pressed = {};
	}
};
window.addEventListener("keydown", keys.keyDown);
window.addEventListener("keyup", keys.keyUp);

/*
 * Game Logic functions
 */

isSquarePlacedAt = function(x, y) {
	var i;
	for(i = 0; i < placedSquares.length; i++) {
		if(placedSquares[i].x === x && placedSquares[i].y === y) {
			return placedSquares[i];
		}
	}
	return false;
};

randomPieceType = function() {
	var history = [];
	var maxHistory = 4;
	var maxTries = 6;
	return function() {
		var i, piece, type, rowNum, colNum;

    // initial randomizer conditions
    if(history.length === 0) {
      history = ["Z", "S", "Z", "S"];
			type = ["I", "J", "L", "T"][Math.floor(Math.random() * 4)];
      history.push(type);
      return type;
    }

		for(i = 0; i < maxTries; i++) {
			type = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
			if(history.indexOf(type) === -1) {
				break;
			}
		}
		if(history.length >= maxHistory) {
			history.shift();
		}
		history.push(type);
		return type;
	};
}();

/*
 * Action functions
 */

spawnPiece = function(forceType) {
	currentPiece = makePiece(Math.round(numCols / 2) - 2, numRows - 4, forceType || randomPieceType());
};

lowerPiece = function() {
	// returns whether or not the piece has been placed.

	var i;
	// see if any square below the current piece is occupied or is the ground
	for(i = 0; i < currentPiece.squares.length; i++) {
		if(currentPiece.squares[i].y === 0 || isSquarePlacedAt(currentPiece.squares[i].x, currentPiece.squares[i].y - 1)) {
			return true;
		}
	}

	// square can be lowered
	for(i = 0; i < currentPiece.squares.length; i++) {
		currentPiece.squares[i].y--;
	}

	return false;
};

rotatePiece = function(rotationAmount) {

};

shiftPiece = function(xDelta) {
	var i;
	// see if any square next to the current piece is occupied or is the wall
	for(i = 0; i < currentPiece.squares.length; i++) {
		if(currentPiece.squares[i].x + xDelta < 0 || currentPiece.squares[i].x + xDelta >= numCols || isSquarePlacedAt(currentPiece.squares[i].x + xDelta, currentPiece.squares[i].y)) {
			return;
		}
	}

	// square can be shifted
	for(i = 0; i < currentPiece.squares.length; i++) {
		currentPiece.squares[i].x += xDelta;
	}
};

clearLines = function() {
	var i, rowNum, colNum, emptyFound;

	for(rowNum = 0; rowNum < numRows; rowNum++) {
		emptyFound = false;
		for(colNum = 0; colNum < numCols; colNum++) {
			if(isSquarePlacedAt(colNum, rowNum) === false) {
				// square not yet cleared
				emptyFound = true;
        break;
			}
		}
		if(emptyFound === true) {
      break;
		}

    // remove squares at the cleared line
    placedSquares = placedSquares.filter(function(square) {
        return square.y !== rowNum;
    });
    // move squares from above the cleared line down
    for(i = 0; i < placedSquares.length; i++) {
      if(placedSquares[i].y > rowNum) {
        // needs to be else if otherwise 
        placedSquares[i].y--;
      }
    }
    // need to check this i value again because the row above it got pushed into this one
    // TODO: see if this can better be refactored
    rowNum--;
	}
};

update = function() {
	var placed = false;
	// get input
	if(keys.isPressed(keys.DOWN)) {
		placed = lowerPiece();
	}
	
	if(keys.isPressed(keys.UP)) {
		rotatePiece();
	}

	if(keys.isPressed(keys.RIGHT)) {
		shiftPiece(1);
	}

	if(keys.isPressed(keys.LEFT)) {
		shiftPiece(-1);
	}

	if(keys.isPressed(keys.SPACE)) {
		while(placed === false) {
			placed = lowerPiece();
		}
	}

  // debug tools
  pieceTypes.forEach(function(type) {
    if(keys.isPressed(keys[type])) {
      spawnPiece(type);
    }
  })

	// gravity
	//placed = lowerPiece();

	if(placed === true) {
		// need to add currentPiece's squares to placedSquares somewhere around this time. Doesn't make sense to do it in clearLines(),
		// but afterwards would be too late since clearLines() expects placedSquares to have everything on the board in it at that point.
		// TODO: maybe this can work better somehow
		placedSquares = placedSquares.concat(currentPiece.squares);
		clearLines();
		spawnPiece();
	}
};

render = function() {
	var i;
	context.clearRect(0 , 0, canvas.width, canvas.height);

	for(i = 0; i < placedSquares.length; i++) {
		context.fillStyle = placedSquares[i].color;
		context.fillRect(placedSquares[i].x * cellWidth, canvas.height - cellHeight - placedSquares[i].y * cellHeight, cellWidth, cellHeight);
	}

	for(i = 0; i < currentPiece.squares.length; i++) {
		context.fillStyle = currentPiece.squares[i].color;
		context.fillRect(currentPiece.squares[i].x * cellWidth, canvas.height - cellHeight - currentPiece.squares[i].y * cellHeight, cellWidth, cellHeight);
	}
};

/*
 * Game Loop
 */

tick = function() {
	update();
	render();
};

init = function() {
	spawnPiece();

	canvas = document.createElement("canvas");
	context = canvas.getContext("2d");
	canvas.width = 480;
	canvas.height = 720;
	canvas.style.backgroundColor = "#000000";
	document.body.appendChild(canvas);

	cellWidth = canvas.width / numCols;
	cellHeight = canvas.height / numRows;

	setInterval(tick, 1000 / fps);
};

init();
