/* ===================== CAPTCHA — STANDALONE ===================== */
/* Do NOT load function.js on captcha.html — this file handles everything */

const TOTAL_TILES  = 12;
const IMAGE_COUNT  = 12;

const DECOY_COLOURS = [
  "#1a0a0c","#2d0810","#3b0d17",
  "#0d0505","#1c0309","#3d0a0f",
  "#080202","#260609"
];

const PROMPTS = [
  "human",
  "human",
  "a person",
  "a person",
];

let lives         = 3;
let selectedTiles = new Set();
let tileData      = [];
let heartIndex    = -1; /* which tile slot holds the heart.gif */

/* ===================== BOOT ===================== */

document.addEventListener("DOMContentLoaded", () => {

  const toggle = document.getElementById("modeToggle");
  if (toggle) {
    toggle.addEventListener("change", () => {
      document.body.classList.toggle("dark");

      const doorArch = document.querySelector("#captchaGrid .door-arch");
      if (doorArch) {
        const isDark = document.body.classList.contains("dark");
        doorArch.setAttribute("fill", isDark ? "#e8e0e0" : "#050000");
      }
    });
  }

  const particleContainer = document.getElementById("particles");
  function createParticle() {
    if (!particleContainer) return;
    const p = document.createElement("div");
    p.classList.add("particle");
    p.style.left = Math.random() * 100 + "vw";
    p.style.animationDuration = (3 + Math.random() * 5) + "s";
    p.style.opacity = Math.random();
    particleContainer.appendChild(p);
    setTimeout(() => p.remove(), 8000);
  }
  setInterval(createParticle, 300);

  window.addEventListener("load", () => document.body.classList.add("loaded"));
  if (document.readyState === "complete") document.body.classList.add("loaded");

  buildRound();
  document.getElementById("verifyBtn").addEventListener("click", handleVerify);
});

/* ===================== BUILD ROUND ===================== */

function buildRound() {
  selectedTiles.clear();
  tileData = [];

  const grid = document.getElementById("captchaGrid");
  grid.innerHTML = "";

  const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  document.querySelector(".captcha-title").textContent = prompt;

  /* Pick one random slot for the heart — the only correct answer */
  heartIndex = Math.floor(Math.random() * TOTAL_TILES);

  /* Shuffle the PNG pool for the decoy tiles */
  const imagePool = shuffle([...Array(IMAGE_COUNT).keys()].map(i => i + 1));
  let imageIdx = 0;

  for (let i = 0; i < TOTAL_TILES; i++) {
    const isHeart = (i === heartIndex);
    tileData.push({ index: i, isReal: isHeart });

    const tile = document.createElement("div");
    tile.classList.add("captcha-tile");
    tile.dataset.index = i;

    const img = document.createElement("img");
    img.alt       = "";
    img.draggable = false;

    if (isHeart) {
      /* The single correct tile — always visible, dark background */
      img.src = "Captcha/heart.gif";
      img.classList.add("heart-tile-img");
    } else {
      /* Decoy: PNG hidden in light mode, revealed in dark mode */
      img.src = `Captcha/Captcha${imagePool[imageIdx++]}.png`;
      img.classList.add("decoy-tile-img");
    }

    tile.appendChild(img);
    tile.addEventListener("click", () => toggleTile(tile, i));
    grid.appendChild(tile);
  }

  renderLives();
}

/* ===================== TOGGLE TILE ===================== */

function toggleTile(tile, index) {
  if (selectedTiles.has(index)) {
    selectedTiles.delete(index);
    tile.classList.remove("selected");
  } else {
    selectedTiles.add(index);
    tile.classList.add("selected");
  }
}

/* ===================== VERIFY ===================== */

function handleVerify() {
  const card = document.querySelector(".captcha-card");

  /* Correct = only the heart tile selected, nothing else */
  const correct =
    selectedTiles.size === 1 &&
    selectedTiles.has(heartIndex);

  if (correct) {
    card.classList.add("success");
    card.addEventListener("animationend", () => card.classList.remove("success"), { once: true });

    if (typeof CaptchaThree !== "undefined") CaptchaThree.onSuccess();

    setTimeout(() => morphToDoor(), 400);

  } else {
    lives--;
    renderLives();

    if (typeof CaptchaThree !== "undefined") CaptchaThree.onWrong();

    card.classList.add("shake");
    card.addEventListener("animationend", () => card.classList.remove("shake"), { once: true });

    if (lives <= 0) {
      showFeedback(false, true);
    } else {
      highlightWrong();
      setTimeout(() => buildRound(), 1200);
    }
  }
}

/* ===================== DOOR MORPH ===================== */

