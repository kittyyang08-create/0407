// =====================================================
//  電流急急棒 — Wire Challenge Game
//  使用方式：搭配 index.html 載入 p5.js 後執行
//  p5.js 全域模式（Global Mode）
// =====================================================

// ─── 常數 ──────────────────────────────────────────
let W, H;
const PAD_L = 70, PAD_R = 70;
let TRACK_Y_CENTER;
const RING_R = 16;

// ─── 關卡設定 ───────────────────────────────────────
const LEVELS = [
  { name: 'LEVEL 1', label: '入門級', color: '#00ff88', pts: 8,  gapMin: 120, gapMax: 150, variance: 40 },
  { name: 'LEVEL 2', label: '簡單',   color: '#aaff00', pts: 10, gapMin: 100, gapMax: 130, variance: 60 },
  { name: 'LEVEL 3', label: '普通',   color: '#ffe600', pts: 12, gapMin: 85,  gapMax: 110, variance: 80 },
  { name: 'LEVEL 4', label: '困難',   color: '#ff8800', pts: 14, gapMin: 70,  gapMax: 95,  variance: 100 },
  { name: 'LEVEL 5', label: '地獄',   color: '#ff2244', pts: 16, gapMin: 55,  gapMax: 80,  variance: 120 },
];

// ─── 狀態變數 ───────────────────────────────────────
let scene = 'title'; // 'title' | 'playing' | 'win' | 'fail' | 'allclear'
let currentLevel = 0;
let pts = [];
let ring = { x: 0, y: 0 };
let isHolding = false;
let failTimer = 0;
let winTimer = 0;
let titleAnim = 0;
let particles = [];
let sparks = [];
let stars = [];
let bgStars = [];

// ─── 按鈕定義 ───────────────────────────────────────
let btnStart, btnRestart, btnNext;

// =====================================================
//  p5.js 生命週期
// =====================================================

function setup() {
  updateLayout();
  createCanvas(W, H);
  textFont('monospace');
  genBgStars();
  genLevel(currentLevel);
}

function windowResized() {
  updateLayout();
  resizeCanvas(W, H);
  genBgStars();
  if (scene === 'playing' || scene === 'title') {
    genLevel(currentLevel);
  }
}

function updateLayout() {
  W = windowWidth;
  H = windowHeight;
  TRACK_Y_CENTER = H / 2;
  btnStart   = { x: W/2, y: H * 0.75, w: 260, h: 70 };
  btnRestart = { x: W/2, y: H * 0.8, w: 220, h: 60 };
  btnNext    = { x: W/2, y: H * 0.8, w: 220, h: 60 };
}

function draw() {
  titleAnim += 0.03;
  drawBg();
  updateBgStars();

  if      (scene === 'title')    drawTitle();
  else if (scene === 'playing')  drawPlaying();
  else if (scene === 'fail')     drawFail();
  else if (scene === 'win')      drawWin();
  else if (scene === 'allclear') drawAllClear();

  updateParticles();
  updateSparks();
  drawParticles();
  drawSparks();
}

// =====================================================
//  關卡產生
// =====================================================

function genBgStars() {
  bgStars = [];
  for (let i = 0; i < 80; i++) {
    bgStars.push({
      x: random(W), y: random(H),
      r: random(0.5, 2),
      speed: random(0.1, 0.4)
    });
  }
}

function genLevel(lv) {
  const cfg = LEVELS[lv];
  pts = [];
  const n = cfg.pts;
  const usable = W - PAD_L - PAD_R;
  for (let i = 0; i < n; i++) {
    const x = PAD_L + Math.round((usable / (n - 1)) * i);
    const offset = (Math.random() - 0.5) * cfg.variance;
    const cy = TRACK_Y_CENTER + offset;
    const half = Math.round(cfg.gapMin / 2 + Math.random() * ((cfg.gapMax - cfg.gapMin) / 2));
    pts.push({ x, topY: cy - half, botY: cy + half });
  }
  resetRing();
  sparks = [];
  particles = [];
  stars = [];
}

function resetRing() {
  ring.x = pts[0].x;
  ring.y = (pts[0].topY + pts[0].botY) / 2;
  isHolding = false;
}

// =====================================================
//  背景
// =====================================================

