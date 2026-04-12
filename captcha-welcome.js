/* ===================== CAPTCHA WELCOME OVERLAY ===================== */
/* Shows tutorial dialogue on every arrival at captcha.html (testing) */

(function () {
  const SITE_PINKS = ['#ffb4ba','#ffcacf','#d4637a','#a8324a','#3d0d14','#fff8f8'];

  const style = document.createElement('style');
  style.textContent = `
    #cwOverlay {
      position: fixed; inset: 0; z-index: 9000;
      background: rgba(61,13,20,0.72);
      display: flex; align-items: flex-end; justify-content: flex-start;
      padding: 24px;
      opacity: 0; transition: opacity 0.55s ease;
      pointer-events: none;
      box-sizing: border-box;
    }
    #cwOverlay.cw-visible { opacity: 1; pointer-events: all; }

    #cwStage {
      display: flex;
      flex-direction: row;
      align-items: flex-end;
      gap: 0;
      width: calc(100vw - 48px);
      max-width: 680px;
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
    #cwMascotImg.cw-jump img {
      animation: cwJump 0.65s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes cwJump {
      0%   { transform: translateY(0) rotate(0deg); }
      35%  { transform: translateY(-56px) rotate(-10deg); }
      65%  { transform: translateY(-28px) rotate(7deg); }
      100% { transform: translateY(0) rotate(0deg); }
    }

    #cwDialogue {
      position: relative; z-index: 9010;
      width: 380px;
      min-width: 0;
      flex: 1 1 auto;
      background: #fff8f8; border: 1px solid rgba(93,20,30,0.2);
      flex-shrink: 1;
      margin-bottom: 8px;
      box-sizing: border-box;
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

    @media (max-height: 950px) {
      #cwMascotImg { width: 160px; height: 160px; }
      #cwDialogue  { width: 300px; }
      #cwDlgBody   { padding: 10px 14px 8px; min-height: 60px; font-size: 12px; }
    }
    @media (max-height: 800px) {
      #cwMascotImg { width: 120px; height: 120px; }
      #cwDialogue  { width: 280px; }
      #cwDlgBody   { padding: 8px 14px 6px; min-height: 50px; font-size: 12px; }
    }
    @media (max-height: 650px) {
      #cwMascotImg { width: 90px; height: 90px; }
      #cwDialogue  { width: 250px; }
      #cwDlgBody   { padding: 6px 12px 4px; min-height: 40px; font-size: 11px; }
      #cwDlgBar    { padding: 5px 10px; }
      #cwDlgBarTitle { font-size: 16px; }
    }

    @media (max-width: 600px) {
      #cwOverlay {
        align-items: flex-end;
        justify-content: center;
        padding: 0;
      }
      #cwStage {
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
        max-width: 100%;
        position: relative;
      }
      #cwMascot {
        position: absolute;
        bottom: 100%;
        left: 12px;
        margin: 0;
        z-index: 1;
        pointer-events: none;
      }
      #cwMascotImg {
        width: 220px;
        height: 220px;
        transform: translateY(60px);
        transition: none;
      }
      #cwDialogue {
        position: relative;
        z-index: 2;
        width: 100%;
        max-width: 100%;
        margin-bottom: 0;
        border-left: none;
        border-right: none;
        border-bottom: none;
      }
      #cwDlgBody  { padding: 12px 16px 8px; font-size: 12px; min-height: 60px; }
      #cwDlgBar   { padding: 8px 14px; }
      #cwDlgBarTitle { font-size: 18px; }
    }
  `;
  document.head.appendChild(style);

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

  function show() {
    overlay.classList.add('cw-visible');
    spawnConfetti();
    setTimeout(() => {
      document.addEventListener('click', dismiss, { once: true, capture: true });
    }, 700);
  }

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