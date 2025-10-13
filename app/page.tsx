'use client';

import { useState } from 'react';
import ProductOptimizer from '@/components/ProductOptimizer';
import { Tag, FileText } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'keyword' | 'description'>('keyword');

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 导航栏 - 紧凑设计 */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Logo */}
              <div className="relative group">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md transform transition-transform duration-300 group-hover:scale-110">
                  <span className="text-white font-bold text-lg">AI</span>
                </div>
              </div>

              {/* 标题 */}
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  产品优化助手
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  ✨ AI驱动的智能优化工具
                </p>
              </div>
            </div>

            {/* 右侧装饰 */}
            <div className="hidden md:flex items-center gap-2">
              <div className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <p className="text-xs font-semibold text-blue-700">Powered by Gemini 2.5</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 标签页切换 - 紧凑设计 */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="inline-flex bg-white/80 backdrop-blur-sm p-1.5 rounded-xl shadow-lg border border-white/20">
          <button
            onClick={() => setActiveTab('keyword')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              activeTab === 'keyword'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>关键词优化</span>
          </button>
          <button
            onClick={() => setActiveTab('description')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              activeTab === 'description'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>产品描述生成</span>
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="py-4">
        {activeTab === 'keyword' ? (
          <ProductOptimizer
            type="keyword"
            title="关键词优化"
            placeholder="请输入产品关键词,每行一个&#x0a;例如:&#x0a;卤鸭板肠(小份)&#x0a;柠檬茶(大杯)&#x0a;卤鸭板肠(小份)+卤菜(小份)"
          />
        ) : (
          <ProductOptimizer
            type="description"
            title="产品描述生成"
            placeholder="请输入产品名称,每行一个&#x0a;例如:&#x0a;麻辣小龙虾&#x0a;招牌烤鱼&#x0a;椒盐排骨"
          />
        )}
      </div>

      {/* 页脚 - 紧凑设计 */}
      <footer className="mt-8 py-6 bg-white/80 backdrop-blur-sm border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center space-y-3">
            {/* 主要信息 */}
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">AI</span>
              </div>
              <p className="text-xs font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                © 2025 产品优化助手
              </p>
            </div>

            {/* 技术栈 */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full text-xs font-semibold text-blue-700 border border-blue-100">
                Next.js 15
              </span>
              <span className="px-2 py-0.5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full text-xs font-semibold text-purple-700 border border-purple-100">
                TypeScript
              </span>
              <span className="px-2 py-0.5 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-full text-xs font-semibold text-indigo-700 border border-indigo-100">
                Tailwind CSS
              </span>
              <span className="px-2 py-0.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full text-xs font-semibold text-green-700 border border-green-100">
                Gemini 2.5
              </span>
            </div>

            {/* 版权信息 */}
            <p className="text-xs text-gray-500">
              基于 AI 技术驱动 · 让产品优化更简单
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
