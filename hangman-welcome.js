/* ===================== HANGMAN WELCOME OVERLAY ===================== */
/* Shows a one-time tutorial dialogue when arriving at hangman.html   */

(function () {
  const SITE_PINKS = ['#ffb4ba','#ffcacf','#d4637a','#a8324a','#3d0d14','#fff8f8'];

  const style = document.createElement('style');
  style.textContent = `
    #hwOverlay {
      position: fixed; inset: 0; z-index: 9000;
      background: rgba(61,13,20,0.72);
      display: flex; align-items: flex-end; justify-content: flex-start;
      padding: 24px;
      opacity: 0; transition: opacity 0.55s ease;
      pointer-events: none;
      box-sizing: border-box;
    }
    #hwOverlay.hw-visible { opacity: 1; pointer-events: all; }

    #hwStage {
      display: flex;
      flex-direction: row;
      align-items: flex-end;
      gap: 0;
      width: calc(100vw - 48px);
      max-width: 680px;
    }

    #hwMascot {
      flex-shrink: 0;
      margin-right: -12px;
      z-index: 2;
      pointer-events: none;
    }
    #hwMascotImg {
      width: 260px; height: 260px; display: block;
    }
    #hwMascotImg img {
      width: 100%; height: 100%; object-fit: contain;
      object-position: bottom center; display: block;
    }
    #hwMascotImg.hw-jump img {
      animation: hwJump 0.65s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes hwJump {
      0%   { transform: translateY(0) rotate(0deg); }
      35%  { transform: translateY(-56px) rotate(-10deg); }
      65%  { transform: translateY(-28px) rotate(7deg); }
      100% { transform: translateY(0) rotate(0deg); }
    }

    #hwDialogue {
      position: relative; z-index: 9010;
      width: 380px;
      min-width: 0;
      flex: 1 1 auto;
      background: #fff8f8; border: 1px solid rgba(93,20,30,0.2);
      flex-shrink: 1;
      margin-bottom: 8px;
      box-sizing: border-box;
    }
    body.dark #hwDialogue { background: #0a0000; border-color: rgba(181,0,8,0.3); }

    #hwDlgBar {
      background: #3d0d14;
      padding: 7px 14px; display: flex; align-items: center;
      justify-content: space-between;
    }
    #hwDlgBarTitle {
      font-family: "fayte-pixel-hard", sans-serif; font-weight: 400;
      font-size: 20px; color: #fff8f8; letter-spacing: 2px;
    }
    .hw-bar-btns { display: flex; gap: 4px; }
    .hw-bar-btn {
      width: 14px; height: 14px; background: #fff8f8;
      border: 1px solid rgba(93,20,30,0.3); font-size: 8px;
      display: flex; align-items: center; justify-content: center; color: #3d0d14;
    }

    #hwDlgBody {
      padding: 18px 22px 10px;
      font-family: "Montserrat", sans-serif; font-size: 13px;
      line-height: 1.9; color: #3d0d14; letter-spacing: 0.3px; min-height: 90px;
    }
    body.dark #hwDlgBody { color: rgba(255,248,248,0.86); }

    #hwDlgEyebrow {
      font-family: "Switzer", sans-serif; font-size: 9px;
      letter-spacing: 3px; text-transform: uppercase;
      color: rgba(93,20,30,0.4); margin-bottom: 8px;
    }
    body.dark #hwDlgEyebrow { color: rgba(255,200,200,0.35); }

    #hwDlgText .hw-hl { color: #a8324a; font-weight: 600; }
    body.dark #hwDlgText .hw-hl { color: #ff8a8a; }

    .hw-dlg-rule {
      width: 30px; height: 1px; background: rgba(93,20,30,0.3); margin: 0 22px 12px;
    }
    body.dark .hw-dlg-rule { background: rgba(181,0,8,0.3); }

    #hwDlgFooter {
      padding: 8px 20px 16px; display: flex; align-items: center;
      justify-content: flex-end;
      border-top: 1px solid rgba(93,20,30,0.08);
    }
    body.dark #hwDlgFooter { border-top-color: rgba(181,0,8,0.15); }

    #hwHint {
      font-family: "Switzer", sans-serif; font-size: 8px;
      letter-spacing: 2px; text-transform: uppercase;
      color: rgba(93,20,30,0.3); margin-right: auto;
    }
    body.dark #hwHint { color: rgba(255,200,200,0.25); }

    .hw-confetti {
      position: fixed; width: 7px; height: 7px; border-radius: 50%;
      pointer-events: none; z-index: 9020; opacity: 0;
    }
    .hw-confetti.hw-pop { animation: hwPop 0.9s ease-out forwards; }
    @keyframes hwPop {
      0%   { opacity: 1; transform: translate(0,0) scale(1); }
      100% { opacity: 0; transform: var(--hw-tx) scale(0.2); }
    }

    @media (max-height: 950px) {
      #hwMascotImg { width: 160px; height: 160px; }
      #hwDialogue  { width: 300px; }
      #hwDlgBody   { padding: 10px 14px 8px; min-height: 60px; font-size: 12px; }
    }
    @media (max-height: 800px) {
      #hwMascotImg { width: 120px; height: 120px; }
      #hwDialogue  { width: 280px; }
      #hwDlgBody   { padding: 8px 14px 6px; min-height: 50px; font-size: 12px; }
    }
    @media (max-height: 650px) {
      #hwMascotImg { width: 90px; height: 90px; }
      #hwDialogue  { width: 250px; }
      #hwDlgBody   { padding: 6px 12px 4px; min-height: 40px; font-size: 11px; }
      #hwDlgBar    { padding: 5px 10px; }
      #hwDlgBarTitle { font-size: 16px; }
    }

    @media (max-width: 600px) {
      #hwOverlay {
        align-items: flex-end;
        justify-content: center;
        padding: 0;
      }
      #hwStage {
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
        max-width: 100%;
        position: relative;
      }
      #hwMascot {
        position: absolute;
        bottom: 100%;
        left: 12px;
        margin: 0;
        z-index: 1;
        pointer-events: none;
      }
      #hwMascotImg {
        width: 220px;
        height: 220px;
        transform: translateY(60px);
        transition: none;
      }
      #hwDialogue {
        position: relative;
        z-index: 2;
        width: 100%;
        max-width: 100%;
        margin-bottom: 0;
        border-left: none;
        border-right: none;
        border-bottom: none;
      }
      #hwDlgBody  { padding: 12px 16px 8px; font-size: 12px; min-height: 60px; }
      #hwDlgBar   { padding: 8px 14px; }
      #hwDlgBarTitle { font-size: 18px; }
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'hwOverlay';
  overlay.innerHTML = `
    <div id="hwStage">
      <div id="hwMascot">
        <div id="hwMascotImg">
          <img src="pngs/mascot_angry.png" alt="Guide">
        </div>
      </div>
      <div id="hwDialogue">
        <div id="hwDlgBar">
          <span id="hwDlgBarTitle">Guide</span>
          <div class="hw-bar-btns">
            <div class="hw-bar-btn">&#8212;</div>
            <div class="hw-bar-btn">&#9633;</div>
            <div class="hw-bar-btn">&#x2715;</div>
          </div>
        </div>
        <div id="hwDlgBody">
          <div id="hwDlgEyebrow">Entry &middot; 006</div>
          <div id="hwDlgText">
            you&rsquo;re still here\u2026 <span class="hw-hl">good.</span> I was a little worried. This next part is on your own. I won&rsquo;t always be around to help. But I think you can manage from here.
          </div>
        </div>
        <div class="hw-dlg-rule"></div>
        <div id="hwDlgFooter">
          <span id="hwHint">Click anywhere to continue</span>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const mascotImg = document.getElementById('hwMascotImg');

  function spawnConfetti() {
    const mR = mascotImg.getBoundingClientRect();
    const cx = mR.left + mR.width / 2, cy = mR.top + mR.height / 2;
    for (let i = 0; i < 28; i++) {
      const dot = document.createElement('div');
      dot.className = 'hw-confetti';
      dot.style.background = SITE_PINKS[i % SITE_PINKS.length];
      dot.style.left = cx + 'px'; dot.style.top = cy + 'px';
      const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 110;
      dot.style.setProperty('--hw-tx', `translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px)`);
      document.body.appendChild(dot);
      setTimeout(() => dot.classList.add('hw-pop'), i * 24);
      setTimeout(() => dot.remove(), 1000 + i * 24);
    }
  }

  function show() {
    overlay.classList.add('hw-visible');
    mascotImg.classList.remove('hw-jump');
    void mascotImg.offsetWidth;
    mascotImg.classList.add('hw-jump');
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