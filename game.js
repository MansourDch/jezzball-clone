// --- JezzBall Clone Game.js Enhanced ---
// Mobile/touch controls, Farcaster fix, Nostalgic music
// DOM Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const splitBtn = document.getElementById('splitBtn');
const levelDisplay = document.getElementById('level');
const livesDisplay = document.getElementById('lives');
const filledDisplay = document.getElementById('filled');
const shareBtn = document.getElementById('shareBtn');
const mintBtn = document.getElementById('mintBtn');
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
let paddle = { x: 85, width: 30, y: 195 };
let ball = { x: 100, y: 100, radius: 6.5, vx: 4, vy: -4 };
let ballRadius = 6.5;
let dragging = false;
let dragStartX = 0;
let isDrawingLine = false;
let lineStart = null;
let gamePaused = false;
let gameRunning = true;
function updateUI() {
  levelDisplay.textContent = level;
  livesDisplay.textContent = lives;
  filledDisplay.textContent = `${filledPercent}%`;
  scoreDisplay.textContent = currentScore;
}
function initializeUI() {
  splitBtn.addEventListener('click', () => { startLine(); });
}
// --- Mobile Touch Events ---
function handleTouchStart(e) {
  if (e.touches.length === 1) {
    const { left } = canvas.getBoundingClientRect();
    const tx = e.touches[0].clientX - left;
    // Detect if near paddle
    if (Math.abs(tx - paddle.x - paddle.width/2) < paddle.width) {
      dragging = true;
      dragStartX = tx - paddle.x;
    }
    // Detect tap on top for line draw
    if (e.touches[0].clientY < canvas.offsetTop + 60) {
      if (!isDrawingLine) startLine();
    }
  }
}
function handleTouchMove(e) {
  if (dragging) {
    const { left } = canvas.getBoundingClientRect();
    let tx = e.touches[0].clientX - left;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, tx - dragStartX));
  }
}
function handleTouchEnd(e) {
  dragging = false;
}
canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
// --- Desktop Controls ---
document.addEventListener('keydown', e => {
  if (gamePaused) return;
  switch (e.code) {
    case 'ArrowLeft':
    case 'KeyA': paddle.x = Math.max(0, paddle.x - 30); break;
    case 'ArrowRight':
    case 'KeyD': paddle.x = Math.min(canvas.width - paddle.width, paddle.x + 30); break;
    case 'Space': startLine(); break;
    case 'KeyP': gamePaused = !gamePaused; break;
  }
});
canvas.addEventListener('mousedown', e => {
  if (e.offsetY >= paddle.y && e.offsetX >= paddle.x && e.offsetX <= paddle.x + paddle.width) {
    dragging = true;
    dragStartX = e.offsetX - paddle.x;
  }
});
canvas.addEventListener('mousemove', e => {
  if (dragging) {
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, e.offsetX - dragStartX));
  }
});
canvas.addEventListener('mouseup', () => dragging = false);
// --- Responsive Canvas (50% smaller) ---
function resizeCanvas() {
  let size = Math.min(window.innerWidth * 0.465, 200);
  canvas.width = size;
  canvas.height = size;
  paddle.y = canvas.height - 5;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
// --- Ball Physics & Collision ---
function updateBall() {
  if (gamePaused || !gameRunning) return;
  
  // Update position
  ball.x += ball.vx;
  ball.y += ball.vy;
  
  // Wall collisions (left and right)
  if (ball.x - ballRadius < 0 || ball.x + ballRadius > canvas.width) {
    ball.vx = -ball.vx;
    ball.x = Math.max(ballRadius, Math.min(canvas.width - ballRadius, ball.x));
  }
  
  // Ceiling collision
  if (ball.y - ballRadius < 0) {
    ball.vy = -ball.vy;
    ball.y = ballRadius;
  }
  
  // Paddle collision
  if (ball.y + ballRadius >= paddle.y &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.width) {
    ball.vy = -ball.vy;
    ball.y = paddle.y - ballRadius;
    currentScore += 10;
    updateUI();
  }
  
  // Ball missed paddle - lose life
  if (ball.y - ballRadius > canvas.height) {
    lives--;
    updateUI();
    
    if (lives <= 0) {
      gameRunning = false;
      alert('Game Over! Lives exhausted.');
      resetGame();
    } else {
      resetBall();
    }
  }
}
function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.vx = (Math.random() > 0.5 ? 1 : -1) * 4;
  ball.vy = -4;
}
function resetGame() {
  level = 1;
  lives = 3;
  currentScore = 0;
  filledPercent = 0;
  gameRunning = true;
  updateUI();
  resetBall();
}
// --- Draw Game ---
function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Paddle
  ctx.fillStyle = '#ffdca3';
  ctx.fillRect(paddle.x, paddle.y - 6, paddle.width, 7);
  
  // Ball
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ballRadius, 0, 2 * Math.PI);
  ctx.fillStyle = '#8a63d2';
  ctx.fill();
  
  // Demo line
  if (isDrawingLine && lineStart) {
    ctx.strokeStyle = '#7d56e5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lineStart.x, lineStart.y);
    ctx.lineTo(lineStart.x, canvas.height);
    ctx.stroke();
  }
}
// --- Animation Loop ---
function gameLoop() {
  updateBall();
  drawGame();
  requestAnimationFrame(gameLoop);
}
function startLine() {
  if (isDrawingLine) return;
  isDrawingLine = true;
  lineStart = { x: paddle.x + paddle.width/2, y: paddle.y - 6 };
  setTimeout(() => { isDrawingLine = false; lineStart = null; }, 800);
}
// --- Farcaster Sharing ---
shareBtn.addEventListener('click', () => {
  currentScore = level * 100 + (lives * 50);
  scoreDisplay.textContent = currentScore;
  farcasterModal.classList.add('active');
});
closeModal.addEventListener('click', () => { farcasterModal.classList.remove('active'); });
cancelBtn.addEventListener('click', () => { farcasterModal.classList.remove('active'); });
confirmShareBtn.addEventListener('click', async () => {
  const message = shareMessage.value || 'I just played JezzBall Clone!';
  try {
    window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(message + '\nScore: ' + currentScore + ' Level: ' + level + '\nPlay: ' + window.location.href)}`, '_blank');
    farcasterModal.classList.remove('active');
    shareMessage.value = '';
  } catch (error) {
    alert('Failed to share. Please try again.');
  }
});
window.addEventListener('click', event => {
  if (event.target === farcasterModal) farcasterModal.classList.remove('active');
});
// --- Nostalgic Background Music ---
function playMusic() {
  if (music) {
    music.volume = 0.3;
    music.loop = true;
    const playPromise = music.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        console.log('Autoplay prevented, waiting for user interaction');
      });
    }
  }
}
// Trigger music on first user interaction
document.addEventListener('touchstart', playMusic, { once: true });
document.addEventListener('click', playMusic, { once: true });
window.addEventListener('load', () => setTimeout(playMusic, 1500));
initializeUI();
updateUI();
gameLoop();
