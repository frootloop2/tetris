Game = {
	numRows: 20,
	numCols: 10,
	fps: 30,
	board: null,
	canvas: null,
	context: null,
	cellWidth: -1,
	cellHeight: -1,
	pieceColors: {
		"X": "#000000",
		"I": "#FF0000",
		"J": "#00FF00",
		"L": "#0000FF",
		"O": "#FF00FF",
		"T": "#FFFF00",
		"S": "#00FFFF",
		"Z": "#FFFFFF"
	},
	rotations: {
		"I": [
			 [["X", "X", "X", "X"],
			  ["I", "I", "I", "I"],
			  ["X", "X", "X", "X"],
			  ["X", "X", "X", "X"]],

			 [["X", "X", "I", "X"],
			  ["X", "X", "I", "X"],
			  ["X", "X", "I", "X"],
			  ["X", "X", "I", "X"]]
			 ],
		"J": [
			 [["X","X","X"],
			  ["J","J","J"],
			  ["X","X","J"]],

			 [["X","J","X"],
			  ["X","J","X"],
			  ["J","J","X"]],

			 [["X","X","X"],
			  ["J","X","X"],
			  ["J","J","J"]],

			 [["X","J","J"],
			  ["X","J","X"],
			  ["X","J","X"]]
			 ],
		"L": [
			 [["X","X","X"],
			  ["L","L","L"],
			  ["L","X","X"]],

			 [["L","L","X"],
			  ["X","L","X"],
			  ["X","L","X"]],

			 [["X","X","X"],
			  ["X","X","L"],
			  ["L","L","L"]],

			 [["X","L","X"],
			  ["X","L","X"],
			  ["X","L","L"]]
			 ],
		"O": [
			 [["X", "X"],
			  ["O", "O"],
			  ["O", "O"]]
			 ],
		"T": [
			 [["X","X","X"],
			  ["T","T","T"],
			  ["X","T","X"]],

			 [["X","T","X"],
			  ["T","T","X"],
			  ["X","T","X"]],

			 [["X","X","X"],
			  ["X","T","X"],
			  ["T","T","T"]],

			 [["X","T","X"],
			  ["X","T","T"],
			  ["X","T","X"]]
			 ],
		"S": [
			 [["X","X","X"],
			  ["X","S","S"],
			  ["S","S","X"]],

			 [["S","X","X"],
			  ["S","S","X"],
			  ["X","S","X"]]
			 ],
		"Z": [
			 [["X","X","X"],
			  ["Z","Z","X"],
			  ["X","Z","Z"]],

			 [["X","X","Z"],
			  ["X","Z","Z"],
			  ["X","Z","X"]]
			 ]
	},
	currentPiece: null,
	image: null, // just a test
	imageReady: false // just a test
};

Game.keys = {
	_pressed: {},

	SPACE: 32,
	UP: 38,
	LEFT: 37,
	DOWN: 40,
	RIGHT: 39,
	ENTER: 13,

	keyDown: function(ev) {
		Game.keys._pressed[ev.keyCode] = true;
	},

	keyUp: function(ev) {
		Game.keys._pressed[ev.keyCode] = false;
	},

	isPressed: function(keyCode) {
		return Game.keys._pressed[keyCode] || false;
	},

	clearInputs: function() {
		Game.keys._pressed = {};
	}
};

window.addEventListener("keydown", Game.keys.keyDown);
window.addEventListener("keyup", Game.keys.keyUp);

Game.spawnNewPiece = function() {
	var pieces = ["I", "J", "L", "O", "T", "S", "Z"];
	var history = [];
	var maxHistory = 4;
	var maxTries = 6;
	return function() {
		var i, piece, type, rowNum, colNum;

		for(i = 0; i < maxTries; i++) {
			type = pieces[Math.floor(Math.random() * pieces.length)];
			if(history.indexOf(type) === -1) {
				break;
			}
		}
		if(history.length >= maxHistory) {
			history.shift();
		}
		history.push(type);

		// new piece object
		piece = {
			type: type,
			rotation: 0,
			position: {
				x: Math.round(Game.numCols / 2),
				y: Game.numRows
			}
		};

		for(rowNum = 0; rowNum < Game.rotations[piece.type][piece.rotation].length; rowNum++) {
			for(colNum = 0; colNum < Game.rotations[piece.type][piece.rotation][rowNum].length; colNum++) {
				if(Game.rotations[piece.type][piece.rotation][rowNum][colNum] !== "X") {
					if(Game.board[piece.position.y - rowNum][piece.position.x + colNum] === "X") {
						Game.board[piece.position.y - rowNum][piece.position.x + colNum] = Game.rotations[piece.type][piece.rotation][rowNum][colNum];
					} else {
						// can't spawn piece on other piece.
						return null;
					}
				}
			}
		}

		Game.currentPiece = piece;
	};
}();

