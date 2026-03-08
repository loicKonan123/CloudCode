'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Scene ──────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x101b22, 0.025);

    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // transparent bg
    mount.appendChild(renderer.domElement);

    // ── Main wireframe cube ────────────────────────────
    const cubeGeo = new THREE.BoxGeometry(2.5, 2.5, 2.5);
    const cubeMat = new THREE.MeshBasicMaterial({
      color: 0x3caff6,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
    });
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    scene.add(cube);

    // Wireframe edges (sharper lines)
    const edgesGeo = new THREE.EdgesGeometry(cubeGeo);
    const edgesMat = new THREE.LineBasicMaterial({
      color: 0x3caff6,
      transparent: true,
      opacity: 0.9,
    });
    const edges = new THREE.LineSegments(edgesGeo, edgesMat);
    cube.add(edges);

    // ── Inner glowing core ─────────────────────────────
    const coreGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x1a6fa8,
      transparent: true,
      opacity: 0.25,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    const coreEdgesGeo = new THREE.EdgesGeometry(coreGeo);
    const coreEdgesMat = new THREE.LineBasicMaterial({
      color: 0x3caff6,
      transparent: true,
      opacity: 0.5,
    });
    const coreEdges = new THREE.LineSegments(coreEdgesGeo, coreEdgesMat);
    core.add(coreEdges);

    // ── Orbiting ring ──────────────────────────────────
    const ringGeo = new THREE.TorusGeometry(2.2, 0.008, 4, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x3caff6,
      transparent: true,
      opacity: 0.3,
    });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2;
    scene.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo.clone(), ringMat.clone());
    ring2.rotation.y = Math.PI / 3;
    scene.add(ring2);

    // ── Particles ──────────────────────────────────────
    const particleCount = 900;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 22;
    }
    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particlesMat = new THREE.PointsMaterial({
      size: 0.03,
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    // ── Lighting ───────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const light1 = new THREE.PointLight(0x3caff6, 2, 20);
    light1.position.set(5, 5, 5);
    scene.add(light1);

    const light2 = new THREE.PointLight(0x0055aa, 1.5, 20);
    light2.position.set(-5, -5, 5);
    scene.add(light2);

    // ── Mouse tracking ─────────────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
      mouseY = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    // ── Resize handler ─────────────────────────────────
    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Animation loop ─────────────────────────────────
    const clock = new THREE.Clock();
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Base rotation
      cube.rotation.x += 0.003;
      cube.rotation.y += 0.005;

      // Mouse influence (smooth lerp)
      cube.rotation.y += (mouseX * 0.4 - cube.rotation.y) * 0.04;
      cube.rotation.x += (mouseY * 0.3 - cube.rotation.x) * 0.04;

      // Inner core — counter-rotate + pulse
      core.rotation.x = -cube.rotation.x * 1.3;
      core.rotation.y = -cube.rotation.y * 1.3;
      const pulse = 1 + Math.sin(t * 2.2) * 0.12;
      core.scale.set(pulse, pulse, pulse);

      // Rings rotate on different axes
      ring1.rotation.z = t * 0.4;
      ring2.rotation.x = t * 0.3;

      // Particles drift slowly
      particles.rotation.y = t * 0.04;
      particles.rotation.x = mouseY * 0.05;

      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />;
}
