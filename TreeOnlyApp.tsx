import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { CameraControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { ParticleTree } from './components/ParticleTree';

// Minimal Scene Component
const TreeScene: React.FC = () => {
  const controlsRef = useRef<CameraControls>(null);

  // Auto-rotate logic
  useFrame((state, delta) => {
    if (controlsRef.current) {
      const azimuthAngle = controlsRef.current.azimuthAngle;
      controlsRef.current.azimuthAngle = azimuthAngle + delta * 0.1; 
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5, 35]} />
      
      <CameraControls 
        ref={controlsRef}
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={10}
        maxDistance={50}
        dollyToCursor={true}
      />

      <ambientLight intensity={0.5} />
      
      {/* Lower the tree slightly to center it */}
      <group position={[0, -8, 0]}>
        <ParticleTree />
      </group>

      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={0.2} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};

// Main Entry Point
export default function TreeOnlyApp() {
  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 5, 35], fov: 45 }}
        gl={{ antialias: false, alpha: false }}
        resize={{ debounce: 0 }}
      >
        <color attach="background" args={['#050505']} />
        <Suspense fallback={null}>
          <TreeScene />
        </Suspense>
      </Canvas>
    </div>
  );
}