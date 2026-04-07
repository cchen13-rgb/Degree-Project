/* ===================== PARTICLES ===================== */

const body = document.body;
const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const isDesktopViewport = window.matchMedia('(min-width: 1025px)').matches;

let particleInterval = null;
let particleContainer = null;
const particleRemovalTimers = new Set();
let postEntryEffectsStarted = false;
let introInteractionLocked = true;

function startParticles() {
  particleContainer = particleContainer || document.getElementById("particles");
  if (!particleContainer || particleInterval) return;
  particleInterval = setInterval(() => {
    const particle = document.createElement("div");
    particle.classList.add("particle");
    particle.style.left = Math.random() * 100 + "vw";
    particle.style.animationDuration = (3 + Math.random() * 5) + "s";
    particle.style.opacity = Math.random();
    particleContainer.appendChild(particle);

    const removalTimer = setTimeout(() => {
      particle.remove();
      particleRemovalTimers.delete(removalTimer);
    }, 8000);

    particleRemovalTimers.add(removalTimer);
  }, 600);
}

function stopParticles() {
  clearInterval(particleInterval);
  particleInterval = null;

  particleRemovalTimers.forEach(clearTimeout);
  particleRemovalTimers.clear();

  particleContainer = particleContainer || document.getElementById("particles");
  if (particleContainer) particleContainer.replaceChildren();
}


/* ===================== MAGNETIC BUTTON ===================== */

function bindMagneticHover(element, xFactor, yFactor, resetDuration, resetEase) {
  if (!element || element.dataset.magneticBound === 'true') return;

  element.dataset.magneticBound = 'true';

  element.addEventListener('mousemove', (e) => {
    const r = element.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    if (element.classList.contains('star2')) {
      gsap.to(element, {
        '--hover-x': `${x * xFactor}px`,
        '--hover-y': `${y * yFactor}px`,
        duration: 0.4,
        ease: "power2.out",
        overwrite: true
      });
      return;
    }
    gsap.to(element, { x: x * xFactor, y: y * yFactor, duration: 0.4, ease: "power2.out", overwrite: true });
  });

  element.addEventListener('mouseleave', () => {
    if (element.classList.contains('star2')) {
      gsap.to(element, {
        '--hover-x': '0px',
        '--hover-y': '0px',
        duration: resetDuration,
        ease: resetEase,
        overwrite: true
      });
      return;
    }
    gsap.to(element, { x: 0, y: 0, duration: resetDuration, ease: resetEase, overwrite: true });
  });
}

function initMagneticButtons() {
  if (isTouchDevice) return;

  document.querySelectorAll('.login').forEach(btn => {
    bindMagneticHover(btn, 0.3, 0.3, 0.7, "elastic.out(1, 0.4)");
  });

  document.querySelectorAll('.star').forEach(star => {
    bindMagneticHover(star, 0.4, 0.4, 0.9, "elastic.out(1, 0.3)");
  });
}

function startPostEntryEffects() {
  if (postEntryEffectsStarted) return;
  postEntryEffectsStarted = true;
  startParticles();
  initMagneticButtons();
  /* Three.js parallax boots here, after entry sequence completes */
  initThreeParallax();
}

function setDarkMode(isDark) {
  if (introInteractionLocked) return;
  body.classList.toggle("dark", isDark);
  applyLoginDarkMode();
}


