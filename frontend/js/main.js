/* ============================================================
   KIRAN ENOSH — MAIN.JS (Homepage)
   3D particle background, navbar scroll, mobile menu, reveals
   ============================================================ */

// ---------- NAVBAR SCROLL EFFECT ----------
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ---------- MOBILE HAMBURGER MENU ----------
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

// Close menu on link click (mobile)
document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
  });
});

// ---------- REVEAL ON SCROLL ----------
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

/* ============================================================
   3D PARTICLE BACKGROUND (Three.js)
   ============================================================ */
const canvas = document.getElementById('bg-canvas');

if (canvas && window.THREE) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a1128, 0.008);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 30;

  /* --- Blue particle cloud --- */
  const particlesGeometry = new THREE.BufferGeometry();
  const particleCount = 900;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 100;
  }

  particlesGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3)
  );

  // Find your particlesMaterial code and change the color to a slightly darker blue
const particlesMaterial = new THREE.PointsMaterial({
  size: 0.35,
  color: 0x1a5fbf, // Darker blue for white background
  transparent: true,
  opacity: 0.6,
  blending: THREE.AdditiveBlending,
});

// Find your accentMaterial code and change the color
const accentMaterial = new THREE.PointsMaterial({
  size: 0.5,
  color: 0xff5500, // Darker orange
  transparent: true,
  opacity: 0.7,
  blending: THREE.AdditiveBlending,
});
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);

  /* --- Orange accent particles --- */
  const accentGeo = new THREE.BufferGeometry();
  const accentCount = 250;
  const accentPositions = new Float32Array(accentCount * 3);

  for (let i = 0; i < accentCount * 3; i++) {
    accentPositions[i] = (Math.random() - 0.5) * 100;
  }

  accentGeo.setAttribute('position', new THREE.BufferAttribute(accentPositions, 3));

  const accentMaterial = new THREE.PointsMaterial({
    size: 0.5,
    color: 0xff7b00,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });

  const accentParticles = new THREE.Points(accentGeo, accentMaterial);
  scene.add(accentParticles);

  /* --- Mouse parallax --- */
  let mouseX = 0;
  let mouseY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* --- Resize --- */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* --- Animation loop --- */
  function animate() {
    requestAnimationFrame(animate);

    particles.rotation.y += 0.0008;
    particles.rotation.x += 0.0004;

    accentParticles.rotation.y -= 0.0011;
    accentParticles.rotation.x -= 0.0005;

    particles.rotation.y += mouseX * 0.002;
    particles.rotation.x += mouseY * 0.002;

    accentParticles.rotation.y += mouseX * 0.003;
    accentParticles.rotation.x += mouseY * 0.003;

    renderer.render(scene, camera);
  }

  animate();
}

/* ============================================================
   FALLBACK — If video can't load, hide it gracefully
   ============================================================ */
const bgVideo = document.querySelector('.about-bg-video');
if (bgVideo) {
  bgVideo.addEventListener('error', () => {
    bgVideo.style.display = 'none';
  });
}

console.log('🚀 Kiran Enosh homepage loaded');