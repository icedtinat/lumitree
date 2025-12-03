import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, RefreshCw, Send } from 'lucide-react';
import { clsx } from 'clsx';
import { useWishStore } from '../store';

interface OverlayProps {
  onRegrow: () => void;
}

export const Overlay: React.FC<OverlayProps> = ({ onRegrow }) => {
  const { isWishing, setIsWishing, wishText, setWishText, addWish } = useWishStore();

  const handleSubmit = () => {
    if (wishText.trim()) {
      addWish(wishText, 'Sphere');
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 flex flex-col justify-end p-8 md:p-12 font-mono">

      {/* --- 底部区域 --- */}
      <footer className="flex justify-end items-end w-full pointer-events-none">

        {/* 右下角：操作按钮组 */}
        <div className="flex gap-4 items-center pointer-events-auto">
            
            {/* 1. Reseed 按钮 */}
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

      {/* --- 全屏许愿弹窗 (金色渐变风格) --- */}
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
                    <h2 className="text-3xl font-thin tracking-tighter text-white mb-2">Make a Wish</h2>
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
                    {wishText.length} / 100
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
                onClick={handleSubmit}
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