# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

基于 Next.js 15 的 AI 关键词优化和描述生成系统，支持美团/饿了么双平台，使用 Gemini 2.5 Flash Lite 模型，支持批量处理和多环境（浏览器/Tauri 桌面应用）导出。

## 核心命令

### 开发与构建
```bash
# 启动开发服务器（端口 3000，使用 turbopack）
npm run dev

# 生产构建（必须使用 turbopack）
npm run build --turbopack

# 启动生产服务器
npm start
```

⚠️ **重要**：构建时**必须**使用 `--turbopack` 标志，否则会出现模块找不到错误。

### 端口占用处理（Windows）
```bash
# 查找占用 3000 端口的进程
netstat -ano | findstr :3000

# 终止进程
taskkill //F //PID <进程ID>
```

### 依赖问题排查
```bash
# 完全清理并重新安装依赖（解决 "Module not found" 错误）
rm -rf node_modules package-lock.json
npm install
```

## 架构设计关键点

### 1. 批量处理策略（lib/api.ts）

系统采用**批量合并请求**而非逐个调用：

**核心原理**：
- 将多个输入用 `\n` 连接成单个字符串发送给 AI
- AI 模型按行处理并返回对应结果
- 系统按行拆分响应并匹配到原始输入

**批次配置**：
- 关键词优化：`BATCH_SIZE = 30`（lib/api.ts:83）
- 产品描述：`BATCH_SIZE = 20`（lib/api.ts:208）
- 批次延迟：1000ms（避免 API 限流）

**智能修复机制**（lib/api.ts:102-128）：
- 自动检测输入/输出行数不匹配
- 输出不足时自动补充 `【待重新生成】`
- 输出过多时自动截断

### 2. 双环境导出机制（utils/export.ts）

**环境检测**（utils/export.ts:7-12）：
```typescript
function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' &&
         typeof (window as any).__TAURI__ !== 'undefined' &&
         typeof (window as any).__TAURI__.core !== 'undefined' &&
         typeof (window as any).__TAURI__.core.invoke === 'function';
}
```

**导出流程差异**：

| 功能 | 浏览器环境 | Tauri 环境 |
|------|-----------|-----------|
| Excel 导出 | `XLSX.writeFile()` 直接下载 | Tauri Dialog API 选择位置 |
| 图片导出 | `canvas.toBlob()` + `<a>` 下载 | Base64 转字节数组 + Tauri FS API |
| 保存确认 | 无 | `alert()` 显示保存路径 |

**Tauri 调用格式**（3 参数格式）：
```typescript
await (window as any).__TAURI__.core.invoke(
  'plugin:fs|write_file',
  bytes,  // Uint8Array 数据
  {
    headers: {
      path: encodeURIComponent(filePath),  // ⚠️ 必须编码中文路径
      options: JSON.stringify({})
    }
  }
);
```

### 3. 图片导出实现（原生 Canvas API）

**为什么不用 html2canvas**：
- 避免 CSS 颜色解析问题
- 更精确的控制和更好的性能

**实现细节**（utils/export.ts:115-234）：
- 手动计算 canvas 尺寸（列宽固定：80/500/500）
- 逐行绘制表头和数据（rowHeight: 50px）
- 支持文字自动换行（`wrapText()` 函数）
- 导出为 JPG（quality: 0.95）

### 4. 平台差异化处理

**美团 vs 饿了么**：

| 平台 | 提示词 | Excel 起始行 | 关键词格式 |
|------|-------|-------------|----------|
| 美团 | `KEYWORD_PROMPT_MEITUAN` | 第 2 行 | 带表情符号 🍗🍱 |
| 饿了么 | `KEYWORD_PROMPT_ELEME` | 第 3 行 | 纯文字 |

**套餐格式处理**：
- 输入：`卤鸭板肠(小份)+卤菜(小份)`
- 提示词会识别 `+` 符号并保持格式

## 环境配置

