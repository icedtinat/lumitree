import React, { useRef } from 'react';
import { CameraControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useFrame } from '@react-three/fiber';
import { ParticleTree } from './ParticleTree';
import { WishSphere } from './WishSphere';
import { useWishStore } from '../store';

interface ExperienceProps {
  triggerGrow: number;
}

export const Experience: React.FC<ExperienceProps> = ({ triggerGrow }) => {
  const wishes = useWishStore((state) => state.wishes);
  const controlsRef = useRef<CameraControls>(null);
  const isInteracting = useRef(false);

  // Custom Auto-Rotate Logic
  useFrame((state, delta) => {
    if (controlsRef.current && !isInteracting.current) {
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
        minDistance={2}
        maxDistance={50}
        dollyToCursor={true}
        onStart={() => { isInteracting.current = true; }}
        onEnd={() => { isInteracting.current = false; }}
      />

      <ambientLight intensity={0.5} />
      
      <group position={[0, -8, 0]}>
        <ParticleTree key={triggerGrow} />
        
        {wishes.map((wish) => (
          <WishSphere 
            key={wish.id}
            id={wish.id}
            text={wish.text}
            color={wish.color}
            position={wish.position}
          />
        ))}
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