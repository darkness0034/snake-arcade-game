// Game state variables
let gameState = {
    currentPage: 'starter-page',
    isPlaying: false,
    isPaused: false,
    score: 0,
    level: 1,
    lives: 3,
    highScores: [],
    isMobile: false,
    platform: 'unknown'
};

// Snake game variables
let snake = [];
let food = {};
let bonusFood = {};
let direction = 'right';
let gameLoop;
let gameSpeed = 150;
let gridSize = 20;
let canvas, ctx;

// Mobile touch variables
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

// PWA install variables
let deferredPrompt = null;

// Initialize the game
document.addEventListener('DOMContentLoaded', function() {
    detectPlatform();
    initializeGame();
    loadHighScores();
    setupMobileControls();
    registerServiceWorker();
    setupPWAInstall();
});

function detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Detect platform
    if (/android/.test(userAgent)) {
        gameState.platform = 'android';
        gameState.isMobile = true;
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
        gameState.platform = 'ios';
        gameState.isMobile = true;
    } else if (/windows/.test(userAgent)) {
        gameState.platform = 'windows';
        gameState.isMobile = false;
    } else if (/linux/.test(userAgent)) {
        gameState.platform = 'linux';
        gameState.isMobile = false;
    } else if (/macintosh|mac os x/.test(userAgent)) {
        gameState.platform = 'mac';
        gameState.isMobile = false;
    }
    
    // Add platform-specific classes to body
    document.body.classList.add(`platform-${gameState.platform}`);
    if (gameState.isMobile) {
        document.body.classList.add('mobile-device');
    }
    
    console.log(`Platform detected: ${gameState.platform}, Mobile: ${gameState.isMobile}`);
}

function initializeGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size based on device
    if (gameState.isMobile) {
        // Mobile-optimized canvas size
        const maxWidth = Math.min(window.innerWidth - 40, 400);
        const maxHeight = Math.min(window.innerHeight * 0.6, 300);
        canvas.width = maxWidth;
        canvas.height = maxHeight;
        gridSize = Math.min(maxWidth, maxHeight) / 20; // Dynamic grid size
    } else {
        // Desktop canvas size
        canvas.width = 600;
        canvas.height = 400;
        gridSize = 20;
    }
    
    // Initialize snake
    resetSnake();
    
    // Generate initial food
    generateFood();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update UI based on platform
    updatePlatformUI();
}

function setupEventListeners() {
    // Keyboard controls (desktop)
    document.addEventListener('keydown', handleKeyPress);
    
    // Touch controls (mobile)
    if (gameState.isMobile) {
        setupTouchControls();
    }
    
    // Settings change listeners
    document.getElementById('difficulty').addEventListener('change', updateDifficulty);
    document.getElementById('sound').addEventListener('change', updateSound);
    document.getElementById('music').addEventListener('change', updateMusic);
    document.getElementById('theme').addEventListener('change', updateTheme);
    
    // Window resize handler
    window.addEventListener('resize', handleResize);
}

function setupTouchControls() {
    // Touch start
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }, { passive: false });
    
    // Touch end
    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        touchEndX = touch.clientX;
        touchEndY = touch.clientY;
        handleSwipe();
    }, { passive: false });
    
    // Prevent default touch behaviors
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });
}

function handleSwipe() {
    if (!gameState.isPlaying) return;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0 && direction !== 'left') {
                direction = 'right';
            } else if (deltaX < 0 && direction !== 'right') {
                direction = 'left';
            }
        }
    } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0 && direction !== 'up') {
                direction = 'down';
            } else if (deltaY < 0 && direction !== 'down') {
                direction = 'up';
            }
        }
    }
}

function setupMobileControls() {
    if (!gameState.isMobile) return;
    
    // Create mobile control buttons
    const mobileControls = document.createElement('div');
    mobileControls.className = 'mobile-controls';
    mobileControls.innerHTML = `
        <div class="mobile-control-row">
            <button class="mobile-btn up-btn" onclick="handleMobileControl('up')">↑</button>
        </div>
        <div class="mobile-control-row">
            <button class="mobile-btn left-btn" onclick="handleMobileControl('left')">←</button>
            <button class="mobile-btn pause-btn" onclick="togglePause()">⏸️</button>
            <button class="mobile-btn right-btn" onclick="handleMobileControl('right')">→</button>
        </div>
        <div class="mobile-control-row">
            <button class="mobile-btn down-btn" onclick="handleMobileControl('down')">↓</button>
        </div>
    `;
    
    // Insert mobile controls after game canvas
    const gameArea = document.querySelector('.game-area');
    gameArea.appendChild(mobileControls);
}