function drawBg() {
  background(5, 10, 20);
  stroke(0, 212, 255, 8);
  strokeWeight(0.5);
  for (let x = 0; x < W; x += 40) line(x, 0, x, H);
  for (let y = 0; y < H; y += 40) line(0, y, W, y);
}

function updateBgStars() {
  for (let s of bgStars) {
    s.x -= s.speed;
    if (s.x < 0) { s.x = W; s.y = random(H); }
    const br = map(Math.sin(titleAnim * 2 + s.x), -1, 1, 80, 200);
    fill(200, 230, 255, br);
    noStroke();
    circle(s.x, s.y, s.r * 2);
  }
}

// =====================================================
//  標題畫面
// =====================================================

function drawTitle() {
  const glow = Math.abs(Math.sin(titleAnim)) * 30;
  textAlign(CENTER, CENTER);

  // 副標題
  fill(0, 212, 255, 160);
  textSize(12);
  text('== WIRE CHALLENGE ==', W / 2, 90);

  // 主標題
  textSize(52);
  fill(0, 212, 255, 40 + glow);
  text('電流急急棒', W/2+2, H/2-90+2);
  fill(0, 212, 255);
  text('電流急急棒', W/2, H/2-90);

  // 關卡選擇提示
  textSize(16);
  fill(150, 200, 255, 180);
  text('選擇起始關卡', W / 2, H / 2 - 80);

  // 關卡按鈕
  const bw = 220, bh = 100, gap = 20;
  const totalW = LEVELS.length * bw + (LEVELS.length - 1) * gap;
  const startX = W / 2 - totalW / 2;
  for (let i = 0; i < LEVELS.length; i++) {
    const cfg = LEVELS[i];
    const bx = startX + i * (bw + gap);
    const by = H / 2 - 50;
    const hover = mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh;
    const isSelected = (currentLevel === i);
    if (isSelected) {
      stroke(cfg.color); strokeWeight(1.5);
      fill(red(color(cfg.color)), green(color(cfg.color)), blue(color(cfg.color)), 40);
    } else if (hover) {
      stroke(255, 255, 255, 80); strokeWeight(0.5);
      fill(255, 255, 255, 15);
    } else {
      stroke(red(color(cfg.color)), green(color(cfg.color)), blue(color(cfg.color)), 85);
      strokeWeight(0.5);
      fill(0, 0, 0, 60);
    }
    rect(bx, by, bw, bh, 12);
    noStroke();
    fill(cfg.color);
    textSize(22);
    text(cfg.name, bx + bw/2, by + 40);
    fill(200, 220, 255, 180);
    textSize(16);
    text(cfg.label, bx + bw/2, by + 70);
  }

  // 開始按鈕
  const bx2 = btnStart.x - btnStart.w / 2;
  const by2 = btnStart.y - btnStart.h / 2;
  const hov = mouseX > bx2 && mouseX < bx2 + btnStart.w && mouseY > by2 && mouseY < by2 + btnStart.h;
  const pulse = Math.abs(Math.sin(titleAnim * 1.5));
  stroke(0, 212, 255, 100 + pulse * 120);
  strokeWeight(1.5);
  fill(hov ? 10 : 5, hov ? 30 : 10, hov ? 60 : 20, hov ? 100 : 40);
  rect(bx2, by2, btnStart.w, btnStart.h, 8);
  noStroke();
  fill(0, 212, 255, 200 + pulse * 55);
  textSize(24);
  text('>  開始遊戲', btnStart.x, btnStart.y);

  // 操作說明
  fill(100, 150, 200, 140);
  textSize(10);
  text('在起點按下滑鼠，拖曳通過管道到達終點', W / 2, 360);
  text('碰到邊線即告觸電失敗', W / 2, 378);
}

// =====================================================
//  遊戲進行
// =====================================================

function drawPlaying() {
  const cfg = LEVELS[currentLevel];
  drawTrack(cfg.color);
  drawStartEndMarkers();
  drawHUD();
  drawRing();

  if (ring.x >= pts[pts.length - 1].x - 5 && isHolding) {
    winTimer = 0;
    scene = 'win';
    spawnStars(ring.x, ring.y);
  }
}