/* ===================== DOM READY ===================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ---- Panel scroll fade ---- */
  const fadeEls = document.querySelectorAll(
    '.left-panel h2, .left-panel .feature-image, .left-panel p, ' +
    '.scroll-content h2, .scroll-content img, .scroll-content p'
  );
  fadeEls.forEach(el => el.classList.add('panel-fade'));

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('panel-fade--visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -100px 0px' });
  fadeEls.forEach(el => fadeObserver.observe(el));

  /* ---- Dark mode toggle ---- */
  const toggle = document.getElementById("modeToggle");
  if (toggle) {
    toggle.addEventListener("change", () => {
      setDarkMode(toggle.checked);
    });
  }

  /* ---- Stars click to toggle dark mode ---- */
  document.addEventListener("click", (e) => {
    if (introInteractionLocked) return;
    if (e.target.closest(".star")) {
      const nextDarkMode = !body.classList.contains("dark");
      if (toggle) toggle.checked = nextDarkMode;
      setDarkMode(nextDarkMode);
    }
  });

  /* ---- Door click ---- */
  const door = document.getElementById("door");
  if (door) {
    door.addEventListener("click", () => {
      door.style.transformOrigin = 'center center';
      door.style.zIndex = '9999';
      const enterText = document.querySelector('.enter');
      const logoText  = document.querySelector('.curveText');
      gsap.timeline()
        .to([enterText, logoText], { opacity: 0, duration: 0.4, ease: "power1.in" })
        .to(door, { scale: 20, duration: 0.8, ease: "power2.inOut" })
        .to(door, {
          opacity: 0, duration: 0.8, ease: "power1.in",
          onComplete: () => { window.location.href = "landing.html"; }
        });
    });
  }

  applyNameReveal();

  /* ---- SplitText reveal on char cards ---- */
  const cardObserverSplit = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const nameEl = entry.target.querySelector('.char-name-en');
      if (nameEl && typeof SplitText !== 'undefined') {
        const split = new SplitText(nameEl, { type: "chars" });
        gsap.from(split.chars, {
          opacity: 0, y: 20, rotateX: -40, stagger: 0.04,
          duration: 0.6, ease: "power3.out", delay: 0.2,
          onComplete: () => split.revert()
        });
      }
      cardObserverSplit.unobserve(entry.target);
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.char-card').forEach(c => cardObserverSplit.observe(c));
});


/* ===================== PAGE LOAD ===================== */

let entryDone = false;
let textEl    = null;
let loginEl   = null;

window.addEventListener("load", () => {
  body.classList.add("loaded");

  const loader  = document.getElementById("loader");
  const barFill = document.getElementById("loader-bar-fill");
  const totalLoad = 2500;
  const startTime = performance.now();

  function animateBar(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / totalLoad, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    if (barFill) barFill.style.width = (eased * 100) + '%';
    if (progress < 1) {
      requestAnimationFrame(animateBar);
    } else {
      setTimeout(beginEntry, 200);
    }
  }

  requestAnimationFrame(animateBar);

  function beginEntry() {
    const modeToggle = document.getElementById('modeToggle');
    if (modeToggle) {
      modeToggle.disabled = true;
      body.classList.add('intro-toggle-locked');
    }

    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => {
        if (loader.parentNode) loader.remove();
      }, 800);
    }

    /* star2 never gets a JS transform — CSS owns it */
    document.querySelectorAll('.dante-layer.star').forEach(el => {
      if (el.classList.contains('star2')) {
        el.style.opacity = '0';
      } else {
        el.style.transition = 'none';
        el.style.transform  = 'translateY(120px)';
        el.style.opacity    = '0';
      }
    });

    const heroLogin = document.querySelector('.center .login');
    const heroText  = document.querySelector('.center .text');
    if (heroLogin) heroLogin.style.opacity = '0';
    if (heroText)  heroText.style.opacity  = '0';

    setTimeout(() => {

      document.querySelectorAll('.dante-layer:not(.star)').forEach(el => {
        el.classList.add('dante-in');
      });

      document.querySelectorAll('.dante-layer.star').forEach(el => {
        if (el.classList.contains('star2')) {
          el.classList.remove('star2-spinning');
          el.style.transition = 'opacity 2s ease 0s';
          setTimeout(() => { el.style.opacity = '1'; }, 450);
          setTimeout(() => {
            el.classList.add('star2-spinning');
            if (modeToggle) {
              modeToggle.disabled = false;
              body.classList.remove('intro-toggle-locked');
            }
            introInteractionLocked = false;
          }, 2450);
        } else {
          el.style.transition = 'opacity 2s ease 0s, transform 2s cubic-bezier(0.16,1,0.3,1), filter 0.6s ease';
          setTimeout(() => {
            el.style.transform = 'translateY(0px)';
            el.style.opacity   = '1';
          }, 50);
        }
      });

      if (heroLogin) {
        heroLogin.style.transition = 'opacity 2s ease';
        setTimeout(() => { heroLogin.style.opacity = '1'; }, 1800);
      }

      if (heroText && !isDesktopViewport && typeof ScrambleTextPlugin !== 'undefined') {
        const lockedWidth  = heroText.offsetWidth;
        const lockedHeight = heroText.offsetHeight;
        heroText.style.width    = lockedWidth  + 'px';
        heroText.style.height   = lockedHeight + 'px';
        heroText.style.overflow = 'hidden';
        heroText.style.display  = 'block';
        const original = heroText.textContent.trim();
        setTimeout(() => {
          gsap.to(heroText, {
            opacity: 1, duration: 1.2, ease: "power1.in",
            onComplete() {
              gsap.to(heroText, {
                duration: 2.4,
                scrambleText: {
                  text: original,
                  chars: "abcdefghijklmnopqrstuvwxyz—…",
                  revealDelay: 0.4,
                  speed: 0.5
                },
                ease: "none",
                onComplete() {
                  heroText.style.width  = '';
                  heroText.style.height = '';
                }
              });
            }
          });
        }, 1400);
      } else if (heroText) {
        heroText.style.transition = 'opacity 1.6s ease';
        setTimeout(() => { heroText.style.opacity = '1'; }, 1400);
      }

    }, 1300);

    setTimeout(() => {
      textEl  = document.querySelector('.center .text');
      loginEl = document.querySelector('.center .login');

      document.querySelectorAll('.dante-layer.star').forEach(el => {
        if (el.classList.contains('star2')) {
          el.style.removeProperty('transform');
          el.style.transition = 'opacity 2s ease, filter 0.6s ease';
        } else {
          el.style.transition = 'filter 0.6s ease';
        }
      });

      entryDone = true;
      body.classList.add('entry-done');

      setTimeout(() => {
        startPostEntryEffects();
      }, 1200);

    }, 4200);
  }
});


