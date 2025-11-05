const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiContainer = document.getElementById('ui');
const levelDisplay = document.getElementById('level');
const livesDisplay = document.getElementById('lives');
const filledDisplay = document.getElementById('filled');

// Game variables
let level = 1;
let lives = 3;
let isGameRunning = false;
let isDrawingLine = false;

// Ball
const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 5,
  vx: 3,
  vy: -3
};

// Paddle
const paddle = {
  x: canvas.width / 2 - 40,
  y: canvas.height - 15,
  width: 80,
  height: 10,
  speed: 6,
  dx: 0
};

// Keyboard state
const keys = {};

// Game state
const gameState = {
  lines: [],
  barriers: [],
  filledPercentage: 0
};

// Event listeners for keyboard controls
document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  
  // Spacebar to start line/barrier
  if (e.key === ' ') {
    e.preventDefault();
    if (!isGameRunning && lives > 0) {
      startGame();
    }
    if (!isDrawingLine && isGameRunning) {
      startDrawingLine();
    }
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
  
  // Release line when key is released
  if (e.key === ' ' && isDrawingLine) {
    endDrawingLine();
  }
});

// Button click handlers
document.getElementById('splitBtn').addEventListener('click', () => {
  if (!isGameRunning && lives > 0) {
    startGame();
  } else if (isGameRunning) {
    if (!isDrawingLine) {
      startDrawingLine();
    } else {
      endDrawingLine();
    }
  }
});

function startGame() {
  if (!isGameRunning) {
    isGameRunning = true;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.vx = 3 * (Math.random() > 0.5 ? 1 : -1);
    ball.vy = -3;
    gameState.lines = [];
    gameState.barriers = [];
    gameState.filledPercentage = 0;
    updateUI();
    gameLoop();
  }
}

function startDrawingLine() {
  if (!isDrawingLine) {
    isDrawingLine = true;
    // Line drawing logic would go here
  }
}

function endDrawingLine() {
  if (isDrawingLine) {
    isDrawingLine = false;
    // Finalize line logic would go here
  }
}

function gameLoop() {
  // Update paddle position based on keyboard input
  if (keys['ArrowLeft'] || keys['a']) {
    paddle.dx = -paddle.speed;
  } else if (keys['ArrowRight'] || keys['d']) {
    paddle.dx = paddle.speed;
  } else {
    paddle.dx = 0;
  }
  
  // Update paddle position
  paddle.x += paddle.dx;
  
  // Clamp paddle to canvas boundaries
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
  
  // Update ball position
  ball.x += ball.vx;
  ball.y += ball.vy;
  
  // Bounce off walls
  if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
    ball.vx = -ball.vx;
    ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x));
  }
  
  if (ball.y - ball.radius < 0) {
    ball.vy = -ball.vy;
    ball.y = Math.max(ball.radius, ball.y);
  }
  
  // Bounce off paddle
  if (checkPaddleCollision()) {
    ball.vy = -Math.abs(ball.vy);
    ball.y = paddle.y - ball.radius;
    // Add some curve based on where the ball hits the paddle
    const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    ball.vx += hitPos * 2;
  }
  
  // Check if ball fell below paddle
  if (ball.y - ball.radius > canvas.height) {
    lives--;
    updateUI();
    
    if (lives <= 0) {
      isGameRunning = false;
      alert('Game Over! Final Level: ' + level);
      // Reset game
      lives = 3;
      level = 1;
      gameState.filledPercentage = 0;
      updateUI();
    } else {
      // Reset ball position
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      ball.vx = 3 * (Math.random() > 0.5 ? 1 : -1);
      ball.vy = -3;
    }
  }
  
  // Draw everything
  draw();
  
  if (isGameRunning) {
    requestAnimationFrame(gameLoop);
  }
}

function checkPaddleCollision() {
  // Check if ball is within paddle's vertical range
  if (ball.y + ball.radius >= paddle.y && ball.y - ball.radius <= paddle.y + paddle.height) {
    // Check if ball is within paddle's horizontal range
    if (ball.x >= paddle.x - ball.radius && ball.x <= paddle.x + paddle.width + ball.radius) {
      return true;
    }
  }
  return false;
}

function draw() {
  // Clear canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw grid/borders
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
  
  // Draw paddle
  ctx.fillStyle = '#0f0';
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  
  // Draw ball
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw any lines/barriers (placeholder)
  ctx.strokeStyle = '#0f0';
  ctx.lineWidth = 2;
  gameState.lines.forEach(line => {
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();
  });
}

function updateUI() {
  levelDisplay.textContent = level;
  livesDisplay.textContent = lives;
  filledDisplay.textContent = gameState.filledPercentage + '%';
}

// Initialize UI with instructions
function initializeUI() {
  const instructionsDiv = document.createElement('div');
  instructionsDiv.id = 'instructions';
  instructionsDiv.innerHTML = `
    <h3>Controls:</h3>
    <p><strong>Spacebar:</strong> Start game / Draw line</p>
    <p><strong>Arrow Left/Right:</strong> Move paddle (or A/D keys)</p>
    <p><strong>Button:</strong> Start Line (alternative to spacebar)</p>
  `;
  uiContainer.appendChild(instructionsDiv);
}

// Farcaster Integration
let currentScore = 0;

const shareBtn = document.getElementById('shareBtn');
const farcasterModal = document.getElementById('farcaster-modal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const confirmShareBtn = document.getElementById('confirmShareBtn');
const shareMessage = document.getElementById('shareMessage');
const scoreDisplay = document.getElementById('scoreDisplay');

shareBtn.addEventListener('click', () => {
  currentScore = level * 100 + (lives * 50);
  scoreDisplay.textContent = currentScore;
  farcasterModal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
  farcasterModal.style.display = 'none';
});

cancelBtn.addEventListener('click', () => {
  farcasterModal.style.display = 'none';
});

confirmShareBtn.addEventListener('click', async () => {
  const message = shareMessage.value || 'I just played JezzBall Clone!';
  try {
    const response = await fetch('https://warpcast.com/~/compose', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        text: `${message}\n\nScore: ${currentScore}\nLevel: ${level}\n\nPlay JezzBall Clone: ${window.location.href}`
      })
    });
    if (response.ok) {
      alert('Shared successfully!');
      farcasterModal.style.display = 'none';
      shareMessage.value = '';
    } else {
      alert('Failed to share. Please try again.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to share. Please try again.');
  }
});

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
  if (event.target === farcasterModal) {
    farcasterModal.style.display = 'none';
  }
});

// Initialize the game
initializeUI();
updateUI();