function handleMobileControl(dir) {
    if (!gameState.isPlaying) return;
    
    switch(dir) {
        case 'up':
            if (direction !== 'down') direction = 'up';
            break;
        case 'down':
            if (direction !== 'up') direction = 'down';
            break;
        case 'left':
            if (direction !== 'right') direction = 'left';
            break;
        case 'right':
            if (direction !== 'left') direction = 'right';
            break;
    }
}

function updatePlatformUI() {
    // Show/hide mobile controls
    const mobileControls = document.querySelector('.mobile-controls');
    if (mobileControls) {
        mobileControls.style.display = gameState.isMobile ? 'block' : 'none';
    }
    
    // Update control instructions
    const controlInfo = document.querySelector('.control-info');
    if (controlInfo) {
        if (gameState.isMobile) {
            controlInfo.innerHTML = `
                <div class="control-item">👆 Swipe to Move</div>
                <div class="control-item">⏸️ Pause Button</div>
                <div class="control-item">🔙 Menu Button</div>
            `;
        } else {
            controlInfo.innerHTML = `
                <div class="control-item">↑↓←→ Move</div>
                <div class="control-item">SPACE Pause</div>
                <div class="control-item">ESC Menu</div>
            `;
        }
    }
    
    // Add platform-specific styling
    document.body.setAttribute('data-platform', gameState.platform);
}

function handleResize() {
    if (gameState.isMobile) {
        // Recalculate canvas size for mobile
        const maxWidth = Math.min(window.innerWidth - 40, 400);
        const maxHeight = Math.min(window.innerHeight * 0.6, 300);
        canvas.width = maxWidth;
        canvas.height = maxHeight;
        gridSize = Math.min(maxWidth, maxHeight) / 20;
        
        // Regenerate food with new grid
        if (gameState.isPlaying) {
            generateFood();
        }
    }
}

// Navigation functions
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    document.getElementById(pageId).classList.add('active');
    gameState.currentPage = pageId;
    
    // Update platform UI when changing pages
    updatePlatformUI();
}