### 必需环境变量（.env.local）
```env
NEXT_PUBLIC_API_BASE_URL=https://jeniya.top/v1/chat/completions
NEXT_PUBLIC_API_MODEL=gemini-2.5-flash-lite
NEXT_PUBLIC_API_KEY=your-api-key-here
```

⚠️ **部署到 GitHub Pages**：需要将 `.env.production` 强制添加到 git（`git add -f .env.production`），因为 API Key 会编译到静态文件中。

### Next.js 关键配置（next.config.ts）

```typescript
{
  output: 'export',  // 静态导出，支持 GitHub Pages
  basePath: process.env.NODE_ENV === 'production'
    ? '/guanjiancimiaoshuxitong'  // 仓库名作为基础路径
    : '',
  images: { unoptimized: true }  // 静态导出必需
}
```

### AI API 参数（lib/api.ts:48-49）
```typescript
temperature: 0.7,
max_tokens: 8000  // ⚠️ 已从默认值降低，配合小批次提升稳定性
```

## 提示词工程（lib/prompts.ts）

**提示词结构（LangGPT 格式）**：
```
Role: 角色定位
Profile: 版本、语言、核心能力
Skill: 技能清单
Goals: 目标定义
Constrains: 约束条件 ⚠️ 最重要
OutputFormat: 输出格式要求
Workflow: 工作流程
Initialization: 初始化指令
```

**最关键的约束条件**（确保 1:1 对应）：
```
【重要】输入行数 = 输出行数
- 每一行输入必须有对应的一行输出
- 绝对不允许跳过、过滤、忽略任何一行
- 保持严格的行序对应
```

## 常见问题处理

### 构建失败
**问题**：`Module not found` 错误
**解决**：
1. 删除 `node_modules` 和 `package-lock.json`
2. 重新 `npm install`
3. 确保使用 `--turbopack` 构建

### API 调用问题
**输出行数不匹配**：系统会自动修复（lib/api.ts:102-128），但如果频繁出现：
- 减小批次大小（BATCH_SIZE）
- 降低 max_tokens
- 检查提示词约束是否清晰

### Tauri 环境调试
**测试页面**：`test-tauri-download.html`（独立测试文件）
**检测方法**：
```javascript
console.log(window.__TAURI__);  // 应返回对象而非 undefined
```

### Excel 上传读取
**关键参数**（utils/export.ts:376-383）：
- `columnIndex: 3` - 第 4 列（D 列）商品名称
- `startRow: 1` - 美团从第 2 行开始
- `startRow: 2` - 饿了么从第 3 行开始

## 修改代码时的注意事项

### 修改批处理逻辑
- 必须保持 `lib/api.ts` 中的智能修复机制
- 测试大批量数据（200+ 条）确保不会丢失数据

### 修改导出功能
- 同时测试浏览器和 Tauri 环境
- Tauri 调用使用 3 参数格式，路径必须 `encodeURIComponent()`
- 用户取消保存时不要抛出错误

### 修改提示词
- 务必保留"输入行数=输出行数"约束
- 测试 1 条、10 条、100 条数据验证稳定性
- 避免引导 AI 输出额外解释性文字

### 添加新平台支持
1. 在 `lib/prompts.ts` 添加新提示词常量
2. 在 `lib/api.ts` 的 `Platform` 类型添加新值
3. 在 `components/ExcelUploader.tsx` 调整起始行配置
4. 更新 `app/page.tsx` 添加新标签页

## 代码组织原则

- **每个文件职责单一**：
  - `lib/api.ts` - 纯 API 调用和批处理
  - `lib/prompts.ts` - 仅提示词定义
  - `utils/export.ts` - 仅导出功能
  - `types/index.ts` - 全局类型定义

- **组件粒度**：
  - `ProductOptimizer.tsx` - 核心优化器（支持双模式）
  - `ExcelUploader.tsx` - Excel 上传独立组件
  - `InfoSidebar.tsx` - 信息侧边栏独立组件

- **所有注释和文档使用中文**
