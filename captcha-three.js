/* =====================================================================
   captcha-three.js
   Loaded by captcha.html after three.min.js and captcha.js.

   Effects:
     — Hover tilt on .captcha-card (same as hangman window)
     — Subtle Three.js particle field behind the card
     — On wrong guess: shockwave ring burst from card centre
     — On success: brief upward particle bloom

   captcha.js calls:
     CaptchaThree.onWrong()
     CaptchaThree.onSuccess()
   ===================================================================== */

const CaptchaThree = (() => {

  function init() {
    if (typeof THREE === "undefined") {
      console.warn("captcha-three.js: THREE not loaded"); return null;
    }

    const card = document.querySelector(".captcha-card");
    if (!card) { console.warn("captcha-three.js: .captcha-card not found"); return null; }

    /* ══════════════════════════════════════════
       1.  HOVER TILT  (identical logic to hangman)
    ══════════════════════════════════════════ */

    const TILT_MAX = 7;
    card.style.transformStyle = "preserve-3d";
    card.style.willChange     = "transform";

    function getBaseShadow() {
      return document.body.classList.contains("dark")
        ? "0 8px 48px rgba(0,0,0,0.6)"
        : "0 8px 48px rgba(93,20,30,0.12)";
    }

    let tiltRaf = null;
    let curRotX = 0, curRotY = 0;
    let tgtRotX = 0, tgtRotY = 0;

    function animateTilt() {
      curRotX += (tgtRotX - curRotX) * 0.12;
      curRotY += (tgtRotY - curRotY) * 0.12;
      card.style.transform =
        `perspective(900px) rotateX(${curRotX}deg) rotateY(${curRotY}deg)`;
      card.style.boxShadow =
        `${-curRotY * 1.5}px ${curRotX * 1.0 + 8}px 32px ` +
        (document.body.classList.contains("dark")
          ? "rgba(0,0,0,0.7)"
          : "rgba(93,20,30,0.18)");
      const stillMoving =
        Math.abs(tgtRotX - curRotX) > 0.01 ||
        Math.abs(tgtRotY - curRotY) > 0.01;
      tiltRaf = stillMoving ? requestAnimationFrame(animateTilt) : null;
    }

    card.addEventListener("mousemove", e => {
      const r  = card.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width  / 2)) / (r.width  / 2);
      const dy = (e.clientY - (r.top  + r.height / 2)) / (r.height / 2);
      tgtRotX = -dy * TILT_MAX;
      tgtRotY =  dx * TILT_MAX;
      if (!tiltRaf) tiltRaf = requestAnimationFrame(animateTilt);
    });

    card.addEventListener("mouseleave", () => {
      tgtRotX = 0; tgtRotY = 0;
      if (!tiltRaf) tiltRaf = requestAnimationFrame(animateTilt);
    });

    /* ══════════════════════════════════════════
       2.  THREE.JS — full-page atmosphere canvas
           Sits fixed behind everything at z-index 0
    ══════════════════════════════════════════ */

    const bgCanvas = document.createElement("canvas");
    bgCanvas.style.cssText = [
      "position:fixed",
      "inset:0",
      "width:100%",
      "height:100%",
      "z-index:0",
      "pointer-events:none",
      "display:block",
    ].join(";");
    document.body.prepend(bgCanvas);

    /* alpha:true so the canvas is transparent — CSS gradient shows through */
    const renderer = new THREE.WebGLRenderer({ canvas: bgCanvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); /* fully transparent */

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    camera.position.z = 14;

    function resize() {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    /* Fog tracks dark mode but renderer background stays transparent */
    function fogColor() {
      return document.body.classList.contains("dark") ? 0x1a0408 : 0xffe8ea;
    }
    function particleColor() {
      return document.body.classList.contains("dark") ? 0xb50008 : 0x3d0d14;
    }

    scene.fog = new THREE.FogExp2(fogColor(), 0.022);

    /* Ambient drifting particles */
    const PCOUNT = 140;
    const pPos   = new Float32Array(PCOUNT * 3);
    const pVel   = [];

    for (let i = 0; i < PCOUNT; i++) {
      pPos[i*3]   = (Math.random() - 0.5) * 30;
      pPos[i*3+1] = (Math.random() - 0.5) * 20;
      pPos[i*3+2] = (Math.random() - 0.5) * 10;
      pVel.push({
        x: (Math.random() - 0.5) * 0.004,
        y:  Math.random() * 0.005 + 0.002,
      });
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.055,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    pMat.color.set(particleColor());
    scene.add(new THREE.Points(pGeo, pMat));

    /* Active effect pool (ripples, blooms) */
    const effects = [];

    /* ── Wrong guess: shockwave ring burst ── */
    function onWrong() {
      /* Three rings, staggered */
      [0, 0.1, 0.22].forEach(delay => {
        const geo = new THREE.RingGeometry(0.05, 0.14, 52);
        const mat = new THREE.MeshBasicMaterial({
          color:       document.body.classList.contains("dark") ? 0xff3030 : 0xb50008,
          transparent: true,
          opacity:     0,
          side:        THREE.DoubleSide,
          depthWrite:  false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        /* Place at approximate screen centre (card is centered) */
        mesh.position.set(0, 0, 6);
        scene.add(mesh);
        effects.push({ type: "ripple", mesh, mat, delay, t: 0, done: false });
      });
    }

    /* ── Win: upward particle bloom ── */
    function onSuccess() {
      const COUNT = 22;
      for (let i = 0; i < COUNT; i++) {
        const angle = (i / COUNT) * Math.PI * 2;
        const speed = 0.04 + Math.random() * 0.06;
        const geo   = new THREE.SphereGeometry(0.035 + Math.random() * 0.04, 5, 5);
        const mat   = new THREE.MeshBasicMaterial({
          color:       document.body.classList.contains("dark") ? 0xff6666 : 0x7a1a22,
          transparent: true,
          opacity:     0.9,
          depthWrite:  false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 1,
          6
        );
        scene.add(mesh);
        effects.push({
          type: "bloom",
          mesh, mat,
          vx:    Math.cos(angle) * speed * 0.5,
          vy:    Math.sin(angle) * speed + 0.02,
          life:  1,
          decay: 0.016 + Math.random() * 0.012,
          done:  false,
        });
      }
    }

    /* ── Effect update ── */
    const DT = 1 / 60;

    function updateEffects() {
      for (let i = effects.length - 1; i >= 0; i--) {
        const e = effects[i];
        e.t += DT;

        if (e.type === "ripple") {
          const rt = e.t - e.delay;
          if (rt <= 0) continue;
          const p  = Math.min(rt / 0.75, 1);
          const ep = 1 - Math.pow(1 - p, 3); /* easeOutCubic */
          const sc = 1 + ep * 11;
          e.mesh.scale.set(sc, sc, 1);
          e.mat.opacity = (1 - ep) * 0.5;
          if (p >= 1) {
            scene.remove(e.mesh);
            e.mesh.geometry.dispose();
            e.mat.dispose();
            e.done = true;
          }

        } else if (e.type === "bloom") {
          e.mesh.position.x += e.vx;
          e.mesh.position.y += e.vy;
          e.vy -= 0.001; /* gentle gravity */
          e.life -= e.decay;
          e.mat.opacity = Math.max(0, e.life * 0.9);
          if (e.life <= 0) {
            scene.remove(e.mesh);
            e.mesh.geometry.dispose();
            e.mat.dispose();
            e.done = true;
          }
        }
      }
      for (let i = effects.length - 1; i >= 0; i--) {
        if (effects[i].done) effects.splice(i, 1);
      }
    }

    /* ── Render loop ── */
    let clock       = 0;
    let lastPalette = null;
    let lastTime    = performance.now();

    function animate() {
      requestAnimationFrame(animate);
      const now = performance.now();
      const dt  = Math.min((now - lastTime) / 1000, 0.05);
      lastTime  = now;
      clock    += dt;

      /* Palette hot-swap — only fog and particles, renderer stays transparent */
      const isDark = document.body.classList.contains("dark");
      if (lastPalette !== isDark) {
        lastPalette = isDark;
        scene.fog.color.set(fogColor());
        pMat.color.set(particleColor());
      }

      /* Drift particles */
      const pos = pGeo.attributes.position.array;
      for (let i = 0; i < PCOUNT; i++) {
        pos[i*3]   += pVel[i].x;
        pos[i*3+1] += pVel[i].y;
        if (pos[i*3+1] > 11) {
          pos[i*3+1] = -10;
          pos[i*3]   = (Math.random() - 0.5) * 30;
        }
      }
      pGeo.attributes.position.needsUpdate = true;

      /* Subtle camera drift */
      camera.position.x = Math.sin(clock * 0.08) * 0.2;
      camera.position.y = Math.cos(clock * 0.06) * 0.1;

      updateEffects();
      renderer.render(scene, camera);
    }
    animate();

    return { onWrong, onSuccess };
  }

  /* ── Boot ── */
  let api = null;

  function tryInit() { api = init(); }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryInit);
  } else {
    tryInit();
  }

  return {
    onWrong:   () => api && api.onWrong(),
    onSuccess: () => api && api.onSuccess(),
  };

})();