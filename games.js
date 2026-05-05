// ==================== UTILITIES ====================

function bumpStat(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('bump');
    void el.offsetWidth; // force reflow
    el.classList.add('bump');
}

function setStatus(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
}

// ==================== HUB NAVIGATION ====================

let currentGame = null;

function startGame(gameName) {
    document.getElementById('hub').classList.add('hidden');
    const gameId = getGameId(gameName);
    document.getElementById(gameId).classList.remove('hidden');
    currentGame = gameName;

    switch (gameName) {
        case 'snake':    initSnake();       break;
        case 'memory':   initMemoryGame();  break;
        case 'flappy':   initFlappy();      break;
        case '2048':     init2048();        break;
        case 'tictactoe':initTicTacToe();   break;
        case 'pong':     initPong();        break;
    }
}

function getGameId(name) {
    return { snake:'snakeGame', memory:'memoryGame', flappy:'flappyGame', '2048':'game2048', tictactoe:'tictactoeGame', pong:'pongGame' }[name];
}

function backToHub() {
    // Stop all running games cleanly
    snakeGame.gameRunning = false;
    flappyGame.gameRunning = false;
    pongGame.gameRunning = false;

    document.querySelectorAll('.game-container').forEach(el => el.classList.add('hidden'));
    document.getElementById('hub').classList.remove('hidden');
    currentGame = null;
}

// ==================== SNAKE ====================

let snakeGame = {
    canvas: null, ctx: null,
    gridSize: 20,
    snake: [], food: {},
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    score: 0,
    highScore: parseInt(localStorage.getItem('snakeHighScore')) || 0,
    gameRunning: false, gameOver: false,
    animFrame: null
};

function initSnake() {
    snakeGame.canvas = document.getElementById('snakeCanvas');
    snakeGame.ctx = snakeGame.canvas.getContext('2d');
    snakeGame.score = 0;
    snakeGame.gameRunning = false;
    snakeGame.gameOver = false;
    updateSnakeScore();
    document.getElementById('snakeHighScore').textContent = snakeGame.highScore;
    drawSnakeIdle();
}

function drawSnakeIdle() {
    const ctx = snakeGame.ctx;
    const W = snakeGame.canvas.width, H = snakeGame.canvas.height;
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(99,102,241,0.15)';
    for (let x = 0; x < W; x += 20) for (let y = 0; y < H; y += 20) {
        ctx.fillRect(x, y, 19, 19);
    }
    ctx.fillStyle = 'rgba(167,139,250,0.35)';
    ctx.font = 'bold 18px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Press START GAME', W/2, H/2);
}

function startSnakeGame() {
    if (snakeGame.gameRunning) return;
    snakeGame.snake = [{x:10, y:10}];
    snakeGame.direction = { x:1, y:0 };
    snakeGame.nextDirection = { x:1, y:0 };
    snakeGame.score = 0;
    snakeGame.gameRunning = true;
    snakeGame.gameOver = false;
    snakeGame.food = generateFoodSnake();
    updateSnakeScore();
    setStatus('snakeStatus', '');
    document.addEventListener('keydown', handleSnakeKeydown);
    gameSnakeLoop();
}

function handleSnakeKeydown(e) {
    if (!snakeGame.gameRunning) return;
    const map = {
        arrowup: {x:0,y:-1}, w: {x:0,y:-1},
        arrowdown: {x:0,y:1}, s: {x:0,y:1},
        arrowleft: {x:-1,y:0}, a: {x:-1,y:0},
        arrowright: {x:1,y:0}, d: {x:1,y:0}
    };
    const key = e.key.toLowerCase();
    const dir = map[key];
    if (!dir) return;
    e.preventDefault();
    // Prevent reversing
    if (dir.x !== 0 && snakeGame.direction.x !== 0) return;
    if (dir.y !== 0 && snakeGame.direction.y !== 0) return;
    snakeGame.nextDirection = dir;
}

function gameSnakeLoop() {
    if (!snakeGame.gameRunning) {
        document.removeEventListener('keydown', handleSnakeKeydown);
        return;
    }
    snakeGame.direction = snakeGame.nextDirection;
    const head = snakeGame.snake[0];
    const newHead = { x: head.x + snakeGame.direction.x, y: head.y + snakeGame.direction.y };

    if (newHead.x < 0 || newHead.x >= 20 || newHead.y < 0 || newHead.y >= 20) { endSnakeGame(); return; }
    if (snakeGame.snake.some(s => s.x === newHead.x && s.y === newHead.y)) { endSnakeGame(); return; }

    snakeGame.snake.unshift(newHead);

    if (newHead.x === snakeGame.food.x && newHead.y === snakeGame.food.y) {
        snakeGame.score += 10;
        snakeGame.food = generateFoodSnake();
        bumpStat('snakeScore');
    } else {
        snakeGame.snake.pop();
    }

    updateSnakeScore();
    drawSnakeGame();
    setTimeout(gameSnakeLoop, 130);
}

