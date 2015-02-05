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
	y: 0
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

/*
 * Globals
 * TODO: Probably should group these nicely or at least move them out of the global namespace.
 */

autoRepeatDelay = 14;
currentPiece = null;
placedSquares = [];
numRows = 20;
numCols = 10;
fps = 30;
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
	ENTER: 13,
	SPACE: 32,

	LEFT:  37,
	UP:    38,
	RIGHT: 39,
	DOWN:  40,
	
	I:     73,
	J:     74,
	L:     76,
	O:     79,
	T:     84,
	S:     83,
	Z:     90,

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

isSquarePlacedAt = function(x, y) {
	var i;
	for(i = 0; i < placedSquares.length; i++) {
		if(placedSquares[i].x === x && placedSquares[i].y === y) {
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

spawnPiece = function(forceType) {
	var x, y, type, rotation;
	
	x = Math.round(numCols / 2) - 2;
	y = numRows - 3;
	type = forceType || randomPieceType();
	rotation = 0;
	
	// TODO: Accurately position spawned piece. Maybe do this inside makePiece? Currently just a rough approximation.
	currentPiece = makePiece(x, y, type, rotation);
};

// returns whether or not the piece has been placed.
lowerPiece = function() {
	var i;

	// see if any square below the current piece is occupied or is the ground
	for(i = 0; i < currentPiece.squares.length; i++) {
		if(currentPiece.squares[i].y === 0 || isSquarePlacedAt(currentPiece.squares[i].x, currentPiece.squares[i].y - 1)) {
			return true;
		}
	}

	// square can be lowered
	// TODO: Ideally we would just call currentPiece.y-- and code elsewhere will figure out that the squares need to be lowered.
	for(i = 0; i < currentPiece.squares.length; i++) {
		currentPiece.squares[i].y--;
	}
	currentPiece.y--;

	return false;
};

rotatePiece = function(rotationAmount) {
	var i, newRotation, testPiece;

	newRotation = (currentPiece.rotation + rotationAmount) % rotations[currentPiece.type].length;

	// see if the destination rotation is occupied
	testPiece = makePiece(currentPiece.x, currentPiece.y, currentPiece.type, newRotation);
	for(i = 0; i < testPiece.squares.length; i++) {
		if(isSquarePlacedAt(testPiece.squares[i].x, testPiece.squares[i].y)) {
			return;
		}
	}

	// square can be rotated
	currentPiece = testPiece;
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
	// TODO: Ideally we would just call currentPiece.x += xDelta; and code elsewhere will figure out that the squares need to be shifted.
	for(i = 0; i < currentPiece.squares.length; i++) {
		currentPiece.squares[i].x += xDelta;
	}
	currentPiece.x += xDelta;
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

		// is there a better way to do this? We want to continue to the next row as soon as we find a piece but we're inside
		// an inner for loop so we break, catch the break via emptyFound and then continue.
		if(emptyFound === true) {
			continue;
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
		// TODO: see if this can better be refactored. Manually adjusting the loop counter is kinda gross.
		rowNum--;
	}
};

update = function() {
	var placed;

	placed = false;

	// get input
	
	// only triggering when pressed for just 1 frame is equivalent to being a keydown event.
	if(keys.framesPressed(keys.UP) === 1) {
		rotatePiece(1);
	}

	// If the key has been held for a while, trigger additional movement every frame the key continues to be held calledDelayed Auto Shift (DAS).
	if(keys.framesPressed(keys.RIGHT) === 1 || keys.framesPressed(keys.RIGHT) >= autoRepeatDelay) {
		shiftPiece(1);
	}
	if(keys.framesPressed(keys.LEFT) === 1 || keys.framesPressed(keys.LEFT) >= autoRepeatDelay) {
		shiftPiece(-1);
	}

	// we want to be able to hold down to lower the piece quickly so we don't test for just === 1
	// kind of like DAS but we don't want to wait.
	if(keys.framesPressed(keys.DOWN) > 0) {
		placed = lowerPiece();
	}

	if(keys.framesPressed(keys.SPACE) === 1) {
		while(placed === false) {
			placed = lowerPiece();
		}
	}

	// debug tools
	pieceTypes.forEach(function(type) {
		if(keys.framesPressed(keys[type])) {
			spawnPiece(type);
		}
	});

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
	// TODO: this might not go here but it kinda makes more sense than in update().
	keys.incrementPressedKeys();
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