// Socket.IO Client for Multiplayer Racing Game

// Get DOM elements
const mainMenu = document.getElementById('main-menu');
const startBtn = document.getElementById('start-btn');
const gameContainer = document.querySelector('.game-container');

// Game state
let myPlayerId = null;
let players = {};
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('game-status');
const playerIdEl = document.getElementById('player-id');

// Socket connection (initialized after start button click)
let socket;

// Start game when button is clicked
startBtn.addEventListener('click', () => {
    // Initialize socket connection
    socket = io();
    
    // Set up socket event handlers
    setupSocketHandlers();
    
    // Hide main menu with fade out
    mainMenu.style.animation = 'menuFadeOut 0.3s ease-out forwards';
    
    setTimeout(() => {
        mainMenu.style.display = 'none';
        // Show game container
        gameContainer.style.display = 'block';
        gameContainer.style.animation = 'gameContainerFadeIn 0.5s ease-out';
    }, 300);
});

// Socket.IO Event Handlers setup
function setupSocketHandlers() {

}

// Preload car images
const carImages = {};
const carImageNames = ['car1.png', 'car2.png', 'car3.png'];

function preloadCarImages() {
    carImageNames.forEach(name => {
        const img = new Image();
        img.src = '/static/' + name;
        carImages[name] = img;
    });
}

// Preload images when script loads
preloadCarImages();

// Player properties
const PLAYER_SIZE = 24;
const MOVE_SPEED = 4;

// Track configuration - Circuit race track with 6 turns (CLOCKWISE DIRECTION)
// Level 1: Beginner Oval Track
const TRACKS = {
    1: {
        name: "Speedway Oval",
        waypoints: [
            { x: 200, y: 150 },  // Start/Finish - top left
            { x: 400, y: 100 },  // Top middle
            { x: 600, y: 150 },  // Top right
            { x: 700, y: 300 },  // Right curve
            { x: 650, y: 450 },  // Bottom right
            { x: 400, y: 500 },  // Bottom middle
            { x: 150, y: 450 },  // Bottom left
            { x: 100, y: 300 },  // Left curve
        ],
        trackWidth: 80,
        closed: true,
        clockwise: true,
    },
    // Level 2: Figure-8 Track
    2: {
        name: "Figure Eight",
        waypoints: [
            { x: 250, y: 200 },  // Start/Finish - top left of figure-8
            { x: 400, y: 150 },  // Top middle
            { x: 550, y: 200 },  // Top right
            { x: 500, y: 300 },  // Right crossover
            { x: 550, y: 400 },  // Bottom right
            { x: 400, y: 450 },  // Bottom middle
            { x: 250, y: 400 },  // Bottom left
            { x: 300, y: 300 },  // Left crossover
        ],
        trackWidth: 65,
        closed: true,
        clockwise: true,
    },
    // Level 3: Technical Chicane Track
    3: {
        name: "Technical Circuit",
        waypoints: [
            { x: 650, y: 100 },  // Start/Finish - top right
            { x: 550, y: 120 },  // Top right corner
            { x: 480, y: 180 },  // Chicane 1
            { x: 400, y: 150 },  // Chicane 1 apex
            { x: 320, y: 200 },  // Chicane 1 exit
            { x: 200, y: 250 },  // Turn 2
            { x: 120, y: 350 },  // Turn 3
            { x: 150, y: 450 },  // Bottom left
            { x: 250, y: 500 },  // Bottom middle left
            { x: 400, y: 480 },  // Chicane 2
            { x: 450, y: 420 },  // Chicane 2 apex
            { x: 500, y: 380 },  // Chicane 2 exit
            { x: 600, y: 400 },  // Bottom right
            { x: 700, y: 350 },  // Right curve
            { x: 720, y: 200 },  // Top right curve
        ],
        trackWidth: 60,
        closed: true,
        clockwise: true,
    },
    // Level 4: Complex Circuit with Hairpins
    4: {
        name: "Grand Prix Circuit",
        waypoints: [
            { x: 620, y: 80 },   // Start/Finish - top right
            { x: 500, y: 60 },   // Top straight start
            { x: 350, y: 80 },   // Turn 1 (hairpin)
            { x: 250, y: 150 },  // Turn 1 apex
            { x: 200, y: 250 },  // Turn 1 exit
            { x: 180, y: 350 },  // Turn 2
            { x: 220, y: 420 },  // Turn 2 exit
            { x: 350, y: 450 },  // Bottom straight
            { x: 500, y: 420 },  // Turn 3 (chicane)
            { x: 520, y: 360 },  // Chicane apex
            { x: 480, y: 320 },  // Chicane exit
            { x: 400, y: 280 },  // Mid track
            { x: 300, y: 250 },  // Turn 4
            { x: 250, y: 180 },  // Turn 4 apex
            { x: 300, y: 120 },  // Back straight
            { x: 450, y: 100 },  // Final turn
        ],
        trackWidth: 55,
        closed: true,
        clockwise: true,
    },
    // Level 5: Ultimate Expert Track
    5: {
        name: "Championship Circuit",
        waypoints: [
            { x: 700, y: 80 },   // Start/Finish - far right
            { x: 580, y: 60 },   // Top right
            { x: 450, y: 80 },   // Turn 1 approach
            { x: 350, y: 120 },  // Hairpin 1
            { x: 280, y: 180 },  // Hairpin 1 apex
            { x: 250, y: 260 },  // Hairpin 1 exit
            { x: 150, y: 320 },  // Left hairpin
            { x: 100, y: 400 },  // Left hairpin apex
            { x: 150, y: 480 },  // Bottom left
            { x: 300, y: 520 },  // Bottom chicane start
            { x: 350, y: 480 },  // Chicane apex
            { x: 400, y: 440 },  // Chicane exit
            { x: 500, y: 460 },  // Bottom right approach
            { x: 600, y: 420 },  // Right hairpin
            { x: 650, y: 350 },  // Right hairpin apex
            { x: 620, y: 280 },  // Mid right
            { x: 550, y: 220 },  // Final chicane
            { x: 480, y: 250 },  // Final chicane apex
            { x: 420, y: 200 },  // Final chicane exit
            { x: 500, y: 150 },  // Back straight
            { x: 600, y: 120 },  // Final approach
        ],
        trackWidth: 50,
        closed: true,
        clockwise: true,
    }
};