function generateFoodSnake() {
    let pos;
    do {
        pos = { x: Math.floor(Math.random()*20), y: Math.floor(Math.random()*20) };
    } while (snakeGame.snake.some(s => s.x === pos.x && s.y === pos.y));
    return pos;
}

function drawSnakeGame() {
    const ctx = snakeGame.ctx;
    const gs = snakeGame.gridSize;
    const W = snakeGame.canvas.width, H = snakeGame.canvas.height;

    // Background
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.fillStyle = 'rgba(99,102,241,0.04)';
    for (let x = 0; x < W; x += gs) for (let y = 0; y < H; y += gs) ctx.fillRect(x, y, gs-1, gs-1);

    // Snake body
    snakeGame.snake.forEach((seg, i) => {
        const t = i / snakeGame.snake.length;
        if (i === 0) {
            // Head — brighter
            ctx.fillStyle = '#818cf8';
        } else {
            const alpha = 1 - t * 0.5;
            ctx.fillStyle = `rgba(99,102,241,${alpha})`;
        }
        const r = 4;
        const x = seg.x * gs + 1, y = seg.y * gs + 1, w = gs - 2, h = gs - 2;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
    });

    // Food — pulsing dot
    const fx = snakeGame.food.x * gs + gs/2;
    const fy = snakeGame.food.y * gs + gs/2;
    const pulse = 1 + 0.15 * Math.sin(Date.now() / 180);
    ctx.fillStyle = '#f472b6';
    ctx.shadowColor = '#f472b6';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(fx, fy, (gs/2 - 3) * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function updateSnakeScore() {
    document.getElementById('snakeScore').textContent = snakeGame.score;
}

function endSnakeGame() {
    snakeGame.gameRunning = false;
    snakeGame.gameOver = true;
    document.removeEventListener('keydown', handleSnakeKeydown);

    if (snakeGame.score > snakeGame.highScore) {
        snakeGame.highScore = snakeGame.score;
        localStorage.setItem('snakeHighScore', snakeGame.highScore);
        document.getElementById('snakeHighScore').textContent = snakeGame.highScore;
        bumpStat('snakeHighScore');
        setStatus('snakeStatus', '🎉 New high score!');
    } else {
        setStatus('snakeStatus', '💀 Game over — try again!');
    }
}

// ==================== MEMORY GAME ====================

let memoryGame = {
    cards: [], flipped: [], matchedIndices: [], moves: 0,
    best: parseInt(localStorage.getItem('memoryBest')) || null,
    locked: false
};

function initMemoryGame() {
    const emojis = ['🎮','🎯','🎲','🎪','🎨','🎭','🎬','🎸'];
    memoryGame.cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
    memoryGame.flipped = [];
    memoryGame.matchedIndices = [];
    memoryGame.moves = 0;
    memoryGame.locked = false;

    document.getElementById('memoryMoves').textContent = '0';
    document.getElementById('memoryBest').textContent = memoryGame.best || '—';
    renderMemoryGrid();
}

function renderMemoryGrid() {
    const grid = document.getElementById('memoryGrid');
    grid.innerHTML = '';

    memoryGame.cards.forEach((card, index) => {
        const isMatched = memoryGame.matchedIndices.includes(index);
        const isFlipped = memoryGame.flipped.includes(index);
        const cardEl = document.createElement('button');
        cardEl.className = 'memory-card' + (isFlipped ? ' flipped' : '') + (isMatched ? ' matched' : '');

        if (isMatched || isFlipped) {
            cardEl.textContent = card;
        } else {
            const q = document.createElement('span');
            q.className = 'card-question';
            q.textContent = '?';
            cardEl.appendChild(q);
        }

        cardEl.onclick = () => flipMemoryCard(index);
        grid.appendChild(cardEl);
    });
}

function flipMemoryCard(index) {
    if (memoryGame.locked) return;
    if (memoryGame.matchedIndices.includes(index)) return;
    if (memoryGame.flipped.includes(index)) return;
    if (memoryGame.flipped.length >= 2) return;

    memoryGame.flipped.push(index);
    renderMemoryGrid();

    if (memoryGame.flipped.length === 2) {
        memoryGame.locked = true;
        memoryGame.moves++;
        document.getElementById('memoryMoves').textContent = memoryGame.moves;
        bumpStat('memoryMoves');

        const [i1, i2] = memoryGame.flipped;
        if (memoryGame.cards[i1] === memoryGame.cards[i2]) {
            memoryGame.matchedIndices.push(i1, i2);
            memoryGame.flipped = [];
            memoryGame.locked = false;
            renderMemoryGrid();

            if (memoryGame.matchedIndices.length === memoryGame.cards.length) {
                setTimeout(() => {
                    if (!memoryGame.best || memoryGame.moves < memoryGame.best) {
                        memoryGame.best = memoryGame.moves;
                        localStorage.setItem('memoryBest', memoryGame.best);
                        document.getElementById('memoryBest').textContent = memoryGame.best;
                        bumpStat('memoryBest');
                    }
                }, 400);
            }
        } else {
            setTimeout(() => {
                memoryGame.flipped = [];
                memoryGame.locked = false;
                renderMemoryGrid();
            }, 900);
        }
    }
}

function resetMemoryGame() { initMemoryGame(); }

// ==================== FLAPPY BIRD ====================

let flappyGame = {
    canvas: null, ctx: null,
    bird: { x:60, y:240, radius:10, velocity:0 },
    gravity: 0.38,
    jumpStrength: -7.5,
    pipes: [],
    pipeGap: 90,
    pipeWidth: 42,
    pipeSpacing: 210,
    score: 0,
    highScore: parseInt(localStorage.getItem('flappyHighScore')) || 0,
    gameRunning: false, gameOver: false,
    frame: 0,
    bgOffset: 0
};

function initFlappy() {
    flappyGame.canvas = document.getElementById('flappyCanvas');
    flappyGame.ctx = flappyGame.canvas.getContext('2d');
    flappyGame.score = 0;
    flappyGame.gameRunning = false;
    flappyGame.gameOver = false;
    updateFlappyScore();
    document.getElementById('flappyBest').textContent = flappyGame.highScore;
    drawFlappyIdle();
}

function drawFlappyIdle() {
    const ctx = flappyGame.ctx;
    const W = flappyGame.canvas.width, H = flappyGame.canvas.height;
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, W, H);
    // Sky gradient
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0, 'rgba(99,102,241,0.12)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(167,139,250,0.35)';
    ctx.font = 'bold 16px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Press START GAME', W/2, H/2);
}

