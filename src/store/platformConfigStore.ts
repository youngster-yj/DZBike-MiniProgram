import { create } from 'zustand';

interface PlatformConfigStore {
  /** 配置刷新计数：接口返回后 +1，驱动页面用最新 sync 数据重渲染 */
  version: number;
  /**
   * 初始为 true，首页可立刻用 platformDefaults 渲染，避免等接口时白屏。
   * 远程配置拉取完成后仍会 bump() 刷新内容。
   */
  ready: boolean;
  bump: () => void;
  setReady: (ready: boolean) => void;
}

export const usePlatformConfigStore = create<PlatformConfigStore>((set) => ({
  version: 0,
  ready: true,
  bump: () => set((s) => ({ version: s.version + 1 })),
  setReady: (ready) => set({ ready }),
}));

export function usePlatformConfigVersion(): number {
  return usePlatformConfigStore((s) => s.version);
}

export function usePlatformConfigReady(): boolean {
  return usePlatformConfigStore((s) => s.ready);
}