function drawTrack(col) {
  const c = color(col);
  // 上線
  strokeWeight(5);
  stroke(c);
  noFill();
  beginShape();
  // 使用 curveVertex 產生平滑曲線，首尾需重複點作為控制點
  curveVertex(pts[0].x, pts[0].topY);
  for (let pt of pts) curveVertex(pt.x, pt.topY);
  curveVertex(pts[pts.length - 1].x, pts[pts.length - 1].topY);
  endShape();

  // 下線
  beginShape();
  curveVertex(pts[0].x, pts[0].botY);
  for (let pt of pts) curveVertex(pt.x, pt.botY);
  curveVertex(pts[pts.length - 1].x, pts[pts.length - 1].botY);
  endShape();

  // 管道填色
  noStroke();
  fill(red(c), green(c), blue(c), 16);
  beginShape();
  curveVertex(pts[0].x, pts[0].topY);
  for (let pt of pts) curveVertex(pt.x, pt.topY);
  curveVertex(pts[pts.length - 1].x, pts[pts.length - 1].topY);
  
  curveVertex(pts[pts.length - 1].x, pts[pts.length - 1].botY);
  for (let i = pts.length - 1; i >= 0; i--) curveVertex(pts[i].x, pts[i].botY);
  curveVertex(pts[0].x, pts[0].botY);
  endShape(CLOSE);

  // 左右封口
  stroke(c); strokeWeight(2);
  line(pts[0].x, pts[0].topY, pts[0].x, pts[0].botY);
  line(pts[pts.length-1].x, pts[pts.length-1].topY, pts[pts.length-1].x, pts[pts.length-1].botY);

  // 發光外緣
  strokeWeight(1);
  stroke(red(c), green(c), blue(c), 64);
  noFill();
  beginShape();
  curveVertex(pts[0].x, pts[0].topY - 3);
  for (let pt of pts) curveVertex(pt.x, pt.topY - 3);
  curveVertex(pts[pts.length - 1].x, pts[pts.length - 1].topY - 3);
  endShape();
  beginShape();
  curveVertex(pts[0].x, pts[0].botY + 3);
  for (let pt of pts) curveVertex(pt.x, pt.botY + 3);
  curveVertex(pts[pts.length - 1].x, pts[pts.length - 1].botY + 3);
  endShape();
}

function drawStartEndMarkers() {
  const s = pts[0];
  const e = pts[pts.length - 1];
  const cy_s = (s.topY + s.botY) / 2;
  const cy_e = (e.topY + e.botY) / 2;
  const pulse = Math.abs(Math.sin(titleAnim * 2));

  // START
  stroke(0, 255, 136, 150 + pulse * 100);
  strokeWeight(2);
  fill(0, 255, 136, 30 + pulse * 20);
  circle(s.x, cy_s, 45);
  noStroke();
  fill(0, 255, 136, 200 + pulse * 55);
  textSize(12); textAlign(CENTER, CENTER);
  text('START', s.x, cy_s);

  // END
  stroke(255, 34, 68, 150 + pulse * 100);
  strokeWeight(2);
  fill(255, 34, 68, 30 + pulse * 20);
  circle(e.x, cy_e, 45);
  noStroke();
  fill(255, 34, 68, 200 + pulse * 55);
  textSize(12);
  text('END', e.x, cy_e);
}

function drawHUD() {
  const cfg = LEVELS[currentLevel];
  textAlign(LEFT, TOP);
  fill(cfg.color);
  textSize(18);
  text(cfg.name, 16, 14);
  fill(150, 200, 255, 150);
  textSize(12);
  text(cfg.label, 16, 38);

  // 進度條
  const prog = constrain((ring.x - pts[0].x) / (pts[pts.length-1].x - pts[0].x), 0, 1);
  const bx = W/2 - 150, by = 15, bw = 300, bh = 12;
  stroke(0, 212, 255, 60); strokeWeight(0.5);
  fill(0, 0, 0, 80);
  rect(bx, by, bw, bh, 4);
  noStroke();
  fill(0, 212, 255, 200);
  rect(bx, by, bw * prog, bh, 4);
  fill(200, 230, 255, 120);
  textAlign(CENTER, CENTER);
  textSize(10);
  text('進度 ' + Math.round(prog * 100) + '%', W/2, by + bh/2);

  if (!isHolding) {
    const pulse = Math.abs(Math.sin(titleAnim * 2));
    fill(0, 255, 136, 160 + pulse * 80);
    textAlign(CENTER, CENTER);
    textSize(11);
    text('在起點按下滑鼠開始', W / 2, H - 20);
  }
}

