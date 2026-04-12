/* ===================== BLOG WELCOME GUIDE ===================== */
/* Drop into blog.html as <script src="blog-guide.js"></script>  */

(function () {

  const SITE_PINKS = ['#ffb4ba','#ffcacf','#d4637a','#a8324a','#3d0d14','#fff8f8'];

  /* ── Inject Typekit + fonts to match site ── */
  if (!document.querySelector('link[href*="typekit"]')) {
    const tk = document.createElement('link');
    tk.rel = 'stylesheet';
    tk.href = 'https://use.typekit.net/mjw2tfe.css';
    document.head.appendChild(tk);
  }
  if (!document.querySelector('link[href*="design.css"]')) {
    const dc = document.createElement('link');
    dc.rel = 'stylesheet';
    dc.href = 'design.css';
    document.head.appendChild(dc);
  }

  const style = document.createElement('style');
  style.textContent = `
    #bgOverlay {
      position: fixed; inset: 0; z-index: 9000;
      background: rgba(61,13,20,0.70);
      display: flex; align-items: flex-end; justify-content: flex-start;
      padding: 24px;
      opacity: 0; transition: opacity 0.6s ease;
      pointer-events: none;
    }
    #bgOverlay.bg-visible { opacity: 1; pointer-events: none; }

    #bgStage { display: flex; flex-direction: row; align-items: flex-end; gap: 0; }

    #bgMascot { flex-shrink: 0; margin-right: -12px; z-index: 2; pointer-events: none; }
    #bgMascotImg { width: 260px; height: 260px; display: block; }
    #bgMascotImg img {
      width: 100%; height: 100%;
      object-fit: contain; object-position: bottom center; display: block;
    }
    #bgMascotImg.bg-jump { animation: bgJump 0.65s cubic-bezier(0.34,1.56,0.64,1); }
    @keyframes bgJump {
      0%   { transform: translateY(0) rotate(0deg); }
      35%  { transform: translateY(-56px) rotate(-10deg); }
      65%  { transform: translateY(-28px) rotate(7deg); }
      100% { transform: translateY(0) rotate(0deg); }
    }

    #bgDialogue {
      position: relative; z-index: 9010; width: 380px;
      pointer-events: all;
      background: #fff8f8; border: 1px solid rgba(93,20,30,0.2);
      flex-shrink: 0; margin-bottom: 8px;
    }
    body.dark #bgDialogue { background: #0a0000; border-color: rgba(181,0,8,0.3); }

    #bgDlgBar {
      background: #3d0d14; padding: 7px 14px;
      display: flex; align-items: center; justify-content: space-between;
    }
    #bgDlgBarTitle {
      font-family: "fayte-pixel-hard", sans-serif;
      font-weight: 400; font-style: normal;
      font-size: 20px; color: #fff8f8; letter-spacing: 2px;
    }
    .bg-bar-btns { display: flex; gap: 4px; }
    .bg-bar-btn {
      width: 14px; height: 14px; background: #fff8f8;
      border: 1px solid rgba(93,20,30,0.3); font-size: 8px;
      display: flex; align-items: center; justify-content: center; color: #3d0d14;
    }

    #bgDlgBody {
      padding: 18px 22px 10px;
      font-family: "Montserrat", sans-serif;
      font-size: 13px; line-height: 1.9; color: #3d0d14;
      letter-spacing: 0.3px; min-height: 90px;
    }
    body.dark #bgDlgBody { color: rgba(255,248,248,0.86); }

    #bgDlgEyebrow {
      font-family: "Switzer", sans-serif;
      font-size: 9px; letter-spacing: 3px; text-transform: uppercase;
      color: rgba(93,20,30,0.4); margin-bottom: 8px;
    }
    body.dark #bgDlgEyebrow { color: rgba(255,200,200,0.35); }

    #bgDlgText .bg-hl { color: #a8324a; font-weight: 600; }
    body.dark #bgDlgText .bg-hl { color: #ff8a8a; }

    .bg-dlg-rule {
      width: 30px; height: 1px;
      background: rgba(93,20,30,0.3); margin: 0 22px 12px;
    }
    body.dark .bg-dlg-rule { background: rgba(181,0,8,0.3); }

    #bgDlgFooter {
      padding: 8px 20px 16px;
      display: flex; align-items: center; justify-content: space-between;
      border-top: 1px solid rgba(93,20,30,0.08);
    }
    body.dark #bgDlgFooter { border-top-color: rgba(181,0,8,0.15); }

    #bgPips { display: flex; gap: 6px; align-items: center; }
    .bg-pip {
      width: 6px; height: 6px; border-radius: 50%;
      background: rgba(93,20,30,0.15); transition: background 0.3s;
    }
    .bg-pip.bg-active { background: #a8324a; }
    .bg-pip.bg-done   { background: rgba(93,20,30,0.32); }
    body.dark .bg-pip           { background: rgba(255,200,200,0.15); }
    body.dark .bg-pip.bg-active { background: #ff8a8a; }
    body.dark .bg-pip.bg-done   { background: rgba(255,200,200,0.32); }

    #bgBtnNext {
      font-family: "Switzer", sans-serif;
      font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
      background: none; border: 1px solid rgba(93,20,30,0.3);
      color: #3d0d14; padding: 5px 14px;
      cursor: url("pngs/cursor.png") 0 0, pointer;
      transition: background 0.2s, color 0.2s;
    }
    #bgBtnNext:hover { background: #3d0d14; color: #fff8f8; }
    body.dark #bgBtnNext { border-color: rgba(181,0,8,0.4); color: rgba(255,248,248,0.8); }
    body.dark #bgBtnNext:hover { background: rgba(181,0,8,0.3); }

    .bg-confetti {
      position: fixed; width: 7px; height: 7px; border-radius: 50%;
      pointer-events: none; z-index: 9020; opacity: 0;
    }
    .bg-confetti.bg-pop { animation: bgPop 0.9s ease-out forwards; }
    @keyframes bgPop {
      0%   { opacity: 1; transform: translate(0,0) scale(1); }
      100% { opacity: 0; transform: var(--bg-tx) scale(0.2); }
    }
  `;
  document.head.appendChild(style);

  /* ── Two steps — shy, warm, completely oblivious ── */
  const steps = [
    {
      eyebrow: 'Entry \u00b7 006',
      sprite: 'pngs/mascot.png',
      pip: 0,
      text: `oh! h-hi\u2026 I didn\u2019t realise anyone was coming. Welcome! <span class="bg-hl">This is the blog.</span> I hope you find something nice here.`,
    },
    {
      eyebrow: 'Entry \u00b7 007',
      sprite: 'pngs/mascot.png',
      pip: 1,
      text: `it\u2019s really lovely to see you\u2026 take your time, look around. <span class="bg-hl">I\u2019m glad you\u2019re here.</span>`,
    },
  ];

  const TOTAL_PIPS = steps.length;
  let step = 0;

  const overlay = document.createElement('div');
  overlay.id = 'bgOverlay';
  overlay.innerHTML = `
    <div id="bgStage">
      <div id="bgMascot">
        <div id="bgMascotImg"><img src="pngs/mascot.png" alt="Guide"></div>
      </div>
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
          <button id="bgBtnNext">Next</button>
        </div>
      </div>
    </div>
  `;
  // overlay is appended inside show() to guarantee body exists
  const mascotImg = document.getElementById('bgMascotImg');
  const mascotEl  = mascotImg.querySelector('img');
  const eyebrowEl = document.getElementById('bgDlgEyebrow');
  const textEl    = document.getElementById('bgDlgText');
  const pipsEl    = document.getElementById('bgPips');
  const btnNext   = document.getElementById('bgBtnNext');

  function spawnConfetti(){
    const mR = mascotImg.getBoundingClientRect();
    const cx = mR.left + mR.width / 2, cy = mR.top + mR.height / 2;
    for(let i = 0; i < 22; i++){
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

  function buildPips(active){
    pipsEl.innerHTML = '';
    for(let i = 0; i < TOTAL_PIPS; i++){
      const d = document.createElement('div');
      d.className = 'bg-pip' + (i < active ? ' bg-done' : i === active ? ' bg-active' : '');
      pipsEl.appendChild(d);
    }
  }

  function jump(){
    mascotImg.classList.remove('bg-jump');
    void mascotImg.offsetWidth;
    mascotImg.classList.add('bg-jump');
  }

  function render(){
    const s = steps[step];
    eyebrowEl.textContent = s.eyebrow;
    textEl.innerHTML = s.text;
    mascotEl.src = s.sprite;
    buildPips(s.pip);
    btnNext.textContent = step < steps.length - 1 ? 'Next' : 'Close';
    jump();
    if(step === 0) spawnConfetti();
  }

  btnNext.addEventListener('click', ()=>{
    if(step < steps.length - 1){
      step++;
      render();
    } else {
      overlay.style.transition = 'opacity 0.5s ease';
      requestAnimationFrame(()=>{ overlay.classList.remove('bg-visible'); });
      setTimeout(() => { if(overlay.parentNode) overlay.remove(); }, 600);
    }
  });

  function show(){
    // Append only if not already in DOM (guard against double-call)
    if(!document.getElementById('bgOverlay')){
      document.body.appendChild(overlay);
    }
    // Force layout so the opacity:0 state is committed before we add the class
    overlay.getBoundingClientRect();
    // Two rAFs: first commits the style, second triggers the transition
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        overlay.classList.add('bg-visible');
        render();
      });
    });
  }

  // Single deferred call — no double-fire risk
  let shown = false;
  function tryShow(){
    if(shown) return;
    shown = true;
    // Make sure body exists before appending
    if(!document.body){
      document.addEventListener('DOMContentLoaded', tryShow);
      return;
    }
    show();
  }
  // Use DOMContentLoaded as primary, timeout as hard fallback
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ()=> setTimeout(tryShow, 600));
  } else {
    setTimeout(tryShow, 600);
  }

})();