/* ===================== NAME REVEAL ===================== */

function applyNameReveal() {
  document.querySelectorAll(
    '.left-panel p, .scroll-content p, .right-panel p, ' +
    '.char-profile-text, .char-name-en, .char-name-sub, .stat-value'
  ).forEach(p => {
    if (p.dataset.nameRevealApplied === 'true') return;
    p.innerHTML = p.innerHTML.replace(
      /\b(Cheryl|Shelley|heart)\b/gi,
      '<span class="reveal-name">$1</span>'
    );
    p.dataset.nameRevealApplied = 'true';
  });
}


/* ===================== LOGIN MODAL ===================== */

const loginBtn = document.querySelector('.login');
const modal    = document.getElementById('loginModal');
const closeBtn = document.getElementById('closeModal');
const modalBox = modal ? modal.querySelector('.modal-box') : null;

if (loginBtn && modal) {
  loginBtn.addEventListener('click', () => {
    modal.classList.add('open');
    body.classList.add('modal-open');
    renderLogin();
    stopParticles();
  });
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove('open');
  body.classList.remove('modal-open');
  startParticles();
}

if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (modal)    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

let loginAttempts = 0;

function renderLogin() {
  if (!modalBox) return;

  const isDark     = body.classList.contains('dark');
  const loreColor  = isDark ? 'transparent' : '#3d0d14';
  const heartColor = isDark ? '#b50008'     : '#3d0d14';

  modalBox.innerHTML = `
    <button class="modal-close" id="closeModal">✕</button>

    <div style="border-left:2px solid rgba(93,20,30,0.2);padding:12px 16px;margin-bottom:28px;text-align:left;">
      <div style="font-family:'Switzer';font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(93,20,30,0.4);margin-bottom:8px;">Entry · 001</div>
      <p class="lore-text" style="font-family:'Montserrat',sans-serif;font-size:11px;line-height:1.85;margin:0;padding:0;border:none;overflow:hidden;word-break:break-word;">
        <span class="lore-before" style="color:${loreColor};transition:color 0.6s;">Your name is—is— You are wandering alone through the dark. You were something before this, somewhere before here, but now…you are being called down. Perhaps these missing pieces will get filled in along the way. …</span><span class="lore-heart" style="color:${heartColor};transition:color 0.6s;">Heart</span><span class="lore-after" style="color:${loreColor};transition:color 0.6s;"> — Something about the word really resonates with you. I wonder why.</span>
      </p>
    </div>

    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <div style="flex:1;height:1px;background:rgba(93,20,30,0.12);"></div>
      <h2 style="font-size:28px;margin:0;padding:0;border:none;white-space:nowrap;">Who Am I?</h2>
      <div style="flex:1;height:1px;background:rgba(93,20,30,0.12);"></div>
    </div>

    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;text-align:left;">
      <div>
        <label style="font-family:'Switzer';font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(93,20,30,0.4);display:block;margin-bottom:6px;">Username</label>
        <input id="loginUser" type="text" placeholder="username" inputmode="text" autocomplete="username" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid rgba(93,20,30,0.2);background:transparent;font-family:'Switzer';font-size:12px;outline:none;">
      </div>
      <div>
        <label style="font-family:'Switzer';font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(93,20,30,0.4);display:block;margin-bottom:6px;">Password</label>
        <input id="loginPass" type="password" placeholder="password" inputmode="text" autocomplete="current-password" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid rgba(93,20,30,0.2);background:transparent;font-family:'Switzer';font-size:12px;outline:none;">
        <p id="loginError" style="color:#c0392b;font-family:'Switzer';font-size:10.5px;letter-spacing:1px;margin:6px 0 0 0;min-height:16px;padding:0;border:none;text-align:left;"></p>
      </div>
    </div>

    <button class="login" id="submitLogin" style="width:100%;">Enter</button>
  `;

  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('submitLogin').addEventListener('click', checkLogin);
  document.getElementById('loginPass').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkLogin(); });

  initMagneticButtons();
}