function startFlappyGame() {
    if (flappyGame.gameRunning) return;
    flappyGame.bird = { x:60, y:flappyGame.canvas.height/2, radius:10, velocity:0 };
    flappyGame.pipes = [];
    flappyGame.score = 0;
    flappyGame.gameRunning = true;
    flappyGame.gameOver = false;
    flappyGame.frame = 0;
    flappyGame.bgOffset = 0;
    updateFlappyScore();
    setStatus('flappyStatus', '');
    document.addEventListener('keydown', handleFlappyKey);
    flappyGame.canvas.addEventListener('click', handleFlappyTap);
    requestAnimationFrame(gameFlappyLoop);
}

function handleFlappyKey(e) {
    if (e.code === 'Space' && flappyGame.gameRunning) {
        e.preventDefault();
        flappyGame.bird.velocity = flappyGame.jumpStrength;
    }
}

function handleFlappyTap() {
    if (flappyGame.gameRunning) flappyGame.bird.velocity = flappyGame.jumpStrength;
}

function gameFlappyLoop() {
    if (!flappyGame.gameRunning) {
        document.removeEventListener('keydown', handleFlappyKey);
        flappyGame.canvas.removeEventListener('click', handleFlappyTap);
        return;
    }

    const W = flappyGame.canvas.width, H = flappyGame.canvas.height;
    flappyGame.frame++;
    flappyGame.bgOffset -= 0.4;

    flappyGame.bird.velocity += flappyGame.gravity;
    flappyGame.bird.y += flappyGame.bird.velocity;

    if (flappyGame.bird.y - flappyGame.bird.radius < 0 ||
        flappyGame.bird.y + flappyGame.bird.radius > H) {
        endFlappyGame(); return;
    }

    // Generate pipes
    if (flappyGame.pipes.length === 0 ||
        flappyGame.pipes[flappyGame.pipes.length - 1].x < W - flappyGame.pipeSpacing) {
        const gapStart = Math.random() * (H - flappyGame.pipeGap - 60) + 30;
        flappyGame.pipes.push({ x: W, topHeight: gapStart, bottomStart: gapStart + flappyGame.pipeGap, scored: false });
    }

    flappyGame.pipes = flappyGame.pipes.filter(pipe => {
        pipe.x -= 3.2;
        if (!pipe.scored && pipe.x + flappyGame.pipeWidth < flappyGame.bird.x) {
            pipe.scored = true;
            flappyGame.score++;
            bumpStat('flappyScore');
            updateFlappyScore();
        }
        // Collision
        const bx = flappyGame.bird.x, by = flappyGame.bird.y, br = flappyGame.bird.radius;
        if (bx + br > pipe.x && bx - br < pipe.x + flappyGame.pipeWidth) {
            if (by - br < pipe.topHeight || by + br > pipe.bottomStart) {
                endFlappyGame(); return false;
            }
        }
        return pipe.x > -flappyGame.pipeWidth;
    });

    if (!flappyGame.gameRunning) return;
    drawFlappyGame();
    requestAnimationFrame(gameFlappyLoop);
}

