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
      font-family: "Courier New", Courier, monospace;
    }
    #cwOverlay.cw-visible { opacity: 1; pointer-events: all; }

    #cwStage {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 0;
      width: calc(100vw - 48px);
      max-width: 420px;
    }

    #cwDialogue {
      position: relative; z-index: 9010;
      width: 100%;
      background: #fff8f8;
      border: 2px solid #3d0d14;
      box-sizing: border-box;
    }
    body.dark #cwDialogue { background: #0a0000; border-color: #b50008; }

    #cwDlgBar {
      background: #3d0d14;
      padding: 6px 10px; display: flex; align-items: center;
      justify-content: space-between;
    }
    body.dark #cwDlgBar { background: #b50008; }

    #cwDlgBarTitle {
      font-family: "Courier New", Courier, monospace;
      font-weight: 700; font-size: 12px;
      color: #fff8f8; letter-spacing: 1px; text-transform: uppercase;
    }
    .cw-bar-btns { display: flex; gap: 3px; }
    .cw-bar-btn {
      width: 12px; height: 12px; background: #fff8f8;
      border: 1px solid rgba(255,248,248,0.4); font-size: 7px;
      display: flex; align-items: center; justify-content: center; color: #3d0d14;
    }

    /* Inner row: kaomoji left, text right */
    #cwDlgInner {
      display: flex;
      flex-direction: row;
      align-items: center;
      border-bottom: 1px solid rgba(93,20,30,0.12);
    }
    body.dark #cwDlgInner { border-bottom-color: rgba(181,0,8,0.2); }

    #cwDlgFace {
      flex-shrink: 0;
      width: 110px;
      padding: 18px 12px;
      font-family: "Courier New", Courier, monospace;
      font-size: 22px;
      line-height: 1.3;
      letter-spacing: -1px;
      color: #3d0d14;
      user-select: none;
      display: flex;
      align-items: center;
      justify-content: center;
      border-right: 1px solid rgba(93,20,30,0.12);
      box-sizing: border-box;
      word-break: break-all;
    }
    body.dark #cwDlgFace { color: #fff8f8; border-right-color: rgba(181,0,8,0.2); }

    #cwDlgBody {
      flex: 1;
      padding: 14px 16px 12px;
      font-family: "Montserrat", sans-serif; font-size: 12px;
      line-height: 1.85; color: #3d0d14; letter-spacing: 0.2px;
      box-sizing: border-box;
    }
    body.dark #cwDlgBody { color: rgba(255,248,248,0.86); }

    #cwDlgEyebrow {
      font-family: "Courier New", Courier, monospace; font-size: 9px;
      letter-spacing: 2px; text-transform: uppercase;
      color: rgba(93,20,30,0.45); margin-bottom: 6px;
    }
    body.dark #cwDlgEyebrow { color: rgba(255,200,200,0.35); }

    #cwDlgText .cw-hl { color: #a8324a; font-weight: 700; }
    body.dark #cwDlgText .cw-hl { color: #ff8a8a; }

    #cwDlgFooter {
      padding: 8px 16px 10px; display: flex; align-items: center;
      justify-content: flex-start;
      border-top: 1px solid rgba(93,20,30,0.12);
    }
    body.dark #cwDlgFooter { border-top-color: rgba(181,0,8,0.2); }

    #cwHint {
      font-family: "Courier New", Courier, monospace; font-size: 8px;
      letter-spacing: 2px; text-transform: uppercase;
      color: rgba(93,20,30,0.35);
    }
    body.dark #cwHint { color: rgba(255,200,200,0.25); }

    .cw-confetti {
      position: fixed; width: 7px; height: 7px; border-radius: 50%;
      pointer-events: none; z-index: 9020;
      transition: transform 0.8s ease, opacity 0.8s ease;
    }

    @media (max-height: 950px) {
      #cwDlgFace { font-size: 18px; width: 90px; padding: 14px 10px; }
      #cwStage   { max-width: 360px; }
      #cwDlgBody { padding: 10px 14px; font-size: 11px; }
    }
    @media (max-height: 800px) {
      #cwDlgFace { font-size: 16px; width: 80px; }
      #cwStage   { max-width: 320px; }
      #cwDlgBody { padding: 8px 12px; font-size: 11px; }
    }
    @media (max-height: 650px) {
      #cwDlgFace  { display: none; }
      #cwDlgBar   { padding: 5px 10px; }
      #cwDlgBarTitle { font-size: 11px; }
      #cwDlgBody  { padding: 8px 14px; font-size: 11px; }
    }
    @media (max-width: 600px) {
      #cwOverlay  { align-items: flex-end; justify-content: center; padding: 0; }
      #cwStage    { width: 100%; max-width: 100%; }
      #cwDialogue {
        width: 100%; max-width: 100%; margin-bottom: 0;
        border-left: none; border-right: none; border-bottom: none;
      }
      #cwDlgFace  { width: 80px; font-size: 16px; padding: 14px 8px; }
      #cwDlgBody  { padding: 10px 14px; font-size: 12px; }
      #cwDlgBar   { padding: 8px 14px; }
      #cwDlgBarTitle { font-size: 12px; }
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'cwOverlay';
  overlay.innerHTML = `
    <div id="cwStage">
      <div id="cwDialogue">
        <div id="cwDlgBar">
          <span id="cwDlgBarTitle">Guide</span>
          <div class="cw-bar-btns">
            <div class="cw-bar-btn">&#8212;</div>
            <div class="cw-bar-btn">&#9633;</div>
            <div class="cw-bar-btn">&#x2715;</div>
          </div>
        </div>
        <div id="cwDlgInner">
          <div id="cwDlgFace">(&#x0060;&#xFF65;\u03c9&#xFF65;&#x00B4;)</div>
          <div id="cwDlgBody">
            <div id="cwDlgEyebrow">Entry &middot; 006</div>
            <div id="cwDlgText">
              you&rsquo;re still here&hellip; <span class="cw-hl">good.</span> I was a little worried. This next part is on your own. I won&rsquo;t always be around to help. But I think you can manage from here.
            </div>
          </div>
        </div>
        <div id="cwDlgFooter">
          <span id="cwHint">Click anywhere to continue</span>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const dlgFace = document.getElementById('cwDlgFace');

  function spawnConfetti() {
    const fR = dlgFace.getBoundingClientRect();
    const cx = fR.left + fR.width / 2, cy = fR.top + fR.height / 2;
    for (let i = 0; i < 28; i++) {
      const dot = document.createElement('div');
      dot.className = 'cw-confetti';
      dot.style.background = SITE_PINKS[i % SITE_PINKS.length];
      dot.style.left = cx + 'px'; dot.style.top = cy + 'px';
      const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 110;
      document.body.appendChild(dot);
      setTimeout(() => {
        dot.style.transform = `translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px)`;
        dot.style.opacity = '0';
      }, i * 24);
      setTimeout(() => dot.remove(), 1000 + i * 24);
    }
  }

  function show() {
    overlay.classList.add('cw-visible');
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