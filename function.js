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

  /* Remove all existing particles immediately to free compositor resources */
  particleContainer = particleContainer || document.getElementById("particles");
  if (particleContainer) particleContainer.replaceChildren();
}

/* Pause/resume parallax ScrollTrigger */
let parallaxPaused = false;

function pauseParallax() {
  if (parallaxPaused || typeof ScrollTrigger === 'undefined') return;
  parallaxPaused = true;
  ScrollTrigger.getAll().forEach(t => t.disable());
}

function resumeParallax() {
  if (!parallaxPaused || typeof ScrollTrigger === 'undefined') return;
  parallaxPaused = false;
  ScrollTrigger.getAll().forEach(t => t.enable());
}


/* ===================== MAGNETIC BUTTON ===================== */

function bindMagneticHover(element, xFactor, yFactor, resetDuration, resetEase) {
  if (!element || element.dataset.magneticBound === 'true') return;

  element.dataset.magneticBound = 'true';

  element.addEventListener('mousemove', (e) => {
    const r = element.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    gsap.to(element, { x: x * xFactor, y: y * yFactor, duration: 0.4, ease: "power2.out", overwrite: true });
  });

  element.addEventListener('mouseleave', () => {
    gsap.to(element, { x: 0, y: 0, duration: resetDuration, ease: resetEase, overwrite: true });
  });
}

function initMagneticButtons() {
  if (isTouchDevice) return;

  document.querySelectorAll('.login').forEach(btn => {
    bindMagneticHover(btn, 0.3, 0.3, 0.7, "elastic.out(1, 0.4)");
  });

  /* star2 is NEVER given to GSAP - CSS owns its transform entirely */
  document.querySelectorAll('.star:not(.star2)').forEach(star => {
    bindMagneticHover(star, 0.4, 0.4, 0.9, "elastic.out(1, 0.3)");
  });
}

function startPostEntryEffects() {
  if (postEntryEffectsStarted) return;
  postEntryEffectsStarted = true;
  startParticles();
  initMagneticButtons();
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

let entryDone   = false;
let imageLayers = [];
let stars       = [];
let portal3d    = null;
let textEl      = null;
let loginEl     = null;

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

    /* ---- Set initial hidden state ---- */
    /* star2 never gets a transform — CSS owns it */
    document.querySelectorAll('.dante-layer.star').forEach(el => {
      if (el.classList.contains('star2')) {
        el.style.opacity = '0';
      } else {
        el.style.transition = 'none';
        el.style.transform  = 'translateY(120px)';
        el.style.opacity    = '0';
      }
    });

    /* Hide login and text from the start */
    const heroLogin = document.querySelector('.center .login');
    const heroText  = document.querySelector('.center .text');
    if (heroLogin) heroLogin.style.opacity = '0';
    if (heroText)  heroText.style.opacity  = '0';

    /* ---- Wait for loader to fully disappear before any fade starts ---- */
    setTimeout(() => {

      /* Trigger CSS staggered fade-in on webp layers */
      document.querySelectorAll('.dante-layer:not(.star)').forEach(el => {
        el.classList.add('dante-in');
      });

      /* star1 animate in with JS transition */
      document.querySelectorAll('.dante-layer.star').forEach(el => {
        if (el.classList.contains('star2')) {
          /* fade first, then start the CSS spin once fully visible */
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

      /* ---- Login fades in after layers have had time to appear ---- */
      if (heroLogin) {
        heroLogin.style.transition = 'opacity 2s ease';
        setTimeout(() => {
          heroLogin.style.opacity = '1';
        }, 1800);
      }

      /* ---- Keep desktop startup lighter by using a simple fade for hero text ---- */
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
        setTimeout(() => {
          heroText.style.opacity = '1';
        }, 1400);
      }

    }, 1300); /* 800ms loader fade + extra settle time for first hero decode/paint */

    /* ---- Hand off to GSAP ScrollTrigger after everything has settled ---- */
    setTimeout(() => {
      imageLayers = [...document.querySelectorAll('.dante-layer:not(.star)')];
      stars       = [...document.querySelectorAll('.dante-layer.star')];
      portal3d    = document.querySelector('.portal');
      textEl      = document.querySelector('.center .text');
      loginEl     = document.querySelector('.center .login');

      stars.forEach(el => {
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
        initCinematicParallax();
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
    pauseParallax();
  });
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove('open');
  body.classList.remove('modal-open');
  startParticles();
  resumeParallax();
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


/* ===================== DANTE PARALLAX SCROLL — GSAP ScrollTrigger ===================== */

function initCinematicParallax() {
  if (!portal3d) return;

  ScrollTrigger.getAll().forEach(t => t.kill());

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: portal3d,
      start: "top top",
      end: "+=100%",
      scrub: 0.35,
      onEnter: () => {
        imageLayers.forEach(el => el.style.willChange = 'transform, opacity');
      },
      onLeave: () => {
        imageLayers.forEach(el => el.style.willChange = 'auto');
      },
      onEnterBack: () => {
        imageLayers.forEach(el => el.style.willChange = 'transform, opacity');
      },
      onLeaveBack: () => {
        imageLayers.forEach(el => el.style.willChange = 'auto');
      }
    }
  });

  imageLayers.forEach((el) => {
    const depth  = parseFloat(el.dataset.depth) || 0.1;
    const isBack = depth <= 0.22;
    const yDist  = isBack ? depth * 190 : depth * 95;
    const rotX   = isBack ? depth * 4 : 0;
    tl.to(el, { y: yDist, rotateX: rotX, opacity: 0, ease: "power1.inOut", duration: 1 }, 0);
  });

  /* star2: opacity fade ONLY — GSAP never sets x/y/transform on it */
  stars.forEach((el, i) => {
    const depth = parseFloat(el.dataset.depth) || 0.1;
    if (el.classList.contains('star2')) {
      tl.to(el, { opacity: 0, ease: "power2.in", duration: 0.7 }, 0);
    } else {
      tl.to(el, {
        y: depth * 85,
        x: (i % 2 === 0 ? 1 : -1) * depth * 22,
        opacity: 0,
        ease: "power2.in",
        duration: 0.7
      }, 0);
    }
  });

  tl.to(portal3d, { scale: 1.03, opacity: 0, ease: "power2.inOut", duration: 1 }, 0);
  if (textEl)  tl.to(textEl,  { y: 24, opacity: 0, ease: "power2.in", duration: 0.6 }, 0);
  if (loginEl) tl.to(loginEl, { y: 24, opacity: 0, ease: "power2.in", duration: 0.6 }, 0.05);
}

window.addEventListener('scroll', () => {
  /* no-op — ScrollTrigger owns scroll */
});
