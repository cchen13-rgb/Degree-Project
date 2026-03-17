/* ===================== CAPTCHA — STANDALONE ===================== */
/* Do NOT load function.js on captcha.html — this file handles everything */

const TOTAL_TILES    = 12;
const IMAGE_COUNT    = 12;
const REAL_PER_ROUND = 9;

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

/* ===================== BOOT ===================== */

document.addEventListener("DOMContentLoaded", () => {

  const toggle = document.getElementById("modeToggle");
  if (toggle) {
    toggle.addEventListener("change", () => {
      document.body.classList.toggle("dark");

      // If the door is currently showing, update the arch color live
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

  const allIndices = shuffle([...Array(TOTAL_TILES).keys()]);
  const realSlots  = new Set(allIndices.slice(0, REAL_PER_ROUND));

  const imagePool = shuffle([...Array(IMAGE_COUNT).keys()].map(i => i + 1));
  let imageIdx = 0;

  for (let i = 0; i < TOTAL_TILES; i++) {
    const isReal = realSlots.has(i);
    tileData.push({ index: i, isReal });

    const tile = document.createElement("div");
    tile.classList.add("captcha-tile");
    tile.dataset.index = i;

    if (isReal) {
      const img = document.createElement("img");
      img.src = `Captcha/Captcha${imagePool[imageIdx++]}.png`;
      img.alt = "";
      img.draggable = false;
      tile.appendChild(img);
    } else {
      const canvas = document.createElement("canvas");
      canvas.width  = 200;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      const col = DECOY_COLOURS[Math.floor(Math.random() * DECOY_COLOURS.length)];
      ctx.fillStyle = col;
      ctx.fillRect(0, 0, 200, 200);
      for (let n = 0; n < 800; n++) {
        const x = Math.random() * 200;
        const y = Math.random() * 200;
        ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.08)";
        ctx.fillRect(x, y, 2, 2);
      }
      const img = document.createElement("img");
      img.src = canvas.toDataURL();
      img.alt = "";
      img.draggable = false;
      tile.appendChild(img);
    }

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

  const realIndices  = tileData.filter(t =>  t.isReal).map(t => t.index);
  const decoyIndices = tileData.filter(t => !t.isReal).map(t => t.index);

  const allRealSelected = realIndices.every(i => selectedTiles.has(i));
  const noDecoySelected = decoyIndices.every(i => !selectedTiles.has(i));
  const correct = allRealSelected && noDecoySelected;

  if (correct) {
    card.classList.add("success");
    card.addEventListener("animationend", () => card.classList.remove("success"), { once: true });
    // Trigger the door morph instead of old feedback
    setTimeout(() => morphToDoor(), 400);
  } else {
    lives--;
    renderLives();
    card.classList.add("shake");
    card.addEventListener("animationend", () => card.classList.remove("shake"), { once: true });

    if (lives <= 0) {
      showFeedback(false, true);
    } else {
      highlightWrong(realIndices, decoyIndices);
      setTimeout(() => buildRound(), 1200);
    }
  }
}

/* ===================== DOOR MORPH ===================== */

function morphToDoor() {
  const card   = document.querySelector(".captcha-card");
  const grid   = document.getElementById("captchaGrid");
  const footer = document.querySelector(".captcha-footer");
  const header = document.querySelector(".captcha-header");

  // Keep header & footer — only morph the grid tiles

  const tiles = Array.from(grid.querySelectorAll(".captcha-tile"));

  // Measure grid before any changes
  const gridRect = grid.getBoundingClientRect();
  const gridW = gridRect.width;
  const gridH = gridRect.height;

  // Fade each tile out
  tiles.forEach((tile, i) => {
    tile.style.transition = `opacity 0.35s ease ${i * 30}ms, transform 0.35s ease ${i * 30}ms`;
    tile.style.opacity    = "0";
    tile.style.transform  = "scale(0.85)";
  });

  // After tiles disappear, show door inside the grid
  setTimeout(() => {
    grid.style.display     = "block";
    grid.style.gap         = "0";
    grid.style.padding     = "0";
    grid.style.background  = "transparent";
    grid.style.width       = gridW + "px";
    grid.style.height      = gridH + "px";
    grid.style.overflow    = "hidden";
    grid.innerHTML = buildDoorHTML(gridW, gridH);
  }, tiles.length * 30 + 380);
}

function buildDoorHTML(w, h) {
  // Door proportions matching the reference image
  const doorW   = w * 0.42;
  const doorH   = h * 0.88;
  const archR   = doorW / 2;
  const doorX   = (w - doorW) / 2;
  const doorY   = h - doorH;
  const isDark  = document.body.classList.contains("dark");
  const archCol = isDark ? "#e8e0e0" : "#050000";
  const bgRect  = '';

  // Pixel/retro font from Google Fonts loaded inline
  const svgContent = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <style>

        .door-void-reveal {
          opacity: 0;
          animation: voidReveal 0.9s ease 0.2s forwards;
        }
        @keyframes voidReveal {
          to { opacity: 1; }
        }
        .enter-click {
          cursor: pointer;
        }
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

    <!-- Door void -->
    <path class="door-void-reveal door-arch" d="
      M ${doorX} ${h}
      L ${doorX} ${doorY + archR}
      A ${archR} ${archR} 0 0 1 ${doorX + doorW} ${doorY + archR}
      L ${doorX + doorW} ${h}
      Z
    " fill="${archCol}"/>

    <!-- Clickable enter zone -->
    <g class="enter-click" id="doorEnterZone">
      <!-- Invisible hit area over the arch -->
      <path d="
        M ${doorX} ${h}
        L ${doorX} ${doorY + archR}
        A ${archR} ${archR} 0 0 1 ${doorX + doorW} ${doorY + archR}
        L ${doorX + doorW} ${h}
        Z
      " fill="transparent"/>

    </g>
  </svg>`;

  // Wrap in a div that handles the click + page transition
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `
    width:100%; height:100%; position:relative; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
  `;
  wrapper.innerHTML = svgContent;

  // Attach click listener for page transition
  wrapper.addEventListener("click", () => {
    triggerDoorTransition();
  });

  // Return as DOM element — but since we set innerHTML we return html string
  // Actually we need to return html string for grid.innerHTML usage
  const outerDiv = `<div id="doorWrapper" style="width:100%;height:100%;position:relative;cursor:pointer;">${svgContent}</div>`;
  return outerDiv;
}

/* ===================== PAGE TRANSITION ===================== */

function triggerDoorTransition() {
  // Re-attach click to the wrapper (since it was set via innerHTML)
  // This is called from the actual click so just run transition

  // Create full-screen black overlay that expands from center
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: #000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.8s ease;
  `;
  document.body.appendChild(overlay);

  // Fade to black
  requestAnimationFrame(() => {
    overlay.style.opacity = "1";
  });

  // Navigate after fade
  setTimeout(() => {
    window.location.href = "hangman.html";
  }, 850);
}

// Delegate click on dynamically inserted doorWrapper
document.addEventListener("click", (e) => {
  const wrapper = e.target.closest("#doorWrapper");
  if (wrapper) {
    triggerDoorTransition();
  }
});

/* ===================== HIGHLIGHT WRONG ===================== */

function highlightWrong(realIndices, decoyIndices) {
  document.querySelectorAll(".captcha-tile").forEach(tile => {
    const idx      = parseInt(tile.dataset.index);
    const isReal   = realIndices.includes(idx);
    const selected = selectedTiles.has(idx);
    if (isReal && !selected)   tile.style.outline = "3px solid #b50008";
    else if (!isReal && selected) tile.style.outline = "3px solid #ff3a1a";
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
          fill="${i < lives ? '#7a1a22' : '#ccc'}"
          stroke="${i < lives ? '#5a0d14' : '#aaa'}"
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

