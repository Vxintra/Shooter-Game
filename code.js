// GAME STATE
const state = {
    username: '',
    level: '',
    gun: '',
    targetType: '',
    score: 0,
    timeLeft: 0,
    timerInterval: null,
    targetSpawnInterval: null,
    isPaused: false,
    isGameOver: false,
    targets: [],
    shootHistory: [],
    countdownInterval: null,
    mouseX: 500,
    mouseY: 300,
    gunTypes: ['pistol', 'rifle'],
    currentGunIndex: 0,
    levelSettings: {
        easy: 30,
        medium: 20,
        hard: 15
    }
};

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const gameUI = document.getElementById('game-ui');
const usernameInput = document.getElementById('username');
const levelSelect = document.getElementById('level');
const playBtn = document.getElementById('play-btn');
const instructionBtn = document.getElementById('instruction-btn');
const historyBtn = document.getElementById('history-btn');
const instructionPopup = document.getElementById('instruction-popup');
const closeInstruction = document.getElementById('close-instruction');
const gameboard = document.getElementById('gameboard');
const crosshair = document.getElementById('crosshair');
const gun = document.getElementById('gun');
const hudPlayer = document.getElementById('hud-player');
const hudScore = document.getElementById('hud-score');
const hudGun = document.getElementById('hud-gun');
const hudTime = document.getElementById('hud-time');
const countdownEl = document.getElementById('countdown');
const pausePopup = document.getElementById('pause-popup');
const continueBtn = document.getElementById('continue-btn');
const gameoverPopup = document.getElementById('gameover-popup');
const finalPlayer = document.getElementById('final-player');
const finalScore = document.getElementById('final-score');
const saveScoreBtn = document.getElementById('save-score-btn');
const restartBtn = document.getElementById('restart-btn');
const historyPopup = document.getElementById('history-popup');
const closeHistory = document.getElementById('close-history');
const historyList = document.getElementById('history-list');
const sortScoreBtn = document.getElementById('sort-score');
const sortLastBtn = document.getElementById('sort-last');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const shootHistoryList = document.getElementById('shoot-history-list');

// Selection Buttons
const gunBtns = document.querySelectorAll('#gun-options .option-btn');
const targetBtns = document.querySelectorAll('#target-options .option-btn');

// INITIALIZATION & SELECTION 
function checkPlayBtn() {
    const isUsernameFilled = usernameInput.value.trim() !== '';
    const isLevelSelected = levelSelect.value !== '';
    const isGunSelected = state.gun !== '';
    const isTargetSelected = state.targetType !== '';
    playBtn.disabled = !(isUsernameFilled && isLevelSelected && isGunSelected && isTargetSelected);
}

usernameInput.addEventListener('input', checkPlayBtn);
levelSelect.addEventListener('change', checkPlayBtn);

gunBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        gunBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.gun = btn.dataset.gun;
        checkPlayBtn();
    });
});

targetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        targetBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.targetType = btn.dataset.target;
        checkPlayBtn();
    });
});

// INSTRUCTION 
instructionBtn.addEventListener('click', () => {
    instructionPopup.classList.add('active');
});

closeInstruction.addEventListener('click', () => {
    instructionPopup.classList.remove('active');
});

// GAME FLOW 
playBtn.addEventListener('click', () => {
    state.username = usernameInput.value.trim();
    state.level = levelSelect.value;
    state.timeLeft = state.levelSettings[state.level];
    state.score = 0;
    state.isGameOver = false;
    state.isPaused = false;
    state.shootHistory = [];
    state.currentGunIndex = state.gunTypes.indexOf(state.gun);
    state.targets = [];

    hudPlayer.textContent = state.username;
    hudScore.textContent = state.score;
    hudTime.textContent = state.timeLeft;
    updateGunUI();
    shootHistoryList.innerHTML = '';

    welcomeScreen.style.display = 'none';
    gameUI.style.display = 'block';
    gameboard.innerHTML = '';
    gameboard.appendChild(crosshair);
    gameboard.appendChild(gun);
    gameboard.appendChild(countdownEl);

    // Re-add shoot history panel
    const shootPanel = document.createElement('div');
    shootPanel.id = 'shoot-history-panel';
    shootPanel.innerHTML = `<h4>Shoot History</h4><ul id="shoot-history-list"></ul>`;
    gameboard.appendChild(shootPanel);

    // Initial targets
    for (let i = 0; i < 3; i++) {
        spawnTarget();
    }

    // Start countdown
    startCountdown(() => {
        startGame();
    });
});

