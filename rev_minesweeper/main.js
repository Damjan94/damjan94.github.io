
window.addEventListener("load", main);

function main(){
  const board = document.getElementById("game")
  let count = Number.parseInt(document.getElementById("board_size").value);
  board.addEventListener("newgame", () => {
    generateBoard(board, count); //TEST can this be clicked while not visible?
  });
  const square_count = document.getElementById("square_count");
  const newgameEvent = new CustomEvent("newgame");
  document.getElementById("board_size").addEventListener("change", (e) => {
    square_count.innerHTML= e.target.value;
    count = Number.parseInt(e.target.value);
    board.dispatchEvent(newgameEvent);
  });

  const victory_message = document.getElementById("win");
  const finish_button = document.getElementById("finish");
  finish_button.addEventListener("click", () => {
    finish_button.attributes.setNamedItem(document.createAttribute("disabled"));
    const diff = finishGame(board, count);
    if(diff.length != 0) {
      diff.forEach((i) => {
        board.childNodes[i].classList.add("background-red");
      });
        setTimeout(() => {
          finish_button.attributes.removeNamedItem("disabled");
          diff.forEach((i) => {
            board.childNodes[i].classList.remove("background-red");
          })
        }, 1000);
      
    } else {
      victory_message.classList.remove("content-hidden");
    }
  });

  document.getElementById("play_again").addEventListener("click", () => {
    finish_button.attributes.removeNamedItem("disabled");
    victory_message.classList.add("content-hidden");
    board.dispatchEvent(newgameEvent);
  });
  board.dispatchEvent(newgameEvent);
}
function generateBoard(board, count) {
  document.body.style.setProperty("--item_count", count);
  board.innerHTML=""
  const squares = createSquares(count)
  squares.forEach((square) => {
    board.appendChild(square);
    if(isBomb(square)) {
      square.classList.add("bomb-background");
    }
    square.classList.add("content-hidden");
  
  });
  setTimeout(() => {
    squares.forEach((square) => {
      if(isBomb(square)) {
        square.classList.remove("bomb-background");
      } 
      square.classList.remove("content-hidden");
    
    });
  }, 2000);
}

function addOnClickListener(square) {
  let downTime;
  function onPointerDown() {
    downTime=Date.now();
  }

  function onPointerUp() {
    const timeDiff = Date.now() - downTime;
    const bomb_count = new Number(square.innerHTML)
    if(timeDiff < 150) {
      square.innerHTML=bomb_count+1;
    } else if(square.innerHTML > 0) {
       square.innerHTML=bomb_count-1;
    }
  }

  square.addEventListener("pointerdown", onPointerDown);
  square.addEventListener("pointerup", onPointerUp);
}
function createSquares(count) {
  const squares = [];
  for(let x = 0; x < count; x++ ) {
    for(let y = 0; y < count; y++) {
      const square = document.createElement("div");
      if(Math.random() > 0.77) {
        square.classList.add("bomb");
      } 
      square.innerHTML = 0;
      addOnClickListener(square);
      squares.push(square);
    }
  }
  
  function hasAtLeastOneBomb(squares) {
    for(let i = 0; i < squares.length; i++){
      if(isBomb(squares[i])) {
        return true
      }
    }
    return false;
  }
  if(!hasAtLeastOneBomb(squares)) {
    squares[0].classList.add("bomb");
  }
  return squares;
}


function finishGame(board, count) {
  board.childNodes.forEach((el) => {
    el.classList.remove("background-red");
  });
  const solved_board = solveBoard(board, count);
  const user_attempt = getUserSolution(board);
  return arrayDiff(user_attempt,solved_board);

}

function solveBoard(board, count) {
  const solved_board= new Array(board.children.length).fill(0);
  for(let i = 0; i < board.children.length; i++) {
    if(!isBomb(board.children[i])) {
      continue; //not a bomb
    }
    const affected_tiles = getAffectedTiles(1, i, count, solved_board.length);
    affected_tiles.forEach((val) => {
      if(!isBomb(board.children[val])) {
        solved_board[val] += 1; //only increment tiles without bombs
      }
    });
  }
  return solved_board;
}
function getUserSolution(board) {
  return  [...board.children].map((val) => {
    return Number.parseInt(val.innerHTML);
  });
}
function arrayDiff(a, b) {
  if(a.length != b.length) {
    throw "arrays should be of equal length"
  }
  return a.reduce((acc, val, i) => {
    if(val != b[i]) {
      acc.push(i);
    }
    return acc;
  }, []);
}

function getAffectedTiles(bomb_power, i, count, length) {
  const affectedTiles = [];
  const x = i % count;
  const y = Math.floor(i/count);
  //diagonals
  if(y >= 1 && x > 0) affectedTiles.push(i - count - 1); //top left
  if(y >= 1 && x < count-1) affectedTiles.push(i - count + 1); //top right 
  if(y < count - 1 && x > 0)affectedTiles.push(i + count - 1); //bottom left
  if(y < count - 1 && x < count - 1)affectedTiles.push(i + count + 1); //bottom right

  for(let b = 1; b <= bomb_power; b++) {
    if(y >= b) affectedTiles.push(i - (count*b)); //up
    if(b + y < count) affectedTiles.push(i + (count*b)); //down
    if(x >= b) affectedTiles.push(i - b); //left
    if(b + x < count) affectedTiles.push(i + b); //right
  }
  return affectedTiles;
}

function isBomb(square) {
  return square.classList.contains("bomb");
}