function drawRing() {
  const pulse = Math.abs(Math.sin(titleAnim * 3));
  noFill();
  stroke(255, 165, 0, 40 + pulse * 30);
  strokeWeight(6);
  circle(ring.x, ring.y, (RING_R + 6) * 2);
  stroke(255, 180, 0);
  strokeWeight(3);
  circle(ring.x, ring.y, RING_R * 2);
  fill(255, 200, 50, 60);
  noStroke();
  circle(ring.x, ring.y, RING_R * 2 - 4);
}

// =====================================================
//  失敗畫面
// =====================================================

function drawFail() {
  failTimer++;
  drawTrack(LEVELS[currentLevel].color);
  drawStartEndMarkers();
  drawHUD();

  const alpha = constrain(map(failTimer, 0, 20, 0, 220), 0, 220);
  fill(180, 0, 20, alpha);
  noStroke();
  rect(0, 0, W, H);

  if (failTimer > 15) {
    const f2 = failTimer - 15;
    textAlign(CENTER, CENTER);
    fill(255, 220, 0, constrain(f2 * 12, 0, 255));
    textSize(48);
    text('[SHOCK!]', W/2, H/2 - 56);
    fill(255, 80, 100, constrain(f2 * 15, 0, 255));
    textSize(36);
    text('SHOCK!', W/2, H/2 - 4);
    fill(255, 200, 210, constrain(f2 * 12, 0, 255));
    textSize(13);
    text('觸電了！好痛！', W/2, H/2 + 36);

    if (f2 > 20) {
      drawMenuBtn(btnRestart, '^  重新挑戰', '#ff2244');
      drawMenuBtn({ x: W/2, y: H - 40, w: 160, h: 36 }, '<  選擇關卡', '#aaaacc', 10);
    }
  }
}

// =====================================================
//  過關畫面
// =====================================================

function drawWin() {
  winTimer++;
  drawTrack(LEVELS[currentLevel].color);
  drawStartEndMarkers();
  drawHUD();
  updateStars();
  drawStarsEffect();

  const alpha = constrain(map(winTimer, 0, 20, 0, 180), 0, 180);
  fill(0, 30, 10, alpha);
  noStroke();
  rect(0, 0, W, H);

  if (winTimer > 15) {
    const f2 = winTimer - 15;
    textAlign(CENTER, CENTER);
    fill(0, 255, 136, constrain(f2 * 12, 0, 255));
    textSize(48);
    text('[ CLEAR! ]', W/2, H/2 - 56);
    fill(0, 255, 136, constrain(f2 * 15, 0, 255));
    textSize(34);
    text('CLEAR!', W/2, H/2 - 4);
    fill(150, 255, 200, constrain(f2 * 12, 0, 255));
    textSize(13);
    text(LEVELS[currentLevel].name + ' 通關！', W/2, H/2 + 34);

    if (f2 > 20) {
      if (currentLevel < LEVELS.length - 1) {
        drawMenuBtn(btnNext, '>  下一關', '#00ff88');
        drawMenuBtn({ x: W/2, y: H - 40, w: 160, h: 36 }, '^  再挑一次', '#44aaff', 10);
      } else {
        drawMenuBtn(btnNext, '[*] 全關通關！', '#ffe600');
        drawMenuBtn({ x: W/2, y: H - 40, w: 160, h: 36 }, '^  再玩一次', '#44aaff', 10);
      }
    }
  }
}

// =====================================================
//  全通關畫面
// =====================================================

function drawAllClear() {
  winTimer++;
  fill(5, 10, 20); noStroke(); rect(0, 0, W, H);
  updateStars(); drawStarsEffect();

  textAlign(CENTER, CENTER);
  const pulse = Math.abs(Math.sin(titleAnim * 2));
  fill(255, 230, 0, 200 + pulse * 55);
  textSize(52);
  text('[TROPHY]', W/2, H/2 - 90);
  textSize(30);
  text('ALL CLEAR!', W/2, H/2 - 24);
  fill(200, 240, 200, 200);
  textSize(14);
  text('恭喜您完成所有關卡！', W/2, H/2 + 18);
  fill(150, 200, 255, 160);
  textSize(11);
  text('您已是電流急急棒大師', W/2, H/2 + 44);

  drawMenuBtn({ x: W/2, y: H * 0.75, w: 200, h: 48 }, '^  重新挑戰', '#ffe600');
  drawMenuBtn({ x: W/2, y: H - 40, w: 160, h: 36 }, '<  選擇關卡', '#aaaacc', 10);
}