function startCountdown(callback) {
    let count = 3;
    countdownEl.textContent = count;
    countdownEl.style.display = 'block';

    if (state.countdownInterval) clearInterval(state.countdownInterval);

    state.countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownEl.textContent = count;
        } else {
            clearInterval(state.countdownInterval);
            countdownEl.style.display = 'none';
            callback();
        }
    }, 1000);
}

function startGame() {
    state.timerInterval = setInterval(() => {
        if (!state.isPaused && !state.isGameOver) {
            state.timeLeft--;
            hudTime.textContent = state.timeLeft;
            if (state.timeLeft <= 0) {
                endGame();
            }
        }
    }, 1000);

    state.targetSpawnInterval = setInterval(() => {
        if (!state.isPaused && !state.isGameOver) {
            spawnTarget();
        }
    }, 3000);
}

function spawnTarget() {
    if (state.isGameOver || state.isPaused) return;

    const target = document.createElement('div');
    target.classList.add('target');

    const maxX = 1000 - 60;
    const maxY = 600 - 60;
    const x = Math.random() * maxX;
    const y = Math.random() * maxY;

    target.style.left = x + 'px';
    target.style.top = y + 'px';

    if (state.targetType === 'dart') {
        target.innerHTML = '🎯';
        target.style.background = 'radial-gradient(circle, #fff 0%, #e74c3c 30%, #fff 60%, #2c3e50 100%)';
    } else if (state.targetType === 'archery') {
        target.innerHTML = '⭕';
        target.style.background = 'radial-gradient(circle, #f1c40f 0%, #e74c3c 30%, #fff 60%, #3498db 100%)';
    } else {
        target.innerHTML = '❌';
        target.style.background = 'radial-gradient(circle, #e74c3c 0%, #fff 50%, #e74c3c 100%)';
    }

    target.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.isPaused || state.isGameOver) return;

        state.score += 10;
        hudScore.textContent = state.score;
        target.classList.add('hit');

        recordShoot(true, x, y);

        setTimeout(() => {
            if (target.parentNode) target.parentNode.removeChild(target);
        }, 200);

        const index = state.targets.indexOf(target);
        if (index > -1) state.targets.splice(index, 1);
    });

    gameboard.appendChild(target);
    state.targets.push(target);
}

// MOVEMENT 
gameboard.addEventListener('mousemove', (e) => {
    if (state.isPaused || state.isGameOver) return;

    const rect = gameboard.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    state.mouseX = x;
    state.mouseY = y;

    crosshair.style.left = x + 'px';
    crosshair.style.top = y + 'px';

    gun.style.left = x + 'px';
    gun.style.top = y + 'px';
});

// SHOOTING
gameboard.addEventListener('click', (e) => {
    if (state.isPaused || state.isGameOver) return;

    state.timeLeft -= 5;
    if (state.timeLeft < 0) state.timeLeft = 0;
    hudTime.textContent = state.timeLeft;

    recordShoot(false, state.mouseX, state.mouseY);

    if (state.timeLeft <= 0) {
        endGame();
    }
});

gameboard.addEventListener('contextmenu', (e) => e.preventDefault());

// RECORD SHOOT HISTORY 
function recordShoot(isHit, x, y) {
    const entry = {
        hit: isHit,
        x: Math.round(x),
        y: Math.round(y),
        time: new Date().toLocaleTimeString()
    };
    state.shootHistory.push(entry);

    const list = document.getElementById('shoot-history-list');
    if (list) {
        const li = document.createElement('li');
        li.className = isHit ? 'hit-text' : 'miss-text';
        li.textContent = `${isHit ? 'HIT' : 'MISS'} @ (${entry.x}, ${entry.y})`;
        list.prepend(li);
    }
}

// GUN SWITCHING
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !state.isPaused && !state.isGameOver && gameUI.style.display === 'block') {
        e.preventDefault();
        switchGun();
    }

    if (e.code === 'Escape') {
        if (gameUI.style.display === 'block' && !state.isGameOver) {
            if (state.isPaused) {
                resumeGame();
            } else {
                pauseGame();
            }
        }
    }
});

