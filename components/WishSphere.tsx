import React, { useMemo, useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { useWishStore } from '../store';

// --------------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------------

const getUniqueWords = (text: string) => {
  const cleanText = text.replace(/[.,;，,。 \n\t]/g, '');
  return [...new Set(cleanText.split(''))];
};

const createWordTextureAtlas = (words: string[]) => {
  if (typeof document === 'undefined') return { texture: new THREE.Texture(), cols: 1, rows: 1 };
  
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
    ctx.font = `bold ${fontSize}px "Microsoft YaHei", "PingFang SC", "Heiti SC", "SimHei", "Arial", sans-serif`;
    
    const metrics = ctx.measureText(word);
    const textWidth = metrics.width;
    const maxWidth = cellWidth * 0.9;
    
    if (textWidth > maxWidth) {
      fontSize = fontSize * (maxWidth / textWidth);
      ctx.font = `bold ${fontSize}px "Microsoft YaHei", "PingFang SC", "Heiti SC", "SimHei", "Arial", sans-serif`;
    }
    
    ctx.fillText(word, centerX, centerY);
  });
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  return { texture, cols, rows };
};

// --------------------------------------------------------
// CUSTOM SHADER MATERIAL
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
// WISH SPHERE COMPONENT
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

  // Animation: Fly from camera to tree position
  const { pos } = useSpring({
    from: { pos: [0, 15, 30] },
    to: { pos: position },
    config: { mass: 2, tension: 50, friction: 15 },
    delay: 100,
  });

  // Process text into unique characters
  const uniqueWords = useMemo(() => getUniqueWords(text), [text]);
  
  // Generate texture atlas
  const { texture, cols, rows } = useMemo(() => createWordTextureAtlas(uniqueWords), [uniqueWords]);
  const atlasGrid = useMemo(() => new THREE.Vector2(cols, rows), [cols, rows]);

  // Generate geometry data - SPIRAL PATTERN WITH GRADIENT
  const { positions, colors, randoms, scales, wordIndexes } = useMemo(() => {
    const count = 400;       // 粒子数量
    const radius = 1;       // 球体半径
    const spirals = 6;       // 螺旋线数量
    const turnsPerSpiral = 6; // 每条螺旋转几圈
    
    const positions = [];
    const colors = [];
    const randoms = [];
    const scales = [];
    const wordIndexes = [];
    
    // 渐变颜色设置
    const cTop = new THREE.Color(color);        // 顶部：愿望颜色
    const cBottom = new THREE.Color('#FFFFFF'); // 底部：白色
    const tempColor = new THREE.Color();
    
    const particlesPerSpiral = Math.floor(count / spirals);

    for (let s = 0; s < spirals; s++) {
      // 每条螺旋的起始角度偏移
      const spiralOffset = (s / spirals) * Math.PI * 2;
      
      for (let i = 0; i < particlesPerSpiral; i++) {
        // t 从 0 到 1，代表从南极到北极
        const t = i / particlesPerSpiral;
        
        // phi: 从底部到顶部 (π 到 0)
        const phi = Math.PI * (1 - t);
        
        // theta: 螺旋角度
        const theta = spiralOffset + t * turnsPerSpiral * Math.PI * 2;
        
        // 添加一点随机抖动
        const jitter = 0.05;
        const r = radius * (1 + (Math.random() - 0.5) * jitter);
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi);
        const z = r * Math.sin(phi) * Math.sin(theta);
        
        positions.push(x, y, z);
        
        // 渐变颜色：底部白色 -> 顶部愿望颜色
        const normalizedY = (y / radius + 1) / 2; // 0 = 底部, 1 = 顶部
        tempColor.copy(cBottom).lerp(cTop, normalizedY);
        colors.push(tempColor.r, tempColor.g, tempColor.b);
        
        // Animation attributes
        randoms.push(Math.random(), Math.random(), Math.random());
        
        // Scale: 中间大，两极小
        const distFromEquator = Math.abs(y / radius);
        const sizeBase = 1.5 - distFromEquator * 0.8;
        scales.push(sizeBase * (0.8 + Math.random() * 0.4));
        
        // Word index
        const wIdx = Math.floor(Math.random() * uniqueWords.length);
        wordIndexes.push(wIdx);
      }
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
      // Slow rotation
      pointsRef.current.rotation.y += delta * 0.05;
      
      // Apply spring position
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