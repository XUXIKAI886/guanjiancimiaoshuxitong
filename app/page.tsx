'use client';

import { useState } from 'react';
import ProductOptimizer from '@/components/ProductOptimizer';
import { Tag, FileText } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'keyword' | 'description'>('keyword');

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">AI</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">产品优化助手</h1>
                <p className="text-xs text-gray-500">AI驱动的智能优化工具</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 标签页切换 */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <div className="flex space-x-2 bg-white p-2 rounded-lg shadow-sm w-fit">
          <button
            onClick={() => setActiveTab('keyword')}
            className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all ${
              activeTab === 'keyword'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Tag className="w-5 h-5" />
            关键词优化
          </button>
          <button
            onClick={() => setActiveTab('description')}
            className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all ${
              activeTab === 'description'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-5 h-5" />
            产品描述生成
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="py-8">
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

      {/* 页脚 */}
      <footer className="mt-16 py-8 bg-white border-t">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600 text-sm">
          <p>© 2025 产品优化助手 - 基于 AI 技术驱动</p>
          <p className="mt-2 text-xs text-gray-500">
            使用 Next.js + TypeScript + Tailwind CSS 构建
          </p>
        </div>
      </footer>
    </main>
  );
}