function applyLoginDarkMode() {
  if (!modalBox) return;
  const isDark   = body.classList.contains('dark');
  const beforeEl = modalBox.querySelector('.lore-before');
  const afterEl  = modalBox.querySelector('.lore-after');
  const heartEl  = modalBox.querySelector('.lore-heart');
  if (beforeEl) beforeEl.style.color = isDark ? 'transparent' : '#3d0d14';
  if (afterEl)  afterEl.style.color  = isDark ? 'transparent' : '#3d0d14';
  if (heartEl)  heartEl.style.color  = isDark ? '#b50008'     : '#3d0d14';
}

function checkLogin() {
  const userInput = document.getElementById('loginUser');
  const passInput = document.getElementById('loginPass');
  const err       = document.getElementById('loginError');

  if (!userInput || !passInput || !err) return;

  const user = userInput.value.trim().toLowerCase();
  const pass = passInput.value.trim().toLowerCase();

  if (user === 'cherylshelley' && pass === 'heart') {
    loginAttempts = 0;
    closeModal();
    window.location.href = "captcha.html";
  } else {
    loginAttempts++;
    passInput.value = '';

    let hint = '';
    if (loginAttempts === 1) {
      hint = 'That is not right...';
    } else if (loginAttempts === 2) {
      hint = 'Perhaps the answer lies in the dark.';
      const toggle = document.getElementById('modeToggle');
      if (toggle && !body.classList.contains('dark')) {
        const slider = toggle.nextElementSibling;
        if (slider) {
          slider.style.transition = 'box-shadow 0.2s';
          slider.style.boxShadow  = '0 0 0 3px rgba(181,0,8,0.6)';
          setTimeout(() => { slider.style.boxShadow = ''; }, 1400);
        }
      }
    } else {
      hint = 'cherylshelley+heart.';
    }

    if (typeof ScrambleTextPlugin !== 'undefined') {
      gsap.to(err, {
        duration: 0.8,
        scrambleText: { text: hint, chars: "abcdefghijklmnopqrstuvwxyz", speed: 0.4 },
        ease: "none"
      });
    } else {
      err.textContent = hint;
    }
  }
}


/* ===================== THREE.JS PARALLAX =====================
   The root problem: CSS owns `transform` on .dante-layer via the
   .dante-in class (translateY(0)). Writing el.style.transform from
   JS triggers the CSS transition and fights the class rule.

   Solution: JS never touches `transform` on individual layers.
   Instead each layer gets a wrapper <div> that JS translates freely,
   while the layer element itself stays CSS-only.

   star2 is fully excluded — CSS owns its animation.
   Touch devices skip entirely.
================================================================ */

