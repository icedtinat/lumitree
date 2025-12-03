import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, RefreshCw, Send } from 'lucide-react'; // 引入了 RefreshCw 图标用于 Reseed
import { clsx } from 'clsx';

interface OverlayProps {
  onRegrow: () => void;
}

// 粒子风格图标组件 (保持不变)
const ParticleIcon = ({ type, selected }: { type: 'ball' | 'star' | 'gift' | 'cane'; selected: boolean }) => {
  return (
    <div className={clsx(
      "w-12 h-12 border-2 border-dotted transition-all duration-300 flex items-center justify-center cursor-pointer relative",
      selected ? "border-orange-400 shadow-[0_0_15px_rgba(251,191,36,0.5)] scale-110" : "border-white/30 hover:border-white/60",
      type === 'ball' && "rounded-full",
      type === 'gift' && "rounded-md",
      type === 'cane' && "rounded-t-3xl rounded-b-none",
      type === 'star' && "rotate-45" // 简单的样式区分
    )}>
      {/* 选中时的内部填充 */}
      <div className={clsx("w-full h-full opacity-50 transition-colors", selected ? "bg-orange-400/20" : "bg-transparent")} />
    </div>
  );
};

export const Overlay: React.FC<OverlayProps> = ({ onRegrow }) => {
  const [isWishing, setIsWishing] = useState(false);
  const [wishText, setWishText] = useState('');
  const [selectedVessel, setSelectedVessel] = useState<'ball' | 'star' | 'gift' | 'cane'>('ball');

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 flex flex-col justify-between p-8 md:p-12 font-mono">
      
      {/* --- 头部区域 (来自 UIOverlay 的设计风格) --- */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="flex flex-col items-start space-y-2 pointer-events-auto"
      >
        <h1 className="text-white text-5xl md:text-7xl font-thin tracking-tighter drop-shadow-2xl">
          LUMINA
        </h1>
        {/* 标志性的橙色渐变分割线 */}
        <div className="h-0.5 w-24 bg-gradient-to-r from-orange-400 to-transparent opacity-80" />
        <p className="text-orange-200 text-xs md:text-sm tracking-[0.2em] uppercase opacity-70 font-light">
          The Digital Tree of Whispers
        </p>
      </motion.div>

      {/* --- 底部区域 --- */}
      <footer className="flex justify-between items-end w-full pointer-events-none">
        
        {/* 左下角：技术参数 (保留自原 Overlay) */}
        <div className="hidden md:block text-white/30 text-[10px] md:text-xs font-mono pointer-events-auto space-y-1">
          <p>VERTICES: 80,000</p>
          <p>RENDER: R3F / GLSL / INSTANCED</p>
          <p className="text-orange-400/50">INTERACTION: ENABLED</p>
        </div>

        {/* 右下角：操作按钮组 */}
        <div className="flex gap-4 items-center pointer-events-auto">
            
            {/* 1. Reseed 按钮 (原 Overlay 功能，样式微调适配新风格) */}
            <button 
              onClick={onRegrow}
              className="group flex items-center gap-2 px-4 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-orange-400/30 transition-all active:scale-95 backdrop-blur-sm"
              title="Regenerate Tree"
            >
              <RefreshCw className="w-4 h-4 text-white/40 group-hover:text-orange-200 transition-colors group-hover:rotate-180 duration-500" />
              <span className="hidden md:block text-xs font-bold tracking-widest text-white/40 group-hover:text-orange-100 uppercase">Reseed</span>
            </button>

            {/* 2. 核心交互 "Make a Wish" 按钮 */}
            <motion.button
              layoutId="wish-button"
              onClick={() => setIsWishing(true)}
              className="relative group bg-gradient-to-r from-orange-900/40 to-black/40 border border-orange-500/30 px-6 md:px-8 py-3 md:py-4 rounded-full backdrop-blur-xl transition-all shadow-[0_0_20px_rgba(251,146,60,0.1)] hover:shadow-[0_0_40px_rgba(251,146,60,0.3)] hover:border-orange-400 active:scale-95 flex items-center gap-3 overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-5 h-5 text-orange-300 animate-pulse" />
              <span className="uppercase tracking-[0.15em] text-xs md:text-sm font-bold text-white group-hover:text-orange-100">
                  Make a Wish
              </span>
              {/* 扫光动画 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
            </motion.button>
        </div>
      </footer>

      {/* --- 全屏许愿弹窗 (样式优化：橙色/琥珀色系) --- */}
      <AnimatePresence>
        {isWishing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center pointer-events-auto p-4"
          >
            <div className="absolute inset-0" onClick={() => setIsWishing(false)} />

            <motion.div
              layoutId="wish-button"
              className="relative w-full max-w-lg bg-black/60 border border-orange-500/20 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl shadow-orange-900/20"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-3xl font-thin tracking-tighter text-white mb-2">Inject Energy</h2>
                    <div className="h-0.5 w-12 bg-orange-500" />
                </div>
                <button onClick={() => setIsWishing(false)} className="text-white/40 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Input */}
              <div className="relative mb-8">
                <textarea
                  value={wishText}
                  onChange={(e) => setWishText(e.target.value)}
                  placeholder="Type your wish..."
                  maxLength={100}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all resize-none h-32 text-lg font-light"
                />
                <div 
                  className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 opacity-0 transition-opacity duration-500 -z-10 blur-sm"
                  style={{ opacity: Math.min(wishText.length / 30, 0.6) }}
                />
                <div className="text-right text-xs text-orange-200/50 mt-2 font-mono tracking-widest">
                    {wishText.length} / 100 ENERGY
                </div>
              </div>

              {/* Vessel Selector */}
              <div className="mb-8">
                <p className="text-xs uppercase tracking-widest text-white/40 mb-4 font-bold">Select Vessel</p>
                <div className="flex gap-4 justify-center">
                    {(['ball', 'gift', 'star', 'cane'] as const).map((vessel) => (
                        <div key={vessel} onClick={() => setSelectedVessel(vessel)}>
                            <ParticleIcon type={vessel} selected={selectedVessel === vessel} />
                        </div>
                    ))}
                </div>
              </div>

              {/* Submit Button */}
              <button 
                className={clsx(
                    "w-full py-4 rounded-xl font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 text-sm",
                    wishText.length > 0 
                        ? "bg-white text-black hover:bg-orange-300 shadow-[0_0_30px_rgba(251,146,60,0.4)]" 
                        : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                )}
                disabled={wishText.length === 0}
                onClick={() => {
                    console.log('Wish submitted:', { text: wishText, vessel: selectedVessel });
                    setWishText('');
                    setIsWishing(false);
                }}
              >
                <Send size={16} />
                <span>Crystallize</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};