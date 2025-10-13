# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 AI 技术的智能产品关键词优化和描述生成系统,专为外卖、电商等行业设计。系统采用 Next.js 15 框架,使用 Gemini 2.5 Flash Lite 模型,支持批量处理和多格式导出。

## 核心命令

### 开发服务器
```bash
# 启动开发服务器 (端口: 3000)
npm run dev

# 如遇端口占用,先执行清理:
netstat -ano | findstr :3000
taskkill //F //PID <进程ID>
```

### 构建与部署
```bash
# 生产构建
npm run build

# 启动生产服务器
npm start

# 本地预览构建结果
npm run build && npm start
```

### 依赖管理
```bash
# 安装依赖
npm install

# 清理并重新安装 (解决模块未找到问题)
rm -rf node_modules package-lock.json && npm install
```

## 环境配置

项目需要在 `.env.local` 文件中配置以下环境变量:

```env
NEXT_PUBLIC_API_BASE_URL=https://jeniya.top/v1/chat/completions
NEXT_PUBLIC_API_MODEL=gemini-2.5-flash-lite
NEXT_PUBLIC_API_KEY=your-api-key-here
```

**注意**: API Key 敏感信息,切勿提交到版本控制系统。

## 架构设计

### 核心模块

1. **AI API 调用层** (`lib/api.ts`)
   - 封装与 AI 模型的通信逻辑
   - 实现批量处理策略 (将多个输入合并为一次 API 调用)
   - 提供统一的错误处理机制
   - 核心函数: `callAI()`, `optimizeKeywords()`, `generateDescriptions()`

2. **提示词工程** (`lib/prompts.ts`)
   - `KEYWORD_PROMPT`: 4000+ 字的关键词优化提示词,支持套餐格式处理 (用 `+` 连接)
   - `DESCRIPTION_PROMPT`: 产品描述生成提示词,避免极限词符合广告法
   - 提示词格式遵循 Role-Profile-Skill-Goals-Constrains-OutputFormat-Workflow 结构

3. **导出功能** (`utils/export.ts`)
   - Excel 导出: 使用 `xlsx` 库生成 `.xlsx` 文件
   - 图片导出: 使用原生 Canvas API 绘制表格并导出为 JPG
   - `exportToImage()` 实现了自定义 canvas 渲染,避免 CSS 解析问题

4. **主组件** (`components/ProductOptimizer.tsx`)
   - 统一的优化器组件,支持关键词优化和描述生成两种模式
   - 实时显示处理进度和错误信息
   - 表格预览和双导出功能

### 数据流

```
用户输入 (换行分隔)
  ↓
按行分割并验证
  ↓
批量提交到 AI API (合并为单个请求)
  ↓
接收并拆分 AI 响应
  ↓
匹配原始输入生成结果对
  ↓
表格展示 + 导出功能
```

### 批量处理策略

系统采用"批量提交"而非"逐个请求"策略:

**优势**:
- API 调用次数减少 99% (100 个产品仅需 1 次调用)
- 响应速度更快
- 输出格式更一致

**实现**:
- 将输入用换行符 `\n` 连接成单个字符串
- AI 模型按行处理并返回对应结果
- 系统按行拆分响应并匹配到原始输入

## 关键技术点

### 1. 静态导出配置 (`next.config.ts`)
```typescript
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
};
```
支持静态站点部署到 GitHub Pages 等平台。

### 2. Canvas 图片导出
使用原生 Canvas API 绘制表格,完全避免 `html2canvas` 的 CSS 颜色解析问题。关键步骤:
- 动态计算 canvas 尺寸
- 逐行绘制表头和数据行
- 支持文字自动换行 (`wrapText()` 函数)
- 导出为 JPG 格式 (quality: 0.95)

### 3. TypeScript 类型系统 (`types/index.ts`)
- `OptimizationType`: 区分关键词优化和描述生成
- `ProductItem`: 产品项状态管理
- `AIResponse`: AI API 响应格式
- `Config`: 环境配置类型

## 常见问题

### 构建失败

**问题**: 使用 `--turbopack` 标志构建时模块找不到
**解决**: 使用标准 webpack 构建 (`npm run build`)

**问题**: 提示 xlsx、lucide-react 等模块未找到
**解决**: 删除 `node_modules` 后重新安装
```bash
rm -rf node_modules package-lock.json
npm install
```

### API 调用失败

**检查清单**:
1. 环境变量配置是否正确 (`.env.local`)
2. API Key 是否有效
3. 网络连接是否正常
4. API 服务商是否有使用限制

### 图片导出失败

系统已采用原生 Canvas API 方案,避免了外部库的颜色解析问题。如仍有问题:
1. 检查浏览器控制台错误信息
2. 确认表格元素已正确渲染
3. 验证 canvas 尺寸计算是否正确

## 修改提示词

编辑 `lib/prompts.ts` 文件中的 `KEYWORD_PROMPT` 或 `DESCRIPTION_PROMPT` 常量。提示词格式说明:

- **Role**: 角色定位
- **Profile**: 助手属性 (版本、语言、核心能力描述)
- **Skill**: 技能清单
- **Goals**: 目标定义
- **Constrains**: 约束条件
- **OutputFormat**: 输出格式要求
- **Workflow**: 工作流程
- **Initialization**: 初始化指令

修改后无需重启开发服务器,刷新页面即可生效。

## 代码质量要求

遵循项目全局 CLAUDE.md 的代码质量准则:
- 每个文件不超过 200 行 (TypeScript)
- 避免代码重复和循环依赖
- 保持代码简洁可读
- 所有注释和文档使用中文

## 部署说明

### GitHub Pages 部署

1. 推送代码到 GitHub 仓库
2. 在 GitHub Settings > Secrets 中配置环境变量:
   - `NEXT_PUBLIC_API_BASE_URL`
   - `NEXT_PUBLIC_API_MODEL`
   - `NEXT_PUBLIC_API_KEY`
3. GitHub Actions 将自动构建并部署到 gh-pages 分支
4. 在 Settings > Pages 中启用 Pages 功能

### 自托管部署

```bash
npm run build
npm start
```

服务将运行在 `http://localhost:3000`。
