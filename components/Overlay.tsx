import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Circle, Triangle, Square, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { useWishStore } from '../store';

interface OverlayProps {
  onRegrow: () => void;
}

// 形状选项配置 - 之后可以替换成 PLY 模型
const VESSEL_OPTIONS = [
  { id: 'Sphere', icon: Circle, label: 'Sphere' },
  { id: 'Pyramid', icon: Triangle, label: 'Pyramid' },
  { id: 'Cube', icon: Square, label: 'Cube' },
  { id: 'Star', icon: Star, label: 'Star' },
];

// 形状选择按钮组件
const VesselButton = ({ 
  id, 
  icon: Icon, 
  selected, 
  onClick 
}: { 
  id: string; 
  icon: React.ElementType; 
  selected: boolean; 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={clsx(
      "relative flex-1 aspect-square rounded-2xl transition-all duration-300 flex items-center justify-center",
      "bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm",
      "hover:bg-white/[0.06] hover:border-white/[0.15]",
      selected && "bg-white/[0.08] border-white/[0.2] shadow-[0_0_20px_rgba(255,255,255,0.05)]"
    )}
  >
    <Icon 
      size={36} 
      strokeWidth={1.2}
      className={clsx(
        "transition-all duration-300",
        selected ? "text-white/70" : "text-white/30"
      )}
    />
    {/* 选中指示器 */}
    {selected && (
      <motion.div
        layoutId="vessel-indicator"
        className="absolute inset-0 rounded-2xl border-2 border-white/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
    )}
  </button>
);

export const Overlay: React.FC<OverlayProps> = ({ onRegrow }) => {
  const { isWishing, setIsWishing, wishText, setWishText, selectedVessel, setSelectedVessel, addWish } = useWishStore();

  const handleSubmit = () => {
    if (wishText.trim()) {
      addWish(wishText, selectedVessel);
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 flex flex-col justify-end p-8 md:p-12 font-mono">

      {/* --- 底部区域 --- */}
      <footer className="flex justify-end items-end w-full pointer-events-none">

        {/* 右下角：操作按钮组 */}
        <div className="flex gap-4 items-center pointer-events-auto">
            
            {/* Reseed 按钮 */}
            <button 
              onClick={onRegrow}
              className="group flex items-center gap-2 px-4 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 backdrop-blur-sm"
              title="Regenerate Tree"
            >
              <RefreshCw className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors group-hover:rotate-180 duration-500" />
              <span className="hidden md:block text-xs tracking-widest text-white/40 group-hover:text-white/70 uppercase">Reseed</span>
            </button>

            {/* Make a Wish 按钮 */}
            <motion.button
              onClick={() => setIsWishing(true)}
              className="relative group bg-white/[0.03] border border-white/10 px-6 md:px-8 py-3 md:py-4 rounded-full backdrop-blur-xl transition-all hover:bg-white/[0.08] hover:border-white/20 active:scale-95 flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="w-5 h-5 text-white/50" />
              <span className="uppercase tracking-[0.15em] text-xs md:text-sm text-white/70">
                  Make a Wish
              </span>
            </motion.button>
        </div>
      </footer>

      {/* --- 全屏许愿弹窗 (Clean Glass Effect) --- */}
      <AnimatePresence>
        {isWishing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[60] flex items-center justify-center pointer-events-auto p-4"
          >
            {/* 点击背景关闭 */}
            <div className="absolute inset-0" onClick={() => setIsWishing(false)} />

            {/* 弹窗主体 - Clean Glass Effect */}
            <motion.div
              className="relative w-full max-w-xl bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 backdrop-blur-2xl"
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              
              {/* 文字输入区域 */}
              <div className="relative mb-6">
                <textarea
                  value={wishText}
                  onChange={(e) => setWishText(e.target.value)}
                  placeholder="Text input......."
                  maxLength={3000}
                  className={clsx(
                    "w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5",
                    "text-white/80 placeholder-white/30 text-lg font-light",
                    "focus:outline-none focus:border-white/20 focus:bg-white/[0.05]",
                    "transition-all resize-none h-48"
                  )}
                />
                {/* 字数统计 */}
                <div className="absolute bottom-4 right-4 text-sm text-white/20 font-mono">
                  {wishText.length}/3000
                </div>
              </div>

              {/* 形状选择器 */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {VESSEL_OPTIONS.map((vessel) => (
                  <VesselButton
                    key={vessel.id}
                    id={vessel.id}
                    icon={vessel.icon}
                    selected={selectedVessel === vessel.id}
                    onClick={() => setSelectedVessel(vessel.id)}
                  />
                ))}
              </div>

              {/* 提交按钮 */}
              <button 
                className={clsx(
                  "w-full py-4 rounded-2xl transition-all duration-300 text-base tracking-wide",
                  "bg-white/[0.03] border border-white/[0.08]",
                  wishText.length > 0 
                    ? "text-white/70 hover:bg-white/[0.08] hover:border-white/20 cursor-pointer" 
                    : "text-white/20 cursor-not-allowed"
                )}
                disabled={wishText.length === 0}
                onClick={handleSubmit}
              >
                Make a wish
              </button>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};