// Current track (active)
let currentTrack = TRACKS[1];

// Level state
let currentLevel = 1;
const totalLevels = 5;

// Get checkpoints for current track
function getCheckpointsForTrack(track) {
    const numCheckpoints = Math.min(5, Math.floor(track.waypoints.length / 2));
    const checkpoints = [];
    
    for (let i = 0; i < numCheckpoints; i++) {
        const wpIndex = Math.floor((i + 1) * track.waypoints.length / (numCheckpoints + 1));
        checkpoints.push({
            id: i,
            waypointIndex: wpIndex % track.waypoints.length,
            progress: 0.5,
            name: `Checkpoint ${i + 1}`,
            passed: false
        });
    }
    
    return checkpoints;
}

// Initialize checkpoints for level 1
let CHECKPOINTS = getCheckpointsForTrack(TRACKS[1]);

// Alias for backward compatibility
const TRACK = currentTrack;

// Load a specific level/track
function loadLevel(level) {
    if (level < 1 || level > totalLevels) {
        console.log("All levels completed!");
        return false;
    }
    
    currentLevel = level;
    currentTrack = TRACKS[level];
    CHECKPOINTS = getCheckpointsForTrack(currentTrack);
    
    // Update HTML level display
    const levelEl = document.getElementById('current-level');
    if (levelEl) {
        levelEl.textContent = currentLevel;
    }
    
    // Update direction indicator with track name
    const titleWrapper = document.querySelector('.title-wrapper');
    if (titleWrapper) {
        const dirIndicator = titleWrapper.querySelector('.direction-indicator');
        if (dirIndicator) {
            dirIndicator.textContent = `↻ ${currentTrack.name}`;
        }
    }
    
    console.log(`Loaded Level ${level}: ${currentTrack.name}`);
    return true;
}

// Advance to next level
function advanceToNextLevel() {
    if (currentLevel < totalLevels) {
        loadLevel(currentLevel + 1);
        resetGameForNewLevel();
    } else {
        // All levels completed - show championship win
        showChampionshipWin();
    }
}

// Reset game for new level
function resetGameForNewLevel() {
    // Hide win overlay
    const winOverlay = document.getElementById('win-overlay');
    winOverlay.classList.remove('active');
    
    // Reset game state
    playerLaps = 0;
    playerCheckpoint = 0;
    raceStarted = true;
    
    // Reset status
    statusEl.textContent = `🏎️ Level ${currentLevel}: ${currentTrack.name}`;
    statusEl.classList.remove('winner');
    statusEl.classList.add('racing');
    
    // Reset checkpoints
    CHECKPOINTS.forEach(cp => cp.passed = false);
    
    // Reset player position to start
    if (myPlayerId && players[myPlayerId]) {
        players[myPlayerId].x = currentTrack.waypoints[0].x;
        players[myPlayerId].y = currentTrack.waypoints[0].y;
        
        // Send position to server
        socket.emit('player_move', {
            x: players[myPlayerId].x,
            y: players[myPlayerId].y
        });
    }
}