// =====================================================
//  通用按鈕繪製
// =====================================================

function drawMenuBtn(btn, label, col, tSize) {
  const bx = btn.x - btn.w / 2, by = btn.y - btn.h / 2;
  const hov = mouseX > bx && mouseX < bx + btn.w && mouseY > by && mouseY < by + btn.h;
  const pulse = Math.abs(Math.sin(titleAnim * 1.5));
  const c = color(col);
  stroke(red(c), green(c), blue(c), 100 + pulse * 120);
  strokeWeight(1.5);
  fill(hov ? 30 : 5, hov ? 40 : 10, hov ? 60 : 20, hov ? 140 : 60);
  rect(bx, by, btn.w, btn.h, 8);
  noStroke();
  fill(c);
  textSize(tSize || 14);
  textAlign(CENTER, CENTER);
  text(label, btn.x, btn.y);
}

// =====================================================
//  粒子系統
// =====================================================

function spawnSparks(x, y) {
  for (let i = 0; i < 20; i++) {
    const angle = random(TWO_PI);
    const speed = random(2, 8);
    sparks.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: random(20, 40)
    });
  }
}

function updateSparks() {
  for (let s of sparks) {
    s.x += s.vx; s.y += s.vy; s.vy += 0.3;
    s.life -= 1 / s.maxLife;
  }
  sparks = sparks.filter(s => s.life > 0);
}

function drawSparks() {
  for (let s of sparks) {
    const a = s.life * 255;
    stroke(255, 200 + s.life * 55, 50, a);
    strokeWeight(2);
    point(s.x, s.y);
    stroke(255, 255, 100, a * 0.5);
    strokeWeight(1);
    line(s.x, s.y, s.x - s.vx, s.y - s.vy);
  }
}

function spawnStars(x, y) {
  for (let i = 0; i < 40; i++) {
    const angle = random(TWO_PI);
    const speed = random(1, 6);
    const cols = ['#00ff88', '#ffe600', '#00d4ff', '#ffffff'];
    stars.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      col: random(cols)
    });
  }
}

function updateStars() {
  for (let s of stars) {
    s.x += s.vx; s.y += s.vy; s.vy += 0.1;
    s.life -= 0.015; s.vx *= 0.98;
  }
  stars = stars.filter(s => s.life > 0);
  if (Math.random() < 0.3 && (scene === 'win' || scene === 'allclear')) {
    spawnStars(random(W), random(H * 0.7));
  }
}

function drawStarsEffect() {
  for (let s of stars) {
    const a = Math.round(s.life * 220);
    const c = color(s.col);
    fill(red(c), green(c), blue(c), a);
    noStroke();
    circle(s.x, s.y, 5 * s.life);
  }
}

function spawnParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x, y,
      vx: random(-3, 3), vy: random(-4, 0),
      life: 1, size: random(3, 8)
    });
  }
}

function updateParticles() {
  for (let pt of particles) {
    pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.2; pt.life -= 0.04;
  }
  particles = particles.filter(pt => pt.life > 0);
}

function drawParticles() {
  for (let pt of particles) {
    fill(255, 200, 50, pt.life * 200);
    noStroke();
    circle(pt.x, pt.y, pt.size * pt.life);
  }
}

// =====================================================
//  碰撞偵測
// =====================================================

function getChannel(rx) {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (rx >= a.x && rx <= b.x) {
      const t = (rx - a.x) / (b.x - a.x);
      return {
        top: a.topY + (b.topY - a.topY) * t,
        bot: a.botY + (b.botY - a.botY) * t,
        ok: true
      };
    }
  }
  return { ok: false };
}

function checkCollision() {
  if (ring.x < pts[0].x - RING_R || ring.x > pts[pts.length-1].x + RING_R) {
    if (ring.x > pts[0].x + RING_R) triggerFail();
    return;
  }
  const ch = getChannel(ring.x);
  if (!ch.ok) { triggerFail(); return; }
  if (ring.y - RING_R < ch.top || ring.y + RING_R > ch.bot) {
    triggerFail();
  }
  if (ring.x >= pts[pts.length - 1].x - 6) {
    winTimer = 0; scene = 'win'; spawnStars(ring.x, ring.y);
  }
}

