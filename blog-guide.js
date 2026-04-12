/* ===================== BLOG WELCOME GUIDE ===================== */

(function () {

  const SITE_PINKS = ['#ffb4ba','#ffcacf','#d4637a','#a8324a','#3d0d14','#fff8f8'];

  if (!document.querySelector('link[href*="typekit"]')) {
    const tk = document.createElement('link');
    tk.rel = 'stylesheet';
    tk.href = 'https://use.typekit.net/mjw2tfe.css';
    document.head.appendChild(tk);
  }

  const style = document.createElement('style');
  style.textContent = `
    #bgOverlay {
      position: fixed; inset: 0; z-index: 9000;
      background: rgba(61,13,20,0.65);
      display: flex; align-items: flex-end; justify-content: flex-start;
      padding: 24px; opacity: 0;
      transition: opacity 0.7s ease;
      pointer-events: none;
    }
    #bgOverlay.bg-visible { opacity: 1; }
    #bgStage { display: flex; flex-direction: row; align-items: flex-end; gap: 0; }
    #bgMascot { flex-shrink: 0; margin-right: -12px; z-index: 2; pointer-events: none; }
    #bgMascotImg { width: 260px; height: 260px; display: block; }
    #bgMascotImg img { width: 100%; height: 100%; object-fit: contain; object-position: bottom center; display: block; }
    #bgMascotImg.bg-jump { animation: bgJump 0.65s cubic-bezier(0.34,1.56,0.64,1); }
    @keyframes bgJump {
      0%   { transform: translateY(0) rotate(0deg); }
      35%  { transform: translateY(-56px) rotate(-10deg); }
      65%  { transform: translateY(-28px) rotate(7deg); }
      100% { transform: translateY(0) rotate(0deg); }
    }
    #bgDialogue {
      position: relative; z-index: 9010; width: 380px;
      background: #fff8f8; border: 1px solid rgba(93,20,30,0.2);
      flex-shrink: 0; margin-bottom: 8px;
      pointer-events: all;
    }
    #bgDlgBar { background: #3d0d14; padding: 7px 14px; display: flex; align-items: center; justify-content: space-between; }
    #bgDlgBarTitle { font-family: "fayte-pixel-hard", sans-serif; font-weight: 400; font-style: normal; font-size: 20px; color: #fff8f8; letter-spacing: 2px; }
    .bg-bar-btns { display: flex; gap: 4px; }
    .bg-bar-btn { width: 14px; height: 14px; background: #fff8f8; border: 1px solid rgba(93,20,30,0.3); font-size: 8px; display: flex; align-items: center; justify-content: center; color: #3d0d14; }
    #bgDlgBody { padding: 18px 22px 10px; font-family: "Montserrat", sans-serif; font-size: 13px; line-height: 1.9; color: #3d0d14; letter-spacing: 0.3px; min-height: 90px; }
    #bgDlgEyebrow { font-family: "Switzer", sans-serif; font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: rgba(93,20,30,0.4); margin-bottom: 8px; }
    #bgDlgText .bg-hl { color: #a8324a; font-weight: 600; }
    .bg-dlg-rule { width: 30px; height: 1px; background: rgba(93,20,30,0.3); margin: 0 22px 12px; }
    #bgDlgFooter { padding: 8px 20px 16px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(93,20,30,0.08); }
    #bgPips { display: flex; gap: 6px; align-items: center; }
    .bg-pip { width: 6px; height: 6px; border-radius: 50%; background: rgba(93,20,30,0.15); transition: background 0.3s; }
    .bg-pip.bg-active { background: #a8324a; }
    .bg-pip.bg-done { background: rgba(93,20,30,0.32); }
    #bgHint { font-family: "Switzer", sans-serif; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: rgba(93,20,30,0.3); }
    .bg-confetti { position: fixed; width: 7px; height: 7px; border-radius: 50%; pointer-events: none; z-index: 9020; opacity: 0; }
    .bg-confetti.bg-pop { animation: bgPop 0.9s ease-out forwards; }
    @keyframes bgPop { 0% { opacity: 1; transform: translate(0,0) scale(1); } 100% { opacity: 0; transform: var(--bg-tx) scale(0.2); } }
  `;
  document.head.appendChild(style);

  const steps = [
    {
      eyebrow: 'Entry \u00b7 006',
      pip: 0,
      text: `oh! h-hi\u2026 I didn\u2019t realise you are here so soon. Welcome! <span class="bg-hl">This is the blog.</span> I hope you find something nice here.`,
    },
    {
      eyebrow: 'Entry \u00b7 007',
      pip: 1,
      text: `it\u2019s really nice to see you\u2026 take your time, look around. <span class="bg-hl">I\u2019m glad you\u2019re here.</span>`,
    },
  ];

  let step = 0;

  function buildOverlay() {
    const ov = document.createElement('div');
    ov.id = 'bgOverlay';
    ov.innerHTML = `
      <div id="bgStage">
        <div id="bgMascot"><div id="bgMascotImg"><img src="pngs/mascot.png" alt="Guide"></div></div>
        <div id="bgDialogue">
          <div id="bgDlgBar">
            <span id="bgDlgBarTitle">Guide</span>
            <div class="bg-bar-btns">
              <div class="bg-bar-btn">&#8212;</div>
              <div class="bg-bar-btn">&#9633;</div>
              <div class="bg-bar-btn">&#x2715;</div>
            </div>
          </div>
          <div id="bgDlgBody">
            <div id="bgDlgEyebrow"></div>
            <div id="bgDlgText"></div>
          </div>
          <div class="bg-dlg-rule"></div>
          <div id="bgDlgFooter">
            <div id="bgPips"></div>
            <div id="bgHint"></div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(ov);

    const mascotImg = ov.querySelector('#bgMascotImg');
    const mascotEl  = mascotImg.querySelector('img');
    const eyebrowEl = ov.querySelector('#bgDlgEyebrow');
    const textEl    = ov.querySelector('#bgDlgText');
    const pipsEl    = ov.querySelector('#bgPips');
    const hintEl    = ov.querySelector('#bgHint');

    function spawnConfetti() {
      const mR = mascotImg.getBoundingClientRect();
      const cx = mR.left + mR.width / 2, cy = mR.top + mR.height / 2;
      for (let i = 0; i < 22; i++) {
        const dot = document.createElement('div');
        dot.className = 'bg-confetti';
        dot.style.background = SITE_PINKS[i % SITE_PINKS.length];
        dot.style.left = cx + 'px'; dot.style.top = cy + 'px';
        const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 110;
        dot.style.setProperty('--bg-tx', `translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px)`);
        document.body.appendChild(dot);
        setTimeout(() => dot.classList.add('bg-pop'), i * 24);
        setTimeout(() => dot.remove(), 1000 + i * 24);
      }
    }

    function buildPips(active) {
      pipsEl.innerHTML = '';
      for (let i = 0; i < steps.length; i++) {
        const d = document.createElement('div');
        d.className = 'bg-pip' + (i < active ? ' bg-done' : i === active ? ' bg-active' : '');
        pipsEl.appendChild(d);
      }
    }

    function jump() {
      mascotImg.classList.remove('bg-jump');
      void mascotImg.offsetWidth;
      mascotImg.classList.add('bg-jump');
    }

    function render() {
      const s = steps[step];
      eyebrowEl.textContent = s.eyebrow;
      textEl.innerHTML = s.text;
      buildPips(s.pip);
      hintEl.textContent = 'click anywhere to continue';
      jump();
      if (step === 0) spawnConfetti();
    }

    function handleClick() {
      if (step < steps.length - 1) {
        step++;
        render();
      } else {
        document.removeEventListener('click', handleClick, true);
        ov.style.opacity = '0';
        setTimeout(() => ov.remove(), 700);
      }
    }
    // Small delay before wiring click so the initial render click doesn't dismiss
    setTimeout(() => {
      document.addEventListener('click', handleClick, true);
    }, 800);

    // Set initial state explicitly, then trigger fade-in
    ov.style.opacity = '0';
    ov.style.transition = 'none';
    // Force a reflow so the browser registers opacity:0 before we animate
    void ov.offsetHeight;
    // Now re-enable transition and fade in
    ov.style.transition = 'opacity 0.7s ease';
    requestAnimationFrame(() => {
      ov.style.opacity = '1';
      render();
    });
  }

  // Script is inside <body> so document.body always exists here
  setTimeout(buildOverlay, 500);

})();