// Show championship win screen
function showChampionshipWin() {
    const winOverlay = document.getElementById('win-overlay');
    const winTitle = winOverlay.querySelector('.win-title');
    const winSubtitle = winOverlay.querySelector('.win-subtitle');
    const winStats = winOverlay.querySelector('.win-stats');
    const nextLevelBtn = document.getElementById('next-level-btn');
    
    // Update win content
    winTitle.textContent = '🏆 CHAMPION! 🏆';
    winSubtitle.textContent = 'All Tracks Completed!';
    winStats.innerHTML = `<p>Total Levels: ${totalLevels}</p><p>You are the Racing Champion!</p>`;
    
    // Hide next level button
    nextLevelBtn.style.display = 'none';
    
    // Show overlay
    winOverlay.classList.add('active');
    createConfetti();
    createStarBurst();
    
    // Reset to level 1 for replay
    document.getElementById('play-again-btn').onclick = function() {
        loadLevel(1);
        resetGameForNewLevel();
    };
}

// Player state for racing
let playerLaps = 0;
let playerCheckpoint = 0;
let raceStarted = false;
const TOTAL_LAPS = 3;

// Keyboard state
const keys = {
    up: false,
    down: false,
    left: false,
    right: false
};

// Socket.IO Event Handlers setup
function setupSocketHandlers() {
    // Connection established
    socket.on('connect', () => {
        console.log('Connected to server with ID:', socket.id);
        statusEl.textContent = 'Connected! Joining race...';
        
        // Join the game
        socket.emit('join_game');
    });

    // Handle player_joined event
    socket.on('player_joined', (data) => {
        if (data.all_players) {
            // This is our initial join - we received all players
            players = data.all_players;
            // Use socket.id as our player ID (available after connection)
            myPlayerId = socket.id;
            
            // Initialize race state for self
            playerLaps = 0;
            playerCheckpoint = 0;
            raceStarted = true;
            statusEl.textContent = '🏎️ Racing!';
            statusEl.classList.add('racing');
            playerIdEl.textContent = myPlayerId.substring(0, 8);
            console.log('Joined race as:', myPlayerId);
        } else if (data.player) {
            // Another player joined
            players[data.player.id] = data.player;
            console.log('Player joined race:', data.player.id);
        }
    });

    // Handle player_moved event
    socket.on('player_moved', (data) => {
        if (data.player) {
            // New player position from join
            players[data.player.id] = data.player;
        } else if (data.player_id && data.x !== undefined && data.y !== undefined) {
            // Existing player moved
            if (players[data.player_id]) {
                players[data.player_id].x = data.x;
                players[data.player_id].y = data.y;
            }
        }
    });

    // Handle player_left event
    socket.on('player_left', (data) => {
        if (data.player_id && players[data.player_id]) {
            delete players[data.player_id];
            console.log('Player left:', data.player_id);
        }
    });

    // Start the game loop once socket is connected
    socket.on('connect', () => {
        gameLoop();
    });
}

// ============================================================
// Track Helper Functions
// ============================================================

// Get distance from point to line segment
function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;
    
    if (lengthSq === 0) {
        // Segment is a point
        return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    }
    
    // Calculate projection parameter
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));
    
    // Find closest point on segment
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    
    return {
        distance: Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY)),
        closestX: closestX,
        closestY: closestY
    };
}

// Check if a point is on the track
function isOnTrack(x, y) {
    const halfWidth = currentTrack.trackWidth / 2;
    const waypoints = currentTrack.waypoints;
    
    // Check distance to each segment of the track
    for (let i = 0; i < waypoints.length; i++) {
        const next = (i + 1) % waypoints.length;
        const result = pointToSegmentDistance(
            x, y,
            waypoints[i].x, waypoints[i].y,
            waypoints[next].x, waypoints[next].y
        );
        
        if (result.distance <= halfWidth) {
            return true;
        }
    }
    
    return false;
}

// Get position along the track (0 to waypoints.length)
function getTrackPosition(x, y) {
    const halfWidth = currentTrack.trackWidth / 2;
    const waypoints = currentTrack.waypoints;
    let minDist = Infinity;
    let bestPos = 0;
    
    for (let i = 0; i < waypoints.length; i++) {
        const next = (i + 1) % waypoints.length;
        const result = pointToSegmentDistance(
            x, y,
            waypoints[i].x, waypoints[i].y,
            waypoints[next].x, waypoints[next].y
        );
        
        if (result.distance < minDist) {
            minDist = result.distance;
            // Calculate position along track
            const segLen = Math.sqrt(
                Math.pow(waypoints[next].x - waypoints[i].x, 2) +
                Math.pow(waypoints[next].y - waypoints[i].y, 2)
            );
            const t = segLen > 0 ? 
                Math.sqrt(Math.pow(x - waypoints[i].x, 2) + Math.pow(y - waypoints[i].y, 2)) / segLen : 0;
            bestPos = i + Math.min(1, Math.max(0, t));
        }
    }
    
    return bestPos;
}

