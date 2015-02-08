/*
 * generic function to make new objects that inherit from another object o
 */

Object.create = function object(o) {
	function F() {}
	F.prototype = o;
	return new F();
};

/*
 * Prototypes and maker functions
 */

Square = {
	x: 0,
	y: 0,
	// Maybe this should be a type instead of a color, and have the render code choose the color.
	color: "#FFFFFF"
};

makeSquare = function(x, y, color) {
	var newSquare;
	
	newSquare = Object.create(Square);
	
	newSquare.x = x;
	newSquare.y = y;
	newSquare.color = color;

	return newSquare;
};

Piece = {
	squares: [],
	type: "X",
	rotation: 0,
	x: 0,
	y: 0,
	dy: 0, // quantize effects of gravity

	translate: function(x, y) {
		this.x += x || 0;
		this.y += y || 0;
		for(var i = 0; i < this.squares.length; i++) {
			this.squares[i].x += x || 0;
			this.squares[i].y += y || 0;
		}
		return this;
	}
};

makePiece = function(x, y, type, rotation) {
	var squares, rowNum, colNum, newPiece;
	
	newPiece = Object.create(Piece);
	newPiece.x = x;
	newPiece.y = y;
	newPiece.type = type;
	newPiece.rotation = rotation;
	// Otherwise all pieces share the same Piece.squares array. We want each piece to have it's own array of squares.
	newPiece.squares = [];
	
	squares = rotations[newPiece.type][newPiece.rotation];
	for(rowNum = 0; rowNum < squares.length; rowNum++) {
		for(colNum = 0; colNum < squares[rowNum].length; colNum++) {
			if(squares[rowNum][colNum] === newPiece.type) {
				newPiece.squares.push(makeSquare(newPiece.x + colNum, newPiece.y + rowNum, pieceColors[newPiece.type]));
			}
		}
	}
	
	return newPiece;
};

Board = {
	gravity: 256 / 60, // cells per frame * 256
	remainingAREframes: 0,
	currentLockDelay: 0,
	currentPiece: null,
	holdPiece: null,
	holdAllowed: true,
	ghostPiece: null,
	placedSquares: [],
	renderXOffset: 0,

	// TODO: maybe make into some input map object
	shiftLeftKey: null,
	shiftRightKey: null,
	rotateCWKey: null,
	rotateCCWKey: null,
	softDropKey: null,
	hardDropKey: null,
	holdKey: null

	// TODO: move all the board specific functions in here so we don't have to pass it around everywhere.
};

makeBoard = function(renderXOffset) {
	var newBoard;
	
	newBoard = Object.create(Board);

	// Otherwise all boards share the same Piece.squares array. We want each piece to have it's own array of squares.
	newBoard.placedSquares = [];
	newBoard.renderXOffset = renderXOffset;
	return newBoard;
};

/*
 * Globals
 * TODO: Probably should group these nicely or at least move them out of the global namespace.
 */

debug = false;
boards = [];
showGhostPiece = true;
lockDelay = 30;
totalAREframes = 30; // frames between lock and spawn of next piece
autoRepeatDelay = 14;
numRows = 20;
numCols = 10;
fps = 60;
canvas = null;
context = null;
cellWidth = -1;
cellHeight = -1;
pieceTypes = ["I", "J", "L", "O", "T", "S", "Z"];
pieceColors = {
	"X": "#000000",
	"I": "#00FFFF",
	"J": "#0000FF",
	"L": "#FF8800",
	"O": "#FFFF00",
	"T": "#8800FF",
	"S": "#00FF00",
	"Z": "#FF0000"
};
ghostColors = {
	"X": "#000000",
	"I": "#004444",
	"J": "#000044",
	"L": "#442200",
	"O": "#444400",
	"T": "#220044",
	"S": "#004400",
	"Z": "#440000"
}
rotations = {
	// bitmaps for each piece in it's various rotations. bitmaps are not all the same size.
	// maybe they shouldn't be "X"s and piece types. Could do a 0, 1 bitmap instead and/or have some enum for the pieces.
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

	// keyCodes
	// TODO: prepend K_ to all codes
	SPACE: 32,

	LEFT:  37,
	UP:    38,
	RIGHT: 39,
	DOWN:  40,

	SHIFT: 16,

	R:     82,
	X:     88,
	
	I:     73,
	J:     74,
	L:     76,
	O:     79,
	T:     84,
	S:     83,
	Z:     90,

	K_EQUALS: 187,

	K_0:   48,
	K_1:   49,
	K_2:   50,
	K_3:   51,
	K_4:   52,
	K_5:   53,
	K_6:   54,
	K_7:   55,
	K_8:   56,
	K_9:   57,

	keyDown: function(ev) {
		// OS generally has it's own repeating key stuff which will retrigger keyDown events.This means a keyDown event can be triggered even though
		// the key is still held so we can't necessarily overwrite the value. This code basically ignores repeated keyDowns without keyUps in between.
		// Setting it to 0 means the incrementPressedKeys will pick it up. If we set it to 1 instead then the incrementPressedKeys will additionally
		// increment and it will 'skip' from 0/undefined straight to 2 as far as update() is concerned.
		// One solution is to run incrementPressedKeys
		// after update() is called but that's kinda weird too. Really we'd like to call incrementPressedKeys before handling the keyDown event
		// but I don't think we control that ordering.
		keys._pressed[ev.keyCode] = keys._pressed[ev.keyCode] || 0;
	},

	keyUp: function(ev) {
		delete keys._pressed[ev.keyCode];
	},

	framesPressed: function(keyCode) {
		return keys._pressed[keyCode] || 0;
	},

	incrementPressedKeys: function() {
		var keyCode;
		for(keyCode in keys._pressed) {
			keys._pressed[keyCode]++;
		};
	}
};
window.addEventListener("keydown", keys.keyDown);
window.addEventListener("keyup", keys.keyUp);

