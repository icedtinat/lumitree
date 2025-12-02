import React, { useRef } from 'react';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
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
  const focusedWishId = useWishStore((state) => state.focusedWishId);
  
  // Ref to controls to handle auto-rotate toggling
  const controlsRef = useRef<any>(null);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5, 35]} />
      <OrbitControls 
        ref={controlsRef}
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={10}
        maxDistance={50}
        target={[0, 6, 0]} 
        // Disable auto-rotate when a wish is focused to make reading easier
        autoRotate={!focusedWishId}
        autoRotateSpeed={0.5}
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