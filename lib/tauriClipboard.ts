/**
 * Tauri 剪贴板功能集成 v2.0
 *
 * 支持浏览器和 Tauri 双环境的剪贴板操作
 * 解决 Tauri 桌面应用中 Clipboard API 权限策略限制问题
 *
 * 修复记录：
 * - v2.0: 修复 Tauri WebView 中环境检测失败导致复制失败的问题
 * - v2.0: 改进降级策略，确保在所有情况下都能复制成功
 * - v2.0: 支持 Tauri 1.x 和 2.x 两种 API 结构
 *
 * @module tauriClipboard
 * @version 2.0.0
 */

// TypeScript 类型声明 - 扩展 Window 接口（支持 Tauri 1.x 和 2.x）
declare global {
  interface Window {
    // Tauri 2.x 结构
    __TAURI__?: {
      core?: {
        invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
      };
      // Tauri 1.x 结构（直接在 __TAURI__ 下有 invoke）
      invoke?: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
      // Tauri 1.x 的 tauri 模块
      tauri?: {
        invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
      };
    };
    // Tauri 1.x 可能直接暴露 __TAURI_INTERNALS__
    __TAURI_INTERNALS__?: unknown;
  }
}

/**
 * 检测是否在 Tauri WebView 环境中运行
 * 支持 Tauri 1.x 和 2.x 的不同 API 结构
 *
 * @returns {boolean} true=Tauri环境, false=浏览器环境
 */
export function isTauriEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // 检测方式 1: Tauri 2.x (window.__TAURI__.core.invoke)
  const hasTauri2 = typeof window.__TAURI__?.core?.invoke === 'function';

  // 检测方式 2: Tauri 1.x (window.__TAURI__.invoke)
  const hasTauri1Direct = typeof window.__TAURI__?.invoke === 'function';

  // 检测方式 3: Tauri 1.x (window.__TAURI__.tauri.invoke)
  const hasTauri1Module = typeof window.__TAURI__?.tauri?.invoke === 'function';

  // 检测方式 4: 检查 __TAURI_INTERNALS__（Tauri 1.x 标志）
  const hasTauriInternals = typeof window.__TAURI_INTERNALS__ !== 'undefined';

  // 检测方式 5: 检查 User-Agent 是否包含 Tauri 标识
  const userAgent = navigator.userAgent || '';
  const isTauriUserAgent = userAgent.includes('Tauri') || userAgent.includes('wry');

  const result = hasTauri2 || hasTauri1Direct || hasTauri1Module || hasTauriInternals || isTauriUserAgent;

  console.log('🔍 [tauriClipboard] 环境检测详情:', {
    hasTauri2,
    hasTauri1Direct,
    hasTauri1Module,
    hasTauriInternals,
    isTauriUserAgent,
    userAgent: userAgent.substring(0, 100),
    result: result ? 'Tauri' : '浏览器'
  });

  return result;
}

/**
 * 获取可用的 Tauri invoke 函数
 * 兼容 Tauri 1.x 和 2.x
 */
function getTauriInvoke(): ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null {
  if (typeof window === 'undefined' || !window.__TAURI__) {
    return null;
  }

  // Tauri 2.x
  if (typeof window.__TAURI__.core?.invoke === 'function') {
    console.log('📋 [tauriClipboard] 使用 Tauri 2.x API');
    return window.__TAURI__.core.invoke;
  }

  // Tauri 1.x (直接 invoke)
  if (typeof window.__TAURI__.invoke === 'function') {
    console.log('📋 [tauriClipboard] 使用 Tauri 1.x API (直接)');
    return window.__TAURI__.invoke;
  }

  // Tauri 1.x (tauri 模块)
  if (typeof window.__TAURI__.tauri?.invoke === 'function') {
    console.log('📋 [tauriClipboard] 使用 Tauri 1.x API (tauri模块)');
    return window.__TAURI__.tauri.invoke;
  }

  return null;
}

