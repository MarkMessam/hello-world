// Game Variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Audio context for sound effects
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Paddle properties
const paddleHeight = 80;
const paddleWidth = 10;
const paddleSpeed = 6;

// Ball properties
const ballSize = 6;
const initialBallSpeed = 5;

// Game objects
const player = {
    x: 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    score: 0
};

const computer = {
    x: canvas.width - paddleWidth - 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    score: 0
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: ballSize,
    dx: initialBallSpeed,
    dy: initialBallSpeed,
    speed: initialBallSpeed
};

// Input handling
const keys = {};
let mouseY = canvas.height / 2;

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
});

// Fart sound effect generator
function playFartSound() {
    try {
        const now = audioContext.currentTime;
        
        // Create oscillator for the fart effect
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        // Connect nodes
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        // Set up the fart sound
        osc.type = 'sine';
        
        // Fart frequency pattern - random low frequency
        const baseFreq = 80 + Math.random() * 60; // 80-140 Hz for that bassy fart sound
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + 0.15);
        
        // Volume envelope - quick attack, quick decay
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        // Start and stop the sound
        osc.start(now);
        osc.stop(now + 0.2);
        
        // Optional: Add some noise for extra fart authenticity
        const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.2, audioContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }
        
        const noiseSource = audioContext.createBufferSource();
        const noiseGain = audioContext.createGain();
        noiseSource.buffer = noiseBuffer;
        noiseSource.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        
        noiseGain.gain.setValueAtTime(0.15, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        noiseSource.start(now);
    } catch (e) {
        console.log('Audio context error:', e);
    }
}

// Update player paddle position
function updatePlayer() {
    // Arrow keys control
    if (keys['ArrowUp'] || keys['ArrowUp']) {
        player.y = Math.max(0, player.y - paddleSpeed);
    }
    if (keys['ArrowDown']) {
        player.y = Math.min(canvas.height - player.height, player.y + paddleSpeed);
    }

    // Mouse control
    const targetY = mouseY - player.height / 2;
    player.y += (targetY - player.y) * 0.15; // Smooth following
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

// Update computer paddle (AI)
function updateComputer() {
    const computerCenter = computer.y + computer.height / 2;
    const ballCenter = ball.y;

    // Simple AI: follow the ball
    if (computerCenter < ballCenter - 35) {
        computer.y = Math.min(canvas.height - computer.height, computer.y + paddleSpeed * 0.9);
    } else if (computerCenter > ballCenter + 35) {
        computer.y = Math.max(0, computer.y - paddleSpeed * 0.9);
    }

    // Smooth movement
    computer.y = Math.max(0, Math.min(canvas.height - computer.height, computer.y));
}

// Update ball position
function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Collision with top and bottom walls
    if (ball.y - ball.size < 0 || ball.y + ball.size > canvas.height) {
        ball.dy = -ball.dy;
        ball.y = Math.max(ball.size, Math.min(canvas.height - ball.size, ball.y));
        playFartSound();
    }

    // Collision with player paddle
    if (
        ball.x - ball.size < player.x + player.width &&
        ball.y > player.y &&
        ball.y < player.y + player.height
    ) {
        ball.dx = -ball.dx;
        ball.x = player.x + player.width + ball.size;

        // Add spin based on where the ball hits the paddle
        const collidePoint = ball.y - (player.y + player.height / 2);
        const normalizedCollidePoint = collidePoint / (player.height / 2);
        ball.dy = normalizedCollidePoint * ball.speed;

        // Increase speed
        ball.speed += 0.5;
        ball.dx = Math.abs(ball.dx) * (ball.speed / initialBallSpeed);
        
        playFartSound();
    }

    // Collision with computer paddle
    if (
        ball.x + ball.size > computer.x &&
        ball.y > computer.y &&
        ball.y < computer.y + computer.height
    ) {
        ball.dx = -ball.dx;
        ball.x = computer.x - ball.size;

        // Add spin based on where the ball hits the paddle
        const collidePoint = ball.y - (computer.y + computer.height / 2);
        const normalizedCollidePoint = collidePoint / (computer.height / 2);
        ball.dy = normalizedCollidePoint * ball.speed;

        // Increase speed
        ball.speed += 0.5;
        ball.dx = -Math.abs(ball.dx) * (ball.speed / initialBallSpeed);
        
        playFartSound();
    }

    // Score points
    if (ball.x - ball.size < 0) {
        computer.score++;
        resetBall();
    } else if (ball.x + ball.size > canvas.width) {
        player.score++;
        resetBall();
    }
}

// Reset ball to center
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = initialBallSpeed;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * initialBallSpeed;
    ball.dy = (Math.random() - 0.5) * initialBallSpeed;
}

// Draw functions
function drawPaddle(paddle) {
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 10;
}

function drawBall() {
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
}

function drawCenterLine() {
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    drawCenterLine();

    // Draw paddles and ball
    drawPaddle(player);
    drawPaddle(computer);
    drawBall();

    // Reset shadow
    ctx.shadowBlur = 0;
}

// Update scores display
function updateScores() {
    document.getElementById('playerScore').textContent = player.score;
    document.getElementById('computerScore').textContent = computer.score;
}

// Game loop
function gameLoop() {
    updatePlayer();
    updateComputer();
    updateBall();
    draw();
    updateScores();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
