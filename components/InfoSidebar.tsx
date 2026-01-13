'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '@/lib/tauriClipboard';

interface InfoSidebarProps {
  type: 'keyword' | 'description';
}

export default function InfoSidebar({ type }: InfoSidebarProps) {
  const [copied, setCopied] = useState(false);

  const keywordText = `🎉 关键词优化方案 🎉
👋 老板您好！
📋 全店菜品关键词优化已完成
╭─────╮
│ 五大优势 │
╰─────╯
🔍 提升曝光·美团搜索排名↑
👆 吸引点击·进店率倍增
💡 激发购买·优化菜品描述
🌟 突出特色·差异化竞争
📅 灵活调整·节假日优化
🎯 目标
精准布局→脱颖而出→销量增长📈
👀 请审阅
✅ 确认后即刻上线`;

  const descriptionText = `🎉 菜品描述文案方案 🎉
👋 老板您好！
📋 全店菜品描述文案已完成
╭─────╮
│ 核心亮点 │
╰─────╯
👁️ 点单即现·第一时间吸睛
✨ 详述特色·展现美味细节
🎯 激发食欲·提升下单欲望
📈 提高转化·有效促成交易
💡 设计目的
生动文字→感受诱人→激发购买
👀 请审阅
✅ 确认后即刻上线`;

  const text = type === 'keyword' ? keywordText : descriptionText;

  const handleCopy = async () => {
    try {
      const success = await copyToClipboard(text);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        alert('复制失败，请手动选择文字复制');
      }
    } catch (error) {
      console.error('复制出错:', error);
      alert('复制失败，请手动选择文字复制');
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 sticky top-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between gap-2 mb-6">
        <h3 className="text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex-shrink-0">
          {type === 'keyword' ? '📋 关键词优化' : '📋 描述文案'}
        </h3>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 flex-shrink-0 ${
            copied
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
          }`}
          title="点击复制全文"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>已复制</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>复制</span>
            </>
          )}
        </button>
      </div>

      <div
        onClick={handleCopy}
        className="text-gray-700 text-sm leading-relaxed whitespace-pre-line cursor-pointer hover:bg-blue-50/50 p-5 rounded-xl transition-all duration-300 border-2 border-transparent hover:border-blue-200"
        title="点击复制全文"
      >
        {text}
      </div>

      <div className="mt-6 pt-4 border-t-2 border-gray-100">
        <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
          点击文字或按钮即可复制全文
        </p>
      </div>
    </div>
  );
}