/**
 * 检测当前 URL 是否为本地 URL
 * Tauri 剪贴板插件仅在本地 URL 下可用
 */
function isLocalUrl(): boolean {
  if (typeof window === 'undefined') return false;

  const url = window.location.href;
  const isLocal = url.startsWith('tauri://') ||
                  url.startsWith('http://tauri.localhost') ||
                  url.startsWith('https://tauri.localhost') ||
                  url.startsWith('http://localhost') ||
                  url.startsWith('http://127.0.0.1') ||
                  url.startsWith('file://');

  console.log('🔍 [tauriClipboard] URL检测:', { url: url.substring(0, 50), isLocal });
  return isLocal;
}

/**
 * 检测是否可以使用 Tauri 剪贴板 API
 */
function canUseTauriClipboard(): boolean {
  const invoke = getTauriInvoke();
  const isLocal = isLocalUrl();
  return invoke !== null && isLocal;
}

/**
 * 降级方案：使用传统的 document.execCommand 方法
 * 这是最可靠的方案，在任何环境下都应该能工作
 */
function fallbackCopyToClipboard(text: string): boolean {
  console.log('📋 [tauriClipboard] 执行降级方案 (execCommand)');

  try {
    // 创建临时 textarea 元素
    const textarea = document.createElement('textarea');
    textarea.value = text;

    // 关键：设置样式确保元素在页面上可见但用户看不到
    textarea.style.position = 'fixed';
    textarea.style.left = '0';
    textarea.style.top = '0';
    textarea.style.width = '2em';
    textarea.style.height = '2em';
    textarea.style.padding = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxShadow = 'none';
    textarea.style.background = 'transparent';
    textarea.style.opacity = '0';
    textarea.style.zIndex = '-1';

    document.body.appendChild(textarea);

    // 关键：在移动端和某些 WebView 中需要这些步骤
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    let successful = false;
    try {
      successful = document.execCommand('copy');
    } catch (e) {
      console.warn('⚠️ [tauriClipboard] execCommand 抛出异常:', e);
    }

    document.body.removeChild(textarea);

    if (successful) {
      console.log('✅ [tauriClipboard] 降级方案复制成功');
      return true;
    } else {
      console.error('❌ [tauriClipboard] 降级方案失败 (execCommand 返回 false)');
      return false;
    }
  } catch (error) {
    console.error('❌ [tauriClipboard] 降级方案异常:', error);
    return false;
  }
}

/**
 * 通用文本复制函数 - 支持浏览器和 Tauri 双环境
 *
 * 复制策略（按优先级）：
 * 1. Tauri 原生 API（如果可用）
 * 2. 浏览器 Clipboard API（在安全上下文中）
 * 3. 降级方案 execCommand（最兼容）
 *
 * 重要改进：在 Tauri WebView 中检测到权限问题时，立即使用降级方案
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  console.log('📋 [tauriClipboard] copyToClipboard 开始，文本长度:', text.length);

  // 1. 检测环境
  const isTauri = isTauriEnvironment();
  const invoke = getTauriInvoke();
  const isLocal = isLocalUrl();

  console.log('🔍 [tauriClipboard] 环境状态:', {
    isTauri,
    hasInvoke: invoke !== null,
    isLocal,
    canUseTauri: invoke !== null && isLocal
  });

  // 2. 尝试 Tauri 原生 API
  if (invoke && isLocal) {
    try {
      console.log('📋 [tauriClipboard] 尝试 Tauri 原生剪贴板 API');
      await invoke('plugin:clipboard-manager|write_text', { text });
      console.log('✅ [tauriClipboard] Tauri API 复制成功');
      return true;
    } catch (error) {
      console.warn('⚠️ [tauriClipboard] Tauri API 失败，尝试降级:', error);
      // Tauri API 失败，直接使用降级方案（不尝试 Clipboard API）
      return fallbackCopyToClipboard(text);
    }
  }

  // 3. 在 Tauri WebView 中但无法使用 Tauri API → 直接降级
  // 这是关键修复：Tauri WebView 中的 Clipboard API 通常会被阻止
  if (isTauri) {
    console.log('⚠️ [tauriClipboard] 检测到 Tauri 环境但无法使用 Tauri API，直接使用降级方案');
    return fallbackCopyToClipboard(text);
  }

  // 4. 纯浏览器环境 - 尝试 Clipboard API
  console.log('📋 [tauriClipboard] 浏览器环境，尝试 Clipboard API');
  try {
    // 检查 Clipboard API 是否可用
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      console.log('✅ [tauriClipboard] Clipboard API 复制成功');
      return true;
    } else {
      console.log('⚠️ [tauriClipboard] Clipboard API 不可用，使用降级方案');
      return fallbackCopyToClipboard(text);
    }
  } catch (error) {
    console.warn('⚠️ [tauriClipboard] Clipboard API 失败，使用降级方案:', error);
    return fallbackCopyToClipboard(text);
  }
}

/**
 * 从剪贴板读取文本 - 支持浏览器和 Tauri 双环境
 */