function startGame() {
    // Hide any existing modals
    const modal = document.getElementById('game-over-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
    
    showPage('game-page');
    resetGame();
    startGameLoop();
    
    // Setup mobile controls if needed
    if (gameState.isMobile) {
        setupMobileControls();
    }
}

function showHighScores() {
    showPage('highscores-page');
    displayHighScores();
}

function showInstructions() {
    showPage('instructions-page');
}

function showSettings() {
    showPage('settings-page');
}

function backToMenu() {
    if (gameState.isPlaying) {
        stopGame();
    }
    // Hide game over modal if visible
    const modal = document.getElementById('game-over-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
    showPage('starter-page');
}

// Snake game functions
function resetGame() {
    gameState.score = 0;
    gameState.level = 1;
    gameState.lives = 3;
    gameState.isPlaying = true;
    gameState.isPaused = false;
    
    resetSnake();
    generateFood();
    updateDisplay();
    
    // Hide game over modal if visible
    const modal = document.getElementById('game-over-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

function resetSnake() {
    snake = [
        {x: 10, y: 10},
        {x: 9, y: 10},
        {x: 8, y: 10}
    ];
    direction = 'right';
}

function generateFood() {
    const maxX = Math.floor(canvas.width / gridSize);
    const maxY = Math.floor(canvas.height / gridSize);
    
    do {
        food = {
            x: Math.floor(Math.random() * maxX),
            y: Math.floor(Math.random() * maxY)
        };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
    
    // Generate bonus food occasionally
    if (Math.random() < 0.2) {
        do {
            bonusFood = {
                x: Math.floor(Math.random() * maxX),
                y: Math.floor(Math.random() * maxY)
            };
        } while (
            (bonusFood.x === food.x && bonusFood.y === food.y) ||
            snake.some(segment => segment.x === bonusFood.x && segment.y === bonusFood.y)
        );
        
        // Bonus food disappears after 5 seconds
        setTimeout(() => {
            bonusFood = {};
        }, 5000);
    } else {
        bonusFood = {};
    }
}

function startGameLoop() {
    if (gameLoop) clearInterval(gameLoop);
    
    gameLoop = setInterval(() => {
        if (!gameState.isPaused && gameState.isPlaying) {
            updateGame();
        }
    }, gameSpeed);
}

function stopGame() {
    gameState.isPlaying = false;
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
}

function updateGame() {
    moveSnake();
    checkCollision();
    checkFood();
    drawGame();
}

function moveSnake() {
    const head = {x: snake[0].x, y: snake[0].y};
    
    switch(direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    
    snake.unshift(head);
    
    // Remove tail unless food was eaten
    if (!checkFoodCollision(head)) {
        snake.pop();
    }
}

function checkCollision() {
    const head = snake[0];
    const maxX = Math.floor(canvas.width / gridSize);
    const maxY = Math.floor(canvas.height / gridSize);
    
    // Wall collision
    if (head.x < 0 || head.x >= maxX || head.y < 0 || head.y >= maxY) {
        gameOver();
        return;
    }
    
    // Self collision
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }
}

function checkFood() {
    const head = snake[0];
    
    // Check regular food
    if (head.x === food.x && head.y === food.y) {
        gameState.score += 10;
        generateFood();
        updateDisplay();
        checkLevelUp();
        playSound('eat');
    }
    
    // Check bonus food
    if (bonusFood.x !== undefined && head.x === bonusFood.x && head.y === bonusFood.y) {
        gameState.score += 25;
        bonusFood = {};
        updateDisplay();
        playSound('bonus');
    }
}

function checkFoodCollision(position) {
    return (position.x === food.x && position.y === food.y) ||
           (bonusFood.x !== undefined && position.x === bonusFood.x && position.y === bonusFood.y);
}

function checkLevelUp() {
    const newLevel = Math.floor(gameState.score / 100) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameSpeed = Math.max(50, 150 - (gameState.level - 1) * 10);
        startGameLoop(); // Restart with new speed
        playSound('levelup');
    }
}

function gameOver() {
    gameState.lives--;
    
    if (gameState.lives > 0) {
        // Continue with remaining lives
        resetSnake();
        generateFood();
        playSound('lifeLost');
        
        // Track life lost
        trackGameEvent('life_lost', { score: gameState.score, level: gameState.level });
    } else {
        // Game over
        stopGame();
        saveHighScore();
        showGameOverModal();
        playSound('gameOver');
        
        // Track game over
        trackGameEvent('game_over', { 
            finalScore: gameState.score, 
            finalLevel: gameState.level,
            platform: gameState.platform 
        });
    }
    
    updateDisplay();
}

function saveHighScore() {
    const playerName = prompt('Enter your name for the high score:') || 'Anonymous';
    const newScore = {
        name: playerName,
        score: gameState.score,
        level: gameState.level,
        date: new Date().toLocaleDateString()
    };
    
    gameState.highScores.push(newScore);
    gameState.highScores.sort((a, b) => b.score - a.score);
    gameState.highScores = gameState.highScores.slice(0, 10); // Keep top 10
    
    localStorage.setItem('snakeHighScores', JSON.stringify(gameState.highScores));
}

function loadHighScores() {
    const saved = localStorage.getItem('snakeHighScores');
    if (saved) {
        gameState.highScores = JSON.parse(saved);
    }
}

function displayHighScores() {
    const scoresList = document.getElementById('scores-list');
    scoresList.innerHTML = '';
    
    if (gameState.highScores.length === 0) {
        scoresList.innerHTML = '<div class="score-entry"><span>No high scores yet!</span></div>';
        return;
    }
    
    gameState.highScores.forEach((score, index) => {
        const scoreEntry = document.createElement('div');
        scoreEntry.className = 'score-entry';
        scoreEntry.innerHTML = `
            <span class="score-rank">#${index + 1}</span>
            <span class="score-name">${score.name}</span>
            <span class="score-value">${score.score}</span>
        `;
        scoresList.appendChild(scoreEntry);
    });
}

function showGameOverModal() {
    console.log('Showing game over modal');
    const finalScoreElement = document.getElementById('final-score');
    const modal = document.getElementById('game-over-modal');
    
    if (!finalScoreElement) {
        console.error('Final score element not found');
        return;
    }
    
    if (!modal) {
        console.error('Game over modal not found');
        return;
    }
    
    finalScoreElement.textContent = gameState.score;
    modal.classList.add('active');
    modal.style.display = 'flex';
    
    // Add click outside to close functionality
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            goToMainMenu();
        }
    });
    
    console.log('Game over modal displayed successfully');
}

function restartGame() {
    const modal = document.getElementById('game-over-modal');
    modal.classList.remove('active');
    modal.style.display = 'none';
    resetGame();
    startGameLoop();
}

function goToMainMenu() {
    console.log('Going to main menu from modal');
    const modal = document.getElementById('game-over-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        // Remove the click event listener to prevent duplicates
        modal.replaceWith(modal.cloneNode(true));
    }
    backToMenu();
}

// Drawing functions
function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid();
    
    // Draw snake
    drawSnake();
    
    // Draw food
    drawFood();
    
    // Draw bonus food
    if (bonusFood.x !== undefined) {
        drawBonusFood();
    }
    
    // Draw mobile controls overlay if needed
    if (gameState.isMobile && gameState.isPlaying) {
        drawMobileControlsOverlay();
    }
}