function triggerFail() {
  scene = 'fail'; failTimer = 0; isHolding = false;
  spawnSparks(ring.x, ring.y);
}

// =====================================================
//  滑鼠事件
// =====================================================

function mousePressed() {
  // ── 標題畫面 ──
  if (scene === 'title') {
    // 關卡選擇
    const bw = 220, bh = 100, gap = 20;
    const totalW = LEVELS.length * bw + (LEVELS.length - 1) * gap;
    const startX = W / 2 - totalW / 2;
    for (let i = 0; i < LEVELS.length; i++) {
      const bx = startX + i * (bw + gap), by = H / 2 - 50;
      if (mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh) {
        currentLevel = i; return;
      }
    }
    // 開始按鈕
    const bx = btnStart.x - btnStart.w/2, by = btnStart.y - btnStart.h/2;
    if (mouseX > bx && mouseX < bx+btnStart.w && mouseY > by && mouseY < by+btnStart.h) {
      genLevel(currentLevel); scene = 'playing';
    }
    return;
  }

  // ── 遊戲中 ──
  if (scene === 'playing') {
    const s = pts[0];
    const cy = (s.topY + s.botY) / 2;
    if (Math.hypot(mouseX - s.x, mouseY - cy) < 30) {
      isHolding = true;
      ring.x = s.x; ring.y = cy;
    }
    return;
  }

  // ── 失敗畫面 ──
  if (scene === 'fail') {
    if (failTimer < 35) return;
    const bx = btnRestart.x - btnRestart.w/2, by = btnRestart.y - btnRestart.h/2;
    if (mouseX > bx && mouseX < bx+btnRestart.w && mouseY > by && mouseY < by+btnRestart.h) {
      genLevel(currentLevel); scene = 'playing'; return;
    }
    const mb = { x: W/2, y: H - 40, w: 160, h: 36 };
    if (mouseX > mb.x-mb.w/2 && mouseX < mb.x+mb.w/2 && mouseY > mb.y-mb.h/2 && mouseY < mb.y+mb.h/2) {
      scene = 'title'; return;
    }
    return;
  }

  // ── 過關畫面 ──
  if (scene === 'win') {
    if (winTimer < 35) return;
    const bx = btnNext.x - btnNext.w/2, by = btnNext.y - btnNext.h/2;
    if (mouseX > bx && mouseX < bx+btnNext.w && mouseY > by && mouseY < by+btnNext.h) {
      if (currentLevel < LEVELS.length - 1) {
        currentLevel++;
        genLevel(currentLevel); scene = 'playing';
      } else {
        scene = 'allclear'; stars = [];
      }
      return;
    }
    const mb = { x: W/2, y: H - 40, w: 160, h: 36 };
    if (mouseX > mb.x-mb.w/2 && mouseX < mb.x+mb.w/2 && mouseY > mb.y-mb.h/2 && mouseY < mb.y+mb.h/2) {
      genLevel(currentLevel); scene = 'playing'; return;
    }
    return;
  }

  // ── 全通關畫面 ──
  if (scene === 'allclear') {
    const bx = W/2-100, by = (H * 0.75)-24;
    if (mouseX > bx && mouseX < bx+200 && mouseY > by && mouseY < by+48) {
      currentLevel = 0; genLevel(0); scene = 'playing'; return;
    }
    const mb = { x: W/2, y: H - 40, w: 160, h: 36 };
    if (mouseX > mb.x-mb.w/2 && mouseX < mb.x+mb.w/2 && mouseY > mb.y-mb.h/2 && mouseY < mb.y+mb.h/2) {
      scene = 'title'; return;
    }
  }
}

function mouseDragged() {
  if (scene !== 'playing' || !isHolding) return;
  ring.x = constrain(mouseX, 0, W);
  ring.y = constrain(mouseY, 0, H);
  spawnParticles(ring.x, ring.y);
  checkCollision();
}

function mouseReleased() {
  if (scene === 'playing' && isHolding) {
    isHolding = false;
    resetRing();
  }
}