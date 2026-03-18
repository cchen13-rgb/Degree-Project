/**
 * THEME & PERFORMANCE CONFIG
 */
const isMobile = window.matchMedia("(max-width: 1024px)").matches;
const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

const ParticleConfig = {
    maxParticles: isMobile ? 25 : 60,
    particleColor: 'rgba(0, 0, 0,',
    isActive: false,
    isPaused: false
};

let canvas, ctx, particles = [];
let particleAnimationId = null;

/**
 * 1. CANVAS PARTICLES
 */
function updateParticleColor() {
    const isDark = document.body.classList.contains('dark');
    ParticleConfig.particleColor = isDark ? 'rgba(13, 13, 13,' : 'rgba(0, 0, 0,';
}

class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * (canvas ? canvas.width : window.innerWidth);
        this.y = (canvas ? canvas.height : window.innerHeight) + 20;
        this.size = Math.random() * (isMobile ? 1.2 : 2.5) + 0.5;
        this.speed = Math.random() * 1.2 + 0.4;
        this.opacity = Math.random() * 0.4 + 0.1;
    }
    update() {
        this.y -= this.speed;
        if (this.y < -20) this.reset();
    }
    draw() {
        ctx.fillStyle = `${ParticleConfig.particleColor}${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function animateParticles() {
    if (!ParticleConfig.isActive || ParticleConfig.isPaused) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (particles.length < ParticleConfig.maxParticles) particles.push(new Particle());
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    particleAnimationId = requestAnimationFrame(animateParticles);
}

function startParticles() {
    if (ParticleConfig.isActive) return;
    ParticleConfig.isActive = true;
    updateParticleColor();
    animateParticles();
}

function stopParticles() {
    ParticleConfig.isActive = false;
    if (particleAnimationId) cancelAnimationFrame(particleAnimationId);
}

function initParticles() {
    const container = document.getElementById("particles");
    if (!container || canvas) return;
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    container.appendChild(canvas);
    const resizer = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizer, { passive: true });
    resizer();
    const observer = new IntersectionObserver((entries) => {
        entries[0].isIntersecting ? startParticles() : stopParticles();
    }, { threshold: 0.01 });
    observer.observe(container);
}

/**
 * 2. MAGNETIC EFFECTS
 */
function initMagneticButtons() {
    if (isTouch) return; 
    document.querySelectorAll('.login, .star:not(.star2)').forEach(el => {
        const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power2.out" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power2.out" });
        el.addEventListener('mousemove', (e) => {
            const r = el.getBoundingClientRect();
            const x = (e.clientX - r.left - r.width / 2) * 0.3;
            const y = (e.clientY - r.top - r.height / 2) * 0.3;
            xTo(x); yTo(y);
        });
        el.addEventListener('mouseleave', () => {
            gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" });
        });
    });
}

/**
 * 3. INITIALIZATION & ENTRY
 */
document.addEventListener("DOMContentLoaded", () => {
    initParticles();
    if (!isTouch) initMagneticButtons();

    // Force hide elements before animation starts
    gsap.set(['.dante-layer', '.star', '.center .login', '.center .text'], { opacity: 0 });

    const door = document.getElementById("door");
    if (door) {
        door.addEventListener("click", () => {
            gsap.timeline()
                .to(['.enter', '.curveText'], { opacity: 0, duration: 0.3 })
                .to(door, { scale: isMobile ? 15 : 25, duration: 0.8, ease: "power2.inOut" })
                .to(door, { opacity: 0, duration: 0.5, onComplete: () => window.location.href = "landing.html" });
        });
    }

    const toggle = document.getElementById("modeToggle");
    const syncTheme = () => {
        document.body.classList.toggle("dark");
        requestAnimationFrame(updateParticleColor);
    };
    if (toggle) toggle.addEventListener("change", syncTheme);
    document.addEventListener("click", (e) => {
        if (e.target.closest(".star")) syncTheme();
    });
});

window.addEventListener("load", () => {
    document.body.classList.add("loaded");
    
    const barFill = document.getElementById("loader-bar-fill");
    if (barFill) {
        gsap.to(barFill, { width: "100%", duration: 1.2, ease: "power1.inOut", onComplete: startPageEntry });
    } else {
        startPageEntry();
    }

    function startPageEntry() {
        const loader = document.getElementById("loader");
        if (loader) gsap.to(loader, { opacity: 0, duration: 0.5, onComplete: () => loader.remove() });

        const layers = document.querySelectorAll('.dante-layer:not(.star)');
        const stars = document.querySelectorAll('.dante-layer.star');
        const heroLogin = document.querySelector('.center .login');
        const heroText = document.querySelector('.center .text');

        const tl = gsap.timeline({ delay: 0.2 });

        // 1. Stagger Background Layers (1-5+)
        tl.to(layers, { 
            opacity: 1, 
            y: 0, 
            duration: 1.2, 
            stagger: 0.08, 
            ease: "power2.out" 
        });

        // 2. Pop in Flowers (Stars) - Slightly overlapped with layers
        tl.to(stars, { 
            opacity: 1, 
            y: 0, 
            duration: 1, 
            stagger: 0.1, 
            ease: "back.out(1.7)" 
        }, "-=0.8");

        // 3. Fade in Text and Login Button together
        tl.to([heroText, heroLogin], { 
            opacity: 1, 
            y: 0, 
            duration: 1, 
            stagger: 0.1, 
            ease: "power2.out" 
        }, "-=0.6");

        // 4. Run Scramble effect last
        if (heroText && !isMobile && typeof ScrambleTextPlugin !== 'undefined') {
            tl.to(heroText, { 
                scrambleText: { text: heroText.textContent, chars: "lowercase", speed: 0.5 },
                duration: 0.5
            }, "-=0.5");
        }

        setTimeout(() => {
            document.body.classList.add('entry-done');
            if (!isMobile) initCinematicParallax();
        }, 1500);
    }
});

function initCinematicParallax() {
    const portal = document.querySelector('.portal');
    if (!portal || isMobile || typeof ScrollTrigger === 'undefined') return;

    gsap.timeline({
        scrollTrigger: {
            trigger: portal,
            start: "top top",
            end: "+=100%",
            scrub: 0.5
        }
    })
    .to('.dante-layer:not(.star)', {
        y: (i, el) => (parseFloat(el.dataset.depth) || 0.1) * 300,
        opacity: 0,
        ease: "none"
    }, 0);
}

// Modal
const modal = document.getElementById('loginModal');
const loginBtn = document.querySelector('.login');
if (loginBtn && modal) {
    loginBtn.addEventListener('click', () => {
        modal.classList.add('open');
        document.body.classList.add('modal-open');
        stopParticles();
    });
}
window.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('modal-close')) {
        modal.classList.remove('open');
        document.body.classList.remove('modal-open');
        startParticles();
    }
});