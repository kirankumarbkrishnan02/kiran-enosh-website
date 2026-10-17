/* ============================================================
   KIRAN ENOSH — ABOUT.JS (Cinematic 3D Scroll Page)
   Uses Three.js to create a scroll-driven 3D scene:
   as you scroll, the camera flies through space while
   geometric objects rotate and shift position.
   ============================================================ */

/* ---------- REVEAL PANELS ON SCROLL ---------- */
const panels = document.querySelectorAll('.panel');

const panelObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.35 }
);

panels.forEach((panel) => panelObserver.observe(panel));

/* ---------- HIDE SCROLL HINT AFTER FIRST SCROLL ---------- */
const scrollHint = document.getElementById('scrollHint');
window.addEventListener('scroll', () => {
  if (window.scrollY > 100 && scrollHint) {
    scrollHint.classList.add('hidden');
  }
});

/* ============================================================
   THREE.JS CINEMATIC SCENE
   ============================================================ */
const canvas = document.getElementById('cinema-canvas');

if (canvas && window.THREE) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050a19, 0.012);

  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 25);

  /* ============================================================
     LIGHTING
     ============================================================ */
  scene.add(new THREE.AmbientLight(0x4a90e2, 0.6));

  const keyLight = new THREE.PointLight(0xff7b00, 2.5, 100);
  keyLight.position.set(15, 15, 15);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0x4a90e2, 2, 100);
  fillLight.position.set(-15, -10, 10);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xffffff, 1, 100);
  rimLight.position.set(0, -20, -10);
  scene.add(rimLight);

  /* ============================================================
     FLOATING 3D OBJECTS — one per scroll panel
     ============================================================ */
  const objects = [];

  // Panel 0 — Orange torus knot
  const knotGeo = new THREE.TorusKnotGeometry(3, 0.9, 100, 20);
  const knotMat = new THREE.MeshStandardMaterial({
    color: 0xff7b00,
    emissive: 0xff5500,
    emissiveIntensity: 0.4,
    metalness: 0.9,
    roughness: 0.2,
  });
  const knot = new THREE.Mesh(knotGeo, knotMat);
  knot.position.set(12, 5, -5);
  scene.add(knot);
  objects.push(knot);

  // Panel 1 — Blue wireframe icosahedron
  const icoGeo = new THREE.IcosahedronGeometry(3.5, 1);
  const icoMat = new THREE.MeshStandardMaterial({
    color: 0x4a90e2,
    emissive: 0x1a5fbf,
    emissiveIntensity: 0.4,
    metalness: 0.8,
    roughness: 0.3,
    wireframe: true,
  });
  const ico = new THREE.Mesh(icoGeo, icoMat);
  ico.position.set(-14, -3, -8);
  scene.add(ico);
  objects.push(ico);

  // Panel 2 — Golden torus
  const torusGeo = new THREE.TorusGeometry(3, 0.6, 30, 80);
  const torusMat = new THREE.MeshStandardMaterial({
    color: 0xffb347,
    emissive: 0xff7b00,
    emissiveIntensity: 0.5,
    metalness: 1,
    roughness: 0.1,
  });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  torus.position.set(14, -6, -4);
  scene.add(torus);
  objects.push(torus);

  // Panel 3 — Deep blue octahedron
  const octaGeo = new THREE.OctahedronGeometry(3.2);
  const octaMat = new THREE.MeshStandardMaterial({
    color: 0x1a5fbf,
    emissive: 0x4a90e2,
    emissiveIntensity: 0.5,
    metalness: 0.9,
    roughness: 0.15,
    flatShading: true,
  });
  const octa = new THREE.Mesh(octaGeo, octaMat);
  octa.position.set(-13, 5, -6);
  scene.add(octa);
  objects.push(octa);

  // Panel 4 — Orange wireframe dodecahedron
  const dodecaGeo = new THREE.DodecahedronGeometry(3);
  const dodecaMat = new THREE.MeshStandardMaterial({
    color: 0xff7b00,
    emissive: 0xff5500,
    emissiveIntensity: 0.6,
    metalness: 0.9,
    roughness: 0.2,
    wireframe: true,
  });
  const dodeca = new THREE.Mesh(dodecaGeo, dodecaMat);
  dodeca.position.set(13, 4, -5);
  scene.add(dodeca);
  objects.push(dodeca);

  /* ============================================================
     PARTICLE STARFIELD (deep background)
     ============================================================ */
  const starGeo = new THREE.BufferGeometry();
  const starCount = 1500;
  const starPositions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount * 3; i++) {
    starPositions[i] = (Math.random() - 0.5) * 250;
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

  const starMat = new THREE.PointsMaterial({
    size: 0.35,
    color: 0x7fb3ff,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
  });

  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  /* ============================================================
     MOUSE PARALLAX
     ============================================================ */
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ============================================================
     SCROLL-DRIVEN CAMERA
     ============================================================ */
  let scrollProgress = 0;
  let targetProgress = 0;

  window.addEventListener('scroll', () => {
    const max = document.body.scrollHeight - window.innerHeight;
    targetProgress = max > 0 ? window.scrollY / max : 0;
  });

  /* ============================================================
     RESIZE
     ============================================================ */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ============================================================
     ANIMATION LOOP
     ============================================================ */
  function animate() {
    requestAnimationFrame(animate);

    // Smooth camera scroll
    scrollProgress += (targetProgress - scrollProgress) * 0.06;

    // Smooth mouse parallax
    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;

    // Camera moves through space as user scrolls
    camera.position.z = 25 - scrollProgress * 10;
    camera.position.x = Math.sin(scrollProgress * Math.PI * 2) * 5 + targetX * 2;
    camera.position.y = scrollProgress * 3 - 1.5 + targetY * -1.5;
    camera.lookAt(0, 0, 0);

    // Rotate objects continuously
    objects.forEach((obj, i) => {
      obj.rotation.x += 0.003 + i * 0.001;
      obj.rotation.y += 0.004 + i * 0.001;

      // Each object drifts slightly based on scroll progress
      const influence = Math.sin(scrollProgress * Math.PI * 2 + i) * 0.3;
      obj.position.y += influence * 0.02;
    });

    // Stars rotate slowly
    stars.rotation.y += 0.0002;
    stars.rotation.x += 0.0001;

    renderer.render(scene, camera);
  }

  animate();
}

console.log('🎬 Kiran Enosh cinematic about page loaded');