// Get checkpoint for a position
function getCheckpointAtPosition(x, y) {
    return getTrackPosition(x, y) / currentTrack.waypoints.length;
}

// Check if player crossed a checkpoint (CLOCKWISE direction)
function checkCheckpoint(player) {
    if (!raceStarted) return;
    
    const currentWaypoint = CHECKPOINTS[playerCheckpoint].waypointIndex;
    const playerPos = getTrackPosition(player.x, player.y);
    
    // For clockwise racing, we check if player has advanced along the track
    // Get the player's current waypoint index based on track position
    const playerWaypointIndex = Math.floor(playerPos) % currentTrack.waypoints.length;
    
    // Check if player crossed the current checkpoint waypoint
    const waypointX = currentTrack.waypoints[currentWaypoint].x;
    const waypointY = currentTrack.waypoints[currentWaypoint].y;
    const dist = Math.sqrt(Math.pow(player.x - waypointX, 2) + Math.pow(player.y - waypointY, 2));
    
    // For clockwise: check if player passed the checkpoint waypoint
    // Player must be near checkpoint AND have come from the correct direction
    if (dist < currentTrack.trackWidth) {
        // Determine if we're moving in clockwise direction
        // In clockwise, waypoint indices should increase (wrapping around)
        const nextExpectedWaypoint = CHECKPOINTS[playerCheckpoint].waypointIndex;
        
        // Check if player has progressed to or past the next checkpoint
        // For clockwise: we need to check if player is at/near current checkpoint
        playerCheckpoint++;
        
        // Check if lap completed
        if (playerCheckpoint >= CHECKPOINTS.length) {
            playerCheckpoint = 0;
            playerLaps++;
            
            // Reset checkpoint passed state
            CHECKPOINTS.forEach(cp => cp.passed = false);
            
            if (playerLaps >= TOTAL_LAPS) {
                statusEl.textContent = `🏆 YOU WIN! 🏆`;
                statusEl.classList.remove('racing');
                statusEl.classList.add('winner');
                raceStarted = false;
                // Trigger the creative win display
                showWinOverlay();
            } else {
                statusEl.textContent = `Lap ${playerLaps + 1}/${TOTAL_LAPS}`;
                statusEl.classList.add('racing');
            }
        } else {
            console.log(`Checkpoint: ${CHECKPOINTS[playerCheckpoint].name}`);
        }
    }
}

// ============================================
// Creative Win Overlay Functions
// ============================================

function showWinOverlay() {
    const winOverlay = document.getElementById('win-overlay');
    const winLapsEl = document.getElementById('win-laps');
    const winTitle = winOverlay.querySelector('.win-title');
    const winSubtitle = winOverlay.querySelector('.win-subtitle');
    const nextLevelBtn = document.getElementById('next-level-btn');
    
    // Update lap count display
    winLapsEl.textContent = TOTAL_LAPS;
    
    // Show the overlay
    winOverlay.classList.add('active');
    
    // Create confetti
    createConfetti();
    
    // Create star burst
    createStarBurst();
    
    // Set up play again button (restart same level)
    document.getElementById('play-again-btn').addEventListener('click', resetGame);
    
    // Show Next Level button if not on final level
    if (currentLevel < totalLevels) {
        nextLevelBtn.style.display = 'inline-block';
        nextLevelBtn.onclick = advanceToNextLevel;
        winTitle.textContent = '🏆 Level Complete! 🏆';
        winSubtitle.textContent = currentTrack.name + ' Conquered!';
    } else {
        nextLevelBtn.style.display = 'none';
        winTitle.textContent = '🏆 YOU WIN! 🏆';
        winSubtitle.textContent = 'Champion!';
    }
}

function createConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ff9f43', '#a29bfe', '#fd79a8'];
    const shapes = ['square', 'circle'];
    
    // Create 100 confetti pieces
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // Random properties
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 2 + Math.random() * 2;
        
        confetti.style.left = left + '%';
        confetti.style.background = color;
        confetti.style.animationDelay = delay + 's';
        confetti.style.animationDuration = duration + 's';
        
        if (shape === 'circle') {
            confetti.style.borderRadius = '50%';
        }
        
        container.appendChild(confetti);
        
        // Trigger animation
        setTimeout(() => {
            confetti.classList.add('active');
        }, 10);
    }
    
    // Clean up confetti after animation
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

