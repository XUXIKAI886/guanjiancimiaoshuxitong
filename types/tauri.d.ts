/**
 * Tauri 全局类型声明
 *
 * 用于解决 TypeScript 无法识别 window.__TAURI__ 的问题
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
       * Tauri 核心模块
       */
      core: {
        /**
         * 调用 Tauri 后端命令
         * @param cmd - 命令名称 (格式: "plugin:plugin-name|command" 或自定义命令)
         * @param args - 命令参数
         * @returns Promise 返回命令执行结果
         *
         * @example
         * // 调用剪贴板写入
         * await window.__TAURI__.core.invoke('plugin:clipboard-manager|write_text', { text: 'Hello' });
         *
         * // 调用剪贴板读取
         * const text = await window.__TAURI__.core.invoke<string>('plugin:clipboard-manager|read_text');
         */
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
  }
}

export {};
