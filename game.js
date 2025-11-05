const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const splitBtn = document.getElementById('splitBtn');
const levelSpan = document.getElementById('level');
const livesSpan = document.getElementById('lives');
const filledSpan = document.getElementById('filled');

const W = canvas.width;
const H = canvas.height;

let balls = [];
let walls = [{ x: 0, y: 0, w: W, h: H, fill: true }]; // initial full board
let splits = [];
let percentFilled = 0;
let lives = 3;
let level = 1;
let isSplitting = false;
let splitData = null;

function resetLevel() {
  balls = [];
  splits = [];
  isSplitting = false;
  splitData = null;
  // place 2 + level balls
  for (let i = 0; i < 2 + level; i++) {
    balls.push({
      x: 60 + Math.random() * 280,
      y: 60 + Math.random() * 280,
      r: 8,
      vx: Math.random() < 0.5 ? 2 : -2,
      vy: Math.random() < 0.5 ? 2 : -2
    });
  }
  // reset board
  walls = [{ x: 0, y: 0, w: W, h: H, fill: true }];
}

function moveBalls() {
  for (const b of balls) {
    b.x += b.vx;
    b.y += b.vy;
    // bounce off canvas edges
    if (b.x - b.r < 0 || b.x + b.r > W) b.vx *= -1;
    if (b.y - b.r < 0 || b.y + b.r > H) b.vy *= -1;
  }
}

function splitDirection(x, y) {
  // determine split direction: horizontal or vertical
  const dx = Math.min(x, W - x);
  const dy = Math.min(y, H - y);
  return dx < dy ? 'horizontal' : 'vertical';
}

function startSplit(x, y) {
  if (isSplitting) return;
  const dir = splitDirection(x, y);
  isSplitting = true;
  splitData = {
    x,
    y,
    dir,
    growLeft: 0,
    growRight: 0,
    growSpeed: 3,
    stopped: false
  };
}

function updateSplit() {
  if (!splitData || splitData.stopped) return;
  const { dir } = splitData;
  splitData.growLeft += splitData.growSpeed;
  splitData.growRight += splitData.growSpeed;
  // check collision with balls
  let collision = false;
  for (const b of balls) {
    if (dir === 'vertical') {
      const x = splitData.x;
      if (
        b.x + b.r >= x - 2 &&
        b.x - b.r <= x + 2 &&
        b.y >= splitData.y - splitData.growLeft &&
        b.y <= splitData.y + splitData.growRight
      ) {
        collision = true;
        break;
      }
    } else {
      const y = splitData.y;
      if (
        b.y + b.r >= y - 2 &&
        b.y - b.r <= y + 2 &&
        b.x >= splitData.x - splitData.growLeft &&
        b.x <= splitData.x + splitData.growRight
      ) {
        collision = true;
        break;
      }
    }
  }
  if (collision) {
    lives--;
    livesSpan.textContent = lives;
    isSplitting = false;
    splitData = null;
    if (lives === 0) {
      alert('Game Over! Final Level: ' + level);
      level = 1;
      lives = 3;
      livesSpan.textContent = lives;
      levelSpan.textContent = level;
      resetLevel();
    }
    return;
  }
  // check if wall reached edges
  if (dir === 'vertical') {
    if (
      splitData.y - splitData.growLeft <= 0 &&
      splitData.y + splitData.growRight >= H
    ) {
      splitData.stopped = true;
      finalizeSplit();
    }
  } else {
    if (
      splitData.x - splitData.growLeft <= 0 &&
      splitData.x + splitData.growRight >= W
    ) {
      splitData.stopped = true;
      finalizeSplit();
    }
  }
}

function finalizeSplit() {
  const { x, y, dir } = splitData;
  walls.push({ x, y, dir });
  isSplitting = false;
  splitData = null;
  computeFilled();
}

function computeFilled() {
  // simple fill: assume vertical/horizontal walls divide board
  // measure largest contiguous open area
  const filledArea = walls.length * 50; // naive
  percentFilled = Math.min((filledArea / (W * H)) * 100, 75);
  filledSpan.textContent = Math.floor(percentFilled) + '%';
  if (percentFilled >= 75) {
    // next level
    level++;
    levelSpan.textContent = level;
    resetLevel();
  }
}