/*
 * Game Logic functions
 */

isValidPiece = function(piece, board) {
	for(i = 0; i < piece.squares.length; i++) {
		if(piece.squares[i].x < 0 || piece.squares[i].x >= numCols || piece.squares[i].y < 0 || isSquarePlacedAt(board, piece.squares[i].x, piece.squares[i].y)) {
			return false;
		}
	}
	return true;
};

isSquarePlacedAt = function(board, x, y) {
	var i;
	for(i = 0; i < board.placedSquares.length; i++) {
		if(board.placedSquares[i].x === x && board.placedSquares[i].y === y) {
			return true;
		}
	}
	return false;
};

randomPieceType = function() {
	// TGM randomizer algorithm
	var history = [];
	var maxTries = 6;
	return function() {
		var i, type;

		if(history.length === 0) {
			// initial randomizer conditions
			history = ["Z", "S", "Z", "S"];
			// NEVER let the first piece be OSZ so it doesn't run the regular algorithm. This rule is also why we don't just initialize history in the first place.
			type = ["I", "J", "L", "T"][Math.floor(Math.random() * 4)];
		} else {
			for(i = 0; i < maxTries; i++) {
				type = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
				if(history.indexOf(type) === -1) {
					break;
				}
			}
		}

		history.shift();
		history.push(type);
		return type;
	};
}();

/*
 * Action functions
 */

// returns the spawned piece if there is room for it to spawn, null otherwise
spawnPiece = function(board, forceType) {
	var x, y, type, rotation, testPiece;
	
	x = Math.round(numCols / 2) - 2;
	y = numRows - 3;

	// don't add forceType to history because it's used for debugging and swapping a hold piece back in
	// neither of which we want to count towards the history.
	type = forceType || randomPieceType();
	rotation = 0;
	
	// TODO: Accurately position spawned piece. Maybe do this inside makePiece? Currently just a rough approximation.

	testPiece = makePiece(x, y, type, rotation);
	if(isValidPiece(testPiece, board)) {
		return testPiece;
	} else {
		return null;
	}
};

rotatePiece = function(piece, rotationAmount, board) {
	var i, newRotation, testPiece;

	// we want the rotation to be (0, number of possible rotations for this piece] but since we allow negative rotation we need to add the number of possible rotations before
	// applying the modulus because -3 % 10 === -3 when we want -3 % 10 to be 7.
	newRotation = (rotations[piece.type].length + (piece.rotation + rotationAmount)) % rotations[piece.type].length;

	// in place
	testPiece = makePiece(piece.x, piece.y, piece.type, newRotation);
	if(isValidPiece(testPiece, board)) {
		return testPiece;
	}

	// I piece cannot kick in TGM2
	if(piece.type !== "I") {
		// 1 square right
		testPiece = makePiece(piece.x + 1, piece.y, piece.type, newRotation);
		if(isValidPiece(testPiece, board)) {
			return testPiece;
		}

		// 1 square left
		testPiece = makePiece(piece.x - 1, piece.y, piece.type, newRotation);
		if(isValidPiece(testPiece, board)) {
			return testPiece;
		}
	}

	return piece;
};

