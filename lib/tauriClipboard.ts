/**
 * Tauri 剪贴板功能集成
 *
 * 支持浏览器和 Tauri 双环境的剪贴板操作
 * 解决 Tauri 桌面应用中 Clipboard API 权限策略限制问题
 *
 * @module tauriClipboard
 * @version 1.0.0
 */

// TypeScript 类型声明 - 扩展 Window 接口
declare global {
  interface Window {
    __TAURI__?: {
      core: {
        invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
      };
    };
  }
}

/**
 * 检测是否在 Tauri 环境中运行
 * @returns {boolean} true=Tauri环境, false=浏览器环境
 */
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' &&
         typeof window.__TAURI__ !== 'undefined' &&
         typeof window.__TAURI__.core !== 'undefined' &&
         typeof window.__TAURI__.core.invoke === 'function';
}

/**
 * 检测当前 URL 是否为本地 URL
 * Tauri 剪贴板插件仅在本地 URL 下可用
 * @returns {boolean} true=本地URL, false=远程URL
 */
function isLocalUrl(): boolean {
  if (typeof window === 'undefined') return false;

  const url = window.location.href;
  return url.startsWith('tauri://') ||
         url.startsWith('http://tauri.localhost') ||
         url.startsWith('https://tauri.localhost') ||
         url.startsWith('http://localhost') ||
         url.startsWith('file://');
}

/**
 * 检测是否可以使用 Tauri 剪贴板 API
 * 需要同时满足：在 Tauri 环境 + 本地 URL
 * @returns {boolean}
 */
function canUseTauriClipboard(): boolean {
  return isTauriEnvironment() && isLocalUrl();
}

/**
 * 降级方案：使用传统的 document.execCommand 方法
 * （用于 Clipboard API 不可用的情况）
 *
 * @param {string} text - 要复制的文本内容
 * @returns {boolean} 复制是否成功
 */
function fallbackCopyToClipboard(text: string): boolean {
  try {
    // 创建临时 textarea 元素
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);

    // 选中并复制
    textarea.focus();
    textarea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (successful) {
      console.log('✅ [降级方案] 文本复制成功 (execCommand)');
      return true;
    } else {
      console.error('❌ [降级方案] execCommand 返回 false');
      return false;
    }
  } catch (error) {
    console.error('❌ [降级方案] 复制失败:', error);
    return false;
  }
}

/**
 * 通用文本复制函数 - 支持浏览器和Tauri双环境
 *
 * 自动检测运行环境并选择最佳的复制方式：
 * 1. Tauri 本地环境 → Tauri 原生 API
 * 2. 浏览器环境 → Clipboard API
 * 3. 降级方案 → document.execCommand
 *
 * @param {string} text - 要复制的文本内容
 * @returns {Promise<boolean>} 复制是否成功
 *
 * @example
 * ```tsx
 * import { copyToClipboard } from '@/lib/tauriClipboard';
 *
 * const handleCopy = async () => {
 *   const success = await copyToClipboard('要复制的文本');
 *   if (success) {
 *     console.log('复制成功');
 *   }
 * };
 * ```
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. 环境检测
  const isTauri = isTauriEnvironment();
  const canUseTauri = canUseTauriClipboard();
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  console.log('🔍 [剪贴板] 环境检测:', isTauri ? 'Tauri桌面应用' : '浏览器');
  if (isTauri && !canUseTauri) {
    console.log('⚠️ [Tauri] 检测到远程URL，使用降级方案:', currentUrl);
  }

  // 2. Tauri环境 + 本地URL - 使用 Tauri Clipboard API
  if (canUseTauri) {
    try {
      console.log('📋 [Tauri] 使用原生剪贴板 API');

      // 调用 Tauri Clipboard 插件
      await window.__TAURI__!.core.invoke('plugin:clipboard-manager|write_text', {
        text: text,
      });

      console.log('✅ [Tauri] 文本复制成功');
      return true;
    } catch (error) {
      console.error('❌ [Tauri] 复制失败:', error);
      // Tauri API 失败时，尝试降级方案
      return fallbackCopyToClipboard(text);
    }
  }

  // 3. 浏览器环境 - 尝试 Clipboard API
  if (!isTauri) {
    try {
      await navigator.clipboard.writeText(text);
      console.log('✅ [浏览器] 文本复制成功 (Clipboard API)');
      return true;
    } catch (error) {
      console.warn('⚠️ [浏览器] Clipboard API 失败，使用降级方案:', error);
      // 浏览器环境失败时，尝试降级方案
      return fallbackCopyToClipboard(text);
    }
  }

  // 4. Tauri 远程 URL - 直接使用降级方案
  return fallbackCopyToClipboard(text);
}

/**
 * 从剪贴板读取文本 - 支持浏览器和Tauri双环境
 *
 * @returns {Promise<string>} 剪贴板中的文本内容，失败时返回空字符串
 *
 * @example
 * ```tsx
 * import { readFromClipboard } from '@/lib/tauriClipboard';
 *
 * const handlePaste = async () => {
 *   const text = await readFromClipboard();
 *   if (text) {
 *     console.log('剪贴板内容:', text);
 *   }
 * };
 * ```
 */
export async function readFromClipboard(): Promise<string> {
  const isTauri = isTauriEnvironment();
  const canUseTauri = canUseTauriClipboard();
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  console.log('🔍 [剪贴板] 读取 - 环境检测:', isTauri ? 'Tauri桌面应用' : '浏览器');
  if (isTauri && !canUseTauri) {
    console.log('⚠️ [Tauri] 检测到远程URL，无法读取剪贴板:', currentUrl);
  }

  // Tauri环境 + 本地URL
  if (canUseTauri) {
    try {
      console.log('📋 [Tauri] 使用原生剪贴板读取');

      const text = await window.__TAURI__!.core.invoke<string>('plugin:clipboard-manager|read_text');

      console.log('✅ [Tauri] 读取剪贴板成功');
      return text || '';
    } catch (error) {
      console.error('❌ [Tauri] 读取剪贴板失败:', error);
      return '';
    }
  }

  // 浏览器环境
  if (!isTauri) {
    try {
      const text = await navigator.clipboard.readText();
      console.log('✅ [浏览器] 读取剪贴板成功 (Clipboard API)');
      return text;
    } catch (error) {
      console.warn('⚠️ [浏览器] 读取剪贴板失败:', error);
      return '';
    }
  }

  // Tauri 远程 URL - 无法读取剪贴板
  console.warn('⚠️ [Tauri 远程URL] 剪贴板读取功能不可用');
  return '';
}

/**
 * 复制富文本（HTML）到剪贴板
 * 注意：此功能仅在浏览器环境下可用
 *
 * @param {string} html - HTML 内容
 * @param {string} plainText - 纯文本备用内容
 * @returns {Promise<boolean>} 复制是否成功
 */
export async function copyHtmlToClipboard(html: string, plainText: string): Promise<boolean> {
  const isTauri = isTauriEnvironment();

  // Tauri 环境暂不支持富文本复制，使用纯文本
  if (isTauri) {
    console.log('⚠️ [Tauri] 不支持富文本复制，使用纯文本');
    return copyToClipboard(plainText);
  }

  // 浏览器环境 - 尝试使用 ClipboardItem API
  try {
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([plainText], { type: 'text/plain' }),
    });
    await navigator.clipboard.write([clipboardItem]);
    console.log('✅ [浏览器] 富文本复制成功');
    return true;
  } catch (error) {
    console.warn('⚠️ [浏览器] 富文本复制失败，降级为纯文本:', error);
    return copyToClipboard(plainText);
  }
}
