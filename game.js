// --- JezzBall Clone Game.js - FIXED ---
// Proper ball physics with random bounces, mobile support, Farcaster integration

// DOM Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const levelDisplay = document.getElementById('level');
const livesDisplay = document.getElementById('lives');
const filledDisplay = document.getElementById('filled');
const shareBtn = document.getElementById('shareBtn');
const farcasterModal = document.getElementById('farcaster-modal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const confirmShareBtn = document.getElementById('confirmShareBtn');
const shareMessage = document.getElementById('shareMessage');
const scoreDisplay = document.getElementById('scoreDisplay');
const music = document.getElementById('backgroundMusic');

// Game Variables
let level = 1;
let lives = 3;
let filledPercent = 0;
let currentScore = 0;
let paddle = { x: 75, width: 30, y: 0 };
let ball = { x: 100, y: 50, radius: 5, vx: 3, vy: 3 };
let gameRunning = true;
let gamePaused = false;
let dragging = false;
let dragStartX = 0;

// Set canvas to 40% of screen (even smaller)
function resizeCanvas() {
  let size = Math.min(window.innerWidth * 0.4, 160);
  canvas.width = size;
  canvas.height = size;
  paddle.y = canvas.height - 8;
  paddle.x = canvas.width / 2 - paddle.width / 2;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function updateUI() {
  levelDisplay.textContent = level;
  livesDisplay.textContent = lives;
  filledDisplay.textContent = `${filledPercent}%`;
  scoreDisplay.textContent = currentScore;
}

// --- Mobile/Touch Controls ---
canvas.addEventListener('touchstart', (e) => {
  if (!gameRunning || gamePaused) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const tx = e.touches[0].clientX - rect.left;
  
  if (tx >= paddle.x - 10 && tx <= paddle.x + paddle.width + 10) {
    dragging = true;
    dragStartX = tx - paddle.x;
  }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  if (!dragging || !gameRunning) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const tx = e.touches[0].clientX - rect.left;
  paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, tx - dragStartX));
}, { passive: false });

canvas.addEventListener('touchend', () => {
  dragging = false;
});

// --- Desktop Controls ---
document.addEventListener('keydown', (e) => {
  if (!gameRunning || gamePaused) return;
  switch(e.key) {
    case 'ArrowLeft':
    case 'a':
    case 'A':
      paddle.x = Math.max(0, paddle.x - 20);
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      paddle.x = Math.min(canvas.width - paddle.width, paddle.x + 20);
      break;
    case ' ':
      e.preventDefault();
      gamePaused = !gamePaused;
      break;
  }
});

canvas.addEventListener('mousedown', (e) => {
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  
  if (mx >= paddle.x && mx <= paddle.x + paddle.width && 
      e.clientY - rect.top >= paddle.y) {
    dragging = true;
    dragStartX = mx - paddle.x;
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!dragging || !gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, mx - dragStartX));
});

canvas.addEventListener('mouseup', () => {
  dragging = false;
});

// --- PROPER BALL PHYSICS WITH RANDOMIZATION ---
function updateBall() {
  if (!gameRunning || gamePaused) return;
  
  // Move ball
  ball.x += ball.vx;
  ball.y += ball.vy;
  
  // Left/Right wall collision with random angle change
  if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= canvas.width) {
    ball.vx = -ball.vx * (0.9 + Math.random() * 0.2); // Random damping
    ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x));
  }
  
  // Top wall collision with randomization
  if (ball.y - ball.radius <= 0) {
    ball.vy = -ball.vy * (0.9 + Math.random() * 0.2);
    ball.y = ball.radius;
  }
  
  // Paddle collision - THIS IS WHERE RANDOMNESS MATTERS MOST
  if (ball.y + ball.radius >= paddle.y &&
      ball.x >= paddle.x - 5 &&
      ball.x <= paddle.x + paddle.width + 5) {
    
    // Strong random angle deflection
    const hitPos = (ball.x - paddle.x) / paddle.width; // 0 = left, 1 = right
    const randomFactor = (Math.random() - 0.5) * 0.8; // Strong randomness
    
    ball.vy = -Math.abs(ball.vy) * (0.95 + Math.random() * 0.15);
    ball.vx = (hitPos - 0.5) * 6 + randomFactor * 4; // Hit position + randomness
    ball.y = paddle.y - ball.radius;
    
    currentScore += 10;
    updateUI();
  }
  
  // Ball fell below paddle
  if (ball.y > canvas.height + 10) {
    lives--;
    updateUI();
    
    if (lives <= 0) {
      gameRunning = false;
      setTimeout(() => {
        alert(`Game Over! Final Score: ${currentScore}`);
        resetGame();
      }, 300);
    } else {
      resetBallPosition();
    }
  }
}

function resetBallPosition() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 3;
  ball.vx = (Math.random() - 0.5) * 6;
  ball.vy = 3 + Math.random() * 2;
}

function resetGame() {
  level = 1;
  lives = 3;
  currentScore = 0;
  filledPercent = 0;
  gameRunning = true;
  gamePaused = false;
  updateUI();
  resetBallPosition();
}

// --- Drawing ---
function drawGame() {
  // Clear canvas
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Border
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
  
  // Paddle
  ctx.fillStyle = '#ffdca3';
  ctx.fillRect(paddle.x, paddle.y, paddle.width, 6);
  
  // Ball with glow effect
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#9d6dd2';
  ctx.fill();
  
  // Ball glow
  ctx.strokeStyle = 'rgba(157, 109, 210, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// --- Game Loop ---
function gameLoop() {
  updateBall();
  drawGame();
  requestAnimationFrame(gameLoop);
}

// --- Farcaster Sharing ---
shareBtn.addEventListener('click', () => {
  farcasterModal.classList.add('active');
});

closeModal.addEventListener('click', () => {
  farcasterModal.classList.remove('active');
});

cancelBtn.addEventListener('click', () => {
  farcasterModal.classList.remove('active');
});

confirmShareBtn.addEventListener('click', () => {
  const message = shareMessage.value || 'I just played JezzBall - a nostalgic arcade game!';
  const text = encodeURIComponent(`${message}\n\nScore: ${currentScore}\nLevel: ${level}\nLives: ${lives}\n\nPlay now: ${window.location.href}`);
  window.open(`https://warpcast.com/~/compose?text=${text}`, '_blank');
  farcasterModal.classList.remove('active');
  shareMessage.value = '';
});

window.addEventListener('click', (e) => {
  if (e.target === farcasterModal) {
    farcasterModal.classList.remove('active');
  }
});

// --- Music ---
function playMusic() {
  if (music && music.paused) {
    music.volume = 0.25;
    music.loop = true;
    music.play().catch(() => {
      console.log('Music autoplay blocked by browser');
    });
  }
}

document.addEventListener('click', playMusic, { once: true });
document.addEventListener('touchstart', playMusic, { once: true });

// Start game
updateUI();
gameLoop();
playMusic();