function drawFlappyGame() {
    const ctx = flappyGame.ctx;
    const W = flappyGame.canvas.width, H = flappyGame.canvas.height;

    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#080c14');
    skyGrad.addColorStop(1, '#0d1220');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = 'rgba(167,139,250,0.5)';
    for (let i = 0; i < 30; i++) {
        const sx = ((i * 73 + flappyGame.bgOffset * 0.2) % W + W) % W;
        const sy = (i * 47) % (H * 0.6);
        const r = (i % 3 === 0) ? 1.5 : 0.8;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Pipes
    flappyGame.pipes.forEach(pipe => {
        const grad = ctx.createLinearGradient(pipe.x, 0, pipe.x + flappyGame.pipeWidth, 0);
        grad.addColorStop(0, '#4f46e5');
        grad.addColorStop(1, '#7c3aed');
        ctx.fillStyle = grad;

        // Top pipe
        ctx.beginPath();
        ctx.roundRect(pipe.x, 0, flappyGame.pipeWidth, pipe.topHeight, [0,0,6,6]);
        ctx.fill();
        // Bottom pipe
        ctx.beginPath();
        ctx.roundRect(pipe.x, pipe.bottomStart, flappyGame.pipeWidth, H - pipe.bottomStart, [6,6,0,0]);
        ctx.fill();

        // Pipe highlights
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(pipe.x + 4, 0, 6, pipe.topHeight);
        ctx.fillRect(pipe.x + 4, pipe.bottomStart, 6, H - pipe.bottomStart);
    });

    // Ground line
    ctx.strokeStyle = 'rgba(99,102,241,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H - 2);
    ctx.lineTo(W, H - 2);
    ctx.stroke();

    // Bird
    const bx = flappyGame.bird.x, by = flappyGame.bird.y, br = flappyGame.bird.radius;
    const tilt = Math.max(-0.5, Math.min(0.8, flappyGame.bird.velocity / 15));

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(tilt);

    // Glow
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 16;

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(0, 0, br + 1, br, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(-3, 2, br * 0.6, br * 0.4, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(br * 0.3, -br * 0.2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(br * 0.3 + 0.8, -br * 0.2 - 0.8, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function updateFlappyScore() {
    document.getElementById('flappyScore').textContent = flappyGame.score;
}

function endFlappyGame() {
    flappyGame.gameRunning = false;
    flappyGame.gameOver = true;
    document.removeEventListener('keydown', handleFlappyKey);
    flappyGame.canvas.removeEventListener('click', handleFlappyTap);

    if (flappyGame.score > flappyGame.highScore) {
        flappyGame.highScore = flappyGame.score;
        localStorage.setItem('flappyHighScore', flappyGame.highScore);
        document.getElementById('flappyBest').textContent = flappyGame.highScore;
        bumpStat('flappyBest');
        setStatus('flappyStatus', '🎉 New high score!');
    } else {
        setStatus('flappyStatus', '💀 Game over — try again!');
    }
}

// ==================== 2048 ====================

let game2048 = {
    grid: [],
    score: 0,
    bestScore: parseInt(localStorage.getItem('best2048Score')) || 0
};

function init2048() { reset2048Game(); }

function reset2048Game() {
    game2048.grid = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    game2048.score = 0;
    addRandomTile2048();
    addRandomTile2048();
    updateScore2048();
    render2048Grid();
    setStatus('status2048', '');
    document.addEventListener('keydown', handle2048Input);
    // Touch support
    let touchStartX = 0, touchStartY = 0;
    const g = document.getElementById('grid2048');
    g.ontouchstart = e => { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; };
    g.ontouchend = e => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const absDx = Math.abs(dx), absDy = Math.abs(dy);
        if (Math.max(absDx, absDy) < 20) return;
        const dir = absDx > absDy ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp');
        move2048(dir);
    };
}

function addRandomTile2048() {
    const empty = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (game2048.grid[i][j] === 0) empty.push({i,j});
    if (empty.length) { const {i,j} = empty[Math.floor(Math.random()*empty.length)]; game2048.grid[i][j] = Math.random() < 0.9 ? 2 : 4; }
}

function handle2048Input(e) {
    if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    move2048(e.key);
}

function move2048(direction) {
    let moved = false;

    if (direction === 'ArrowLeft') {
        for (let i = 0; i < 4; i++) {
            const r = slide2048(game2048.grid[i]);
            game2048.grid[i] = r.line; game2048.score += r.score; if (r.moved) moved = true;
        }
    } else if (direction === 'ArrowRight') {
        for (let i = 0; i < 4; i++) {
            const r = slide2048([...game2048.grid[i]].reverse());
            game2048.grid[i] = r.line.reverse(); game2048.score += r.score; if (r.moved) moved = true;
        }
    } else if (direction === 'ArrowUp') {
        for (let j = 0; j < 4; j++) {
            const col = [game2048.grid[0][j],game2048.grid[1][j],game2048.grid[2][j],game2048.grid[3][j]];
            const r = slide2048(col);
            for (let i = 0; i < 4; i++) game2048.grid[i][j] = r.line[i];
            game2048.score += r.score; if (r.moved) moved = true;
        }
    } else if (direction === 'ArrowDown') {
        for (let j = 0; j < 4; j++) {
            const col = [game2048.grid[3][j],game2048.grid[2][j],game2048.grid[1][j],game2048.grid[0][j]];
            const r = slide2048(col);
            for (let i = 0; i < 4; i++) game2048.grid[3-i][j] = r.line[i];
            game2048.score += r.score; if (r.moved) moved = true;
        }
    }

    if (moved) {
        addRandomTile2048();
        updateScore2048();
        render2048Grid();
        if (is2048GameOver()) setStatus('status2048', '💀 No moves left!');
        // Check win
        if (game2048.grid.flat().includes(2048)) setStatus('status2048', '🎉 You reached 2048!');
    }
}

function is2048GameOver() {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        if (game2048.grid[i][j] === 0) return false;
        if (i < 3 && game2048.grid[i][j] === game2048.grid[i+1][j]) return false;
        if (j < 3 && game2048.grid[i][j] === game2048.grid[i][j+1]) return false;
    }
    return true;
}

function slide2048(line) {
    let newLine = line.filter(v => v !== 0);
    let score = 0;
    for (let i = 0; i < newLine.length - 1; i++) {
        if (newLine[i] === newLine[i+1]) {
            newLine[i] *= 2; score += newLine[i]; newLine.splice(i+1, 1);
        }
    }
    while (newLine.length < 4) newLine.push(0);
    return { line: newLine, score, moved: JSON.stringify(line) !== JSON.stringify(newLine) };
}

function render2048Grid() {
    const grid = document.getElementById('grid2048');
    grid.innerHTML = '';
    game2048.grid.forEach(row => row.forEach(value => {
        const tile = document.createElement('div');
        tile.className = 'tile-2048';
        tile.textContent = value || '';
        if (value >= 1000) tile.style.fontSize = '1.1rem';
        if (value >= 10000) tile.style.fontSize = '0.85rem';
        const { bg, color } = getTileStyle(value);
        tile.style.background = bg;
        tile.style.color = color || 'white';
        grid.appendChild(tile);
    }));
}

function getTileStyle(v) {
    const styles = {
        0:    { bg: '#0d1220', color: 'transparent' },
        2:    { bg: '#1e293b' },
        4:    { bg: '#1e3a5f' },
        8:    { bg: '#1d4ed8' },
        16:   { bg: '#4f46e5' },
        32:   { bg: '#7c3aed' },
        64:   { bg: '#9333ea' },
        128:  { bg: '#c026d3' },
        256:  { bg: '#db2777' },
        512:  { bg: '#e11d48' },
        1024: { bg: '#ea580c' },
        2048: { bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }
    };
    return styles[v] || { bg: 'linear-gradient(135deg, #fbbf24, #fb923c)' };
}

function updateScore2048() {
    const el = document.getElementById('score2048');
    if (parseInt(el.textContent) !== game2048.score) {
        el.textContent = game2048.score;
        bumpStat('score2048');
    }
    if (game2048.score > game2048.bestScore) {
        game2048.bestScore = game2048.score;
        localStorage.setItem('best2048Score', game2048.bestScore);
        document.getElementById('best2048').textContent = game2048.bestScore;
        bumpStat('best2048');
    }
}

// ==================== TIC-TAC-TOE ====================

let tictactoe = {
    board: Array(9).fill(''),
    playerWins: parseInt(localStorage.getItem('playerWins')) || 0,
    aiWins: parseInt(localStorage.getItem('aiWins')) || 0,
    gameActive: true
};

function initTicTacToe() { resetTicTacToe(); }

function resetTicTacToe() {
    tictactoe.board = Array(9).fill('');
    tictactoe.gameActive = true;
    document.getElementById('playerWins').textContent = tictactoe.playerWins;
    document.getElementById('aiWins').textContent = tictactoe.aiWins;
    setStatus('tttStatus', '');
    renderTTTBoard();
}

function renderTTTBoard() {
    const board = document.getElementById('tttBoard');
    board.innerHTML = '';
    tictactoe.board.forEach((value, index) => {
        const cell = document.createElement('button');
        cell.className = `ttt-cell${value ? ' ' + value : ''}`;
        cell.textContent = value;
        cell.onclick = () => playTTT(index);
        cell.disabled = !tictactoe.gameActive || value !== '';
        board.appendChild(cell);
    });
}

function playTTT(index) {
    if (tictactoe.board[index] || !tictactoe.gameActive) return;
    tictactoe.board[index] = 'X';

    if (checkWinner(tictactoe.board, 'X')) {
        tictactoe.playerWins++;
        localStorage.setItem('playerWins', tictactoe.playerWins);
        document.getElementById('playerWins').textContent = tictactoe.playerWins;
        bumpStat('playerWins');
        setStatus('tttStatus', '🎉 You win!');
        tictactoe.gameActive = false;
        renderTTTBoard();
        return;
    }
    if (isBoardFull(tictactoe.board)) {
        setStatus('tttStatus', "🤝 It's a draw!");
        tictactoe.gameActive = false;
        renderTTTBoard();
        return;
    }

    renderTTTBoard();

    setTimeout(() => {
        const aiMove = getBestMove(tictactoe.board);
        tictactoe.board[aiMove] = 'O';
        renderTTTBoard();

        if (checkWinner(tictactoe.board, 'O')) {
            tictactoe.aiWins++;
            localStorage.setItem('aiWins', tictactoe.aiWins);
            document.getElementById('aiWins').textContent = tictactoe.aiWins;
            bumpStat('aiWins');
            setStatus('tttStatus', '🤖 AI wins!');
            tictactoe.gameActive = false;
        } else if (isBoardFull(tictactoe.board)) {
            setStatus('tttStatus', "🤝 It's a draw!");
            tictactoe.gameActive = false;
        }
    }, 500);
}

function checkWinner(board, player) {
    return [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
        .some(line => line.every(i => board[i] === player));
}
function isBoardFull(board) { return board.every(c => c !== ''); }

function getBestMove(board) {
    for (let i = 0; i < 9; i++) { if (board[i]==='') { board[i]='O'; if(checkWinner(board,'O')){board[i]='';return i;} board[i]=''; } }
    for (let i = 0; i < 9; i++) { if (board[i]==='') { board[i]='X'; if(checkWinner(board,'X')){board[i]='';return i;} board[i]=''; } }
    if (board[4]==='') return 4;
    const c = [0,2,6,8].filter(i=>board[i]===''); if(c.length) return c[Math.floor(Math.random()*c.length)];
    const s = [1,3,5,7].filter(i=>board[i]===''); if(s.length) return s[Math.floor(Math.random()*s.length)];
    return -1;
}

// ==================== PONG ====================
// Player = right paddle (mouse/touch). AI = left paddle.
// First to WIN_SCORE points wins the match.

const PONG_WIN_SCORE = 7;
const PADDLE_W = 12, PADDLE_H = 70, PADDLE_MARGIN = 18;
const BALL_SPEED_INIT = 5.5;

let pongGame = {
    canvas: null, ctx: null,
    ball: null,
    playerPaddle: null,   // right side, mouse-controlled
    aiPaddle: null,        // left side, AI-controlled
    playerScore: 0,
    aiScore: 0,
    bestScore: parseInt(localStorage.getItem('pongBestScore')) || 0,
    gameRunning: false,
    mouseY: 200,
    particles: [],
    serving: true,         // brief pause before each serve
    serveTimer: 0
};

function pongMakeBall(W, H, towardsPlayer) {
    // Launch angle: 20–55 degrees from horizontal
    const angle = (Math.random() * 35 + 20) * Math.PI / 180;
    const dirX = towardsPlayer ? 1 : -1;
    const dirY = Math.random() > 0.5 ? 1 : -1;
    return {
        x: W / 2, y: H / 2,
        radius: 7,
        vx: dirX * BALL_SPEED_INIT * Math.cos(angle),
        vy: dirY * BALL_SPEED_INIT * Math.sin(angle),
        speed: BALL_SPEED_INIT
    };
}

function pongMakePlayerPaddle(W, H) {
    return { x: W - PADDLE_MARGIN - PADDLE_W, y: H / 2 - PADDLE_H / 2, width: PADDLE_W, height: PADDLE_H };
}

function pongMakeAIPaddle(H) {
    return { x: PADDLE_MARGIN, y: H / 2 - PADDLE_H / 2, width: PADDLE_W, height: PADDLE_H };
}

function initPong() {
    pongGame.canvas = document.getElementById('pongCanvas');
    pongGame.ctx = pongGame.canvas.getContext('2d');
    pongGame.playerScore = 0;
    pongGame.aiScore = 0;
    pongGame.gameRunning = false;
    pongGame.particles = [];
    updatePongScore();
    document.getElementById('pongBest').textContent = pongGame.bestScore;
    drawPongIdle();
}

function drawPongIdle() {
    const ctx = pongGame.ctx;
    const W = pongGame.canvas.width, H = pongGame.canvas.height;
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, W, H);
    drawPongCourt(ctx, W, H);

    // Draw ghost paddles
    const pp = pongMakePlayerPaddle(W, H);
    const ap = pongMakeAIPaddle(H);
    drawPaddle(ctx, pp, '#6366f1', '#818cf8');
    drawPaddle(ctx, ap, '#f472b6', '#fb7185');

    ctx.fillStyle = 'rgba(167,139,250,0.4)';
    ctx.font = 'bold 15px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Press START GAME', W / 2, H / 2);
    ctx.font = '12px DM Sans, sans-serif';
    ctx.fillStyle = 'rgba(148,163,184,0.5)';
    ctx.fillText('You vs AI  ·  First to ' + PONG_WIN_SCORE, W / 2, H / 2 + 24);
}

function startPongGame() {
    if (pongGame.gameRunning) return;
    const W = pongGame.canvas.width, H = pongGame.canvas.height;

    pongGame.playerScore = 0;
    pongGame.aiScore = 0;
    pongGame.gameRunning = true;
    pongGame.particles = [];
    pongGame.playerPaddle = pongMakePlayerPaddle(W, H);
    pongGame.aiPaddle = pongMakeAIPaddle(H);
    pongGame.ball = pongMakeBall(W, H, true); // serve to player first
    pongGame.serving = true;
    pongGame.serveTimer = 60;

    updatePongScore();
    setStatus('pongStatus', '');

    pongGame.canvas.addEventListener('mousemove', handlePongMouse);
    pongGame.canvas.addEventListener('touchmove', handlePongTouch, { passive: true });
    document.addEventListener('mousemove', handlePongMouse);

    requestAnimationFrame(gamePongLoop);
}

function handlePongMouse(e) {
    const rect = pongGame.canvas.getBoundingClientRect();
    const scaleY = pongGame.canvas.height / rect.height;
    pongGame.mouseY = (e.clientY - rect.top) * scaleY;
}

function handlePongTouch(e) {
    const rect = pongGame.canvas.getBoundingClientRect();
    const scaleY = pongGame.canvas.height / rect.height;
    pongGame.mouseY = (e.touches[0].clientY - rect.top) * scaleY;
}

function spawnParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        pongGame.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            color: color || `hsl(${200 + Math.random() * 80}, 80%, 65%)`
        });
    }
}