function drawGrid() {
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawSnake() {
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Head
            ctx.fillStyle = '#00ff41';
            ctx.strokeStyle = '#00cc33';
        } else {
            // Body
            ctx.fillStyle = '#00cc33';
            ctx.strokeStyle = '#009926';
        }
        
        ctx.fillRect(
            segment.x * gridSize + 1,
            segment.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2
        );
        
        ctx.strokeRect(
            segment.x * gridSize + 1,
            segment.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2
        );
    });
}

function drawFood() {
    ctx.fillStyle = '#ff4444';
    ctx.strokeStyle = '#cc0000';
    
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2 - 2,
        0,
        2 * Math.PI
    );
    ctx.fill();
    ctx.stroke();
}

function drawBonusFood() {
    ctx.fillStyle = '#ffaa00';
    ctx.strokeStyle = '#cc8800';
    
    ctx.beginPath();
    ctx.arc(
        bonusFood.x * gridSize + gridSize / 2,
        bonusFood.y * gridSize + gridSize / 2,
        gridSize / 2 - 2,
        0,
        2 * Math.PI
    );
    ctx.fill();
    ctx.stroke();
    
    // Add sparkle effect
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
        bonusFood.x * gridSize + gridSize / 2 - 1,
        bonusFood.y * gridSize + gridSize / 2 - 1,
        2,
        2
    );
}

function drawMobileControlsOverlay() {
    // Add subtle visual indicators for mobile users
    ctx.fillStyle = 'rgba(0, 255, 65, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Input handling
function handleKeyPress(event) {
    // Check if game over modal is visible
    const modal = document.getElementById('game-over-modal');
    if (modal && modal.classList.contains('active')) {
        if (event.key === 'Escape') {
            goToMainMenu();
            return;
        }
        // Don't handle other keys when modal is open
        return;
    }
    
    if (!gameState.isPlaying) return;
    
    switch(event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction !== 'down') direction = 'up';
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction !== 'up') direction = 'down';
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction !== 'right') direction = 'left';
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction !== 'left') direction = 'right';
            break;
        case ' ':
            togglePause();
            break;
        case 'Escape':
            backToMenu();
            break;
        case 'p':
        case 'P':
            togglePause();
            break;
    }
}

function togglePause() {
    if (!gameState.isPlaying) return;
    
    gameState.isPaused = !gameState.isPaused;
    const overlay = document.getElementById('gameOverlay');
    
    if (gameState.isPaused) {
        overlay.classList.add('active');
        playSound('pause');
    } else {
        overlay.classList.remove('active');
        playSound('resume');
    }
}

// Display updates
function updateDisplay() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('lives').textContent = gameState.lives;
}

// Settings functions
function updateDifficulty() {
    const difficulty = document.getElementById('difficulty').value;
    switch(difficulty) {
        case 'easy':
            gameSpeed = gameState.isMobile ? 250 : 200;
            break;
        case 'medium':
            gameSpeed = gameState.isMobile ? 200 : 150;
            break;
        case 'hard':
            gameSpeed = gameState.isMobile ? 150 : 100;
            break;
    }
    
    if (gameState.isPlaying) {
        startGameLoop();
    }
}

function updateSound() {
    const soundEnabled = document.getElementById('sound').checked;
    // Sound settings logic would go here
}

function updateMusic() {
    const musicEnabled = document.getElementById('music').checked;
    // Music settings logic would go here
}

function updateTheme() {
    const theme = document.getElementById('theme').value;
    // Theme switching logic would go here
}

// Sound effects (placeholder)
function playSound(soundType) {
    // In a real implementation, you would play actual sound files
    // For now, we'll just log the sound type
    console.log(`Playing sound: ${soundType}`);
    
    // You can add actual sound files and play them here:
    // const audio = new Audio(`sounds/${soundType}.mp3`);
    // audio.play();
}

