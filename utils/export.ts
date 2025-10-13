import * as XLSX from 'xlsx';

/**
 * 导出数据到Excel
 * @param data 数据数组 [[原文, 优化后], ...]
 * @param filename 文件名
 * @param sheetName 工作表名称
 */
export function exportToExcel(
  data: string[][],
  filename: string = '导出数据.xlsx',
  sheetName: string = 'Sheet1'
) {
  try {
    // 创建工作簿
    const wb = XLSX.utils.book_new();

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(data);

    // 设置列宽
    ws['!cols'] = [
      { wch: 40 }, // 第一列宽度
      { wch: 40 }, // 第二列宽度
    ];

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // 导出文件
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error('Excel导出失败:', error);
    throw new Error('Excel导出失败');
  }
}

/**
 * 将表格数据渲染到Canvas并导出为图片
 * @param element 要导出的HTML元素
 * @param filename 文件名
 */
export async function exportToImage(
  element: HTMLElement,
  filename: string = '导出图片.jpg'
) {
  try {
    // 获取表格元素
    const table = element.querySelector('table');
    if (!table) {
      throw new Error('未找到表格元素');
    }

    // 创建canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法创建canvas context');
    }

    // 设置canvas尺寸
    const padding = 40;
    const rowHeight = 50;
    const rows = table.querySelectorAll('tr');
    const headerRow = rows[0];
    const dataRows = Array.from(rows).slice(1);

    // 计算列宽
    const col1Width = 80;  // 序号列
    const col2Width = 500; // 原内容列
    const col3Width = 500; // 优化后列
    const totalWidth = col1Width + col2Width + col3Width + padding * 2;
    const totalHeight = (rows.length + 1) * rowHeight + padding * 2;

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    // 设置背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 设置字体
    ctx.font = '16px Arial, sans-serif';
    ctx.textBaseline = 'middle';

    let currentY = padding;

    // 绘制表头
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(padding, currentY, totalWidth - padding * 2, rowHeight);

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, currentY, totalWidth - padding * 2, rowHeight);

    // 绘制表头文字
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 16px Arial, sans-serif';

    const headers = headerRow.querySelectorAll('th');
    ctx.fillText(headers[0]?.textContent || '序号', padding + 20, currentY + rowHeight / 2);
    ctx.fillText(headers[1]?.textContent || '原内容', padding + col1Width + 20, currentY + rowHeight / 2);
    ctx.fillText(headers[2]?.textContent || '优化后', padding + col1Width + col2Width + 20, currentY + rowHeight / 2);

    // 绘制垂直线
    ctx.beginPath();
    ctx.moveTo(padding + col1Width, currentY);
    ctx.lineTo(padding + col1Width, currentY + rowHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding + col1Width + col2Width, currentY);
    ctx.lineTo(padding + col1Width + col2Width, currentY + rowHeight);
    ctx.stroke();

    currentY += rowHeight;

    // 绘制数据行
    ctx.font = '14px Arial, sans-serif';
    dataRows.forEach((row, index) => {
      const cells = row.querySelectorAll('td');

      // 绘制行背景
      if (index % 2 === 0) {
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = '#f9fafb';
      }
      ctx.fillRect(padding, currentY, totalWidth - padding * 2, rowHeight);

      // 绘制边框
      ctx.strokeStyle = '#e5e7eb';
      ctx.strokeRect(padding, currentY, totalWidth - padding * 2, rowHeight);

      // 绘制垂直线
      ctx.beginPath();
      ctx.moveTo(padding + col1Width, currentY);
      ctx.lineTo(padding + col1Width, currentY + rowHeight);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padding + col1Width + col2Width, currentY);
      ctx.lineTo(padding + col1Width + col2Width, currentY + rowHeight);
      ctx.stroke();

      // 绘制文字
      ctx.fillStyle = '#111827';

      // 序号
      const text1 = cells[0]?.textContent || '';
      ctx.fillText(text1, padding + 20, currentY + rowHeight / 2);

      // 原内容 - 支持文字换行
      const text2 = cells[1]?.textContent || '';
      wrapText(ctx, text2, padding + col1Width + 20, currentY + rowHeight / 2, col2Width - 40, 20);

      // 优化后 - 支持文字换行
      const text3 = cells[2]?.textContent || '';
      wrapText(ctx, text3, padding + col1Width + col2Width + 20, currentY + rowHeight / 2, col3Width - 40, 20);

      currentY += rowHeight;
    });

    // 将canvas转换为blob并下载
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          throw new Error('图片生成失败');
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      'image/jpeg',
      0.95
    );
  } catch (error) {
    console.error('图片导出失败:', error);
    throw new Error('图片导出失败');
  }
}

/**
 * 在canvas上绘制文字并支持换行
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split('');
  let line = '';
  const lines: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i];
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && line.length > 0) {
      lines.push(line);
      line = words[i];
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  // 绘制所有行,居中对齐
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    ctx.fillText(line, x, startY + index * lineHeight);
  });
}

/**
 * 格式化日期时间用于文件名
 */
export function formatDateTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}_${hour}${minute}${second}`;
}

/**
 * 从Excel文件中读取指定列的数据
 * @param file Excel文件对象
 * @param columnIndex 列索引(从0开始,第四列为3)
 * @param startRow 开始行(从0开始,默认为1跳过表头)
 * @returns 提取的数据数组
 */
export async function readExcelColumn(
  file: File,
  columnIndex: number = 3,
  startRow: number = 1
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            throw new Error('文件读取失败');
          }

          // 读取工作簿
          const workbook = XLSX.read(data, { type: 'binary' });

          // 获取第一个工作表
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // 将工作表转换为JSON数组
          const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // 提取指定列的数据
          const columnData: string[] = [];
          for (let i = startRow; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row && row[columnIndex]) {
              const value = String(row[columnIndex]).trim();
              if (value) {
                columnData.push(value);
              }
            }
          }

          if (columnData.length === 0) {
            throw new Error(`第${columnIndex + 1}列没有找到有效数据`);
          }

          resolve(columnData);
        } catch (error) {
          console.error('Excel解析失败:', error);
          reject(new Error('Excel解析失败: ' + (error instanceof Error ? error.message : '未知错误')));
        }
      };

      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('读取Excel文件失败:', error);
      reject(error);
    }
  });
}
