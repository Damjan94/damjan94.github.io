
window.addEventListener("load", main);

function drawTutorial(board) {
  const tutorial_grid_size = 3;
  const squares = createSquares(tutorial_grid_size);
  squares.forEach((square) => {
    board.appendChild(square);
    if(isBomb(square)) {
      square.classList.add("bomb-background");
    }
  });
  const solution = solveBoard(board, tutorial_grid_size);
  solution.forEach((val, i) => {
    board.children[i].innerHTML=val;
  });
}


function getHighScores(minBoardSize, maxBoardSize) {
  const scores = [];
  for(let i = minBoardSize; i <=maxBoardSize; i++) {
    const score = Number.parseInt(localStorage.getItem("highscore-"+i) || 0);
    scores.push(score);
  }
  return scores;
}

function createHighScoreTableRow(boardSize, score) {
  const tr = document.createElement("tr");
  const td_size = document.createElement("td");
  const td_score= document.createElement("td");
  td_size.innerHTML = boardSize;
  td_score.innerHTML= score;
  tr.appendChild(td_size);
  tr.appendChild(td_score);
  return tr;
}

function populateHighScoreTable(table, scores) {
  table.innerHTML="";
  const heading = document.createElement("tr");
  const board_size_heading = document.createElement("th");
  const score_heading = document.createElement("th");
  board_size_heading.innerHTML="Board size";
  score_heading.innerHTML="Score";
  heading.appendChild(board_size_heading);
  heading.appendChild(score_heading);
  table.appendChild(heading);
  scores.forEach((score, i) => {
    if(score > 0) {
      table.appendChild(createHighScoreTableRow(i + 3, score));
    }
  });
}

function createCurrentScore(el) {
  let currentScore = 0;
  function increment() {
    currentScore+=1;
    el.innerHTML = currentScore;
  }
  function reset() {
    currentScore = 0;
    el.innerHTML = currentScore;
  }
  function getCurrentScore() {
    return currentScore;
  }
  return [increment, reset, getCurrentScore];
}
const newgameEvent = new CustomEvent("newgame");
const incorrectguessEvent = new CustomEvent("incorrectguess");
function main(){
  drawTutorial(document.getElementById("tutorial"));
  let scores = getHighScores(3, 15);
  const high_score_table = document.getElementById("scores");
  populateHighScoreTable(high_score_table, scores);
  const board = document.getElementById("game")
  const board_size = document.getElementById("board_size");
  let count = Number.parseInt(localStorage.getItem("userBoardSize") || board_size.valueAsNumber);
  board_size.value=count; // set the value from local storage, if exists
  const [incrementCurrentScore, resetCurrentScore, getCurrentScore] = createCurrentScore(document.getElementById("score"));
  board.addEventListener("newgame", () => {
    board.classList.remove("border-green");
    board.classList.remove("border-red");

    scores[count-3] = Math.max(scores[count-3], getCurrentScore());
    populateHighScoreTable(high_score_table, scores);
    let current_high_score = Number.parseInt(localStorage.getItem("highscore-"+count) || 0);
    if(isNaN(current_high_score)) {
      current_high_score = 0;
    }
    localStorage.setItem("highscore-"+count, Math.max(current_high_score, scores[count-3]));
    generateBoard(board, count); //TEST can this be clicked while not visible?
  });
  board.addEventListener("incorrectguess", () => {
    board.classList.add("border-red");
    let current_high_score = Number.parseInt(localStorage.getItem("highscore-"+count) || 0);
    if(isNaN(current_high_score)) {
      current_high_score = 0;
    }
    localStorage.setItem("highscore-"+count, Math.max(current_high_score, getCurrentScore()));
    resetCurrentScore();
  });
  board_size.addEventListener("change", (e) => {
    count = e.target.valueAsNumber;
    localStorage.setItem("userBoardSize", count);
    board.dispatchEvent(newgameEvent);
    resetCurrentScore();
  });
  
  const victory_message = document.getElementById("win");
  const finish_button = document.getElementById("finish");
  finish_button.addEventListener("click", () => {
    finish_button.disabled = true;
    const diff = finishGame(board, count);
    if(diff.length != 0) {
      board.dispatchEvent(incorrectguessEvent);
      diff.forEach((i) => {
        board.childNodes[i].classList.add("background-red");
      });
      setTimeout(() => {
        finish_button.disabled=false;
        diff.forEach((i) => {
          board.childNodes[i].classList.remove("background-red");
        })
      }, 1000);
      
    } else {
      victory_message.classList.remove("content-hidden");
      board.classList.add("border-green");
      incrementCurrentScore();
      setTimeout(() => {
        finish_button.disabled=false;
        victory_message.classList.add("content-hidden");
        board.dispatchEvent(newgameEvent);
      }, 1000);
    }
  });

  board.dispatchEvent(newgameEvent);
}
function generateBoard(board, count) {
  document.body.style.setProperty("--item_count", count);
  board.innerHTML=""
  const squares = createSquares(count)
  squares.forEach((square) => {
    addOnClickListener(square);
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