function createStarBurst() {
    const container = document.getElementById('win-stars');
    const numStars = 20;
    
    for (let i = 0; i < numStars; i++) {
        const star = document.createElement('div');
        star.className = 'star-burst';
        
        // Calculate position in a circle
        const angle = (i / numStars) * 360;
        const distance = 150 + Math.random() * 100;
        const radians = (angle * Math.PI) / 180;
        
        const x = Math.cos(radians) * distance;
        const y = Math.sin(radians) * distance;
        
        star.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        star.style.animationDelay = (Math.random() * 0.3) + 's';
        
        // Random colors between gold and orange
        const hue = Math.random() > 0.5 ? '#ffd700' : '#ff8c00';
        star.style.background = hue;
        star.style.boxShadow = `0 0 10px ${hue}, 0 0 20px #ff6b00`;
        
        container.appendChild(star);
    }
}

function resetGame() {
    // Hide win overlay
    const winOverlay = document.getElementById('win-overlay');
    winOverlay.classList.remove('active');
    
    // Reset game state
    playerLaps = 0;
    playerCheckpoint = 0;
    raceStarted = true;
    
    // Reset status
    statusEl.textContent = '🏎️ Racing!';
    statusEl.classList.remove('winner');
    statusEl.classList.add('racing');
    
    // Reset checkpoints
    CHECKPOINTS.forEach(cp => cp.passed = false);
    
    // Reset player position to start
    if (myPlayerId && players[myPlayerId]) {
        players[myPlayerId].x = currentTrack.waypoints[0].x;
        players[myPlayerId].y = currentTrack.waypoints[0].y;
        
        // Send position to server
        socket.emit('player_move', {
            x: players[myPlayerId].x,
            y: players[myPlayerId].y
        });
    }
}

// Constrain player position to track
function constrainToTrack(player) {
    const margin = PLAYER_SIZE / 2;
    
    // If not on track, find closest point on track and push there
    if (!isOnTrack(player.x, player.y)) {
        const halfWidth = currentTrack.trackWidth / 2 - margin;
        const waypoints = currentTrack.waypoints;
        let minDist = Infinity;
        let bestX = player.x;
        let bestY = player.y;
        
        // Find closest point on track
        for (let i = 0; i < waypoints.length; i++) {
            const next = (i + 1) % waypoints.length;
            const result = pointToSegmentDistance(
                player.x, player.y,
                waypoints[i].x, waypoints[i].y,
                waypoints[next].x, waypoints[next].y
            );
            
            if (result.distance < minDist) {
                minDist = result.distance;
                // Push the point towards the track center
                const pushDist = halfWidth;
                const dx = result.closestX - player.x;
                const dy = result.closestY - player.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len > 0) {
                    bestX = result.closestX - (dx / len) * pushDist;
                    bestY = result.closestY - (dy / len) * pushDist;
                } else {
                    bestX = result.closestX;
                    bestY = result.closestY;
                }
            }
        }
        
        player.x = bestX;
        player.y = bestY;
    }
}

// ============================================================
// Game Logic
// ============================================================

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            keys.up = true;
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            keys.down = true;
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            keys.left = true;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            keys.right = true;
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            keys.up = false;
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            keys.down = false;
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            keys.left = false;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            keys.right = false;
            break;
    }
});

// Update player position
function updatePlayer() {
    if (!myPlayerId || !players[myPlayerId]) return;
    
    const player = players[myPlayerId];
    let moved = false;
    
    // Store old position for collision
    const oldX = player.x;
    const oldY = player.y;
    
    // Movement with track boundaries
    if (keys.up && player.y > PLAYER_SIZE) {
        player.y -= MOVE_SPEED;
        moved = true;
    }
    if (keys.down && player.y < canvas.height - PLAYER_SIZE) {
        player.y += MOVE_SPEED;
        moved = true;
    }
    if (keys.left && player.x > PLAYER_SIZE) {
        player.x -= MOVE_SPEED;
        moved = true;
    }
    if (keys.right && player.x < canvas.width - PLAYER_SIZE) {
        player.x += MOVE_SPEED;
        moved = true;
    }
    
    // Constrain to track
    if (moved) {
        constrainToTrack(player);
        
        // Check checkpoints
        checkCheckpoint(player);
        
        // Send position update to server
        socket.emit('player_move', {
            x: player.x,
            y: player.y
        });
    }
}

