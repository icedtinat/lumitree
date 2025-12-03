import React, { Suspense, useState, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Experience } from './components/Experience';
import { Overlay } from './components/Overlay';
import { useWishStore } from './store';

export default function App() {
  const [triggerGrow, setTriggerGrow] = useState(0);
  const { focusedWishId, setFocusedWishId, wishes } = useWishStore();

  const handleRegrow = useCallback(() => {
    setTriggerGrow(prev => prev + 1);
  }, []);

  const isSplit = !!focusedWishId;

  // Find the content of the currently focused wish
  const focusedWish = useMemo(() => 
    wishes.find(w => w.id === focusedWishId), 
  [wishes, focusedWishId]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-mono">
      
      {/* --- EXIT BUTTON (Visible in Split Mode) --- */}
      <button
        onClick={() => setFocusedWishId(null)}
        className={`absolute top-6 left-6 z-50 group flex items-center space-x-2 text-white/70 hover:text-white transition-all duration-500 ${isSplit ? 'opacity-100 translate-y-0 delay-300' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
      >
        <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-sm group-hover:bg-white/10 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <span className="text-sm tracking-widest uppercase">Close View</span>
      </button>

      {/* --- MAIN CONTAINER --- */}
      <div className="flex w-full h-full">

        {/* --- LEFT SIDE: 3D CANVAS (The Tree) --- */}
        <div className={`relative h-full transition-[width] duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isSplit ? 'w-1/2' : 'w-full'}`}>
          <Canvas
            dpr={[1, 2]}
            camera={{ position: [0, 5, 35], fov: 45 }}
            gl={{ antialias: false, alpha: false }}
            resize={{ debounce: 0 }}
          >
            <color attach="background" args={['#050505']} />
            <Suspense fallback={null}>
              <Experience triggerGrow={triggerGrow} />
            </Suspense>
          </Canvas>
          
          {/* Only show the main UI overlay when NOT in split mode */}
          <div className={`transition-opacity duration-500 ${isSplit ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <Overlay onRegrow={handleRegrow} />
          </div>
        </div>

        {/* --- RIGHT SIDE: CONTENT PANEL (Wish Details) --- */}
        <div 
          className={`relative h-full overflow-hidden transition-[width] duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isSplit ? 'w-1/2' : 'w-0'}`}
        >
          {/* Glassmorphism Container */}
          <div className={`absolute inset-0 w-full h-full border-l border-white/10 bg-white/5 backdrop-blur-2xl p-12 md:p-16 overflow-y-auto custom-scrollbar transition-opacity duration-700 delay-100 ${isSplit ? 'opacity-100' : 'opacity-0'}`}>
            
            <div className="max-w-xl mx-auto mt-12 flex flex-col space-y-8">
              {/* Header */}
              <div className="space-y-2">
                 <h2 className="text-3xl md:text-4xl text-white font-thin tracking-tighter">
                   WISH FRAGMENT
                 </h2>
                 <p className="text-cyan-300/80 text-xs uppercase tracking-widest">
                   ID: {focusedWishId}
                 </p>
              </div>
              
              <div className="w-full h-px bg-gradient-to-r from-white/20 to-transparent" />

              {/* Wish Content */}
              <div className="text-white/80 leading-relaxed text-sm md:text-xl space-y-6 font-mono">
                 <p>
                   "{focusedWish?.text}"
                 </p>
              </div>
              
               <div className="w-full h-px bg-gradient-to-r from-white/20 to-transparent" />
               
               <div className="text-white/40 text-xs italic">
                 "Particle representation of user intention."
               </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}