const LETTERS = "აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ".split("");
const N = 20,
  CELL = 30;
const cv = document.getElementById("c"),
  ctx = cv.getContext("2d");
const $ = (id) => document.getElementById(id);

let mode = "alpha",
  snake,
  dir,
  nextDir,
  foods,
  score,
  lives,
  idx,
  collected,
  running = false,
  paused = false,
  timer,
  speed;
let best = 0;
try {
  best = +localStorage.getItem("geoSnakeBest") || 0;
} catch (e) {}
$("best").textContent = best;

// alphabet panel
LETTERS.forEach((l, i) => {
  const s = document.createElement("span");
  s.textContent = l;
  s.id = "a" + i;
  $("alpha").appendChild(s);
});

function setMode(m) {
  if (running && !paused) return;
  mode = m;
  $("mAlpha").classList.toggle("on", m === "alpha");
  $("mFree").classList.toggle("on", m === "free");
  $("targetCard").style.display = m === "alpha" ? "" : "none";
  $("ovText").textContent =
    m === "alpha"
      ? "ისრებით ან WASD-ით მართე მერცხალი. ჭამე ასოები რიგრიგობით: ა → ბ → გ… არასწორი ასო სიცოცხლეს წაგართმევს."
      : "ისრებით ან WASD-ით მართე მერცხალი. ჭამე ნებისმიერი ასო და გაიზარდე რაც შეიძლება დიდი!";
}
$("mAlpha").onclick = () => setMode("alpha");
$("mFree").onclick = () => setMode("free");

function freeCell() {
  while (true) {
    const p = {
      x: Math.floor(Math.random() * N),
      y: Math.floor(Math.random() * N),
    };
    if (snake.some((s) => s.x === p.x && s.y === p.y)) continue;
    if (foods.some((f) => f.x === p.x && f.y === p.y)) continue;
    if (Math.abs(p.x - snake[0].x) + Math.abs(p.y - snake[0].y) < 3) continue;
    return p;
  }
}

function spawnFoods() {
  foods = [];
  if (mode === "alpha") {
    const want = LETTERS[idx];
    foods.push({ ...freeCell(), l: want });
    const others = LETTERS.filter((l) => l !== want)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    others.forEach((l) => foods.push({ ...freeCell(), l }));
  } else {
    while (foods.length < 4)
      foods.push({
        ...freeCell(),
        l: LETTERS[Math.floor(Math.random() * LETTERS.length)],
      });
  }
}

function reset() {
  snake = [
    { x: 10, y: 10, l: "" },
    { x: 9, y: 10, l: "" },
    { x: 8, y: 10, l: "" },
  ];
  dir = { x: 1, y: 0 };
  nextDir = dir;
  score = 0;
  lives = 3;
  idx = 0;
  collected = new Set();
  speed = 200;
  foods = [];
  spawnFoods();
  updateUI();
}

function updateUI() {
  $("score").textContent = score;
  $("lives").textContent = "❤".repeat(lives) + "♡".repeat(3 - lives);
  $("target").textContent = LETTERS[idx] || "★";
  LETTERS.forEach((l, i) => {
    const s = $("a" + i);
    s.classList.toggle("got", collected.has(l));
    s.classList.toggle("now", mode === "alpha" && i === idx);
  });
}

function toast(t, color) {
  const el = $("toast");
  el.textContent = t;
  el.style.color = color;
  el.style.opacity = 1;
  clearTimeout(el._t);
  el._t = setTimeout(() => (el.style.opacity = 0), 700);
}

function start() {
  reset();
  running = true;
  paused = false;
  $("ov").classList.add("hidden");
  if (musicOn) Snd.start();
  loop();
}
function loop() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    step();
    if (running) loop();
  }, speed);
}

