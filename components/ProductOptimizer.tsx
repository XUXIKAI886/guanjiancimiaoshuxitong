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
      <div className="w-full max-w-7xl mx-auto p-4 space-y-4">
        {/* 标题区域 - 紧凑设计 */}
        <div className="text-center space-y-2 py-4">
          <div className="inline-block">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {title}
            </h1>
            <div className="h-0.5 mt-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full"></div>
          </div>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            批量{type === 'keyword' ? '优化产品关键词' : '生成产品描述'},一键导出Excel和图片
          </p>
        </div>

        {/* 平台切换 - 紧凑设计 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-white/20 p-4 hover:shadow-lg transition-shadow">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              <span className="text-xs font-semibold text-gray-700">选择平台</span>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <button
                onClick={() => setPlatform('meituan')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  platform === 'meituan'
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                美团
              </button>
              <button
                onClick={() => setPlatform('eleme')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  platform === 'eleme'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                饿了么
              </button>
            </div>
          </div>
        </div>
        {/* 输入区域 - 紧凑设计 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-white/20 p-4 hover:shadow-lg transition-shadow">
          {/* 切换按钮 - 紧凑样式 */}
          <div className="flex gap-2 pb-4 mb-4 border-b border-gray-100">
            <button
              onClick={() => setShowUploader(true)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                showUploader
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📁 上传 Excel
            </button>
            <button
              onClick={() => setShowUploader(false)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                !showUploader
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            startRow={platform === 'eleme' ? 3 : 1}
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
              className="w-full h-40 p-3 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-300 hover:border-blue-300"
              disabled={loading}
            />
          </div>
        )}

        {/* 错误提示 - 紧凑样式 */}
        {error && (
          <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 text-xs flex items-start gap-2 animate-shake">
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* 操作按钮 - 紧凑设计 */}
        <div className="flex gap-3 pt-3">
          <button
            onClick={handleOptimize}
            disabled={loading || !input.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-md"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>处理中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>开始{type === 'keyword' ? '优化' : '生成'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleClear}
            disabled={loading}
            className="px-6 py-3 text-sm bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            🗑️ 清空
          </button>
        </div>
        </div>

        {/* 结果展示 - 紧凑设计 */}
        {results.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-white/20 p-4 hover:shadow-lg transition-shadow animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ✨ 结果预览
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">共 {results.length} 条数据</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>导出Excel</span>
                </button>

                <button
                  onClick={handleExportImage}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-md"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>导出图片</span>
                </button>
              </div>
            </div>

            {/* 表格 - 紧凑样式 */}
            <div ref={tableRef} className="overflow-x-auto bg-white rounded-lg shadow-inner">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-700 border-b-2 border-blue-200">
                      序号
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-700 border-b-2 border-blue-200">
                      {type === 'keyword' ? '原关键词' : '原产品名称'}
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-700 border-b-2 border-blue-200">
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
                      <td className="px-4 py-2.5 text-xs font-semibold text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-900">
                        {result.original}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-900 font-medium">
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

      {/* 右侧固定侧边栏 */}
      <div className="hidden xl:block fixed right-8 top-24 w-[380px] max-h-[calc(100vh-120px)] overflow-y-auto">
        <InfoSidebar type={type} />
      </div>
    </div>
  );
}