Game.init = function() {
	var rowNum, colNum;

	Game.board = [];
	for(rowNum = 0; rowNum < Game.numRows; rowNum++) {
		Game.board.push([]);
		for(colNum = 0; colNum < Game.numCols; colNum++) {
				Game.board[rowNum].push("X");
		}
	}

	// initial piece
	Game.spawnNewPiece();

	Game.canvas = document.createElement("canvas");
	Game.context = Game.canvas.getContext("2d");
	Game.canvas.width = 480;
	Game.canvas.height = 720;
	document.body.appendChild(Game.canvas);

	Game.cellWidth = Game.canvas.width / Game.numCols;
	Game.cellHeight = Game.canvas.height / Game.numRows;

	// just a test
	Game.image = new Image();
	Game.image.onload = function () {
		Game.imageReady = true;
	};
	Game.image.src = "tetris.png";

	setInterval(Game.tick, 1000 / Game.fps);
};

Game.lowerPiece = function() {
	var rowNum, colNum;
	for(rowNum = 0; rowNum < Game.rotations[Game.currentPiece.type][Game.currentPiece.rotation].length; rowNum++) {
		for(colNum = 0; colNum < Game.rotations[Game.currentPiece.type][Game.currentPiece.rotation][rowNum].length; colNum++) {
			if(Game.rotations[Game.currentPiece.type][Game.currentPiece.rotation][rowNum][colNum] !== "X") {
				if(Game.currentPiece.position.y - rowNum - 1 < 0) {
					// can't lower because a square of the piece is on the ground. piece is placed.
					return true;
				}
				console.log("checking below for landing")
				if(Game.board[Game.currentPiece.position.y - rowNum - 1][Game.currentPiece.position.x + colNum] !== "X") {
					console.log("possible landing found, checking for same-piece")
					console.log(rowNum,colNum)
					if(rowNum - 1 >= 0 && Game.rotations[Game.currentPiece.type][Game.currentPiece.rotation][rowNum - 1][colNum] === "X") {// otherwise piece will count as placed because it can't fall on itself
						console.log("not same-piece landing found. piece placed");
						// can't lower because a block is in the way. piece is placed.
						return true;	
					}
				}
			}
		}
	}

	// lowering is possible, clear piece
	for(rowNum = 0; rowNum < Game.rotations[Game.currentPiece.type][Game.currentPiece.rotation].length; rowNum++) {
		for(colNum = 0; colNum < Game.rotations[Game.currentPiece.type][Game.currentPiece.rotation][rowNum].length; colNum++) {
			if(Game.rotations[Game.currentPiece.type][Game.currentPiece.rotation][rowNum][colNum] !== "X") {
				Game.board[Game.currentPiece.position.y - rowNum][Game.currentPiece.position.x + colNum] = "X";//Game.rotations[Game.currentPiece.type][Game.currentPiece.rotation][rowNum][colNum];
			}
		}
	}

	// change piece position
	Game.currentPiece.position.y--;

	// put piece in new position
	for(rowNum = 0; rowNum < Game.rotations[Game.currentPiece.type][Game.currentPiece.rotation].length; rowNum++) {
		for(colNum = 0; colNum < Game.rotations[Game.currentPiece.type][Game.currentPiece.rotation][rowNum].length; colNum++) {
			if(Game.rotations[Game.currentPiece.type][Game.currentPiece.rotation][rowNum][colNum] !== "X") {
				if(Game.currentPiece.position.y - rowNum >= 0) {
					Game.board[Game.currentPiece.position.y - rowNum][Game.currentPiece.position.x + colNum] = Game.rotations[Game.currentPiece.type][Game.currentPiece.rotation][rowNum][colNum];
				}
			}
		}
	}

	return false; // piece is not yet placed
};

Game.rotatePiece = function() {
	//Game.currentPiece.rotation = Game.currentPiece.rotation + 
};

Game.shiftPiece = function(xDelta) {

};

Game.update = function() {
	var placed = false;
	// get input
	if(Game.keys.isPressed(Game.keys.DOWN)) {
		placed = Game.lowerPiece();
		console.log(placed);
	}
	
	if(Game.keys.isPressed(Game.keys.UP)) {
		Game.rotatePiece();
	}

	if(Game.keys.isPressed(Game.keys.RIGHT)) {
		Game.shiftPiece(1);
	}

	if(Game.keys.isPressed(Game.keys.LEFT)) {
		Game.shiftPiece(-1);
	}

	if(Game.keys.isPressed(Game.keys.SPACE)) {
		while(placed === false) {
			placed = Game.lowerPiece();
		}
	}

	/*
	// gravity
	if(placed === false) {
		placed = Game.lowerPiece();
	}
	*/
	if(placed === true) {
		// check for line clear

		// spawn a new piece
		Game.spawnNewPiece();
	}
};

Game.render = function() {
	var rowNum;
	var colNum;

	Game.context.clearRect(0 , 0, Game.canvas.width, Game.canvas.height);

	for(rowNum = 0; rowNum < Game.board.length; rowNum++) {
		for(colNum = 0; colNum < Game.board[rowNum].length; colNum++) {
			Game.context.fillStyle = Game.pieceColors[Game.board[rowNum][colNum]];
			Game.context.fillRect(colNum * Game.cellWidth, Game.canvas.height - Game.cellHeight - rowNum * Game.cellHeight, Game.cellWidth, Game.cellHeight);
		}
	}
};

Game.tick = function() {
	Game.update();
	Game.render();
};

Game.init();