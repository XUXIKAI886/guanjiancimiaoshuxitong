# 产品优化助手

基于 AI 技术的智能产品关键词优化和描述生成系统,专为外卖、电商等行业设计。

## 项目简介

产品优化助手是一个强大的 AI 驱动工具,可以帮助您快速优化产品关键词和生成产品描述。系统支持批量处理,并提供 Excel 和 JPG 图片两种导出格式。

### 核心功能

- **关键词优化**: 批量优化产品关键词,添加表情符号和四字卖点
- **产品描述生成**: 根据产品名称自动生成吸引人的描述文案
- **批量处理**: 一次处理多个产品,提高工作效率
- **双列对比**: 清晰展示优化前后的对比效果
- **多格式导出**: 支持导出为 Excel 表格和 JPG 图片

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **Excel 导出**: xlsx
- **图片导出**: 原生 Canvas API
- **AI 模型**: Gemini 2.5 Flash Lite

## 安装指南

### 环境要求

- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. 克隆项目

```bash
git clone <repository-url>
cd product-optimizer
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量

创建 `.env.local` 文件并填入配置:

```env
NEXT_PUBLIC_API_BASE_URL=https://jeniya.top/v1/chat/completions
NEXT_PUBLIC_API_MODEL=gemini-2.5-flash-lite
NEXT_PUBLIC_API_KEY=your-api-key-here
```

4. 启动开发服务器

```bash
npm run dev
```

5. 打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 使用说明

### 关键词优化

1. 选择"关键词优化"标签页
2. 在输入框中输入产品关键词,每行一个
3. 支持套餐格式,用 `+` 连接多个产品(例如: 卤鸭板肠(小份)+卤菜(小份))
4. 点击"开始优化"按钮
5. 查看优化结果,系统会添加表情符号和四字卖点
6. 可导出为 Excel 表格或 JPG 图片

**输入示例:**
```
卤鸭板肠(小份)
柠檬茶(大杯)
卤鸭板肠(小份)+卤菜(小份)
```

**输出示例:**
```
卤鸭板肠(小份)【🍗卤香四溢】
柠檬茶(大杯)【🍹清爽解腻】
卤鸭板肠(小份)+卤菜(小份)【🍱组合丰富】
```

### 产品描述生成

1. 选择"产品描述生成"标签页
2. 在输入框中输入产品名称,每行一个
3. 点击"开始生成"按钮
4. 查看生成的产品描述
5. 可导出为 Excel 表格或 JPG 图片

**输入示例:**
```
麻辣小龙虾
招牌烤鱼
椒盐排骨
```

## 项目结构

```
product-optimizer/
├── app/                    # Next.js App Router 页面
│   ├── page.tsx           # 主页面
│   ├── layout.tsx         # 布局组件
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   └── ProductOptimizer.tsx  # 优化器组件
├── lib/                   # 核心功能库
│   ├── api.ts            # AI API 调用
│   └── prompts.ts        # 提示词配置
├── utils/                 # 工具函数
│   └── export.ts         # 导出功能
├── types/                 # TypeScript 类型定义
│   └── index.ts          # 类型定义
└── public/               # 静态资源
```

## API 配置说明

系统使用 OpenAI 兼容的 API 接口,默认配置如下:

- **Base URL**: https://jeniya.top/v1/chat/completions
- **模型**: gemini-2.5-flash-lite
- **API Key**: 需要在 `.env.local` 中配置

如需更换其他 AI 服务商,只需修改环境变量即可。

## 关键算法说明

### 批量处理策略

系统采用批量提交策略,将多个产品一次性发送给 AI 模型处理:

**优点:**
- 减少 API 调用次数,降低成本
- 提高处理速度
- 保持输出格式一致性

**实现方式:**
- 将输入按换行符合并成单个字符串
- AI 模型按行处理并返回对应结果
- 系统自动拆分结果并匹配到原始输入

### 提示词工程

项目包含两套专业的提示词:

1. **关键词优化提示词** (`lib/prompts.ts:KEYWORD_PROMPT`)
   - 角色定位: 产品关键词优化助手
   - 核心能力: 提炼四字卖点 + 匹配表情符号
   - 特殊处理: 支持套餐格式(+连接符)

2. **描述生成提示词** (`lib/prompts.ts:DESCRIPTION_PROMPT`)
   - 角色定位: 菜品描述生成助手
   - 核心能力: 撰写吸引人的产品描述
   - 限制条件: 避免极限词,符合广告法

## 构建和部署

### 本地构建

```bash
npm run build
npm start
```

### 部署到 Vercel

1. 将项目推送到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 自动部署

### 使用 GitHub Actions 部署

项目支持通过 GitHub Actions 自动部署。配置文件将在下一步创建。

## 开发说明

### 添加新功能

1. 在 `components/` 目录创建新组件
2. 在 `lib/` 目录添加业务逻辑
3. 在 `types/` 目录定义类型
4. 更新主页面引入新功能

### 修改提示词

编辑 `lib/prompts.ts` 文件,调整提示词内容以优化输出效果。

### 自定义样式

项目使用 Tailwind CSS,可在组件中直接使用工具类,或在 `tailwind.config.ts` 中自定义主题。

## 常见问题

### Q: API 调用失败怎么办?

A: 请检查以下几点:
- 环境变量配置是否正确
- API Key 是否有效
- 网络连接是否正常
- API 服务商是否有使用限制

### Q: 导出的图片不清晰?

A: 系统使用原生 Canvas API 直接绘制表格,默认 `scale: 2` 已提供高清晰度。如需调整,可在 `utils/export.ts` 中修改 canvas 尺寸参数。

### Q: 图片导出失败怎么办?

A: 系统已采用原生 Canvas API 方案,完全避免了 CSS 颜色解析问题。如仍有问题,请检查浏览器控制台的错误信息。

### Q: 如何更换其他 AI 模型?

A: 修改 `.env.local` 中的 `NEXT_PUBLIC_API_MODEL` 和 `NEXT_PUBLIC_API_BASE_URL` 即可。

## 许可证

MIT License

## 联系方式

如有问题或建议,欢迎提交 Issue 或 Pull Request。