function gameOver(win) {
  running = false;
  clearTimeout(timer);
  if (score > best) {
    best = score;
    try {
      localStorage.setItem("geoSnakeBest", best);
    } catch (e) {}
    $("best").textContent = best;
  }
  $("ovTitle").textContent = win
    ? "🎉 მთელი ანბანი შეაგროვე!"
    : "თამაში დასრულდა";
  $("ovText").textContent =
    `ქულა: ${score} · შეგროვებული ასოები: ${collected.size}/33`;
  $("startBtn").textContent = "თავიდან";
  $("ov").classList.remove("hidden");
}

function step() {
  if (paused) return;
  dir = nextDir;
  const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y, l: "" };
  if (
    h.x < 0 ||
    h.y < 0 ||
    h.x >= N ||
    h.y >= N ||
    snake.some((s) => s.x === h.x && s.y === h.y)
  ) {
    draw();
    return gameOver(false);
  }
  snake.unshift(h);
  const fi = foods.findIndex((f) => f.x === h.x && f.y === h.y);
  if (fi < 0) {
    snake.pop();
  } else {
    const f = foods[fi];
    peck(mode === "free" || f.l === LETTERS[idx]);
    if (mode === "alpha") {
      if (f.l === LETTERS[idx]) {
        snake[1] && (h.l = f.l);
        h.l = f.l;
        collected.add(f.l);
        score += 10;
        idx++;
        toast(f.l + " ✓", "var(--good)");
        speed = Math.max(110, speed - 2);
        if (idx >= LETTERS.length) {
          updateUI();
          draw();
          return gameOver(true);
        }
        spawnFoods();
      } else {
        snake.pop();
        lives--;
        toast("არა " + f.l + " — საჭიროა " + LETTERS[idx], "var(--bad)");
        foods.splice(fi, 1);
        foods.push({ ...freeCell(), l: f.l });
        if (lives <= 0) {
          updateUI();
          draw();
          return gameOver(false);
        }
      }
    } else {
      h.l = f.l;
      collected.add(f.l);
      score += 10;
      toast(f.l, "var(--good)");
      speed = Math.max(105, speed - 2);
      foods.splice(fi, 1);
      foods.push({
        ...freeCell(),
        l: LETTERS[Math.floor(Math.random() * LETTERS.length)],
      });
      if (collected.size === 33 && !snake._won) {
        snake._won = true;
        toast("🎉 მთელი ანბანი!", "var(--snake)");
      }
    }
    updateUI();
  }
  draw();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function drawSwallow(cx, cy, s, ang, isHead) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  if (Math.cos(ang) < -0.01) ctx.scale(1, -1);
  // forked tail
  ctx.fillStyle = "#2a4f9e";
  ctx.beginPath();
  ctx.moveTo(-0.2 * s, -0.15 * s);
  ctx.lineTo(-1.05 * s, -0.6 * s);
  ctx.lineTo(-0.7 * s, 0);
  ctx.lineTo(-1.05 * s, 0.6 * s);
  ctx.lineTo(-0.2 * s, 0.15 * s);
  ctx.closePath();
  ctx.fill();
  // body
  ctx.fillStyle = "#3b6fd4";
  ctx.beginPath();
  ctx.ellipse(0, 0, 0.7 * s, 0.38 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // belly
  ctx.fillStyle = "#f4efe3";
  ctx.beginPath();
  ctx.ellipse(0.05 * s, 0.14 * s, 0.5 * s, 0.2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // wing
  ctx.fillStyle = "#1f428a";
  ctx.beginPath();
  ctx.moveTo(0.25 * s, -0.1 * s);
  ctx.quadraticCurveTo(-0.3 * s, -0.95 * s, -0.95 * s, -0.8 * s);
  ctx.quadraticCurveTo(-0.4 * s, -0.3 * s, -0.3 * s, 0);
  ctx.closePath();
  ctx.fill();
  // head
  ctx.fillStyle = "#3b6fd4";
  ctx.beginPath();
  ctx.arc(0.55 * s, 0, 0.3 * s, 0, Math.PI * 2);
  ctx.fill();
  // red throat
  ctx.fillStyle = "#e2663a";
  ctx.beginPath();
  ctx.arc(0.68 * s, 0.1 * s, 0.17 * s, 0, Math.PI * 2);
  ctx.fill();
  // beak
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.moveTo(0.8 * s, -0.08 * s);
  ctx.lineTo(1.02 * s, 0.02 * s);
  ctx.lineTo(0.8 * s, 0.08 * s);
  ctx.closePath();
  ctx.fill();
  // eye
  if (isHead) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0.62 * s, -0.1 * s, 0.11 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.arc(0.65 * s, -0.1 * s, 0.06 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function draw() {
  ctx.fillStyle = "#173328";
  ctx.fillRect(0, 0, 600, 600);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      if ((x + y) % 2) {
        ctx.fillStyle = "#1a382c";
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // foods
  foods.forEach((f) => {
    const isTarget = mode === "alpha" && f.l === LETTERS[idx];
    ctx.fillStyle = "rgba(244,239,227,.12)";
    roundRect(f.x * CELL + 2, f.y * CELL + 2, CELL - 4, CELL - 4, 8);
    ctx.fillStyle = "#f4efe3";
    ctx.font = "800 21px 'Noto Sans Georgian'";
    ctx.fillText(f.l, f.x * CELL + CELL / 2, f.y * CELL + CELL / 2 + 1);
  });
  // snake (მერცხლები)
  for (let i = snake.length - 1; i >= 0; i--) {
    const s = snake[i];
    const cx = s.x * CELL + CELL / 2,
      cy = s.y * CELL + CELL / 2;
    let ang;
    if (i === 0) ang = Math.atan2(dir.y, dir.x);
    else ang = Math.atan2(snake[i - 1].y - s.y, snake[i - 1].x - s.x);
    drawSwallow(cx, cy, i === 0 ? 16 : 12, ang, i === 0);
    if (s.l && i > 0) {
      ctx.fillStyle = "#f4efe3";
      ctx.font = "800 15px 'Noto Sans Georgian'";
      ctx.fillText(s.l, cx, cy + 1);
    }
  }
  if (paused) {
    ctx.fillStyle = "rgba(10,24,18,.6)";
    ctx.fillRect(0, 0, 600, 600);
    ctx.fillStyle = "#f4efe3";
    ctx.font = "800 36px 'Noto Sans Georgian'";
    ctx.fillText("პაუზა", 300, 300);
  }
}

const DIRS = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
};
document.addEventListener("keydown", (e) => {
  if (DIRS[e.code]) {
    e.preventDefault();
    const [x, y] = DIRS[e.code];
    if (running && !(x === -dir.x && y === -dir.y)) nextDir = { x, y };
  } else if (e.code === "Space") {
    e.preventDefault();
    if (running) {
      paused = !paused;
      draw();
    }
  } else if (e.code === "Enter" && !running) {
    start();
  }
});
$("startBtn").onclick = start;

// touch: on-screen pad + swipe
function turn(x, y) {
  if (running && !(x === -dir.x && y === -dir.y)) nextDir = { x, y };
}
document.querySelectorAll("#pad [data-d]").forEach((b) => {
  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const [x, y] = b.dataset.d.split(",").map(Number);
    turn(x, y);
  });
});
$("pauseBtn").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (running) {
    paused = !paused;
    draw();
  } else start();
});
let sx = null,
  sy = null;
