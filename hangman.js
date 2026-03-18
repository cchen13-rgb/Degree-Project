/* ===================== HANGMAN ===================== */

const ANSWER      = "nest egg heart";
const MAX_WRONG   = 9;

const CRANE_IMGS = [
  "Hangman/Crane Default.png",
  "Hangman/hangman1.png",
  "Hangman/hangman2.png",
  "Hangman/hangman3.png",
  "Hangman/hangman4.png",
  "Hangman/hangman5.png",
  "Hangman/hangman6.png",
  "Hangman/hangman7.png",
  "Hangman/hangman8.png",
  "Hangman/hangman9.png",
];

const NAG_CORRECT = [
  "oh. you got one.",
  "lucky.",
  "making progress..",
  "i am impressed.",
  "this one works.",
  "hm. not bad.",
  "getting closer..",
  "sure. you got it.",
];

const NAG_WRONG = [
  "i don't think Crane meat taste good...",
  "there was an attempt",
  "are you even trying?",
  "put your heart into it.",
  "unlucky...",
  "think! think harder!.",
  "nope. absolutely no",
  "why can't you understand?",
  "you are not good enough",
];

const HINTS = [
  { threshold: 0, text: "lovingly woven, sturdier than a web" },
  { threshold: 3, text: "if you don't crack the shell, you'll die without being born" },
  { threshold: 6, text: "it beats and bleeds" },
];

const NAG_IDLE = [
  "guess a letter.",
  "i'm waiting.",
  "still here. unfortunately.",
  "tick tock.",
  "i will be here forever.",
];

const KEYBOARD_ROWS = [
  ["q","w","e","r","t","y","u","i","o","p"],
  ["a","s","d","f","g","h","j","k","l"],
  ["z","x","c","v","b","n","m"],
];

let wrongCount = 0;
let guessed    = new Set();
let gameOver   = false;

/* ===================== INIT ===================== */

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("modeToggle");
  if (toggle) {
    toggle.addEventListener("change", () => {
      document.body.classList.toggle("dark");
    });
  }

  const particleContainer = document.getElementById("particles");
  if (particleContainer) {
    function createParticle() {
      const p = document.createElement("div");
      p.classList.add("particle");
      p.style.left = Math.random() * 100 + "vw";
      p.style.animationDuration = (3 + Math.random() * 5) + "s";
      p.style.opacity = Math.random();
      particleContainer.appendChild(p);
      setTimeout(() => p.remove(), 8000);
    }
    setInterval(createParticle, 300);
  }

  window.addEventListener("load", () => document.body.classList.add("loaded"));
  if (document.readyState === "complete") document.body.classList.add("loaded");

  buildKeyboard();
  renderWord();
  renderCrane();
  updateHint();

  document.addEventListener("keydown", (e) => {
    const letter = e.key.toLowerCase();
    if (/^[a-z]$/.test(letter) && !gameOver) {
      handleGuess(letter);
    }
  });
});

/* ===================== KEYBOARD ===================== */

function buildKeyboard() {
  const kb = document.getElementById("keyboard");
  kb.innerHTML = "";

  KEYBOARD_ROWS.forEach(row => {
    const rowEl = document.createElement("div");
    rowEl.classList.add("hm-kb-row");

    row.forEach(letter => {
      const key = document.createElement("button");
      key.classList.add("hm-key");
      key.textContent = letter;
      key.id = "key-" + letter;
      key.addEventListener("click", () => handleGuess(letter));
      rowEl.appendChild(key);
    });

    kb.appendChild(rowEl);
  });
}

/* ===================== WORD DISPLAY ===================== */

function renderWord() {
  const display = document.getElementById("wordDisplay");
  display.innerHTML = "";

  const words = ANSWER.split(" ");

  words.forEach((word, wi) => {
    word.split("").forEach(char => {
      const slot = document.createElement("span");
      slot.classList.add("hm-letter");

      const charEl = document.createElement("span");
      charEl.classList.add("hm-letter-char");
      charEl.dataset.letter = char;

      if (guessed.has(char)) {
        charEl.textContent = char.toUpperCase();
        charEl.classList.add("revealed");
      } else {
        charEl.textContent = "";
      }

      const line = document.createElement("span");
      line.classList.add("hm-letter-line");

      slot.appendChild(charEl);
      slot.appendChild(line);
      display.appendChild(slot);
    });

    if (wi < words.length - 1) {
      const space = document.createElement("span");
      space.classList.add("hm-word-space");
      display.appendChild(space);
    }
  });
}

/* ===================== WRONG LETTERS ===================== */

function renderWrongLetters() {
  const container = document.getElementById("wrongLetters");
  const label     = document.getElementById("wrongLabel");
  const wrongs    = [...guessed].filter(l => !ANSWER.includes(l));

  container.innerHTML = "";
  label.textContent   = wrongs.length > 0 ? "incorrect:" : "";

  wrongs.forEach(l => {
    const span = document.createElement("span");
    span.classList.add("hm-wrong-letter");
    span.textContent = l;
    container.appendChild(span);
  });
}

/* ===================== HINT ===================== */

function updateHint() {
  const el = document.getElementById("hintText");
  let current = HINTS[0];
  for (const hint of HINTS) {
    if (wrongCount >= hint.threshold) current = hint;
  }

  if (el.textContent !== current.text) {
    el.style.opacity = "0";
    setTimeout(() => {
      el.textContent = current.text;
      el.style.opacity = "1";
    }, 300);
  }
}

/* ===================== CRANE ===================== */

