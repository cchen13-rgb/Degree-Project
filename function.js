console.log(document.getElementById("particles"));
document.addEventListener("DOMContentLoaded", () => {

const door = document.getElementById("door");
const particleContainer = document.getElementById("particles");

console.log("Particles container:", particleContainer);

/* DOOR */

door.addEventListener("click", () => {

    door.style.transform = "scale(12)";

    setTimeout(() => {
        window.location.href = "landing.html";
    }, 800);

});

/* PARTICLES */

function createParticle() {

    const particle = document.createElement("div");
    particle.classList.add("particle");

    particle.style.left = Math.random() * 100 + "vw";
    particle.style.animationDuration = (3 + Math.random() * 5) + "s";
    particle.style.opacity = Math.random();

    particleContainer.appendChild(particle);

    setTimeout(() => {
        particle.remove();
    }, 8000);

}

setInterval(createParticle, 300);

});