// Draw the race track with CLOCKWISE direction indicators
function drawTrack() {
    const waypoints = currentTrack.waypoints;
    const halfWidth = currentTrack.trackWidth / 2;
    
    // Draw grass/background with gradient
    const grassGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grassGradient.addColorStop(0, '#1a4d1a');
    grassGradient.addColorStop(0.5, '#2d6b2d');
    grassGradient.addColorStop(1, '#1a4d1a');
    ctx.fillStyle = grassGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add grass texture pattern
    ctx.fillStyle = 'rgba(30, 90, 30, 0.3)';
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillRect(x, y, 2, 6);
    }
    
    // Draw track border/curb (red-white alternating)
    ctx.lineWidth = TRACK.trackWidth + 16;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Red curb
    ctx.strokeStyle = '#cc2222';
    ctx.beginPath();
    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x, waypoints[i].y);
    }
    if (TRACK.closed) {
        ctx.closePath();
    }
    ctx.stroke();
    
    // Draw track surface (tarmac) - draw as thick lines between waypoints
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = currentTrack.trackWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x, waypoints[i].y);
    }
    if (currentTrack.closed) {
        ctx.closePath();
    }
    ctx.stroke();
    
    // Add track centerline (dashed yellow) - now shows clockwise direction
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);
    
    ctx.beginPath();
    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x, waypoints[i].y);
    }
    if (currentTrack.closed) {
        ctx.closePath();
    }
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Draw track edges (white lines)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 10]);
    
    // Draw outer edge
    ctx.beginPath();
    for (let i = 0; i < waypoints.length; i++) {
        const next = (i + 1) % waypoints.length;
        const curr = waypoints[i];
        const nextPt = waypoints[next];
        
        // Calculate perpendicular offset for outer edge
        const dx = nextPt.x - curr.x;
        const dy = nextPt.y - curr.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) continue;
        
        // Perpendicular vector (outer)
        const px = -dy / len;
        const py = dx / len;
        
        if (i === 0) {
            ctx.moveTo(curr.x + px * halfWidth, curr.y + py * halfWidth);
        } else {
            ctx.lineTo(curr.x + px * halfWidth, curr.y + py * halfWidth);
        }
    }
    if (currentTrack.closed) ctx.closePath();
    ctx.stroke();
    
    // Draw inner edge
    ctx.beginPath();
    for (let i = 0; i < waypoints.length; i++) {
        const next = (i + 1) % waypoints.length;
        const curr = waypoints[i];
        const nextPt = waypoints[next];
        
        const dx = nextPt.x - curr.x;
        const dy = nextPt.y - curr.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) continue;
        
        // Perpendicular vector (inner)
        const px = dy / len;
        const py = -dx / len;
        
        if (i === 0) {
            ctx.moveTo(curr.x + px * halfWidth, curr.y + py * halfWidth);
        } else {
            ctx.lineTo(curr.x + px * halfWidth, curr.y + py * halfWidth);
        }
    }
    if (currentTrack.closed) ctx.closePath();
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Draw CLOCKWISE direction arrows along the track
    drawDirectionArrows(waypoints, halfWidth);
    
    // Draw start/finish line at waypoint 0 - Updated for CLOCKWISE direction
    const startWp = waypoints[0];
    const nextWp = waypoints[1];
    const startDx = nextWp.x - startWp.x;
    const startDy = nextWp.y - startWp.y;
    const startLen = Math.sqrt(startDx * startDx + startDy * startDy);
    
    if (startLen > 0) {
        // Perpendicular to track direction (adjusted for clockwise)
        // For clockwise at start, perpendicular points inward toward track center
        const perpX = startDy / startLen;  // Reversed from counter-clockwise
        const perpY = -startDx / startLen; // Reversed from counter-clockwise
        
        // Draw finish line base (black)
        ctx.fillStyle = '#222222';
        const checkSize = 10;
        for (let offset = -halfWidth; offset < halfWidth; offset += checkSize) {
            for (let i = 0; i < 2; i++) {
                const sx = startWp.x + perpX * (offset + i * checkSize);
                const sy = startWp.y + perpY * (offset + i * checkSize);
                ctx.fillRect(sx - checkSize/2 - 2, sy - checkSize/2 - 2, checkSize + 4, checkSize + 4);
            }
        }
        
        // Checkered pattern for start line
        ctx.fillStyle = '#ffffff';
        for (let offset = -halfWidth; offset < halfWidth; offset += checkSize) {
            for (let i = 0; i < 2; i++) {
                const sx = startWp.x + perpX * (offset + i * checkSize);
                const sy = startWp.y + perpY * (offset + i * checkSize);
                if ((Math.floor(offset / checkSize) + i) % 2 === 0) {
                    ctx.fillRect(sx - checkSize/2, sy - checkSize/2, checkSize, checkSize);
                }
            }
        }
    }
    
    // Draw checkpoint markers with glow effect
    const checkpointColors = ['#ff3333', '#ff33ff', '#33ffff', '#33ff33', '#ffff33'];
    for (let i = 0; i < CHECKPOINTS.length; i++) {
        const cp = CHECKPOINTS[i];
        const wp = waypoints[cp.waypointIndex];
        
        // Glow effect
        const glowGradient = ctx.createRadialGradient(wp.x, wp.y, 5, wp.x, wp.y, 20);
        glowGradient.addColorStop(0, checkpointColors[i % checkpointColors.length]);
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, 20, 0, 2 * Math.PI);
        ctx.fill();
        
        // Main checkpoint circle
        ctx.fillStyle = checkpointColors[i % checkpointColors.length];
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, 12, 0, 2 * Math.PI);
        ctx.fill();
        
        // Inner highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(wp.x - 3, wp.y - 3, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(cp.id + 1, wp.x, wp.y - 18);
    }
}