function initThreeParallax() {
  if (isTouchDevice) return;

  const container = document.querySelector('.dante-parallax');
  const portal    = document.querySelector('.portal');
  if (!container || !portal) return;

  const shells = [];

  /* ── Helper: wrap any element in a parallax shell ──
     JS moves only the shell; the element inside keeps
     its own CSS transforms/animations completely untouched. */
  function makeShell(el, depth, opts = {}) {
    if (!el) return;
    if (el.parentElement && el.parentElement.classList.contains('parallax-shell')) return;

    const shell = document.createElement('div');
    shell.className = 'parallax-shell';

    const isAbsolute = opts.forceAbsolute ||
      getComputedStyle(el).position === 'absolute';

    shell.style.cssText = [
      isAbsolute ? 'position:absolute' : 'position:relative',
      'top:0', 'left:0',
      'width:100%',
      'will-change:transform',
      /* shells that wrap interactive elements must pass pointer events through */
      opts.interactive ? 'pointer-events:auto' : 'pointer-events:none',
    ].join(';');

    el.parentNode.insertBefore(shell, el);
    shell.appendChild(el);
    shells.push({ shell, depth });
  }

  /* ── 1. Dante image layers (non-star2) ── */
  container.querySelectorAll('.dante-layer:not(.star2)').forEach(layer => {
    const depth = parseFloat(layer.dataset.depth) || 0.1;
    makeShell(layer, depth, { forceAbsolute: getComputedStyle(layer).position === 'absolute' });
  });

  /* ── 2. star2 — CSS owns the spin via --star2-rot; shell handles XY offset ── */
  const star2 = container.querySelector('.star2');
  if (star2) {
    makeShell(star2, 0.7, { forceAbsolute: true });
  }

  /* ── 3. Hero text + login button ──
     These are flex children of .center — wrapping them in a div
     breaks the layout. Instead we drive them via CSS custom
     properties so JS never conflicts with any existing transform. */
  const textEl  = document.querySelector('.center .text');
  const loginEl = document.querySelector('.center .login');

  /* Inject the custom-property transform once, then update vars each frame.
     Any pre-existing CSS transform (opacity transitions etc.) is preserved
     because we're adding a NEW transform that reads the vars.            */
  function injectVarTransform(el) {
    if (!el) return;
    el.style.setProperty('--px', '0px');
    el.style.setProperty('--py', '0px');
    /* Append to whatever transform is already there by reading it back.
       Safest: just set will-change and write transform directly each tick
       using the vars — since these elements have no competing class
       transform (unlike .dante-layer which has .dante-in translateY).   */
    el.style.willChange = 'transform';
  }

  injectVarTransform(textEl);
  injectVarTransform(loginEl);

  /* ── Smooth mouse tracking — listen on .center so text/login
        keep responding when mouse drifts below .portal          ── */
  const center = document.querySelector('.center') || portal;

  const target  = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  const SPREAD  = 28;
  const TILT    = 8;

  center.addEventListener('mousemove', e => {
    const r  = portal.getBoundingClientRect();
    const nx = (e.clientX - (r.left + r.width  / 2)) / (r.width  / 2);
    const ny = (e.clientY - (r.top  + r.height / 2)) / (r.height / 2);
    target.x =  nx * SPREAD;
    target.y = -ny * SPREAD;
  });

  center.addEventListener('mouseleave', () => {
    target.x = 0;
    target.y = 0;
  });

  /* ── RAF loop ── */
  function tick() {
    requestAnimationFrame(tick);

    current.x += (target.x - current.x) * 0.07;
    current.y += (target.y - current.y) * 0.07;

    /* Tilt the dante-parallax container */
    const tx = (current.x / SPREAD) * TILT;
    const ty = (current.y / SPREAD) * TILT;
    container.style.transform = `rotateY(${tx}deg) rotateX(${-ty}deg)`;

    /* Shells inside .dante-parallax */
    shells.forEach(({ shell, depth }) => {
      const px = current.x * depth;
      const py = current.y * depth;
      shell.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    });

    /* text + login: write transform directly — these elements have no
       competing CSS class transform so there is no conflict here.
       We preserve any existing inline transform prefix (e.g. the
       desktop !important margin-based positioning leaves transform:none). */
    if (textEl) {
      const px = current.x * 0.18;
      const py = current.y * 0.18;
      textEl.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    }
    if (loginEl) {
      const px = current.x * 0.12;
      const py = current.y * 0.12;
      /* On mobile the login has translateX(-50%) from CSS !important.
         We must preserve it or the button jumps off-centre.           */
      const isMobile = window.innerWidth <= 1024;
      loginEl.style.transform = isMobile
        ? `translateX(-50%) translate3d(${px}px, ${py}px, 0)`
        : `translate3d(${px}px, ${py}px, 0)`;
    }
  }

  tick();
}