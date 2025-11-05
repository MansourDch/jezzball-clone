const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const splitBtn = document.getElementById('splitBtn');
const levelSpan = document.getElementById('level');
const livesSpan = document.getElementById('lives');
const filledSpan = document.getElementById('filled');

const W = canvas.width;
const H = canvas.height;

let balls = [];
let walls = [{x:0, y:0, w:W, h:H, fill:true}]; // initial full board
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
      vx: Math.random()<0.5?2:-2,
      vy: Math.random()<0.5?2:-2
    });
  }
  // reset board
  walls = [{x:0, y:0, w:W, h:H, fill:true}];
}

function percentArea() {
  let fill = 0;
  walls.forEach(w => { if (w.fill) fill += w.w * w.h; });
  return Math.round((fill/(W*H))*100);
}

function draw() {
  // clear
  ctx.clearRect(0, 0, W, H);

  // draw walls
  walls.forEach(w => {
    ctx.fillStyle = w.fill ? '#222' : '#383';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(w.x, w.y, w.w, w.h);
  });

  // draw split line
  if(isSplitting && splitData) {
    ctx.save();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if(splitData.dir==='h') {
      ctx.moveTo(0, splitData.y);
      ctx.lineTo(W, splitData.y);
    } else {
      ctx.moveTo(splitData.x, 0);
      ctx.lineTo(splitData.x, H);
    }
    ctx.stroke();
    ctx.restore();
  }

  // draw balls
  balls.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();
  });
}

function moveBalls() {
  balls.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;
    // collision with filled area boundaries
    let inUnfilled = false;
    for(let w of walls) {
      if(!w.fill) continue;
      if(
        b.x-b.r < w.x || b.x+b.r > w.x+w.w ||
        b.y-b.r < w.y || b.y+b.r > w.y+w.h
      ) continue;
      // bounce
      if(b.x-b.r <= w.x || b.x+b.r >= w.x+w.w) b.vx *= -1;
      if(b.y-b.r <= w.y || b.y+b.r >= w.y+w.h) b.vy *= -1;
      inUnfilled = true;
      break;
    }
    // Ball outside any filled region (shouldn't happen)
    if(!inUnfilled) b.vx *= -1, b.vy *= -1;
  });
}

function splitBoard(pos, dir) {
  // split the walls at pos, in direction dir
  let newWalls = [];
  walls.forEach(w => {
    if(!w.fill) {
      newWalls.push(w);
      return;
    }
    if(dir==='h' && pos>w.y && pos<w.y+w.h) {
      // split horizontally at y=pos
      newWalls.push({x:w.x, y:w.y, w:w.w, h:pos-w.y, fill:true}); // upper
      newWalls.push({x:w.x, y:pos, w:w.w, h:w.y+w.h-pos, fill:true}); // lower
    } else if(dir==='v' && pos>w.x && pos<w.x+w.w) {
      // split vertically at x=pos
      newWalls.push({x:w.x, y:w.y, w:pos-w.x, h:w.h, fill:true});
      newWalls.push({x:pos, y:w.y, w:w.x+w.w-pos, h:w.h, fill:true});
    } else {
      newWalls.push(w);
    }
  });
  // Mark any region that contains a ball as not filled
  newWalls.forEach(w => {
    for(let b of balls)
      if(
        b.x > w.x && b.x < w.x+w.w &&
        b.y > w.y && b.y < w.y+w.h
      ) {
        w.fill = false;
        break;
      }
  });
  walls = newWalls;
}

function gameStep() {
  moveBalls();
  draw();

  percentFilled = percentArea();

  filledSpan.textContent = percentFilled+"%";

  if(percentFilled>=75) {
    level++;
    levelSpan.textContent = level;
    resetLevel();
  }

  requestAnimationFrame(gameStep);
}

canvas.addEventListener('mousedown', function(e){
  if(isSplitting) return;
  let rect = canvas.getBoundingClientRect();
  let x = Math.round(e.clientX - rect.left);
  let y = Math.round(e.clientY - rect.top);

  // Alternate split direction by click or button
  let dir = (Math.abs(x-W/2) > Math.abs(y-H/2)) ? 'h' : 'v';
  splitData = {x, y, dir};
  isSplitting = true;

  setTimeout(()=> {
    splitBoard(dir==='h'?y:x, dir);
    percentFilled = percentArea();
    if(percentFilled>=100) {
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
  splitData = {x:W/2, y:H/2, dir:(Math.random()<.5?'h':'v')};
  setTimeout(()=> {
    splitBoard(splitData.dir==='h'?splitData.y:splitData.x, splitData.dir);
    isSplitting = false;
    splitData = null;
  }, 400);
});

resetLevel();
livesSpan.textContent = lives;
levelSpan.textContent = level;
gameStep();