// shift and return the piece if possible, or return false
shiftPiece = function(piece, dx, dy, board) {
	piece.translate(dx, dy);
	if(isValidPiece(piece, board)) {
		return piece;
	}
	piece.translate(-dx, -dy);
	return false;
};

clearLines = function(board) {
	var i, rowNum, colNum, emptyFound;

	for(rowNum = 0; rowNum < numRows; rowNum++) {
		emptyFound = false;
		for(colNum = 0; colNum < numCols; colNum++) {
			if(isSquarePlacedAt(board, colNum, rowNum) === false) {
				// square not yet cleared
				emptyFound = true;
				break;
			}
		}

		// is there a better way to do this? We want to continue to the next row as soon as we find a piece but we're inside
		// an inner for loop so we break, catch the break via emptyFound and then continue.
		if(emptyFound === true) {
			continue;
		}

		// remove squares at the cleared line
		board.placedSquares = board.placedSquares.filter(function(square) {
			return square.y !== rowNum;
		});
		// move squares from above the cleared line down
		for(i = 0; i < board.placedSquares.length; i++) {
			if(board.placedSquares[i].y > rowNum) {
				// needs to be else if otherwise 
				board.placedSquares[i].y--;
			}
		}
		// need to check this i value again because the row above it got pushed into this one
		// TODO: see if this can better be refactored. Manually adjusting the loop counter is kinda gross.
		rowNum--;
	}
};

restart = function(board) {
	board.placedSquares = [];
	board.currentPiece = spawnPiece(board);
};

update = function() {
	var i, pieceLocked, tmpPiece;

	// TODO: probably just have a board.update() function that this function calls for each board.
	boards.forEach(function(board) {	
		pieceLocked = false;
		// debug tools
		if(debug === true) {
			// spawn a specific piece
			pieceTypes.forEach(function(type) {
				if(keys.framesPressed(keys[type]) === 1) {
					board.currentPiece = spawnPiece(board, type);
				}
			});
			// set gravity from 0 to 20G
			for(var i = 0; i <= 9; i++) {
				if(keys.framesPressed(keys["K_" + i]) === 1) {
					board.gravity = (i === 0) ? 0 : Math.pow(4, i); // 4^0 != 0 for 0G
				}
			}
			// toggle lock delay
			if(keys.framesPressed(keys.K_EQUALS) === 1) {
				lockDelay = lockDelay ? 0 : 30;
			}
			// manual reset
			if(keys.framesPressed(keys.R) === 1) {
				restart(board);
			}
		}

		// wait to spawn the next piece
		if(board.remainingAREframes > 0) {
			if(--board.remainingAREframes === 0) {
				board.holdAllowed = true;
				board.currentPiece = spawnPiece(board);
				// Initial Rotation System
				if(keys.framesPressed(board.rotateCWKey) > 0) {
					board.currentPiece = rotatePiece(board.currentPiece, 1, board);
				}
				if(keys.framesPressed(board.rotateCCWKey) > 0) {
					board.currentPiece = rotatePiece(board.currentPiece, -1, board);
				}
				// you can IRS to avoid losing
				if(!isValidPiece(board.currentPiece, board)) {
					restart(board);
				}
			} else {
				return; // we can't control anything so nothing to do this frame?
				// TODO: find a better/safer way to do this (and handle currentPiece === null)
			}
		}

		// get input
		// TODO: need to determine the appropriate order for applying inputs.
		// TODO: pick more ideal keys for controls.

		// only triggering when pressed for just 1 frame is equivalent to being a keydown event.
		if(keys.framesPressed(board.holdKey) === 1) {
			if(board.holdAllowed === true) {
				if(board.holdPiece === null) {
					board.holdPiece = board.currentPiece;
					board.currentPiece = spawnPiece(board);
				} else {
					tmpPiece = board.currentPiece;
					// don't just set currentPiece to holdPiece because holdPiece might have fallen. I guess we could just store the type but w/e for now
					// unless something comes up.
					board.currentPiece = spawnPiece(board, board.holdPiece.type);
					board.holdPiece = tmpPiece;
				}
			}
			// can't re-hold until a piece is locked.
			board.holdAllowed = false;
		}

		if(keys.framesPressed(board.rotateCWKey) === 1) {
			board.currentPiece = rotatePiece(board.currentPiece, 1, board);
		}
		if(keys.framesPressed(board.rotateCCWKey) === 1) {
			board.currentPiece = rotatePiece(board.currentPiece, -1, board);
		}

		// If the key has been held for a while, trigger additional movement every frame the key continues to be held calledDelayed Auto Shift (DAS).
		if(keys.framesPressed(board.shiftRightKey) === 1 || keys.framesPressed(board.shiftRightKey) >= autoRepeatDelay) {
			shiftPiece(board.currentPiece, 1, 0, board);
		}
		if(keys.framesPressed(board.shiftLeftKey) === 1 || keys.framesPressed(board.shiftLeftKey) >= autoRepeatDelay) {
			shiftPiece(board.currentPiece, -1, 0, board);
		}

		// we want to be able to hold down to lower the piece quickly so we don't test for just === 1
		// kind of like DAS but we don't want to wait.
		if(keys.framesPressed(board.softDropKey) > 0) {
			pieceLocked = !shiftPiece(board.currentPiece, 0, -1, board);
		}

		if(keys.framesPressed(board.hardDropKey) === 1) {
			while(shiftPiece(board.currentPiece, 0, -1, board)) {}
		}

		// piece locking
		if(shiftPiece(board.currentPiece, 0, -1, board)) {
			shiftPiece(board.currentPiece, 0, 1, board);
			board.currentLockDelay = 0; // still hovering, reset lock delay
		} else if(++board.currentLockDelay === lockDelay) {
				board.currentLockDelay = 0;
				pieceLocked = true;
		}
		if(pieceLocked) {
			// add the current piece to the board
			board.placedSquares = board.placedSquares.concat(board.currentPiece.squares);
			clearLines(board);
			board.remainingAREframes = totalAREframes;
			board.currentPiece = null;
		}

		// gravity
		if(!pieceLocked) {
			board.currentPiece.dy -= board.gravity / 256;
			while(board.currentPiece.dy <= -1) {
				board.currentPiece.dy++
				shiftPiece(board.currentPiece, 0, -1, board);
			}
		}
	});
};