// Utility functions
function getRandomColor() {
    const colors = ['#00ff41', '#00ffff', '#ff00ff', '#ffff00', '#ff8800'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Add some arcade-style effects
function addScreenShake() {
    canvas.style.transform = 'translate(2px, 2px)';
    setTimeout(() => {
        canvas.style.transform = 'translate(0, 0)';
    }, 100);
}

// Initialize arcade effects
setInterval(() => {
    if (gameState.currentPage === 'starter-page') {
        // Add subtle glow effects to menu items
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.boxShadow = '0 0 30px #00ff41';
                setTimeout(() => {
                    item.style.boxShadow = '';
                }, 200);
            }, index * 200);
        });
    }
}, 3000);

// Add cross-platform analytics
function trackGameEvent(eventName, data = {}) {
    // Add your analytics tracking here
    // Example: Google Analytics, Facebook Pixel, etc.
    console.log(`Game Event: ${eventName}`, { ...data, platform: gameState.platform, mobile: gameState.isMobile });
}

// Service Worker Registration
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
}

// PWA Installation
function setupPWAInstall() {
    console.log('Setting up PWA install functionality');
    
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('Install prompt event received');
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install button if not already installed
        if (!window.matchMedia('(display-mode: standalone)').matches) {
            console.log('Showing install prompt');
            showInstallPrompt();
        } else {
            console.log('App already installed');
        }
    });
    
    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        trackGameEvent('pwa_installed', { platform: gameState.platform });
        
        // Remove install prompt if visible
        const installPrompt = document.querySelector('.install-prompt');
        if (installPrompt) {
            installPrompt.remove();
        }
    });
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('App is already installed');
    }
}

function showInstallPrompt() {
    console.log('Creating install prompt');
    
    // Remove existing install prompt if any
    const existingPrompt = document.querySelector('.install-prompt');
    if (existingPrompt) {
        existingPrompt.remove();
    }
    
    // Create install button
    const installBtn = document.createElement('div');
    installBtn.className = 'install-prompt';
    installBtn.innerHTML = `
        <div class="install-content">
            <span>📱 Install Snake Arcade</span>
            <button onclick="installPWA()" class="install-btn">INSTALL</button>
            <button onclick="this.parentElement.parentElement.remove()" class="close-btn">✕</button>
        </div>
    `;
    
    // Add to starter page
    const starterPage = document.getElementById('starter-page');
    if (starterPage) {
        starterPage.appendChild(installBtn);
        console.log('Install prompt added to starter page');
    } else {
        console.error('Starter page not found');
    }
}

function installPWA() {
    console.log('Install PWA called');
    
    if (deferredPrompt) {
        console.log('Prompting user for installation');
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;
        });
    } else {
        console.log('Install prompt not available');
        // Fallback for browsers that don't support beforeinstallprompt
        const message = 'To install this app:\n\n' +
                       '• Chrome/Edge: Click the install icon in the address bar\n' +
                       '• Firefox: Click the install icon in the address bar\n' +
                       '• Safari: Use Share button and "Add to Home Screen"';
        alert(message);
    }
}

// Platform-specific optimizations
function optimizeForPlatform() {
    switch(gameState.platform) {
        case 'android':
            // Android-specific optimizations
            if (gameState.isMobile) {
                // Enable Android-specific features
                enableAndroidFeatures();
            }
            break;
        case 'ios':
            // iOS-specific optimizations
            if (gameState.isMobile) {
                enableIOSFeatures();
            }
            break;
        case 'windows':
            // Windows-specific optimizations
            enableWindowsFeatures();
            break;
        case 'linux':
            // Linux-specific optimizations
            enableLinuxFeatures();
            break;
        case 'mac':
            // Mac-specific optimizations
            enableMacFeatures();
            break;
    }
}

function enableAndroidFeatures() {
    // Android-specific mobile optimizations
    document.body.classList.add('android-optimized');
}

function enableIOSFeatures() {
    // iOS-specific mobile optimizations
    document.body.classList.add('ios-optimized');
}

function enableWindowsFeatures() {
    // Windows-specific desktop optimizations
    document.body.classList.add('windows-optimized');
}

function enableLinuxFeatures() {
    // Linux-specific desktop optimizations
    document.body.classList.add('linux-optimized');
}

function enableMacFeatures() {
    // Mac-specific desktop optimizations
    document.body.classList.add('mac-optimized');
}

// Call platform optimization after platform detection
setTimeout(optimizeForPlatform, 100);
