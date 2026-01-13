/**
 * Tauri 全局类型声明 v2.0
 *
 * 支持 Tauri 1.x 和 2.x 两种 API 结构
 *
 * @file tauri.d.ts
 */

declare global {
  interface Window {
    /**
     * Tauri 注入的全局对象
     * 仅在 Tauri 桌面应用环境中存在
     */
    __TAURI__?: {
      /**
       * Tauri 2.x 核心模块
       */
      core?: {
        invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
      };

      /**
       * Tauri 1.x 直接 invoke
       */
      invoke?: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;

      /**
       * Tauri 1.x tauri 模块
       */
      tauri?: {
        invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
      };

      /**
       * Tauri 事件模块（可选）
       */
      event?: {
        listen: <T>(event: string, handler: (payload: T) => void) => Promise<() => void>;
        emit: (event: string, payload?: unknown) => Promise<void>;
      };

      /**
       * Tauri 窗口模块（可选）
       */
      window?: {
        appWindow: {
          close: () => Promise<void>;
          minimize: () => Promise<void>;
          maximize: () => Promise<void>;
          unmaximize: () => Promise<void>;
          toggleMaximize: () => Promise<void>;
          setFullscreen: (fullscreen: boolean) => Promise<void>;
          setTitle: (title: string) => Promise<void>;
        };
      };
    };

    /**
     * Tauri 1.x 内部标志
     */
    __TAURI_INTERNALS__?: unknown;
  }
}

export {};