function switchGun() {
    state.currentGunIndex = (state.currentGunIndex + 1) % state.gunTypes.length;
    state.gun = state.gunTypes[state.currentGunIndex];
    updateGunUI();

    gun.style.transform = 'translate(-50%, -50%) scale(1.5) rotate(360deg)';
    setTimeout(() => {
        gun.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
    }, 200);
}

function updateGunUI() {
    hudGun.textContent = state.gun.charAt(0).toUpperCase() + state.gun.slice(1);
}

// PAUSE / RESUM
function pauseGame() {
    state.isPaused = true;
    pausePopup.style.display = 'block';
}

function resumeGame() {
    pausePopup.style.display = 'none';
    startCountdown(() => {
        state.isPaused = false;
    });
}

continueBtn.addEventListener('click', resumeGame);

// GAME OVER 
function endGame() {
    state.isGameOver = true;
    clearInterval(state.timerInterval);
    clearInterval(state.targetSpawnInterval);

    finalPlayer.textContent = state.username;
    finalScore.textContent = state.score;
    gameoverPopup.style.display = 'block';

    state.targets.forEach(t => {
        if (t.parentNode) t.parentNode.removeChild(t);
    });
    state.targets = [];
}

// RESTART 
restartBtn.addEventListener('click', () => {
    gameoverPopup.style.display = 'none';
    gameUI.style.display = 'none';
    welcomeScreen.style.display = 'flex';

    state.isGameOver = false;
    state.isPaused = false;
    state.score = 0;
    state.shootHistory = [];
    state.targets = [];
    if (state.timerInterval) clearInterval(state.timerInterval);
    if (state.targetSpawnInterval) clearInterval(state.targetSpawnInterval);
    if (state.countdownInterval) clearInterval(state.countdownInterval);

    usernameInput.value = '';
    levelSelect.value = '';
    gunBtns.forEach(b => b.classList.remove('selected'));
    targetBtns.forEach(b => b.classList.remove('selected'));
    state.gun = '';
    state.targetType = '';
    playBtn.disabled = true;
});

// SAVE SCORE 
saveScoreBtn.addEventListener('click', () => {
    const match = {
        username: state.username,
        score: state.score,
        date: new Date().toLocaleString()
    };

    let history = JSON.parse(localStorage.getItem('shooterHistory')) || [];
    history.push(match);
    localStorage.setItem('shooterHistory', JSON.stringify(history));

    saveScoreBtn.disabled = true;
    saveScoreBtn.textContent = 'Saved!';
    setTimeout(() => {
        saveScoreBtn.disabled = false;
        saveScoreBtn.textContent = 'Save Score';
    }, 2000);
});

// MATCH HISTORY
historyBtn.addEventListener('click', () => {
    openHistory();
});

function openHistory() {
    historyPopup.style.display = 'block';
    renderHistory('score');
}

closeHistory.addEventListener('click', () => {
    historyPopup.style.display = 'none';
});

sortScoreBtn.addEventListener('click', () => {
    sortScoreBtn.classList.add('active');
    sortLastBtn.classList.remove('active');
    renderHistory('score');
});

sortLastBtn.addEventListener('click', () => {
    sortLastBtn.classList.add('active');
    sortScoreBtn.classList.remove('active');
    renderHistory('last');
});

function renderHistory(sortBy) {
    let history = JSON.parse(localStorage.getItem('shooterHistory')) || [];

    if (sortBy === 'score') {
        history.sort((a, b) => b.score - a.score);
    } else {
        history.reverse();
    }

    historyList.innerHTML = '';
    if (history.length === 0) {
        historyList.innerHTML = '<li style="text-align:center; color:#7f8c8d;">No match history yet.</li>';
    } else {
        history.forEach((match, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${index + 1}. ${match.username}</span>
                <span>Score: ${match.score} | ${match.date}</span>
            `;
            historyList.appendChild(li);
        });
    }
}

// CLEAR HISTORY
clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all match history?')) {
        localStorage.removeItem('shooterHistory');
        renderHistory('score');
    }
});