function drawWalls() {
  ctx.fillStyle = '#fff';
  for (const w of walls) {
    if (w.fill) {
      ctx.fillRect(w.x, w.y, w.w, w.h);
    } else if (w.dir === 'vertical') {
      ctx.fillRect(w.x - 2, 0, 4, H);
    } else {
      ctx.fillRect(0, w.y - 2, W, 4);
    }
  }
}

function drawSplit() {
  if (!splitData) return;
  ctx.fillStyle = '#0f0';
  const { x, y, dir, growLeft, growRight } = splitData;
  if (dir === 'vertical') {
    ctx.fillRect(x - 2, y - growLeft, 4, growLeft + growRight);
  } else {
    ctx.fillRect(x - growLeft, y - 2, growLeft + growRight, 4);
  }
}

function drawBalls() {
  ctx.fillStyle = '#f00';
  for (const b of balls) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function gameStep() {
  moveBalls();
  updateSplit();
  ctx.clearRect(0, 0, W, H);
  drawWalls();
  drawSplit();
  drawBalls();
  requestAnimationFrame(gameStep);
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  startSplit(mx, my);
});

splitBtn.addEventListener('click', () => {
  startSplit(W / 2, H / 2);
});

resetLevel();
livesSpan.textContent = lives;
levelSpan.textContent = level;
gameStep();

/* ============================================ */
/* FARCASTER INTEGRATION                      */
/* ============================================ */

// Get modal elements
const shareBtn = document.getElementById('shareBtn');
const modal = document.getElementById('farcaster-modal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const confirmShareBtn = document.getElementById('confirmShareBtn');
const shareMessage = document.getElementById('shareMessage');
const scoreDisplay = document.getElementById('scoreDisplay');

// Function to calculate current score
function calculateScore() {
  return level * 100 + Math.floor(percentFilled * 10);
}

// Open modal when share button is clicked
shareBtn.addEventListener('click', () => {
  const currentScore = calculateScore();
  scoreDisplay.textContent = currentScore;
  shareMessage.value = `I just played JezzBall Clone! 🎮\n\nLevel: ${level}\nFilled: ${Math.floor(percentFilled)}%\nScore: ${currentScore}\n\nPlay now: ${window.location.href}`;
  modal.style.display = 'block';
});

// Close modal when X is clicked
closeModal.addEventListener('click', () => {
  modal.style.display = 'none';
});

// Close modal when cancel button is clicked
cancelBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

// Close modal when clicking outside of it
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

// Share to Farcaster function
confirmShareBtn.addEventListener('click', async () => {
  const message = shareMessage.value;
  const currentScore = calculateScore();
  
  try {
    // Method 1: Using Warpcast intent URL (recommended for simplicity)
    const encodedMessage = encodeURIComponent(message);
    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodedMessage}`;
    
    // Open in new window
    window.open(warpcastUrl, '_blank');
    
    // Optional: Log the share event
    console.log('Shared to Farcaster:', {
      level: level,
      percentFilled: percentFilled,
      score: currentScore,
      message: message
    });
    
    // Show success message
    alert('Opening Warpcast to share your achievement!');
    
    // Close modal
    modal.style.display = 'none';
    
  } catch (error) {
    console.error('Error sharing to Farcaster:', error);
    alert('Failed to share. Please try again.');
  }
});

// Alternative Method: Direct Farcaster API integration (requires authentication)
// Uncomment and configure if you want to use the Farcaster API directly

/*
async function shareToFarcasterAPI(message) {
  const FARCASTER_API_URL = 'https://api.farcaster.xyz/v2/casts';
  const YOUR_API_KEY = 'YOUR_FARCASTER_API_KEY_HERE';
  
  try {
    const response = await fetch(FARCASTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${YOUR_API_KEY}`
      },
      body: JSON.stringify({
        text: message,
        embeds: [
          {
            url: window.location.href
          }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to post to Farcaster');
    }
    
    const data = await response.json();
    console.log('Successfully posted to Farcaster:', data);
    return data;
    
  } catch (error) {
    console.error('Farcaster API error:', error);
    throw error;
  }
}
*/

/* ============================================ */
/* END OF FARCASTER INTEGRATION               */
/* ============================================ */
