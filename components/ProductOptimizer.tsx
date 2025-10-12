'use client';

import { useState, useRef } from 'react';
import { Download, FileSpreadsheet, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { optimizeKeywords, generateDescriptions } from '@/lib/api';
import { exportToExcel, exportToImage, formatDateTime } from '@/utils/export';
import { OptimizationType } from '@/types';

interface ProductOptimizerProps {
  type: OptimizationType;
  title: string;
  placeholder: string;
}

export default function ProductOptimizer({ type, title, placeholder }: ProductOptimizerProps) {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<Array<{ original: string; optimized: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const tableRef = useRef<HTMLDivElement>(null);

  // 处理优化
  const handleOptimize = async () => {
    if (!input.trim()) {
      setError('请输入内容');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      // 按行分割输入
      const lines = input
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length === 0) {
        setError('请输入有效内容');
        return;
      }

      // 调用对应的API
      let optimizedLines: string[];
      if (type === 'keyword') {
        optimizedLines = await optimizeKeywords(lines);
      } else {
        optimizedLines = await generateDescriptions(lines);
      }

      // 组合结果
      const newResults = lines.map((original, index) => ({
        original,
        optimized: optimizedLines[index] || '生成失败',
      }));

      setResults(newResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败,请重试');
      console.error('优化失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 导出到Excel
  const handleExportExcel = () => {
    if (results.length === 0) {
      setError('没有可导出的数据');
      return;
    }

    try {
      const header = type === 'keyword' ? ['原关键词', '优化后关键词'] : ['原产品名称', '产品描述'];
      const data = [header, ...results.map(r => [r.original, r.optimized])];
      const filename = `${title}_${formatDateTime()}.xlsx`;

      exportToExcel(data, filename);
    } catch (err) {
      setError('导出Excel失败');
      console.error(err);
    }
  };

  // 导出为图片
  const handleExportImage = async () => {
    if (results.length === 0) {
      setError('没有可导出的数据');
      return;
    }

    if (!tableRef.current) {
      setError('无法获取表格元素');
      return;
    }

    try {
      const filename = `${title}_${formatDateTime()}.jpg`;
      await exportToImage(tableRef.current, filename);
    } catch (err) {
      setError('导出图片失败');
      console.error(err);
    }
  };

  // 清空所有
  const handleClear = () => {
    setInput('');
    setResults([]);
    setError('');
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* 标题 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600">批量{type === 'keyword' ? '优化产品关键词' : '生成产品描述'},一键导出Excel和图片</p>
      </div>

      {/* 输入区域 */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            输入内容 (每行一个{type === 'keyword' ? '关键词' : '产品名称'})
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={loading}
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={handleOptimize}
            disabled={loading || !input.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                开始{type === 'keyword' ? '优化' : '生成'}
              </>
            )}
          </button>

          <button
            onClick={handleClear}
            disabled={loading}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            清空
          </button>
        </div>
      </div>

      {/* 结果展示 */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              结果预览 (共 {results.length} 条)
            </h2>

            <div className="flex gap-2">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                导出Excel
              </button>

              <button
                onClick={handleExportImage}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                导出图片
              </button>
            </div>
          </div>

          {/* 表格 */}
          <div ref={tableRef} className="overflow-x-auto bg-white p-4 rounded-lg">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border border-gray-200">
                    序号
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border border-gray-200">
                    {type === 'keyword' ? '原关键词' : '原产品名称'}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border border-gray-200">
                    {type === 'keyword' ? '优化后关键词' : '产品描述'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600 border border-gray-200">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">
                      {result.original}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">
                      {result.optimized}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