// Draw clockwise direction arrows along the track
function drawDirectionArrows(waypoints, halfWidth) {
    const arrowSpacing = 3; // Draw arrow every N waypoints
    
    for (let i = 0; i < waypoints.length; i++) {
        if (i % arrowSpacing !== 0) continue;
        
        const curr = waypoints[i];
        const next = waypoints[(i + 1) % waypoints.length];
        
        // Calculate direction
        const dx = next.x - curr.x;
        const dy = next.y - curr.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        if (len === 0) continue;
        
        // Normalize direction
        const dirX = dx / len;
        const dirY = dy / len;
        
        // Calculate perpendicular for offset (inner side for clockwise)
        const perpX = dirY;
        const perpY = -dirX;
        
        // Position arrow on inner side of track
        const arrowX = curr.x + perpX * (halfWidth - 15);
        const arrowY = curr.y + perpY * (halfWidth - 15);
        
        // Draw arrow
        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(Math.atan2(dirY, dirX));
        
        // Arrow shape
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-5, -6);
        ctx.lineTo(-5, 6);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

// Render the game with CLOCKWISE direction indicator
function render() {
    // Draw the track
    drawTrack();
    
    // Draw lap counter and direction indicator at top center of canvas
    if (raceStarted) {
        // Draw background pill for lap counter
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(canvas.width / 2 - 120, 15, 240, 40, 20);
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw lap text
        const lapText = `L${currentLevel}:${currentTrack.name} | Lap ${playerLaps + 1}/${TOTAL_LAPS}`;
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(lapText, canvas.width / 2, 35);
        ctx.shadowBlur = 0;
        ctx.textBaseline = 'alphabetic';
    }
    
    // Draw all players
    for (const playerId in players) {
        const player = players[playerId];
        
        // Draw player car image
        ctx.save();
        ctx.translate(player.x + PLAYER_SIZE/2, player.y + PLAYER_SIZE/2);
        
        // Rotate based on movement direction (adjusted for clockwise track)
        if (keys.right) ctx.rotate(Math.PI / 2);
        else if (keys.left) ctx.rotate(-Math.PI / 2);
        else if (keys.up) ctx.rotate(0);
        else if (keys.down) ctx.rotate(Math.PI);
        
        // Draw car glow/shadow effect
        const glowGradient = ctx.createRadialGradient(0, 0, 5, 0, 0, PLAYER_SIZE);
        glowGradient.addColorStop(0, 'rgba(255, 200, 0, 0.4)');
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, 0, PLAYER_SIZE, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw car image if loaded, otherwise fallback to colored rectangle
        const carImage = carImages[player.car_image];
        if (carImage && carImage.complete) {
            ctx.drawImage(carImage, -PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
        } else {
            // Enhanced fallback: draw styled rectangle
            const carGradient = ctx.createLinearGradient(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE/2, PLAYER_SIZE/2);
            carGradient.addColorStop(0, '#ff4444');
            carGradient.addColorStop(0.5, '#ff0000');
            carGradient.addColorStop(1, '#cc0000');
            ctx.fillStyle = carGradient;
            ctx.fillRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE/2);
            
            // Car highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(-PLAYER_SIZE/2 + 2, -PLAYER_SIZE/2 + 2, PLAYER_SIZE - 4, 4);
        }
        
        ctx.restore();
        
        // Draw player outline with glow
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE/2);
        
        // Highlight own player with enhanced effect
        if (playerId === myPlayerId) {
            // Glow effect for own player
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.strokeRect(player.x - 2, player.y - 2, PLAYER_SIZE + 4, PLAYER_SIZE/2 + 4);
            ctx.shadowBlur = 0;
            
            // Draw lap counter with style
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'left';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            ctx.fillText(`L${playerLaps + 1}`, player.x + PLAYER_SIZE + 5, player.y + 10);
            ctx.shadowBlur = 0;
        }
    }
}

// ============================================================
// Navigation and AI Pathfinding for CLOCKWISE Racing
// ============================================================

// Get the next waypoint for AI/player guidance (CLOCKWISE)
function getNextWaypoint(currentIndex) {
    return (currentIndex + 1) % currentTrack.waypoints.length;
}