function morphToDoor() {
  const grid = document.getElementById("captchaGrid");

  const tiles = Array.from(grid.querySelectorAll(".captcha-tile"));
  const gridRect = grid.getBoundingClientRect();
  const gridW = gridRect.width;
  const gridH = gridRect.height;

  tiles.forEach((tile, i) => {
    tile.style.transition = `opacity 0.35s ease ${i * 30}ms, transform 0.35s ease ${i * 30}ms`;
    tile.style.opacity    = "0";
    tile.style.transform  = "scale(0.85)";
  });

  setTimeout(() => {
    grid.style.display    = "block";
    grid.style.gap        = "0";
    grid.style.padding    = "0";
    grid.style.background = "transparent";
    grid.style.width      = gridW + "px";
    grid.style.height     = gridH + "px";
    grid.style.overflow   = "hidden";
    grid.innerHTML = buildDoorHTML(gridW, gridH);
  }, tiles.length * 30 + 380);
}

function buildDoorHTML(w, h) {
  const doorW   = w * 0.42;
  const doorH   = h * 0.88;
  const archR   = doorW / 2;
  const doorX   = (w - doorW) / 2;
  const doorY   = h - doorH;
  const isDark  = document.body.classList.contains("dark");
  const archCol = isDark ? "#e8e0e0" : "#050000";

  const svgContent = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <style>
        .door-void-reveal {
          opacity: 0;
          animation: voidReveal 0.9s ease 0.2s forwards;
        }
        @keyframes voidReveal { to { opacity: 1; } }
        .enter-click { cursor: pointer; }
      </style>
      <clipPath id="archClip">
        <path d="
          M ${doorX} ${h}
          L ${doorX} ${doorY + archR}
          A ${archR} ${archR} 0 0 1 ${doorX + doorW} ${doorY + archR}
          L ${doorX + doorW} ${h}
          Z
        "/>
      </clipPath>
    </defs>

    <path class="door-void-reveal door-arch" d="
      M ${doorX} ${h}
      L ${doorX} ${doorY + archR}
      A ${archR} ${archR} 0 0 1 ${doorX + doorW} ${doorY + archR}
      L ${doorX + doorW} ${h}
      Z
    " fill="${archCol}"/>

    <g class="enter-click" id="doorEnterZone">
      <path d="
        M ${doorX} ${h}
        L ${doorX} ${doorY + archR}
        A ${archR} ${archR} 0 0 1 ${doorX + doorW} ${doorY + archR}
        L ${doorX + doorW} ${h}
        Z
      " fill="transparent"/>
    </g>
  </svg>`;

  return `<div id="doorWrapper" style="width:100%;height:100%;position:relative;cursor:pointer;">${svgContent}</div>`;
}

/* ===================== PAGE TRANSITION ===================== */

function triggerDoorTransition() {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:#000;opacity:0;pointer-events:none;
    transition:opacity 0.8s ease;
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.opacity = "1"; });
  setTimeout(() => { window.location.href = "hangman.html"; }, 850);
}

document.addEventListener("click", (e) => {
  if (e.target.closest("#doorWrapper")) triggerDoorTransition();
});

/* ===================== HIGHLIGHT WRONG ===================== */

function highlightWrong() {
  document.querySelectorAll(".captcha-tile").forEach(tile => {
    const idx      = parseInt(tile.dataset.index);
    const isHeart  = idx === heartIndex;
    const selected = selectedTiles.has(idx);

    /* Missed the heart */
    if (isHeart && !selected) tile.style.outline = "3px solid #b50008";
    /* Selected a decoy */
    if (!isHeart && selected) tile.style.outline = "3px solid #ff3a1a";
  });
}

/* ===================== LIVES ===================== */

function renderLives() {
  const container = document.getElementById("captchaLives");
  container.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const heart = document.createElement("div");
    heart.classList.add("captcha-heart");
    if (i >= lives) heart.classList.add("lost");
    heart.innerHTML = `
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 27.5S3 19.5 3 10.5C3 7 5.5 4 9 4c2.5 0 5 1.5 7 4 2-2.5 4.5-4 7-4 3.5 0 6 3 6 6.5C29 19.5 16 27.5 16 27.5Z"
          fill="${i < lives ? "#7a1a22" : "#ccc"}"
          stroke="${i < lives ? "#5a0d14" : "#aaa"}"
          stroke-width="1.5"/>
      </svg>`;
    container.appendChild(heart);
  }
}

/* ===================== FEEDBACK (failure only) ===================== */

function showFeedback(success, gameOver = false) {
  const overlay = document.getElementById("captchaFeedback");
  const box = document.createElement("div");
  box.classList.add("captcha-feedback-box");

  if (gameOver) {
    box.innerHTML = `
      <h2>Failed</h2>
      <p>You have proven yourself<br>to not be<br> a human.</p>
      <button class="captcha-verify" id="retryBtn">Try Again</button>
    `;
    overlay.appendChild(box);
    overlay.classList.add("show");
    setTimeout(() => {
      document.getElementById("retryBtn").addEventListener("click", () => {
        lives = 3;
        overlay.classList.remove("show");
        overlay.innerHTML = "";
        buildRound();
      });
    }, 50);
  }
}

/* ===================== UTILITY ===================== */

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}