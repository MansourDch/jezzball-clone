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

function draw() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, W, H);

  // draw walls
  ctx.fillStyle = '#999';
  for (let wall of walls) {
    if (!wall.fill) continue;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
  }

  // draw split lines
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  for (let split of splits) {
    ctx.beginPath();
    if (split.dir === 'h') {
      ctx.moveTo(split.x1, split.y);
      ctx.lineTo(split.x2, split.y);
    } else {
      ctx.moveTo(split.x, split.y1);
      ctx.lineTo(split.x, split.y2);
    }
    ctx.stroke();
  }

  // draw split construction line
  if (isSplitting && splitData) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (splitData.dir === 'h') {
      ctx.moveTo(0, splitData.y);
      ctx.lineTo(W, splitData.y);
    } else {
      ctx.moveTo(splitData.x, 0);
      ctx.lineTo(splitData.x, H);
    }
    ctx.stroke();
  }

  // draw balls
  ctx.fillStyle = '#f00';
  for (let ball of balls) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function updateBalls() {
  for (let ball of balls) {
    ball.x += ball.vx;
    ball.y += ball.vy;

    // check collisions with splits
    for (let split of splits) {
      if (split.dir === 'h') {
        if (
          Math.abs(ball.y - split.y) < ball.r &&
          ball.x >= split.x1 &&
          ball.x <= split.x2
        ) {
          ball.vy = -ball.vy;
        }
      } else {
        if (
          Math.abs(ball.x - split.x) < ball.r &&
          ball.y >= split.y1 &&
          ball.y <= split.y2
        ) {
          ball.vx = -ball.vx;
        }
      }
    }

    // check collisions with walls
    for (let wall of walls) {
      if (!wall.fill) continue;

      if (ball.x - ball.r < wall.x) {
        ball.x = wall.x + ball.r;
        ball.vx = -ball.vx;
      }
      if (ball.x + ball.r > wall.x + wall.w) {
        ball.x = wall.x + wall.w - ball.r;
        ball.vx = -ball.vx;
      }
      if (ball.y - ball.r < wall.y) {
        ball.y = wall.y + ball.r;
        ball.vy = -ball.vy;
      }
      if (ball.y + ball.r > wall.y + wall.h) {
        ball.y = wall.y + wall.h - ball.r;
        ball.vy = -ball.vy;
      }
    }
  }
}

function percentArea() {
  let totalArea = W * H;
  let filledArea = 0;
  for (let wall of walls) {
    if (wall.fill) filledArea += wall.w * wall.h;
  }
  return Math.floor((filledArea / totalArea) * 100);
}

function splitBoard(pos, dir) {
  let newWalls = [];
  for (let wall of walls) {
    if (!wall.fill) {
      newWalls.push(wall);
      continue;
    }
    if (dir === 'h') {
      if (pos > wall.y && pos < wall.y + wall.h) {
        newWalls.push({
          x: wall.x,
          y: wall.y,
          w: wall.w,
          h: pos - wall.y,
          fill: true
        });
        newWalls.push({
          x: wall.x,
          y: pos,
          w: wall.w,
          h: wall.y + wall.h - pos,
          fill: true
        });
        newWalls.push({
          x: wall.x,
          y: pos - 1,
          w: wall.w,
          h: 2,
          fill: false
        });
      } else newWalls.push(wall);
    } else {
      if (pos > wall.x && pos < wall.x + wall.w) {
        newWalls.push({
          x: wall.x,
          y: wall.y,
          w: pos - wall.x,
          h: wall.h,
          fill: true
        });
        newWalls.push({
          x: pos,
          y: wall.y,
          w: wall.x + wall.w - pos,
          h: wall.h,
          fill: true
        });
        newWalls.push({
          x: pos - 1,
          y: wall.y,
          w: 2,
          h: wall.h,
          fill: false
        });
      } else newWalls.push(wall);
    }
  }
  walls = newWalls;
}

function gameStep() {
  updateBalls();
  draw();
  percentFilled = percentArea();
  filledSpan.textContent = percentFilled + '%';
  if (percentFilled >= 75) {
    level++;
    levelSpan.textContent = level;
    resetLevel();
  }
  requestAnimationFrame(gameStep);
}

canvas.addEventListener('mousedown', function (e) {
  if (isSplitting) return;
  let rect = canvas.getBoundingClientRect();
  let x = Math.round(e.clientX - rect.left);
  let y = Math.round(e.clientY - rect.top);
  // Alternate split direction by click or button
  let dir =
    Math.abs(x - W / 2) > Math.abs(y - H / 2) ? 'h' : 'v';
  splitData = { x, y, dir };
  isSplitting = true;
  setTimeout(() => {
    splitBoard(dir === 'h' ? y : x, dir);
    percentFilled = percentArea();
    if (percentFilled >= 100) {
      level++;
      resetLevel();
    }
    isSplitting = false;
    splitData = null;
  }, 700);
});

splitBtn.addEventListener('click', () => {
  // alternate split: horizontal/vertical
  isSplitting = true;
  splitData = {
    x: W / 2,
    y: H / 2,
    dir: Math.random() < 0.5 ? 'h' : 'v'
  };
  setTimeout(() => {
    splitBoard(splitData.dir === 'h' ? splitData.y : splitData.x, splitData.dir);
    isSplitting = false;
    splitData = null;
  }, 400);
});

resetLevel();
livesSpan.textContent = lives;
levelSpan.textContent = level;
gameStep();

/* ============================================ */
/* OPTIONAL WEB3 HOOKS FOR FUTURE INTEGRATION */
/* ============================================ */

// Hook 1: Mint a Memory NFT
// This function can be called when a player completes a level
// to mint a commemorative NFT of their achievement.
// Example integration:
// function mintMemoryNFT(level, score) {
//   // Connect to wallet (e.g., ethers.js or wagmi)
//   // Call smart contract to mint NFT
//   // Pass game metadata: level completed, time taken, score
//   console.log('Minting NFT for level:', level);
// }

// Hook 2: Share on Farcaster
// This function can be called to allow players to share their
// gameplay achievements on the Farcaster social platform.
// Example integration:
// function shareOnFarcaster(level, message) {
//   // Use Farcaster API to post a frame or cast
//   // Include game screenshot or stats
//   // Embed a playable frame link if supported
//   console.log('Sharing on Farcaster:', message);
// }

// Hook 3: Track Gameplay Events
// Optional callback for analytics or blockchain event logging
// Example integration:
// function trackGameEvent(eventType, eventData) {
//   // Send to analytics service (e.g., Mixpanel, Segment)
//   // Or log to blockchain contract for permanent record
//   // Event types: 'level_completed', 'nft_minted', 'shared_socially'
//   console.log('Game event:', eventType, eventData);
// }

// Potential hook locations in existing code:
// - After level completion: mintMemoryNFT(level, percentFilled);
// - On share button click: shareOnFarcaster(level, 'I just completed level ' + level);
// - On game event: trackGameEvent('level_completed', { level, time: Date.now() });

/* ============================================ */
/* END OF WEB3 HOOKS SECTION */
/* ============================================ */