function gamePongLoop() {
    if (!pongGame.gameRunning) {
        document.removeEventListener('mousemove', handlePongMouse);
        pongGame.canvas.removeEventListener('mousemove', handlePongMouse);
        pongGame.canvas.removeEventListener('touchmove', handlePongTouch);
        return;
    }

    const W = pongGame.canvas.width, H = pongGame.canvas.height;
    const ball = pongGame.ball;
    const player = pongGame.playerPaddle;
    const ai = pongGame.aiPaddle;

    // Brief serving pause (ball sits still)
    if (pongGame.serving) {
        pongGame.serveTimer--;
        if (pongGame.serveTimer <= 0) pongGame.serving = false;
        drawPongGame();
        requestAnimationFrame(gamePongLoop);
        return;
    }

    // ── Move ball ──
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Top / bottom bounce
    if (ball.y - ball.radius < 0) {
        ball.vy = Math.abs(ball.vy);
        ball.y = ball.radius;
        spawnParticles(ball.x, ball.y, '#94a3b8');
    }
    if (ball.y + ball.radius > H) {
        ball.vy = -Math.abs(ball.vy);
        ball.y = H - ball.radius;
        spawnParticles(ball.x, ball.y, '#94a3b8');
    }

    // ── Scoring: ball passes left or right edge ──
    if (ball.x - ball.radius < 0) {
        // Player scores (AI missed)
        pongGame.playerScore++;
        bumpStat('pongScore');
        updatePongScore();
        spawnParticles(ball.x, ball.y, '#4ade80');
        if (pongGame.playerScore >= PONG_WIN_SCORE) { endPongGame(true); return; }
        serveNextBall(W, H, false); // serve toward AI next
        return;
    }
    if (ball.x + ball.radius > W) {
        // AI scores (player missed)
        pongGame.aiScore++;
        bumpStat('pongBest'); // reuse Best pill for AI score display hack — see updatePongScore
        updatePongScore();
        spawnParticles(ball.x, ball.y, '#f87171');
        if (pongGame.aiScore >= PONG_WIN_SCORE) { endPongGame(false); return; }
        serveNextBall(W, H, true); // serve toward player next
        return;
    }

    // ── Player paddle: smooth follow mouse ──
    const targetY = pongGame.mouseY - player.height / 2;
    player.y += (targetY - player.y) * 0.22;
    player.y = Math.max(0, Math.min(H - player.height, player.y));

    // ── AI paddle: tracks ball with capped speed + deliberate imperfection ──
    const aiSpeed = 4.2 + Math.min(ball.speed - BALL_SPEED_INIT, 3) * 0.4; // gets harder as ball speeds up
    const aiTarget = ball.y - ai.height / 2;
    const aiDiff = aiTarget - ai.y;
    ai.y += Math.sign(aiDiff) * Math.min(Math.abs(aiDiff), aiSpeed);
    ai.y = Math.max(0, Math.min(H - ai.height, ai.y));

    // ── Collisions ──
    // Player paddle (ball moving right → left toward player on right)
    if (ball.vx > 0 &&
        ball.x + ball.radius >= player.x &&
        ball.x - ball.radius <= player.x + player.width &&
        ball.y >= player.y && ball.y <= player.y + player.height) {
        ball.vx = -Math.abs(ball.vx) * 1.04;
        ball.x = player.x - ball.radius;
        const hit = (ball.y - player.y) / player.height - 0.5; // -0.5 to 0.5
        ball.vy = hit * 10;
        ball.speed = Math.hypot(ball.vx, ball.vy);
        spawnParticles(ball.x, ball.y, '#818cf8');
    }

    // AI paddle (ball moving left)
    if (ball.vx < 0 &&
        ball.x - ball.radius <= ai.x + ai.width &&
        ball.x + ball.radius >= ai.x &&
        ball.y >= ai.y && ball.y <= ai.y + ai.height) {
        ball.vx = Math.abs(ball.vx) * 1.04;
        ball.x = ai.x + ai.width + ball.radius;
        const hit = (ball.y - ai.y) / ai.height - 0.5;
        ball.vy = hit * 10;
        ball.speed = Math.hypot(ball.vx, ball.vy);
        spawnParticles(ball.x, ball.y, '#fb7185');
    }

    // Cap max speed
    const maxSpeed = 14;
    const currentSpeed = Math.hypot(ball.vx, ball.vy);
    if (currentSpeed > maxSpeed) {
        ball.vx = (ball.vx / currentSpeed) * maxSpeed;
        ball.vy = (ball.vy / currentSpeed) * maxSpeed;
    }

    // ── Particles ──
    pongGame.particles = pongGame.particles.filter(p => {
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.92; p.vy *= 0.92;
        p.life -= 0.05;
        return p.life > 0;
    });

    drawPongGame();
    requestAnimationFrame(gamePongLoop);
}

