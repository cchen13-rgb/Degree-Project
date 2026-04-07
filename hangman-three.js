/* =====================================================================
   hangman-three.js
   Loaded by hangman.html after three.min.js and hangman.js.
   Exposes window.HMThree with:
     HMThree.onWrong(wrongCount, maxWrong)
     HMThree.onWin()
     HMThree.onLose()
     HMThree.onReset()
   ===================================================================== */

const HMThree = (() => {

  function init() {
    if (typeof THREE === "undefined") {
      console.warn("hangman-three.js: THREE not loaded"); return null;
    }

    const win = document.querySelector(".hm-window");
    if (!win) { console.warn("hangman-three.js: .hm-window not found"); return null; }

    /* ══════════════════════════════════════════
       1.  HOVER TILT
    ══════════════════════════════════════════ */

    const TILT_MAX = 6;
    win.style.transformStyle = "preserve-3d";
    win.style.willChange     = "transform";

    function getBaseShadow() {
      return document.body.classList.contains("dark")
        ? "4px 4px 0 rgba(181,0,8,0.4)"
        : "4px 4px 0 #3d0d14";
    }

    let tiltRaf = null;
    let curRotX = 0, curRotY = 0;
    let tgtRotX = 0, tgtRotY = 0;

    function animateTilt() {
      curRotX += (tgtRotX - curRotX) * 0.12;
      curRotY += (tgtRotY - curRotY) * 0.12;
      win.style.transform =
        `perspective(900px) rotateX(${curRotX}deg) rotateY(${curRotY}deg)`;
      win.style.boxShadow =
        `${-curRotY * 1.2}px ${curRotX * 0.8 + 4}px 0 ` +
        (document.body.classList.contains("dark")
          ? "rgba(181,0,8,0.5)" : "#3d0d14");
      const stillMoving =
        Math.abs(tgtRotX - curRotX) > 0.01 ||
        Math.abs(tgtRotY - curRotY) > 0.01;
      tiltRaf = stillMoving ? requestAnimationFrame(animateTilt) : null;
    }

    win.addEventListener("mousemove", e => {
      const r  = win.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width  / 2)) / (r.width  / 2);
      const dy = (e.clientY - (r.top  + r.height / 2)) / (r.height / 2);
      tgtRotX = -dy * TILT_MAX;
      tgtRotY =  dx * TILT_MAX;
      if (!tiltRaf) tiltRaf = requestAnimationFrame(animateTilt);
    });

    win.addEventListener("mouseleave", () => {
      tgtRotX = 0; tgtRotY = 0;
      if (!tiltRaf) tiltRaf = requestAnimationFrame(animateTilt);
    });

    /* ══════════════════════════════════════════
       2.  THREE.JS BLOOD FILL
    ══════════════════════════════════════════ */

    /* Canvas sits inside .hm-window, behind all content */
    const canvas = document.createElement("canvas");
    canvas.style.cssText = [
      "position:absolute",
      "inset:0",
      "width:100%",
      "height:100%",
      "z-index:1",
      "pointer-events:none",
      "display:block",
    ].join(";");

    win.style.position = "relative";
    win.style.overflow = "hidden";
    win.prepend(canvas);

    /* Push all sibling children above the canvas */
    Array.from(win.children).forEach(child => {
      if (child === canvas) return;
      child.style.position = "relative";
      child.style.zIndex   = "2";
    });

    /* ── renderer ── */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene  = new THREE.Scene();
    /* Orthographic camera: NDC coords, -1…1 each axis */
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
    camera.position.z = 1;

    function resize() {
      const w = win.offsetWidth  || 860;
      const h = win.offsetHeight || 480;
      renderer.setSize(w, h, false);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(win);

    /* ── blood plane ── */
    const SEG_X   = 90;
    const planeGeo = new THREE.PlaneGeometry(2, 2, SEG_X, 2);

    function bloodColor() {
      return document.body.classList.contains("dark")
        ? new THREE.Color(0x5a0000)
        : new THREE.Color(0x7a0000);
    }

    const bloodMat = new THREE.MeshBasicMaterial({
      color:       bloodColor(),
      transparent: true,
      opacity:     0,
      depthWrite:  false,
      side:        THREE.DoubleSide,
    });
    const blood = new THREE.Mesh(planeGeo, bloodMat);
    scene.add(blood);

    /* Surface sheen — brighter strip at the liquid line */
    const sheenGeo = new THREE.PlaneGeometry(2, 0.035, SEG_X, 1);
    const sheenMat = new THREE.MeshBasicMaterial({
      color: 0xcc0000, transparent: true, opacity: 0, depthWrite: false,
    });
    const sheen = new THREE.Mesh(sheenGeo, sheenMat);
    sheen.position.z = 0.01;
    scene.add(sheen);

    /* Highlight — thin bright line right at the surface */
    const hlGeo = new THREE.PlaneGeometry(2, 0.008, 1, 1);
    const hlMat = new THREE.MeshBasicMaterial({
      color: 0xff6666, transparent: true, opacity: 0, depthWrite: false,
    });
    const hl = new THREE.Mesh(hlGeo, hlMat);
    hl.position.z = 0.02;
    scene.add(hl);

    /* State */
    let fillLevel  = 0;
    let targetFill = 0;
    let waveTime   = 0;
    let lastPalette = null;

    function fillToY(f) { return -1 + f * 2; }

    /* ── drip particles ── */
    const drips = [];

    function spawnDrips(count) {
      for (let d = 0; d < count; d++) {
        const r   = 0.008 + Math.random() * 0.018;
        const geo = new THREE.CircleGeometry(r, 7);
        const mat = new THREE.MeshBasicMaterial({
          color: 0x990000, transparent: true, opacity: 0.9,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          (Math.random() - 0.5) * 1.9,
          fillToY(fillLevel) + r,
          0.03
        );
        scene.add(mesh);
        drips.push({
          mesh, mat,
          vy:    -(0.003 + Math.random() * 0.007),
          life:  1,
          decay: 0.008 + Math.random() * 0.012,
        });
      }
    }

    /* Store original Y values for clean per-frame recompute */
    const origY = [];
    {
      const pos = planeGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) origY.push(pos.getY(i));
    }

    let dripTimer = 0;

    function updateGeometry(dt) {
      waveTime += dt;

      /* Viscous rise, faster drain */
      const speed = fillLevel < targetFill ? 0.018 : 0.035;
      fillLevel += (targetFill - fillLevel) * speed;

      const topY  = fillToY(fillLevel);
      const alpha = Math.min(fillLevel * 4, 0.78);

      bloodMat.opacity = alpha;
      sheenMat.opacity = alpha * 0.5;
      hlMat.opacity    = alpha * 0.6;

      /* Wave top-edge vertices */
      const pos = planeGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const ox = pos.getX(i);
        const oy = origY[i]; /* -1 | 0 | +1 in plane space */

        if (oy > 0.5) {
          const wave =
            Math.sin(ox * 4.1 + waveTime * 2.1)  * 0.030 +
            Math.sin(ox * 7.8 - waveTime * 3.3)  * 0.013 +
            Math.sin(ox * 2.0 + waveTime * 1.1)  * 0.022;
          const t    = (oy + 1) / 2;
          pos.setY(i, -1 + t * (topY + 1) + wave * t);
        } else if (oy < -0.5) {
          pos.setY(i, -1);
        } else {
          const t = (oy + 1) / 2;
          pos.setY(i, -1 + t * (topY + 1));
        }
      }
      pos.needsUpdate = true;

      /* Sheen + highlight track the surface */
      const surfaceY = topY + Math.sin(waveTime * 2.1) * 0.018;
      sheen.position.y = surfaceY;
      hl.position.y    = surfaceY + 0.016;

      /* Ambient drip */
      dripTimer += dt;
      if (dripTimer > 1.1 && fillLevel > 0.05) {
        dripTimer = 0;
        spawnDrips(1);
      }

      /* Tick drip particles */
      for (let i = drips.length - 1; i >= 0; i--) {
        const d = drips[i];
        d.mesh.position.y += d.vy;
        d.life -= d.decay;
        d.mat.opacity = Math.max(0, d.life * 0.9);
        if (d.life <= 0 || d.mesh.position.y < -1.12) {
          scene.remove(d.mesh);
          d.mesh.geometry.dispose();
          d.mat.dispose();
          drips.splice(i, 1);
        }
      }
    }

    /* ── render loop ── */
    let lastTime = performance.now();

    function animate() {
      requestAnimationFrame(animate);
      const now = performance.now();
      const dt  = Math.min((now - lastTime) / 1000, 0.05);
      lastTime  = now;

      const isDark = document.body.classList.contains("dark");
      if (lastPalette !== isDark) {
        lastPalette = isDark;
        bloodMat.color.copy(bloodColor());
      }

      updateGeometry(dt);
      renderer.render(scene, camera);
    }
    animate();

    /* ── surge snap on wrong guess ── */
    function surge() {
      fillLevel = Math.min(fillLevel + 0.055, targetFill + 0.01, 1);
      spawnDrips(3 + Math.floor(Math.random() * 5));
    }

    /* ── PUBLIC API ── */

    function onWrong(wrongCount, maxWrong) {
      targetFill = wrongCount / maxWrong;
      setTimeout(surge, 80);
    }

    function onWin() {
      targetFill = 0;
    }

    function onLose() {
      targetFill = 1;
      spawnDrips(14);
    }

    function onReset() {
      targetFill       = 0;
      fillLevel        = 0;
      bloodMat.opacity = 0;
      sheenMat.opacity = 0;
      hlMat.opacity    = 0;
      drips.forEach(d => {
        scene.remove(d.mesh);
        d.mesh.geometry.dispose();
        d.mat.dispose();
      });
      drips.length = 0;
    }

    return { onWrong, onWin, onLose, onReset };
  }

  /* ── boot after DOM ready ── */
  let api = null;

  function tryInit() { api = init(); }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryInit);
  } else {
    tryInit();
  }

  /* Safe proxy — callable before init completes */
  return {
    onWrong: (wc, mx) => api && api.onWrong(wc, mx),
    onWin:   ()       => api && api.onWin(),
    onLose:  ()       => api && api.onLose(),
    onReset: ()       => api && api.onReset(),
  };

})();