function renderCrane() {
  const img = document.getElementById("craneImg");
  const idx = Math.min(wrongCount, CRANE_IMGS.length - 1);
  img.style.opacity = "0";
  setTimeout(() => {
    img.src = CRANE_IMGS[idx];
    img.style.opacity = "1";
  }, 150);
}

/* ===================== HANDLE GUESS ===================== */

function handleGuess(letter) {
  if (gameOver || guessed.has(letter)) return;

  guessed.add(letter);

  const key = document.getElementById("key-" + letter);

  if (ANSWER.includes(letter)) {
    if (key) key.classList.add("used-correct");
    setNag(NAG_CORRECT);

    document.querySelectorAll(".hm-letter-char").forEach(el => {
      if (el.dataset.letter === letter) {
        el.textContent = letter.toUpperCase();
        el.classList.add("revealed");
        el.addEventListener("animationend", () => el.classList.remove("revealed"), { once: true });
      }
    });

    if (isWordComplete()) {
      setTimeout(() => showOverlay(true), 500);
    }

  } else {
    wrongCount++;
    if (key) key.classList.add("used-wrong");
    setNag(NAG_WRONG);

    // Jump + red flash on crane
    const craneImg = document.getElementById("craneImg");
    craneImg.classList.remove("hurt");
    void craneImg.offsetWidth; // force reflow
    craneImg.classList.add("hurt");
    craneImg.addEventListener("animationend", () => craneImg.classList.remove("hurt"), { once: true });

    renderCrane();
    renderWrongLetters();
    updateHint();

    if (wrongCount >= MAX_WRONG) {
      setTimeout(() => showOverlay(false), 600);
    }
  }
}

/* ===================== WIN CHECK ===================== */

function isWordComplete() {
  return ANSWER.split("").every(c => c === " " || guessed.has(c));
}

/* ===================== NAG ===================== */

function setNag(pool) {
  const el = document.getElementById("nagMsg");
  el.style.opacity = "0";
  setTimeout(() => {
    el.textContent = pool[Math.floor(Math.random() * pool.length)];
    el.style.opacity = "1";
  }, 150);
}

/* ===================== OVERLAY ===================== */

function showOverlay(win) {
  gameOver = true;

  if (win) {
    morphCraneToDoor();
    return;
  }

  const window_ = document.querySelector(".hm-window");

  const overlay = document.createElement("div");
  overlay.classList.add("hm-overlay");

  const title = document.createElement("div");
  title.classList.add("hm-overlay-title");
  title.textContent = "Failed.";

  const msg = document.createElement("div");
  msg.classList.add("hm-overlay-msg");
  msg.innerHTML = `The Crane has died from a heavy heart.`;

  const btn = document.createElement("button");
  btn.classList.add("hm-overlay-btn");
  btn.textContent = "try again";
  btn.addEventListener("click", () => resetGame(overlay));

  overlay.appendChild(title);
  overlay.appendChild(msg);
  overlay.appendChild(btn);
  window_.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add("show"));
}

/* ===================== CRANE → DOOR MORPH ===================== */

function morphCraneToDoor() {
  const craneFrame = document.querySelector(".hm-crane-frame");
  const craneImg   = document.getElementById("craneImg");

  const rect = craneFrame.getBoundingClientRect();
  const w    = rect.width;
  const h    = rect.height;

  craneImg.style.transition = "opacity 0.4s ease";
  craneImg.style.opacity    = "0";

  setTimeout(() => {
    const isDark  = document.body.classList.contains("dark");
    const archCol = isDark ? "#e8e0e0" : "#050000";

    const doorW = w * 0.55;
    const archR = doorW / 2;
    const doorX = (w - doorW) / 2;
    const doorY = h * 0.08;
    const doorH = h - doorY;

    const svg = `
    <svg id="craneDoorSvg" xmlns="http://www.w3.org/2000/svg"
         width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"
         style="cursor:pointer;display:block;">
      <defs>
        <style>
          .crane-arch {
            opacity: 0;
            animation: archReveal 0.8s ease 0.1s forwards;
          }
          @keyframes archReveal {
            to { opacity: 1; }
          }
        </style>
      </defs>
      <path class="crane-arch" id="craneArch" d="
        M ${doorX} ${h}
        L ${doorX} ${doorY + archR}
        A ${archR} ${archR} 0 0 1 ${doorX + doorW} ${doorY + archR}
        L ${doorX + doorW} ${h}
        Z
      " fill="${archCol}"/>
    </svg>`;

    craneFrame.innerHTML = svg;

    const modeToggle = document.getElementById("modeToggle");
    if (modeToggle) {
      modeToggle._doorListener = () => {
        const arch = document.getElementById("craneArch");
        if (arch) {
          const dark = document.body.classList.contains("dark");
          arch.setAttribute("fill", dark ? "#e8e0e0" : "#050000");
        }
      };
      modeToggle.addEventListener("change", modeToggle._doorListener);
    }

    document.getElementById("craneDoorSvg").addEventListener("click", () => {
      triggerDoorTransition();
    });

  }, 450);
}

/* ===================== PAGE TRANSITION ===================== */

function triggerDoorTransition() {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position:fixed; inset:0; z-index:9999;
    background:#000; opacity:0; pointer-events:none;
    transition:opacity 0.8s ease;
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.opacity = "1"; });
  setTimeout(() => { window.location.href = "index.html"; }, 850);
}

/* ===================== RESET ===================== */

function resetGame(overlay) {
  wrongCount = 0;
  guessed.clear();
  gameOver   = false;

  overlay.classList.remove("show");
  setTimeout(() => overlay.remove(), 400);

  renderCrane();
  renderWord();
  renderWrongLetters();
  buildKeyboard();
  updateHint();
  setNag(NAG_IDLE);
}