function serveNextBall(W, H, towardsPlayer) {
    pongGame.ball = pongMakeBall(W, H, towardsPlayer);
    pongGame.serving = true;
    pongGame.serveTimer = 70; // ~1 second pause at 60fps
}

function drawPaddle(ctx, p, colorTop, colorBottom) {
    const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
    grad.addColorStop(0, colorTop);
    grad.addColorStop(1, colorBottom);
    ctx.shadowColor = colorBottom;
    ctx.shadowBlur = 14;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.width, p.height, 6);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawPongCourt(ctx, W, H) {
    // Center line
    ctx.strokeStyle = 'rgba(99,102,241,0.18)';
    ctx.setLineDash([6, 12]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Top & bottom borders
    ctx.strokeStyle = 'rgba(99,102,241,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 1); ctx.lineTo(W, 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, H - 1); ctx.lineTo(W, H - 1); ctx.stroke();
}

function drawPongGame() {
    const ctx = pongGame.ctx;
    const W = pongGame.canvas.width, H = pongGame.canvas.height;

    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, W, H);

    drawPongCourt(ctx, W, H);

    // Score on canvas
    ctx.font = 'bold 36px DM Sans, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(99,102,241,0.25)';
    ctx.fillText(pongGame.aiScore, W / 2 - 60, 14);
    ctx.fillStyle = 'rgba(99,102,241,0.25)';
    ctx.fillText(pongGame.playerScore, W / 2 + 60, 14);

    // Serving flash
    if (pongGame.serving && Math.floor(pongGame.serveTimer / 10) % 2 === 0) {
        ctx.font = '13px DM Sans, sans-serif';
        ctx.fillStyle = 'rgba(167,139,250,0.6)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Get ready…', W / 2, H / 2 - 24);
    }

    // Particles
    pongGame.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Ball
    const ball = pongGame.ball;
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Paddles
    drawPaddle(ctx, pongGame.playerPaddle, '#818cf8', '#6366f1'); // player: indigo
    drawPaddle(ctx, pongGame.aiPaddle, '#fb7185', '#f43f5e');      // AI: rose
}

function updatePongScore() {
    // "Score" pill = player score, "Best" pill = AI score (repurposed label in HTML is fine)
    document.getElementById('pongScore').textContent = pongGame.playerScore;
    document.getElementById('pongBest').textContent = pongGame.aiScore;
}

function endPongGame(playerWon) {
    pongGame.gameRunning = false;
    document.removeEventListener('mousemove', handlePongMouse);
    pongGame.canvas.removeEventListener('mousemove', handlePongMouse);
    pongGame.canvas.removeEventListener('touchmove', handlePongTouch);

    if (playerWon) {
        const wins = parseInt(localStorage.getItem('pongBestScore') || '0');
        const newWins = wins + 1;
        localStorage.setItem('pongBestScore', newWins);
        pongGame.bestScore = newWins;
        setStatus('pongStatus', `🎉 You win ${pongGame.playerScore}–${pongGame.aiScore}!`);
    } else {
        setStatus('pongStatus', `💀 AI wins ${pongGame.aiScore}–${pongGame.playerScore}. Try again!`);
    }
}