render = function() {
	var i, ghostPiece;
	context.clearRect(0 , 0, canvas.width, canvas.height);

	boards.forEach(function(board) {
		for(i = 0; i < board.placedSquares.length; i++) {
			context.fillStyle = board.placedSquares[i].color;
			context.fillRect(board.renderXOffset + (board.placedSquares[i].x * cellWidth), canvas.height - cellHeight - board.placedSquares[i].y * cellHeight, cellWidth, cellHeight);
		}

		if(board.currentPiece !== null) {
			if(showGhostPiece) {
				ghostPiece = makePiece(board.currentPiece.x, board.currentPiece.y, board.currentPiece.type, board.currentPiece.rotation);
				while(shiftPiece(ghostPiece, 0, -1, board)) {}
				for(i = 0; i < ghostPiece.squares.length; i++) {
					context.fillStyle = ghostColors[ghostPiece.type];
					context.fillRect(board.renderXOffset + (ghostPiece.squares[i].x * cellWidth), canvas.height - cellHeight - ghostPiece.squares[i].y * cellHeight, cellWidth, cellHeight);
				}
			}
			
			for(i = 0; i < board.currentPiece.squares.length; i++) {
				context.fillStyle = board.currentPiece.squares[i].color;
				context.fillRect(board.renderXOffset + (board.currentPiece.squares[i].x * cellWidth), canvas.height - cellHeight - board.currentPiece.squares[i].y * cellHeight, cellWidth, cellHeight);
			}
		}

		if(board.holdPiece !== null) {
			context.font = "24px serif";
			context.fillStyle = "#FFFFFF";
	  		context.fillText("Hold Piece: " + board.holdPiece.type, board.renderXOffset, 24);
		}
	});
};

/*
 * Game Loop
 */

tick = function() {
	// TODO: this might not go here but it kinda makes more sense than in update().
	keys.incrementPressedKeys();
	update();
	render();
};

init = function() {
	canvas = document.createElement("canvas");
	context = canvas.getContext("2d");
	canvas.width = 960;
	canvas.height = 960;
	canvas.style.backgroundColor = "#000000";
	document.body.appendChild(canvas);

	cellWidth = (canvas.width / 2) / numCols;
	cellHeight = canvas.height / numRows;

	boards.push(makeBoard(0));
	boards.push(makeBoard(canvas.width / 2));
	boards[0].shiftLeftKey = keys.LEFT;
	boards[0].shiftRightKey = keys.RIGHT;
	boards[0].rotateCWKey = keys.UP;
	boards[0].rotateCCWKey = keys.X;
	boards[0].softDropKey = keys.DOWN;
	boards[0].hardDropKey = keys.SPACE;
	boards[0].holdKey = keys.SHIFT;
	
	boards.forEach(function(board) {
		board.currentPiece = spawnPiece(board);	
	});

	setInterval(tick, 1000 / fps);
};

init();
