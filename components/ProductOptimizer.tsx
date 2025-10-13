'use client';

import { useState, useRef } from 'react';
import { Download, FileSpreadsheet, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { optimizeKeywords, generateDescriptions, Platform } from '@/lib/api';
import { exportToExcel, exportToImage, formatDateTime } from '@/utils/export';
import { OptimizationType } from '@/types';
import ExcelUploader from './ExcelUploader';
import InfoSidebar from './InfoSidebar';

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
  const [showUploader, setShowUploader] = useState(true); // 默认显示上传Excel
  const [platform, setPlatform] = useState<Platform>('meituan'); // 默认美团
  const tableRef = useRef<HTMLDivElement>(null);

  // 处理从Excel提取的数据
  const handleDataExtracted = (data: string[]) => {
    setInput(data.join('\n'));
    setShowUploader(false);
    setError('');
  };

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
        optimizedLines = await optimizeKeywords(lines, platform);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full max-w-7xl mx-auto p-6 space-y-8">
        {/* 标题区域 - 增强视觉效果 */}
        <div className="text-center space-y-4 py-8">
          <div className="inline-block">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {title}
            </h1>
            <div className="h-1 mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full"></div>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            批量{type === 'keyword' ? '优化产品关键词' : '生成产品描述'},一键导出Excel和图片
          </p>
        </div>

        {/* 平台切换 - 优化设计 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-shadow">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              <span className="text-sm font-semibold text-gray-700">选择平台</span>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={() => setPlatform('meituan')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  platform === 'meituan'
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg shadow-yellow-500/50'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                美团
              </button>
              <button
                onClick={() => setPlatform('eleme')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  platform === 'eleme'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                饿了么
              </button>
            </div>
          </div>
        </div>
        {/* 输入区域 - 优化设计 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 hover:shadow-xl transition-shadow">
          {/* 切换按钮 - 优化样式 */}
          <div className="flex gap-3 pb-6 mb-6 border-b-2 border-gray-100">
            <button
              onClick={() => setShowUploader(true)}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                showUploader
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
              }`}
            >
              📁 上传 Excel
            </button>
            <button
              onClick={() => setShowUploader(false)}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                !showUploader
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
              }`}
            >
              ✏️ 手动输入
            </button>
          </div>

        {/* 根据状态显示不同内容 */}
        {showUploader ? (
          <ExcelUploader
            onDataExtracted={handleDataExtracted}
            columnIndex={3}
            columnName="商品名称"
          />
        ) : (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              输入内容 (每行一个{type === 'keyword' ? '关键词' : '产品名称'})
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              className="w-full h-48 p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-300 hover:border-blue-300"
              disabled={loading}
            />
          </div>
        )}

        {/* 错误提示 - 优化样式 */}
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 text-sm flex items-start gap-3 animate-shake">
            <span className="text-xl">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* 操作按钮 - 优化设计 */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={handleOptimize}
            disabled={loading || !input.trim()}
            className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>处理中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>开始{type === 'keyword' ? '优化' : '生成'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleClear}
            disabled={loading}
            className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
          >
            🗑️ 清空
          </button>
        </div>
      </div>

        {/* 结果展示 - 优化设计 */}
        {results.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 hover:shadow-xl transition-shadow animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ✨ 结果预览
                </h2>
                <p className="text-sm text-gray-600 mt-1">共 {results.length} 条数据</p>
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>导出Excel</span>
                </button>

                <button
                  onClick={handleExportImage}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <ImageIcon className="w-5 h-5" />
                  <span>导出图片</span>
                </button>
              </div>
            </div>

            {/* 表格 - 优化样式 */}
            <div ref={tableRef} className="overflow-x-auto bg-white rounded-xl shadow-inner">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-b-2 border-blue-200">
                      序号
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-b-2 border-blue-200">
                      {type === 'keyword' ? '原关键词' : '原产品名称'}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-b-2 border-blue-200">
                      {type === 'keyword' ? '优化后关键词' : '产品描述'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr
                      key={index}
                      className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {result.original}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {result.optimized}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 右侧固定侧边栏 */}
        <div className="hidden xl:block fixed right-8 top-24 w-[380px] max-h-[calc(100vh-120px)] overflow-y-auto">
          <InfoSidebar type={type} />
        </div>
      </div>
    </div>
  );
}
