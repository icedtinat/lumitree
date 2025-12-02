import React, { useMemo, useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { useWishStore } from '../store';

// --------------------------------------------------------
// 1. HELPER FUNCTIONS (From new ParticleSphere code)
// --------------------------------------------------------

const getUniqueWords = (text: string) => {
  const cleanText = text.replace(/[.,;，,。 \n\t]/g, ' ');
  const words = cleanText.split(' ').filter(w => w.length > 0);
  return [...new Set(words)];
};

const createWordTextureAtlas = (words: string[]) => {
  if (typeof document === 'undefined') return { texture: new THREE.Texture(), cols: 1, rows: 1 };
  
  if (words.length === 0) return { texture: new THREE.Texture(), cols: 1, rows: 1 };

  const count = words.length;
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  
  const canvas = document.createElement('canvas');
  const size = 2048; 
  canvas.width = size;
  canvas.height = size;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return { texture: new THREE.Texture(), cols: 1, rows: 1 };

  ctx.clearRect(0, 0, size, size);
  
  const cellWidth = size / cols;
  const cellHeight = size / rows;
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  
  words.forEach((word, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    
    const centerX = col * cellWidth + cellWidth / 2;
    const centerY = row * cellHeight + cellHeight / 2;
    
    let fontSize = cellHeight * 0.75; 
    ctx.font = `bold ${fontSize}px "Microsoft YaHei", "Arial", sans-serif`;
    
    const metrics = ctx.measureText(word);
    const textWidth = metrics.width;
    const maxWidth = cellWidth * 0.9;
    
    if (textWidth > maxWidth) {
      fontSize = fontSize * (maxWidth / textWidth);
      ctx.font = `bold ${fontSize}px "Microsoft YaHei", "Arial", sans-serif`;
    }
    
    ctx.fillText(word, centerX, centerY);
  });
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  return { texture, cols, rows };
};

// --------------------------------------------------------
// 2. CUSTOM SHADER MATERIAL
// --------------------------------------------------------

const ParticleShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorTop: new THREE.Color('#ffaa33'),
    uColorBottom: new THREE.Color('#ffffff'),
    uPixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 2.0,
    uSize: 95.0,
    uTexture: null,
    uAtlasGrid: new THREE.Vector2(1, 1),
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform float uPixelRatio;
    uniform float uSize;
    
    attribute float aScale;
    attribute vec3 aColor;
    attribute vec3 aRandom;
    attribute float aWordIndex;
    
    varying vec3 vColor;
    varying float vWordIndex;
    varying float vScale;
    
    void main() {
      vColor = aColor;
      vWordIndex = aWordIndex;
      vScale = aScale;
      
      vec3 pos = position;
      
      // ORGANIC MOVEMENT
      float time = uTime * 0.3;
      
      // Independent wiggling
      pos.x += sin(time + pos.y * 1.5 + aRandom.x) * 0.05;
      pos.y += cos(time + pos.x * 1.5 + aRandom.y) * 0.05;
      pos.z += sin(time + pos.z * 1.5 + aRandom.z) * 0.05;
      
      // Breathing effect
      float breath = sin(time * 0.5) * 0.08;
      pos += normal * breath;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation
      gl_PointSize = uSize * aScale * uPixelRatio * (1.0 / -mvPosition.z);
    }
  `,
  // Fragment Shader
  `
    uniform sampler2D uTexture;
    uniform vec2 uAtlasGrid;
    
    varying vec3 vColor;
    varying float vWordIndex;
    
    void main() {
      vec2 uv = gl_PointCoord;
      uv.y = 1.0 - uv.y; 
      
      float cols = uAtlasGrid.x;
      float rows = uAtlasGrid.y;
      
      float index = floor(vWordIndex + 0.5);
      float colIndex = mod(index, cols);
      float rowIndex = floor(index / cols);
      
      vec2 atlasUV = vec2(
        (colIndex + uv.x) / cols,
        1.0 - (rowIndex + 1.0 - uv.y) / rows
      );
      
      vec4 texColor = texture2D(uTexture, atlasUV);
      
      if (texColor.a < 0.3) discard;
      
      gl_FragColor = vec4(vColor, texColor.a);
    }
  `
);

extend({ ParticleShaderMaterial });

// --------------------------------------------------------
// 3. COMPONENT
// --------------------------------------------------------

interface WishSphereProps {
  id: string;
  text: string;
  color: string;
  position: [number, number, number];
}

export const WishSphere: React.FC<WishSphereProps> = ({ id, text, color, position }) => {
  const materialRef = useRef<THREE.ShaderMaterial & { uTime: number }>(null!);
  const pointsRef = useRef<THREE.Points>(null!);
  const setFocusedWishId = useWishStore(state => state.setFocusedWishId);

  // Animation: Trajectory from camera to tree (Retained from original code)
  const { pos } = useSpring({
    from: { pos: [0, 15, 30] },
    to: { pos: position },
    config: { mass: 2, tension: 50, friction: 15 },
    delay: 100,
  });

  // Data Generation (Memoized)
  const uniqueWords = useMemo(() => getUniqueWords(text), [text]);
  const { texture, cols, rows } = useMemo(() => createWordTextureAtlas(uniqueWords), [uniqueWords]);
  const atlasGrid = useMemo(() => new THREE.Vector2(cols, rows), [cols, rows]);

  const { positions, colors, randoms, scales, wordIndexes } = useMemo(() => {
    // New density and distribution logic from ParticleSphere.tsx
    const count = 2000; // Moderate count for performance with sprites
    const radius = 0.6; // Scale down from original 2.5 to fit on tree

    const positions = [];
    const colors = [];
    const randoms = [];
    const scales = [];
    const wordIndexes = [];
    
    const cTop = new THREE.Color(color); // Use the wish color
    const cBottom = new THREE.Color('#ffffff'); // White bottom
    const tempColor = new THREE.Color();

    let i = 0;
    while (positions.length < count * 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      
      const r = radius * (0.95 + Math.random() * 0.1); 

      let x = r * Math.sin(phi) * Math.cos(theta);
      let y = r * Math.cos(phi);
      let z = r * Math.sin(phi) * Math.sin(theta);
      
      // Density Logic (more at poles)
      const normalizedY = y / radius; 
      const densityVal = Math.abs(normalizedY);
      const densityProbability = 0.25 + 0.75 * Math.pow(densityVal, 2.5);
      
      if (Math.random() > densityProbability) continue;

      positions.push(x, y, z);
      
      // Color
      const t = (normalizedY + 1) / 2;
      tempColor.copy(cBottom).lerp(cTop, t);
      colors.push(tempColor.r, tempColor.g, tempColor.b);

      randoms.push(Math.random(), Math.random(), Math.random());
      
      // Scale
      const sizeBase = 2.5 - (densityVal * 1.5); 
      scales.push(sizeBase * (0.8 + Math.random() * 0.5));
      
      // Word Index
      const wIdx = Math.floor(Math.random() * uniqueWords.length);
      wordIndexes.push(wIdx);
      
      i++;
    }

    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
      randoms: new Float32Array(randoms),
      scales: new Float32Array(scales),
      wordIndexes: new Float32Array(wordIndexes)
    };
  }, [text, color, uniqueWords]);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.2; // Rotate the wish sphere
      
      // Apply Spring position
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
        <bufferAttribute attach="attributes-aWordIndex" count={wordIndexes.length} array={wordIndexes} itemSize={1} />
      </bufferGeometry>
      {/* @ts-ignore */}
      <particleShaderMaterial
        ref={materialRef}
        uTexture={texture}
        uAtlasGrid={atlasGrid}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </animated.points>
  );
};