// Get optimal racing line offset for clockwise direction
// This creates a path that's slightly inside on corners for better lap times
function getOptimalRacingLine(waypointIndex) {
    const wp = currentTrack.waypoints[waypointIndex];
    const nextWp = currentTrack.waypoints[(waypointIndex + 1) % currentTrack.waypoints.length];
    
    // Calculate direction vector
    const dx = nextWp.x - wp.x;
    const dy = nextWp.y - wp.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len === 0) return { x: wp.x, y: wp.y };
    
    // For clockwise racing, optimal line is inside (right side of track on left turns)
    // This is the opposite of counter-clockwise
    const dirX = dx / len;
    const dirY = dy / len;
    
    // Perpendicular inward for clockwise
    const perpX = dirY;   // Reversed from counter-clockwise
    const perpY = -dirX;  // Reversed from counter-clockwise
    
    // Offset for optimal racing line (slightly inside)
    const offset = currentTrack.trackWidth * 0.25;
    
    return {
        x: wp.x + perpX * offset,
        y: wp.y + perpY * offset
    };
}

// Get braking point for a corner (CLOCKWISE optimized)
function getBrakingPoint(cornerWaypointIndex, currentSpeed) {
    const corner = currentTrack.waypoints[cornerWaypointIndex];
    const prevWaypoint = currentTrack.waypoints[(cornerWaypointIndex - 1 + currentTrack.waypoints.length) % currentTrack.waypoints.length];
    
    // Calculate distance to corner
    const dist = Math.sqrt(Math.pow(corner.x - prevWaypoint.x, 2) + Math.pow(corner.y - prevWaypoint.y, 2));
    
    // Braking distance scales with speed (simplified physics)
    // For clockwise, braking zones are adjusted for right-hand corners
    const brakingFactor = 0.4;
    const brakingDist = currentSpeed * brakingFactor * 15;
    
    // Position at which to start braking
    const ratio = Math.min(1, brakingDist / dist);
    
    return {
        x: corner.x - (corner.x - prevWaypoint.x) * ratio,
        y: corner.y - (corner.y - prevWaypoint.y) * ratio,
        distance: brakingDist
    };
}

// Calculate corner entry/exit angles for clockwise racing
function getCornerAngles(waypointIndex) {
    const prev = currentTrack.waypoints[(waypointIndex - 1 + currentTrack.waypoints.length) % currentTrack.waypoints.length];
    const curr = currentTrack.waypoints[waypointIndex];
    const next = currentTrack.waypoints[(waypointIndex + 1) % currentTrack.waypoints.length];
    
    // Entry angle (direction from previous to current)
    const entryDx = curr.x - prev.x;
    const entryDy = curr.y - prev.y;
    const entryAngle = Math.atan2(entryDy, entryDx);
    
    // Exit angle (direction from current to next)
    const exitDx = next.x - curr.x;
    const exitDy = next.y - curr.y;
    const exitAngle = Math.atan2(exitDy, exitDx);
    
    // Corner angle (difference between exit and entry)
    // For clockwise, this tells us if it's a left or right turn
    let cornerAngle = exitAngle - entryAngle;
    
    // Normalize to -PI to PI
    while (cornerAngle > Math.PI) cornerAngle -= 2 * Math.PI;
    while (cornerAngle < -Math.PI) cornerAngle += 2 * Math.PI;
    
    return {
        entry: entryAngle,
        exit: exitAngle,
        corner: cornerAngle,
        isLeftTurn: cornerAngle > 0,  // Positive = left turn in standard math, but on screen Y is inverted
        isRightTurn: cornerAngle < 0  // Negative = right turn in standard math
    };
}

// Get recommended speed for each track segment (CLOCKWISE)
function getRecommendedSpeed(waypointIndex) {
    const angles = getCornerAngles(waypointIndex);
    const cornerSeverity = Math.abs(angles.corner);
    
    // Base speed
    let speed = MOVE_SPEED * 2.5;
    
    // Reduce speed for sharper corners
    // For clockwise, left turns (positive corner angle on screen) need different handling
    if (cornerSeverity > Math.PI / 3) {
        speed *= 0.4; // Hairpin
    } else if (cornerSeverity > Math.PI / 4) {
        speed *= 0.6; // Medium corner
    } else if (cornerSeverity > Math.PI / 6) {
        speed *= 0.8; // Mild corner
    }
    
    return speed;
}

// Calculate total track distance for clockwise lap
function getTrackDistance() {
    let totalDist = 0;
    const waypoints = currentTrack.waypoints;
    
    for (let i = 0; i < waypoints.length; i++) {
        const next = (i + 1) % waypoints.length;
        const dx = waypoints[next].x - waypoints[i].x;
        const dy = waypoints[next].y - waypoints[i].y;
        totalDist += Math.sqrt(dx * dx + dy * dy);
    }
    
    return totalDist;
}

// Get progress along track as percentage (0-100)
function getTrackProgress(x, y) {
    const position = getTrackPosition(x, y);
    return (position / currentTrack.waypoints.length) * 100;
}

// Helper function to lighten a color
function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + 
        (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
        (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
}

// Game loop
function gameLoop() {
    updatePlayer();
    render();
    requestAnimationFrame(gameLoop);
}
