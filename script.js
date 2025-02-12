function rand(max) {
    return Math.floor(Math.random() * max);
  }
  
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  
  function changeBrightness(factor, sprite) {
    var virtCanvas = document.createElement("canvas");
    virtCanvas.width = 500;
    virtCanvas.height = 500;
    var context = virtCanvas.getContext("2d");
    context.drawImage(sprite, 0, 0, 500, 500);
  
    var imgData = context.getImageData(0, 0, 500, 500);
  
    for (let i = 0; i < imgData.data.length; i += 4) {
      imgData.data[i] = imgData.data[i] * factor;
      imgData.data[i + 1] = imgData.data[i + 1] * factor;
      imgData.data[i + 2] = imgData.data[i + 2] * factor;
    }
    context.putImageData(imgData, 0, 0);
  
    var spriteOutput = new Image();
    spriteOutput.src = virtCanvas.toDataURL();
    virtCanvas.remove();
    return spriteOutput;
  }
  
  var gameMode, timeLimit, mazeCount, timerInterval, startTime, elapsedTime, score;
  var mazeTimes = [];
  var highscores = JSON.parse(localStorage.getItem('highscores')) || {};
  
  var volumeSlider = document.getElementById("volumeSlider");
  var volumeLevel = document.getElementById("volumeLevel");
  var victorySound = document.getElementById("victorySound");
  
  // Set initial volume
  victorySound.volume = volumeSlider.value / 100;
  volumeLevel.innerText = volumeSlider.value;
  
  // Update volume when slider value changes
  volumeSlider.addEventListener("input", function() {
    victorySound.volume = volumeSlider.value / 100;
    volumeLevel.innerText = volumeSlider.value;
  });
  
  function displayVictoryMess() {
    var currentTime = Date.now();
    var timeTaken = currentTime - startTime;
    var minutes = Math.floor(timeTaken / 60000);
    var seconds = Math.floor((timeTaken % 60000) / 1000);
    var milliseconds = timeTaken % 1000;
    var formattedTime = (minutes < 10 ? "0" : "") + minutes + ":" +
                        (seconds < 10 ? "0" : "") + seconds + "." +
                        (milliseconds < 100 ? "0" : "") + (milliseconds < 10 ? "0" : "") + milliseconds;
  
    mazeTimes.push("M" + (score + 1) + " - " + formattedTime);
    updateMazeList();
  
    // Play victory sound
    victorySound.pause();
    victorySound.currentTime = 0;
    victorySound.play();
  
    if (gameMode === "timeRush") {
      score++;
      document.getElementById("score").innerText = "Score: " + score;
      makeMaze();
    } else if (gameMode === "speedrun") {
      score++;
      document.getElementById("score").innerText = "Mazes: " + score + " / " + mazeCount;
      if (score >= mazeCount) {
        clearInterval(timerInterval);
        endGame();
      } else {
        makeMaze();
      }
    }
  }
  
  function updateMazeList() {
    var mazeList = document.getElementById("mazeList");
    mazeList.innerHTML = "";
    mazeTimes.slice().reverse().forEach(function(time) {
      var div = document.createElement("div");
      div.className = "maze-time";
      div.innerText = time;
      mazeList.appendChild(div);
    });
  }
  
  function toggleVisablity(id) {
    if (document.getElementById(id).style.visibility == "visible") {
      document.getElementById(id).style.visibility = "hidden";
    } else {
      document.getElementById(id).style.visibility = "visible";
    }
  }
  
  function Maze(Width, Height) {
    var mazeMap;
    var width = Width;
    var height = Height;
    var startCoord, endCoord;
    var dirs = ["n", "s", "e", "w"];
    var modDir = {
      n: {
        y: -1,
        x: 0,
        o: "s"
      },
      s: {
        y: 1,
        x: 0,
        o: "n"
      },
      e: {
        y: 0,
        x: 1,
        o: "w"
      },
      w: {
        y: 0,
        x: -1,
        o: "e"
      }
    };
  
    this.map = function() {
      return mazeMap;
    };
    this.startCoord = function() {
      return startCoord;
    };
    this.endCoord = function() {
      return endCoord;
    };
  
    function genMap() {
      mazeMap = new Array(height);
      for (y = 0; y < height; y++) {
        mazeMap[y] = new Array(width);
        for (x = 0; x < width; ++x) {
          mazeMap[y][x] = {
            n: false,
            s: false,
            e: false,
            w: false,
            visited: false,
            priorPos: null
          };
        }
      }
    }
  
    function defineMaze() {
      var isComp = false;
      var move = false;
      var cellsVisited = 1;
      var numLoops = 0;
      var maxLoops = 0;
      var pos = {
        x: 0,
        y: 0
      };
      var numCells = width * height;
      while (!isComp) {
        move = false;
        mazeMap[pos.x][pos.y].visited = true;
  
        if (numLoops >= maxLoops) {
          shuffle(dirs);
          maxLoops = Math.round(rand(height / 8));
          numLoops = 0;
        }
        numLoops++;
        for (index = 0; index < dirs.length; index++) {
          var direction = dirs[index];
          var nx = pos.x + modDir[direction].x;
          var ny = pos.y + modDir[direction].y;
  
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            //Check if the tile is already visited
            if (!mazeMap[nx][ny].visited) {
              //Carve through walls from this tile to next
              mazeMap[pos.x][pos.y][direction] = true;
              mazeMap[nx][ny][modDir[direction].o] = true;
  
              //Set Currentcell as next cells Prior visited
              mazeMap[nx][ny].priorPos = pos;
              //Update Cell position to newly visited location
              pos = {
                x: nx,
                y: ny
              };
              cellsVisited++;
              //Recursively call this method on the next tile
              move = true;
              break;
            }
          }
        }
  
        if (!move) {
          //  If it failed to find a direction,
          //  move the current position back to the prior cell and Recall the method.
          pos = mazeMap[pos.x][pos.y].priorPos;
        }
        if (numCells == cellsVisited) {
          isComp = true;
        }
      }
    }
  
    function defineStartEnd() {
      switch (rand(4)) {
        case 0:
          startCoord = {
            x: 0,
            y: 0
          };
          endCoord = {
            x: height - 1,
            y: width - 1
          };
          break;
        case 1:
          startCoord = {
            x: 0,
            y: width - 1
          };
          endCoord = {
            x: height - 1,
            y: 0
          };
          break;
        case 2:
          startCoord = {
            x: height - 1,
            y: 0
          };
          endCoord = {
            x: 0,
            y: width - 1
          };
          break;
        case 3:
          startCoord = {
            x: height - 1,
            y: width - 1
          };
          endCoord = {
            x: 0,
            y: 0
          };
          break;
      }
    }
  
    genMap();
    defineStartEnd();
    defineMaze();
  }
  
  function DrawMaze(Maze, ctx, cellsize, endSprite = null) {
    var map = Maze.map();
    var cellSize = cellsize;
    var drawEndMethod;
    ctx.lineWidth = cellSize / 40;
    ctx.strokeStyle = "white"; // Set the color of the maze walls to white
  
    this.redrawMaze = function(size) {
      cellSize = size;
      ctx.lineWidth = cellSize / 50;
      drawMap();
      drawEndMethod();
    };
  
    function drawCell(xCord, yCord, cell) {
      var x = xCord * cellSize;
      var y = yCord * cellSize;
  
      if (cell.n == false) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + cellSize, y);
        ctx.stroke();
      }
      if (cell.s === false) {
        ctx.beginPath();
        ctx.moveTo(x, y + cellSize);
        ctx.lineTo(x + cellSize, y + cellSize);
        ctx.stroke();
      }
      if (cell.e === false) {
        ctx.beginPath();
        ctx.moveTo(x + cellSize, y);
        ctx.lineTo(x + cellSize, y + cellSize);
        ctx.stroke();
      }
      if (cell.w === false) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + cellSize);
        ctx.stroke();
      }
    }
  
    function drawMap() {
      for (x = 0; x < map.length; x++) {
        for (y = 0; y < map[x].length; y++) {
          drawCell(x, y, map[x][y]);
        }
      }
    }
  
    function drawEndFlag() {
      var coord = Maze.endCoord();
      var gridSize = 4;
      var fraction = cellSize / gridSize - 2;
      var colorSwap = true;
      for (let y = 0; y < gridSize; y++) {
        if (gridSize % 2 == 0) {
          colorSwap = !colorSwap;
        }
        for (let x = 0; x < gridSize; x++) {
          ctx.beginPath();
          ctx.rect(
            coord.x * cellSize + x * fraction + 4.5,
            coord.y * cellSize + y * fraction + 4.5,
            fraction,
            fraction
          );
          if (colorSwap) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
          } else {
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          }
          ctx.fill();
          colorSwap = !colorSwap;
        }
      }
    }
  
    function drawEndSprite() {
      var offsetLeft = cellSize / 50;
      var offsetRight = cellSize / 25;
      var coord = Maze.endCoord();
      ctx.drawImage(
        endSprite,
        2,
        2,
        endSprite.width,
        endSprite.height,
        coord.x * cellSize + offsetLeft,
        coord.y * cellSize + offsetLeft,
        cellSize - offsetRight,
        cellSize - offsetRight
      );
    }
  
    function clear() {
      var canvasSize = cellSize * map.length;
      ctx.clearRect(0, 0, canvasSize, canvasSize);
    }
  
    if (endSprite != null) {
      drawEndMethod = drawEndSprite;
    } else {
      drawEndMethod = drawEndFlag;
    }
    clear();
    drawMap();
    drawEndMethod();
  }
  
  function Player(maze, c, _cellsize, onComplete, sprite = null) {
    var ctx = c.getContext("2d");
    var drawSprite;
    var moves = 0;
    drawSprite = drawSpriteCircle;
    if (sprite != null) {
      drawSprite = drawSpriteImg;
    }
    var player = this;
    var map = maze.map();
    var cellCoords = {
      x: maze.startCoord().x,
      y: maze.startCoord().y
    };
    var cellSize = _cellsize;
    var halfCellSize = cellSize / 2;
    var moveInterval;
    var moveDelay = 100; // Delay in milliseconds
  
    this.redrawPlayer = function(_cellsize) {
      cellSize = _cellsize;
      drawSpriteImg(cellCoords);
    };
  
    function drawSpriteCircle(coord) {
      ctx.beginPath();
      ctx.fillStyle = "yellow";
      ctx.arc(
        (coord.x + 1) * cellSize - halfCellSize,
        (coord.y + 1) * cellSize - halfCellSize,
        halfCellSize - 2,
        0,
        2 * Math.PI
      );
      ctx.fill();
      if (coord.x === maze.endCoord().x && coord.y === maze.endCoord().y) {
        onComplete(moves);
        player.unbindKeyDown();
      }
    }
  
    function drawSpriteImg(coord) {
      var offsetLeft = cellSize / 50;
      var offsetRight = cellSize / 25;
      ctx.drawImage(
        sprite,
        0,
        0,
        sprite.width,
        sprite.height,
        coord.x * cellSize + offsetLeft,
        coord.y * cellSize + offsetLeft,
        cellSize - offsetRight,
        cellSize - offsetRight
      );
      if (coord.x === maze.endCoord().x && coord.y === maze.endCoord().y) {
        onComplete(moves);
        player.unbindKeyDown();
      }
    }
  
    function removeSprite(coord) {
      var offsetLeft = cellSize / 50;
      var offsetRight = cellSize / 25;
      ctx.clearRect(
        coord.x * cellSize + offsetLeft,
        coord.y * cellSize + offsetLeft,
        cellSize - offsetRight,
        cellSize - offsetRight
      );
    }
  
    function movePlayer(direction) {
      var cell = map[cellCoords.x][cellCoords.y];
      moves++;
      switch (direction) {
        case "left":
          if (cell.w == true) {
            removeSprite(cellCoords);
            cellCoords = {
              x: cellCoords.x - 1,
              y: cellCoords.y
            };
            drawSprite(cellCoords);
          }
          break;
        case "up":
          if (cell.n == true) {
            removeSprite(cellCoords);
            cellCoords = {
              x: cellCoords.x,
              y: cellCoords.y - 1
            };
            drawSprite(cellCoords);
          }
          break;
        case "right":
          if (cell.e == true) {
            removeSprite(cellCoords);
            cellCoords = {
              x: cellCoords.x + 1,
              y: cellCoords.y
            };
            drawSprite(cellCoords);
          }
          break;
        case "down":
          if (cell.s == true) {
            removeSprite(cellCoords);
            cellCoords = {
              x: cellCoords.x,
              y: cellCoords.y + 1
            };
            drawSprite(cellCoords);
          }
          break;
      }
    }
  
    function check(e) {
      var direction;
      switch (e.keyCode) {
        case 65:
        case 37: // west
          direction = "left";
          break;
        case 87:
        case 38: // north
          direction = "up";
          break;
        case 68:
        case 39: // east
          direction = "right";
          break;
        case 83:
        case 40: // south
          direction = "down";
          break;
      }
      if (direction) {
        movePlayer(direction);
      }
    }
  
    function stopMove() {
      clearInterval(moveInterval);
    }
  
    this.bindKeyDown = function() {
      window.addEventListener("keydown", check, false);
      window.addEventListener("keyup", stopMove, false);
  
      $("#view").swipe({
        swipe: function(
          event,
          direction,
          distance,
          duration,
          fingerCount,
          fingerData
        ) {
          switch (direction) {
            case "up":
              check({
                keyCode: 38
              });
              break;
            case "down":
              check({
                keyCode: 40
              });
              break;
            case "left":
              check({
                keyCode: 37
              });
              break;
            case "right":
              check({
                keyCode: 39
              });
              break;
          }
        },
        threshold: 0
      });
    };
  
    this.unbindKeyDown = function() {
      window.removeEventListener("keydown", check, false);
      window.removeEventListener("keyup", stopMove, false);
      $("#view").swipe("destroy");
    };
  
    drawSprite(maze.startCoord());
  
    this.bindKeyDown();
  }
  
  var mazeCanvas = document.getElementById("mazeCanvas");
  var ctx = mazeCanvas.getContext("2d");
  var sprite;
  var finishSprite;
  var maze, draw, player;
  var cellSize;
  var difficulty;
  var gameMode, timeLimit, mazeCount, timerInterval, startTime, elapsedTime, score;
  var gameStarted = false;
  // sprite.src = 'media/sprite.png';
  
  window.onload = function() {
    let viewWidth = $("#view").width();
    let viewHeight = $("#view").height();
    if (viewHeight < viewWidth) {
      ctx.canvas.width = viewHeight - viewHeight / 100;
      ctx.canvas.height = viewHeight - viewHeight / 100;
    } else {
      ctx.canvas.width = viewWidth - viewWidth / 100;
      ctx.canvas.height = viewWidth - viewWidth / 100;
    }
  
    //Load and edit sprites
    var completeOne = false;
    var completeTwo = false;
    var isComplete = () => {
      if(completeOne === true && completeTwo === true)
         {
           console.log("Runs");
           setTimeout(function(){
             makeMaze();
           }, 500);         
         }
    };
    sprite = new Image();
    sprite.src =
      "./assets/red.png" +
      "?" +
      new Date().getTime();
    sprite.setAttribute("crossOrigin", " ");
    sprite.onload = function() {
      sprite = changeBrightness(1.2, sprite);
      completeOne = true;
      console.log(completeOne);
      isComplete();
    };
  
    finishSprite = new Image();
    finishSprite.src = "./assets/gem.png"+
    "?" +
    new Date().getTime();
    finishSprite.setAttribute("crossOrigin", " ");
    finishSprite.onload = function() {
      finishSprite = changeBrightness(1.1, finishSprite);
      completeTwo = true;
      console.log(completeTwo);
      isComplete();
    };
    
  };
  
  window.onresize = function() {
    let viewWidth = $("#view").width();
    let viewHeight = $("#view").height();
    if (viewHeight < viewWidth) {
      ctx.canvas.width = viewHeight - viewHeight / 100;
      ctx.canvas.height = viewHeight - viewHeight / 100;
    } else {
      ctx.canvas.width = viewWidth - viewWidth / 100;
      ctx.canvas.height = viewWidth - viewWidth / 100;
    }
    cellSize = mazeCanvas.width / difficulty;
    if (player != null) {
      draw.redrawMaze(cellSize);
      player.redrawPlayer(cellSize);
    }
  };
  
  function makeMaze() {
    if (player != undefined) {
      player.unbindKeyDown();
      player = null;
    }
    var e = document.getElementById("diffSelect");
    difficulty = e.options[e.selectedIndex].value;
    cellSize = mazeCanvas.width / difficulty;
    maze = new Maze(difficulty, difficulty);
    draw = new DrawMaze(maze, ctx, cellSize, finishSprite);
    player = new Player(maze, mazeCanvas, cellSize, displayVictoryMess, sprite);
    if (document.getElementById("mazeContainer").style.opacity < "100") {
      document.getElementById("mazeContainer").style.opacity = "100";
    }
    gameStarted = false; // Freeze the maze
    player.bindKeyDown(); // Re-bind swipe functionality
  }

  function startGame() {
    mazeTimes = [];
    updateMazeList();
    var modeSelect = document.getElementById("modeSelect");
    gameMode = modeSelect.options[modeSelect.selectedIndex].value;
  
    var diffSelect = document.getElementById("diffSelect");
    difficulty = diffSelect.options[diffSelect.selectedIndex].value;
  
    if (gameMode === "timeRush") {
      var timeSelect = document.getElementById("timeSelect");
      timeLimit = parseInt(timeSelect.options[timeSelect.selectedIndex].value);
      score = 0;
      document.getElementById("score").innerText = "Score: " + score;
      startTimer(timeLimit, "down");
    } else if (gameMode === "speedrun") {
      var mazeCountSelect = document.getElementById("mazeCountSelect");
      if (mazeCountSelect) {
        mazeCount = parseInt(mazeCountSelect.options[mazeCountSelect.selectedIndex].value);
        score = 0;
        document.getElementById("score").innerText = "Mazes: " + score + " / " + mazeCount;
        startTimer(0, "up");
      } else {
        console.error("mazeCountSelect element not found");
      }
    }
  
    makeMaze();
  }
  
  function startTimer(limit, direction) {
    startTime = Date.now();
    elapsedTime = 0;
  
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  
    timerInterval = setInterval(function() {
      var currentTime = Date.now();
      elapsedTime = currentTime - startTime;
  
      if (direction === "down") {
        var remainingTime = limit * 1000 - elapsedTime;
        if (remainingTime <= 10) { // Adjusted to account for slight delay
          clearInterval(timerInterval);
          endGame();
        } else {
          updateTimer(remainingTime);
        }
      } else if (direction === "up") {
        updateTimer(elapsedTime);
      }
    }, 10);
  }
  
  function updateTimer(time) {
    var minutes = Math.floor(time / 60000);
    var seconds = Math.floor((time % 60000) / 1000);
    var milliseconds = time % 1000;
  
    document.getElementById("timer").innerText =
      (minutes < 10 ? "0" : "") + minutes + ":" +
      (seconds < 10 ? "0" : "") + seconds + "." +
      (milliseconds < 100 ? "0" : "") + (milliseconds < 10 ? "0" : "") + milliseconds;
  }
  
  function endGame() {
    var endMessageText = "";
    if (gameMode === "timeRush") {
      endMessageText = "Time's up! You completed " + score + " mazes.";
      document.getElementById("timer").innerText = "00:00.000"; // Reset timer to 00:00.000
    } else if (gameMode === "speedrun") {
      endMessageText = "You completed " + mazeCount + " mazes in " + document.getElementById("timer").innerText;
    }
    document.getElementById("endMessageText").innerText = endMessageText;
    document.getElementById("endMessage").style.display = "block";
    player.unbindKeyDown(); // Freeze the player
    saveHighscore();
  }

  function closeEndMessage() {
    document.getElementById("endMessage").style.display = "none";
  }

  // Add this event listener to close the end message when Enter is pressed
  document.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      closeEndMessage();
    }
  });

  function toggleGameModeOptions() {
    var modeSelect = document.getElementById("modeSelect");
    var gameMode = modeSelect.options[modeSelect.selectedIndex].value;
  
    if (gameMode === "timeRush") {
      document.getElementById("timeRushOptions").style.display = "block";
      document.getElementById("speedrunOptions").style.display = "none";
    } else if (gameMode === "speedrun") {
      document.getElementById("timeRushOptions").style.display = "none";
      document.getElementById("speedrunOptions").style.display = "block";
    }
  }

  var highscores = JSON.parse(localStorage.getItem('highscores')) || {};

  function saveHighscore() {
    var username = document.getElementById("usernameDisplay").innerText;
    if (username === "GUEST") return; // Do not save if username is GUEST
  
    var key = gameMode + "|" + difficulty + "|" + (gameMode === "timeRush" ? timeLimit : mazeCount);
    var scoreValue = gameMode === "timeRush" ? score : elapsedTime;
  
    if (!highscores[key]) {
      highscores[key] = [];
    }
  
    var existingEntry = highscores[key].find(entry => entry.username === username);
    if (existingEntry) {
      if ((gameMode === "timeRush" && scoreValue > existingEntry.score) || (gameMode === "speedrun" && scoreValue < existingEntry.score)) {
        existingEntry.score = scoreValue;
      }
    } else {
      highscores[key].push({ username: username, score: scoreValue });
    }
  
    localStorage.setItem('highscores', JSON.stringify(highscores));
    updateHighscoreList();
  }
  
  function updateHighscoreList() {
    var modeSelect = document.getElementById("modeSelect");
    var diffSelect = document.getElementById("diffSelect");
    var timeSelect = document.getElementById("timeSelect");
    var mazeCountSelect = document.getElementById("mazeCountSelect");
  
    var selectedMode = modeSelect.options[modeSelect.selectedIndex].value;
    var selectedDiff = diffSelect.options[diffSelect.selectedIndex].value;
    var selectedTimeOrMazeCount = selectedMode === "timeRush" ? timeSelect.options[timeSelect.selectedIndex].value : mazeCountSelect.options[mazeCountSelect.selectedIndex].value;
  
    var key = selectedMode + "|" + selectedDiff + "|" + selectedTimeOrMazeCount;
    var highscoreList = highscores[key] || [];
  
    highscoreList.sort((a, b) => selectedMode === "timeRush" ? b.score - a.score : a.score - b.score);
  
    var highscoreListDiv = document.getElementById("highscoreList");
    highscoreListDiv.innerHTML = "";
    highscoreList.forEach((entry, index) => {
      var div = document.createElement("div");
      div.className = "highscore-entry";
      div.innerHTML = `<span>${index + 1}. ${entry.username}</span><span>${selectedMode === "timeRush" ? entry.score : formatTime(entry.score)}</span>`;
      if (isAdmin) {
        div.style.cursor = "pointer";
        div.onclick = function() {
          if (confirm("Are you sure you want to delete this highscore?")) {
            highscoreList.splice(index, 1);
            localStorage.setItem('highscores', JSON.stringify(highscores));
            updateHighscoreList();
          }
        };
      }
      highscoreListDiv.appendChild(div);
    });
  }
  
  function formatTime(time) {
    var minutes = Math.floor(time / 60000);
    var seconds = Math.floor((time % 60000) / 1000);
    var milliseconds = time % 1000;
    return (minutes < 10 ? "0" : "") + minutes + ":" +
           (seconds < 10 ? "0" : "") + seconds + "." +
           (milliseconds < 100 ? "0" : "") + (milliseconds < 10 ? "0" : "") + milliseconds;
  }
  
  function toggleHighscoreOptions() {
    var modeSelect = document.getElementById("highscoreModeSelect");
    var gameMode = modeSelect.options[modeSelect.selectedIndex].value;
  
    if (gameMode === "timeRush") {
      document.getElementById("highscoreTimeRushOptions").style.display = "block";
      document.getElementById("highscoreSpeedrunOptions").style.display = "none";
    } else if (gameMode === "speedrun") {
      document.getElementById("highscoreTimeRushOptions").style.display = "none";
      document.getElementById("highscoreSpeedrunOptions").style.display = "block";
    }
  }
  
  document.getElementById("highscoreModeSelect").addEventListener("change", toggleHighscoreOptions);
  document.getElementById("highscoreDiffSelect").addEventListener("change", updateHighscoreList);
  document.getElementById("highscoreTimeSelect").addEventListener("change", updateHighscoreList);
  document.getElementById("highscoreMazeCountSelect").addEventListener("change", updateHighscoreList);
  
  document.getElementById("diffSelect").addEventListener("change", function() {
    makeMaze();
    updateHighscoreList();
  });
  
  document.getElementById("modeSelect").addEventListener("change", function() {
    toggleGameModeOptions();
    updateHighscoreList();
  });
  
  document.getElementById("timeSelect").addEventListener("change", updateHighscoreList);
  document.getElementById("mazeCountSelect").addEventListener("change", updateHighscoreList);
  
  document.getElementById("diffSelect").addEventListener("change", function() {
    makeMaze();
    updateLeaderboard();
  });
  
  window.onload = function() {
    toggleGameModeOptions();
    toggleHighscoreOptions();
    updateHighscoreList();

    document.getElementById("diffSelect").addEventListener("change", function() {
      makeMaze();
      updateHighscoreList();
    });
  
    document.getElementById("modeSelect").addEventListener("change", function() {
      toggleGameModeOptions();
      updateHighscoreList();
    });
  
    document.getElementById("timeSelect").addEventListener("change", updateHighscoreList);
    document.getElementById("mazeCountSelect").addEventListener("change", updateHighscoreList);
  };

  function editUsername() {
    var usernameDisplay = document.getElementById("usernameDisplay");
    var usernameInput = document.getElementById("username");
    var editUsernameBtn = document.getElementById("editUsernameBtn");
  
    usernameDisplay.style.display = "none";
    usernameInput.style.display = "inline-block";
    usernameInput.value = usernameDisplay.innerText;
    usernameInput.focus();
  
    usernameInput.addEventListener("keypress", function(event) {
      if (event.key === "Enter") {
        usernameDisplay.innerText = (usernameInput.value || "GUEST").toUpperCase();
        usernameDisplay.style.display = "inline-block";
        usernameInput.style.display = "none";
        editUsernameBtn.style.display = "inline-block";
        updateHighscoreList();
      }
    });
  
    editUsernameBtn.style.display = "none";
  }

  var isAdmin = false;

  function toggleAdminMode() {
    if (isAdmin) {
      isAdmin = false;
      document.getElementById("adminBtn").innerText = "🛡️";
      updateHighscoreList();
    } else {
      var password = prompt("Enter admin password:");
      if (password === "4DM1N1STR4T0R") {
        isAdmin = true;
        document.getElementById("adminBtn").innerText = "🛡️ (Admin)";
        updateHighscoreList();
      }
    }
  }

  document.getElementById('refreshButton').addEventListener('click', refreshLeaderboard);

  function toggleCompletedMazes() {
    const completedMazes = document.getElementById('completedMazes');
    completedMazes.style.display = completedMazes.style.display === 'none' ? 'block' : 'none';
    makeDraggable(completedMazes);
  }
  
  function toggleHighscores() {
    const highscores = document.getElementById('highscores');
    highscores.style.display = highscores.style.display === 'none' ? 'block' : 'none';
    makeDraggable(highscores);
  }
  
  function makeDraggable(element) {
    element.classList.add('draggable');
    element.onmousedown = function(event) {
      let shiftX = event.clientX - element.getBoundingClientRect().left;
      let shiftY = event.clientY - element.getBoundingClientRect().top;
  
      function moveAt(pageX, pageY) {
        element.style.left = pageX - shiftX + 'px';
        element.style.top = pageY - shiftY + 'px';
      }
  
      function onMouseMove(event) {
        moveAt(event.pageX, event.pageY);
      }
  
      document.addEventListener('mousemove', onMouseMove);
  
      element.onmouseup = function() {
        document.removeEventListener('mousemove', onMouseMove);
        element.onmouseup = null;
      };
    };
  
    element.ondragstart = function() {
      return false;
    };
  }

