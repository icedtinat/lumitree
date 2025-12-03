import { create } from 'zustand';

export interface Wish {
  id: string;
  text: string;
  vessel: string;
  color: string;
  position: [number, number, number];
}

interface WishState {
  isWishing: boolean;
  wishText: string;
  selectedVessel: string;
  wishes: Wish[];
  focusedWishId: string | null;
  setIsWishing: (isWishing: boolean) => void;
  setWishText: (text: string) => void;
  setSelectedVessel: (vessel: string) => void;
  addWish: (text: string, vessel: string) => void;
  setFocusedWishId: (id: string | null) => void;
}

const NEON_COLORS = [
  '#ff00ff', // Magenta
  '#00ffff', // Cyan
  '#ffff00', // Yellow
  '#ff00aa', // Hot Pink
  '#00ff00', // Lime
  '#aa00ff', // Violet
  '#ffaa00', // Amber
];

export const useWishStore = create<WishState>((set) => ({
  isWishing: false,
  wishText: '',
  selectedVessel: 'Sphere', 
  wishes: [],
  focusedWishId: null,
  setIsWishing: (isWishing) => set({ isWishing }),
  setWishText: (wishText) => set({ wishText }),
  setSelectedVessel: (selectedVessel) => set({ selectedVessel }),
  setFocusedWishId: (focusedWishId) => set({ focusedWishId }),
  addWish: (text, vessel) => {
    set((state) => {
      // 树的参数:
      // - OBJ 被缩放 2.5x
      // - 树高度大约 25 单位 (原始约10 * 2.5)
      // - 树底部在 Y=0，顶部在 Y≈25
      // - WishSphere 在 group 内部，group 位于 [0, -8, 0]
      // - 所以球的本地坐标 Y 范围是 0 到 25
      
      // 随机高度: 从 2 到 22 (避开最底部和最顶部)
      const minY = 2;
      const maxY = 22;
      const y = minY + Math.random() * (maxY - minY);
      
      // 树的锥形：底部宽 (约半径5)，顶部窄 (约半径0)
      const treeHeight = 25;
      const maxRadiusAtBottom = 5.0;
      const taperFactor = 1 - (y / treeHeight); // 1 at bottom, 0 at top
      const maxRadiusAtY = maxRadiusAtBottom * taperFactor;
      
      // 在该高度的有效半径内随机放置
      // 使用 0.2 到 0.7 的范围，确保球在树内但不在正中心
      const radius = maxRadiusAtY * (0.2 + Math.random() * 0.5);
      
      // 随机角度 (360度)
      const theta = Math.random() * Math.PI * 2;
      
      const x = radius * Math.cos(theta);
      const z = radius * Math.sin(theta);
      
      // 随机颜色
      const color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];

      const newWish: Wish = {
        id: Math.random().toString(36).substr(2, 9),
        text,
        vessel,
        color,
        position: [x, y, z]
      };

      return {
        wishes: [...state.wishes, newWish],
        wishText: '', 
        isWishing: false 
      };
    });
  }
}));