
import React, { useMemo, useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { useWishStore } from '../store';

// --------------------------------------------------------
// LUXURY SHADER MATERIAL
// --------------------------------------------------------

const LuxShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorTop: new THREE.Color('#FFD700'), // Gold
    uColorBottom: new THREE.Color('#FFFFFF'), // White
    uPixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 2.0,
    uSize: 120.0,
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform float uPixelRatio;
    uniform float uSize;
    
    attribute float aScale;
    attribute vec3 aColor;
    attribute vec3 aRandom;
    
    varying vec3 vColor;
    
    void main() {
      vColor = aColor;

      vec3 pos = position;
      
      // ORGANIC MOVEMENT
      float time = uTime * 0.15; // Slow, elegant movement
      
      // Vertical flowing motion (like rising bubbles or falling snow depending on perspective)
      pos.y += sin(time + pos.x * 2.0) * 0.02;
      pos.x += cos(time + pos.z * 1.0) * 0.01;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation
      gl_PointSize = uSize * aScale * uPixelRatio * (1.0 / -mvPosition.z);
    }
  `,
  // Fragment Shader
  `
    varying vec3 vColor;
    
    void main() {
      // Crisp Circle
      vec2 xy = gl_PointCoord.xy - vec2(0.5);
      float r = length(xy);
      
      if (r > 0.5) discard;

      // High contrast core with slight glow
      float alpha = 1.0 - smoothstep(0.4, 0.5, r);
      
      // Additive Blending
      gl_FragColor = vec4(vColor, alpha);
    }
  `
);

extend({ LuxShaderMaterial });

// --------------------------------------------------------
// COMPONENT
// --------------------------------------------------------

interface LuxBallProps {
  id: string;
  text: string;
  color: string;
  position: [number, number, number];
}

export const LuxBall: React.FC<LuxBallProps> = ({ id, color, position }) => {
  const materialRef = useRef<THREE.ShaderMaterial & { uTime: number }>(null!);
  const pointsRef = useRef<THREE.Points>(null!);
  const setFocusedWishId = useWishStore(state => state.setFocusedWishId);

  // Trajectory Animation
  const { pos } = useSpring({
    from: { pos: [0, 15, 30] },
    to: { pos: position },
    config: { mass: 2, tension: 50, friction: 15 },
    delay: 100,
  });

  const { positions, colors, randoms, scales } = useMemo(() => {
    const count = 1200; // Higher density for this style
    const radius = 0.6; 

    const positions = [];
    const colors = [];
    const randoms = [];
    const scales = [];
    
    const cTop = new THREE.Color(color); 
    const cBottom = new THREE.Color('#ffffff'); 
    const tempColor = new THREE.Color();

    let i = 0;
    while (i < count) {
      // 1. RANDOM SPHERE POINT
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      
      // 2. DENSITY LOGIC (The "Lux" Pattern)
      // We want dense poles (y near 1 or -1) and sparse equator (y near 0).
      // y = r * cos(phi). Normalized y is cos(phi).
      const normalizedY = Math.cos(phi); // -1 to 1
      const absY = Math.abs(normalizedY);
      
      // Probability function: 
      // Higher chance to keep particle if absY is high (near poles).
      // Lower chance if absY is low (near equator).
      // Formula: keep if random < (0.1 + 0.9 * absY^2)
      // The ^2 makes the drop-off sharper towards the center.
      const probability = 0.05 + 0.95 * Math.pow(absY, 3);
      
      if (Math.random() > probability) continue; // Skip this point to create sparsity

      // Calculate Position
      let x = radius * Math.sin(phi) * Math.cos(theta);
      let y = radius * Math.cos(phi);
      let z = radius * Math.sin(phi) * Math.sin(theta);
      
      positions.push(x, y, z);

      // Color Gradient
      const t = (normalizedY + 1) / 2; 
      tempColor.copy(cBottom).lerp(cTop, t);
      colors.push(tempColor.r, tempColor.g, tempColor.b);

      randoms.push(Math.random(), Math.random(), Math.random());
      
      // Scale: Particles at poles are slightly smaller/finer, center ones larger
      scales.push((0.4 + 0.6 * (1.0 - absY)) * (0.8 + Math.random() * 0.4));
      
      i++;
    }

    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
      randoms: new Float32Array(randoms),
      scales: new Float32Array(scales),
    };
  }, [color]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
    }
    if (pointsRef.current) {
      // Elegant Rotation
      pointsRef.current.rotation.y += 0.003; 
      
      const currentPos = pos.get() as [number, number, number];
      pointsRef.current.position.set(currentPos[0], currentPos[1], currentPos[2]);
    }
  });

  return (
    <animated.points 
      ref={pointsRef} 
      onDoubleClick={(e) => {
        e.stopPropagation();
        setFocusedWishId(id);
      }}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aColor" count={colors.length / 3} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={randoms.length / 3} array={randoms} itemSize={3} />
        <bufferAttribute attach="attributes-aScale" count={scales.length} array={scales} itemSize={1} />
      </bufferGeometry>
      {/* @ts-ignore */}
      <luxShaderMaterial
        ref={materialRef}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </animated.points>
  );
};
