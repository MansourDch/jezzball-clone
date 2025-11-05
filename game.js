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

// Game Variables (demo logic)
let level = 1;
let lives = 3;
let filledPercent = 0;
let currentScore = 0;
let paddle = { x: 170, width: 60, y: 390 };
let dragging = false;
let dragStartX = 0;
let isDrawingLine = false;
let lineStart = null;
let gamePaused = false;

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
    if (e.touches[0].clientY < canvas.offsetTop + 120) {
      if (!isDrawingLine) startLine();
    }
  }
}
function handleTouchMove(e) {
  if (dragging) {
    const { left } = canvas.getBoundingClientRect();
    let tx = e.touches[0].clientX - left;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, tx - dragStartX));
    drawGame();
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
    case 'KeyA': paddle.x = Math.max(0, paddle.x - 30); drawGame(); break;
    case 'ArrowRight':
    case 'KeyD': paddle.x = Math.min(canvas.width - paddle.width, paddle.x + 30); drawGame(); break;
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
    drawGame();
  }
});
canvas.addEventListener('mouseup', () => dragging = false);

// --- Responsive Canvas ---
function resizeCanvas() {
  let size = Math.min(window.innerWidth * 0.93, 400);
  canvas.width = size;
  canvas.height = size;
  paddle.y = canvas.height - 10;
  drawGame();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Draw Demo (Paddle & Ball) ---
function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Paddle
  ctx.fillStyle = '#ffdca3';
  ctx.fillRect(paddle.x, paddle.y - 12, paddle.width, 14);
  // Ball
  ctx.beginPath(); ctx.arc(canvas.width/2, canvas.height/2, 13, 0, 2 * Math.PI); ctx.fillStyle = '#8a63d2'; ctx.fill();
  // Demo line
  if (isDrawingLine && lineStart) {
    ctx.strokeStyle = '#7d56e5';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(lineStart.x, lineStart.y);
    ctx.lineTo(lineStart.x, canvas.height);
    ctx.stroke();
  }
}
drawGame();

function startLine() {
  if (isDrawingLine) return;
  isDrawingLine = true;
  lineStart = { x: paddle.x + paddle.width/2, y: paddle.y - 12 };
  drawGame();
  setTimeout(() => { isDrawingLine = false; lineStart = null; drawGame(); }, 800);
}

// --- Farcaster Sharing ---
shareBtn.addEventListener('click', () => {
  // Prepare score
  currentScore = level * 100 + (lives * 50);
  scoreDisplay.textContent = currentScore;
  farcasterModal.classList.add('active');
});
closeModal.addEventListener('click', () => { farcasterModal.classList.remove('active'); });
cancelBtn.addEventListener('click', () => { farcasterModal.classList.remove('active'); });
confirmShareBtn.addEventListener('click', async () => {
  const message = shareMessage.value || 'I just played JezzBall Clone!';
  try {
    // Opens Farcaster's compose Frame (official way)
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

// --- Soft Nostalgic Music ---
function playMusic() {
  if(music) {
    music.volume = 0.5;
    music.play().catch(()=>{});
  }
}
document.addEventListener('touchstart', playMusic, { once: true });
document.addEventListener('click', playMusic, { once: true });
window.addEventListener('load', () => setTimeout(playMusic, 1500));

initializeUI();
updateUI();