cv.addEventListener(
  "touchstart",
  (e) => {
    const t = e.touches[0];
    sx = t.clientX;
    sy = t.clientY;
    e.preventDefault();
  },
  { passive: false },
);
cv.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    if (sx === null) return;
    const t = e.touches[0],
      dx = t.clientX - sx,
      dy = t.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0);
    else turn(0, dy > 0 ? 1 : -1);
    sx = t.clientX;
    sy = t.clientY;
  },
  { passive: false },
);
cv.addEventListener("touchend", () => {
  sx = null;
});

// initial preview
snake = [
  { x: 10, y: 10, l: "" },
  { x: 9, y: 10, l: "ბ" },
  { x: 8, y: 10, l: "ა" },
];
dir = { x: 1, y: 0 };
foods = [];
setMode("alpha");
idx = 0;
collected = new Set();
spawnFoods();
document.fonts && document.fonts.ready.then(draw);
draw();
updateUI();

// ===== მუსიკა და ეფექტები (Web Audio — ყველაფერი კოდით იქმნება, ავტორული უფლებები არ ეხება) =====
let musicOn = true;
const Snd = (() => {
  let ac, master, musicGain, timer, nextT = 0, stepI = 0, playing = false;
  const STEP = 0.28;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // აკორდები: ბანი + სამხმოვანება (C – Am – F – G)
  const CH = [
    [48, 60, 64, 67],
    [45, 57, 60, 64],
    [41, 53, 57, 60],
    [43, 55, 59, 62],
  ];
  // მელოდია (null = პაუზა)
  const MEL = [
    [76, null, 79, 76, 72, null, 74, 76],
    [76, null, 81, 79, 76, null, 72, 74],
    [77, null, 81, 77, 72, null, 74, 77],
    [74, null, 79, 74, 71, null, 74, 79],
  ];
  function ensure() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = 0.8;
      master.connect(ac.destination);
      musicGain = ac.createGain();
      musicGain.gain.value = 0.5;
      musicGain.connect(master);
    }
    if (ac.state === "suspended") ac.resume();
    return true;
  }
  function tone(type, freq, t, dur, vol, dest) {
    const o = ac.createOscillator(),
      g = ac.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  function sched() {
    while (nextT < ac.currentTime + 0.4) {
      const bar = Math.floor(stepI / 8) % 4,
        s = stepI % 8,
        ch = CH[bar];
      if (s === 0 || s === 4) tone("triangle", hz(ch[0] - 12), nextT, 0.5, 0.25, musicGain);
      if (s === 0) for (let i = 1; i < 4; i++) tone("sine", hz(ch[i]), nextT, 2, 0.06, musicGain);
      const m = MEL[bar][s];
      if (m) tone("triangle", hz(m), nextT, 0.35, 0.18, musicGain);
      nextT += STEP;
      stepI++;
    }
  }
  return {
    start() {
      if (playing || !ensure()) return;
      playing = true;
      musicGain.gain.cancelScheduledValues(ac.currentTime);
      musicGain.gain.setValueAtTime(0.5, ac.currentTime);
      nextT = ac.currentTime + 0.1;
      stepI = 0;
      sched();
      timer = setInterval(sched, 100);
    },
    stop() {
      if (!playing) return;
      playing = false;
      clearInterval(timer);
      musicGain.gain.setTargetAtTime(0, ac.currentTime, 0.05);
    },
    // კენკვის ეფექტი: ორი სწრაფი „ტაკ-ტაკ“
    peck(good) {
      if (!ensure()) return;
      const t = ac.currentTime;
      if (good) {
        [0, 0.07].forEach((k) => {
          const o = ac.createOscillator(),
            g = ac.createGain();
          o.type = "triangle";
          o.frequency.setValueAtTime(1800, t + k);
          o.frequency.exponentialRampToValueAtTime(700, t + k + 0.04);
          g.gain.setValueAtTime(0.35, t + k);
          g.gain.exponentialRampToValueAtTime(0.0001, t + k + 0.06);
          o.connect(g);
          g.connect(master);
          o.start(t + k);
          o.stop(t + k + 0.08);
        });
      } else {
        const o = ac.createOscillator(),
          g = ac.createGain();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(220, t);
        o.frequency.exponentialRampToValueAtTime(110, t + 0.18);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        o.connect(g);
        g.connect(master);
        o.start(t);
        o.stop(t + 0.22);
      }
    },
  };
})();
function peck(good) {
  Snd.peck(good);
}
$("musicBtn").onclick = (e) => {
  musicOn = !musicOn;
  $("musicBtn").textContent = musicOn ? "🔊 მუსიკა: ჩართულია" : "🔇 მუსიკა: გამორთულია";
  if (musicOn) Snd.start();
  else Snd.stop();
  e.currentTarget.blur();
};