export async function readFromClipboard(): Promise<string> {
  console.log('📋 [tauriClipboard] readFromClipboard 开始');

  const isTauri = isTauriEnvironment();
  const invoke = getTauriInvoke();
  const isLocal = isLocalUrl();

  // Tauri 原生 API
  if (invoke && isLocal) {
    try {
      console.log('📋 [tauriClipboard] 使用 Tauri API 读取');
      const text = await invoke('plugin:clipboard-manager|read_text') as string;
      console.log('✅ [tauriClipboard] Tauri API 读取成功');
      return text || '';
    } catch (error) {
      console.error('❌ [tauriClipboard] Tauri API 读取失败:', error);
      return '';
    }
  }

  // Tauri WebView 但无法使用 API
  if (isTauri) {
    console.warn('⚠️ [tauriClipboard] Tauri 环境无法读取剪贴板（需要 Tauri API）');
    return '';
  }

  // 浏览器 Clipboard API
  try {
    if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      const text = await navigator.clipboard.readText();
      console.log('✅ [tauriClipboard] Clipboard API 读取成功');
      return text;
    }
  } catch (error) {
    console.warn('⚠️ [tauriClipboard] Clipboard API 读取失败:', error);
  }

  return '';
}

/**
 * 复制富文本（HTML）到剪贴板
 * 注意：Tauri 环境会降级为纯文本
 */
export async function copyHtmlToClipboard(html: string, plainText: string): Promise<boolean> {
  const isTauri = isTauriEnvironment();

  if (isTauri) {
    console.log('⚠️ [tauriClipboard] Tauri 环境不支持富文本，使用纯文本');
    return copyToClipboard(plainText);
  }

  try {
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([plainText], { type: 'text/plain' }),
    });
    await navigator.clipboard.write([clipboardItem]);
    console.log('✅ [tauriClipboard] 富文本复制成功');
    return true;
  } catch (error) {
    console.warn('⚠️ [tauriClipboard] 富文本复制失败，降级为纯文本:', error);
    return copyToClipboard(plainText);
  }
}

/**
 * 获取剪贴板环境调试信息
 */
export function getClipboardDebugInfo(): Record<string, unknown> {
  return {
    isTauri: isTauriEnvironment(),
    hasInvoke: getTauriInvoke() !== null,
    isLocalUrl: isLocalUrl(),
    canUseTauri: canUseTauriClipboard(),
    hasClipboardAPI: typeof navigator?.clipboard?.writeText === 'function',
    userAgent: navigator?.userAgent?.substring(0, 100) || 'N/A',
    currentUrl: window?.location?.href?.substring(0, 50) || 'N/A',
    tauriObject: typeof window?.__TAURI__,
    tauriCore: typeof window?.__TAURI__?.core,
    tauriInternals: typeof window?.__TAURI_INTERNALS__,
  };
}
