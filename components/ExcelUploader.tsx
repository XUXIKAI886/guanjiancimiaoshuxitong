'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import { readExcelColumn } from '@/utils/export';

interface ExcelUploaderProps {
  onDataExtracted: (data: string[]) => void;
  columnIndex?: number;
  columnName?: string;
}

export default function ExcelUploader({
  onDataExtracted,
  columnIndex = 3,
  columnName = '商品名称'
}: ExcelUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // 验证文件类型
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['xls', 'xlsx'].includes(fileExtension || '')) {
      setError('请上传 .xls 或 .xlsx 格式的 Excel 文件');
      return;
    }

    setFile(selectedFile);
    setError('');

    // 自动解析文件
    await parseFile(selectedFile);
  };

  // 解析Excel文件
  const parseFile = async (fileToparse: File) => {
    setLoading(true);
    setError('');

    try {
      // 从指定列提取数据
      const data = await readExcelColumn(fileToparse, columnIndex);

      if (data.length === 0) {
        throw new Error('未找到有效数据');
      }

      // 回调传递数据
      onDataExtracted(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '文件解析失败';
      setError(errorMessage);
      console.error('Excel解析错误:', err);
    } finally {
      setLoading(false);
    }
  };

  // 清除文件
  const handleClear = () => {
    setFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 触发文件选择
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <div
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}
          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xls,.xlsx"
          onChange={handleFileChange}
          className="hidden"
          disabled={loading}
        />

        <div className="flex flex-col items-center gap-3">
          {file ? (
            <>
              <FileSpreadsheet className="w-12 h-12 text-green-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-700">
                  {file.name}
                </p>
                <p className="text-xs text-green-600">
                  文件大小: {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  点击上传 Excel 文件
                </p>
                <p className="text-xs text-gray-500">
                  支持 .xls 和 .xlsx 格式
                </p>
              </div>
            </>
          )}
        </div>

        {file && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="absolute top-2 right-2 p-1 rounded-full bg-red-100 hover:bg-red-200 transition-colors"
            disabled={loading}
          >
            <X className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>

      {/* 说明信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <div className="flex gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-blue-900">使用说明:</p>
            <ul className="text-blue-800 space-y-1 list-disc list-inside">
              <li>系统会自动读取第 {columnIndex + 1} 列 ("{columnName}") 的数据</li>
              <li>第一行将作为表头被跳过</li>
              <li>上传后会自动提取并填充到输入框</li>
              <li>空白单元格会被自动忽略</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="text-center text-sm text-gray-600">
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
          正在解析 Excel 文件...
        </div>
      )}
    </div>
  );
}
