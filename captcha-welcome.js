/* ===================== CAPTCHA WELCOME OVERLAY ===================== */
/* Shows tutorial dialogue on every arrival at captcha.html (testing) */

(function () {
  /* Always show — no sessionStorage check for testing */

  const SITE_PINKS = ['#ffb4ba','#ffcacf','#d4637a','#a8324a','#3d0d14','#fff8f8'];

  /* ── Inject styles ── */
  const style = document.createElement('style');
  style.textContent = `
    #cwOverlay {
      position: fixed; inset: 0; z-index: 9000;
      background: rgba(61,13,20,0.72);
      display: flex; align-items: flex-end; justify-content: flex-start;
      padding: 24px;
      opacity: 0; transition: opacity 0.55s ease;
      pointer-events: none;
    }
    #cwOverlay.cw-visible { opacity: 1; pointer-events: all; }

    #cwStage {
      display: flex; flex-direction: row; align-items: flex-end; gap: 0;
    }

    #cwMascot {
      flex-shrink: 0;
      margin-right: -12px;
      z-index: 2;
      pointer-events: none;
    }
    #cwMascotImg {
      width: 260px; height: 260px; display: block;
    }
    #cwMascotImg img {
      width: 100%; height: 100%; object-fit: contain;
      object-position: bottom center; display: block;
    }
    #cwMascotImg.cw-jump {
      animation: cwJump 0.65s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes cwJump {
      0%   { transform: translateY(0) rotate(0deg); }
      35%  { transform: translateY(-56px) rotate(-10deg); }
      65%  { transform: translateY(-28px) rotate(7deg); }
      100% { transform: translateY(0) rotate(0deg); }
    }

    #cwDialogue {
      position: relative; z-index: 9010; width: 380px;
      background: #fff8f8; border: 1px solid rgba(93,20,30,0.2);
      flex-shrink: 0; margin-bottom: 8px;
    }
    body.dark #cwDialogue { background: #0a0000; border-color: rgba(181,0,8,0.3); }

    #cwDlgBar {
      background: #3d0d14;
      padding: 7px 14px; display: flex; align-items: center;
      justify-content: space-between;
    }
    #cwDlgBarTitle {
      font-family: "fayte-pixel-hard", sans-serif; font-weight: 400;
      font-size: 20px; color: #fff8f8; letter-spacing: 2px;
    }
    .cw-bar-btns { display: flex; gap: 4px; }
    .cw-bar-btn {
      width: 14px; height: 14px; background: #fff8f8;
      border: 1px solid rgba(93,20,30,0.3); font-size: 8px;
      display: flex; align-items: center; justify-content: center; color: #3d0d14;
    }

    #cwDlgBody {
      padding: 18px 22px 10px;
      font-family: "Montserrat", sans-serif; font-size: 13px;
      line-height: 1.9; color: #3d0d14; letter-spacing: 0.3px; min-height: 90px;
    }
    body.dark #cwDlgBody { color: rgba(255,248,248,0.86); }

    #cwDlgEyebrow {
      font-family: "Switzer", sans-serif; font-size: 9px;
      letter-spacing: 3px; text-transform: uppercase;
      color: rgba(93,20,30,0.4); margin-bottom: 8px;
    }
    body.dark #cwDlgEyebrow { color: rgba(255,200,200,0.35); }

    #cwDlgText .cw-hl { color: #a8324a; font-weight: 600; }
    body.dark #cwDlgText .cw-hl { color: #ff8a8a; }

    .cw-dlg-rule {
      width: 30px; height: 1px; background: rgba(93,20,30,0.3); margin: 0 22px 12px;
    }
    body.dark .cw-dlg-rule { background: rgba(181,0,8,0.3); }

    #cwDlgFooter {
      padding: 8px 20px 16px; display: flex; align-items: center;
      justify-content: flex-end;
      border-top: 1px solid rgba(93,20,30,0.08);
    }
    body.dark #cwDlgFooter { border-top-color: rgba(181,0,8,0.15); }

    #cwHint {
      font-family: "Switzer", sans-serif; font-size: 8px;
      letter-spacing: 2px; text-transform: uppercase;
      color: rgba(93,20,30,0.3); margin-right: auto;
    }
    body.dark #cwHint { color: rgba(255,200,200,0.25); }

    .cw-confetti {
      position: fixed; width: 7px; height: 7px; border-radius: 50%;
      pointer-events: none; z-index: 9020; opacity: 0;
    }
    .cw-confetti.cw-pop { animation: cwPop 0.9s ease-out forwards; }
    @keyframes cwPop {
      0%   { opacity: 1; transform: translate(0,0) scale(1); }
      100% { opacity: 0; transform: var(--cw-tx) scale(0.2); }
    }
  `;
  document.head.appendChild(style);

  /* ── Build HTML ── */
  const overlay = document.createElement('div');
  overlay.id = 'cwOverlay';
  overlay.innerHTML = `
    <div id="cwStage">
      <div id="cwMascot">
        <div id="cwMascotImg">
          <img src="pngs/mascot_sad.png" alt="Guide">
        </div>
      </div>
      <div id="cwDialogue">
        <div id="cwDlgBar">
          <span id="cwDlgBarTitle">Guide</span>
          <div class="cw-bar-btns">
            <div class="cw-bar-btn">&#8212;</div>
            <div class="cw-bar-btn">&#9633;</div>
            <div class="cw-bar-btn">&#x2715;</div>
          </div>
        </div>
        <div id="cwDlgBody">
          <div id="cwDlgEyebrow">Entry &middot; 005</div>
          <div id="cwDlgText">
            oh, you made it through\u2026 <span class="cw-hl">well done.</span> Honestly, I wasn&rsquo;t sure you would. This place is a bit strange but keep looking. There are still things to find.
          </div>
        </div>
        <div class="cw-dlg-rule"></div>
        <div id="cwDlgFooter">
          <span id="cwHint">Click anywhere to continue</span>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const mascotImg = document.getElementById('cwMascotImg');

  /* ── Spawn confetti ── */
  function spawnConfetti() {
    const mR = mascotImg.getBoundingClientRect();
    const cx = mR.left + mR.width / 2, cy = mR.top + mR.height / 2;
    for (let i = 0; i < 28; i++) {
      const dot = document.createElement('div');
      dot.className = 'cw-confetti';
      dot.style.background = SITE_PINKS[i % SITE_PINKS.length];
      dot.style.left = cx + 'px'; dot.style.top = cy + 'px';
      const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 110;
      dot.style.setProperty('--cw-tx', `translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px)`);
      document.body.appendChild(dot);
      setTimeout(() => dot.classList.add('cw-pop'), i * 24);
      setTimeout(() => dot.remove(), 1000 + i * 24);
    }
  }

  /* ── Show ── */
  function show() {
    overlay.classList.add('cw-visible');
    mascotImg.classList.remove('cw-jump');
    void mascotImg.offsetWidth;
    mascotImg.classList.add('cw-jump');
    spawnConfetti();

    setTimeout(() => {
      document.addEventListener('click', dismiss, { once: true, capture: true });
    }, 700);
  }

  /* ── Dismiss ── */
  function dismiss() {
    overlay.style.transition = 'opacity 0.45s ease';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 500);
  }

  if (document.readyState === 'complete') {
    setTimeout(show, 600);
  } else {
    window.addEventListener('load', () => setTimeout(show, 600));
  }
})();