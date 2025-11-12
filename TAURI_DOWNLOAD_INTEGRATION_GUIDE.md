# 🚀 Tauri桌面应用文件下载集成指南

## 📋 文档概述

本文档面向**外部工具开发者**，指导如何修改工具源代码，使其在呈尚策划工具箱Tauri桌面应用中支持文件下载功能。

**适用工具**: 所有需要下载文件的工具（图片下载、表格导出、文档下载等）

**技术栈**: Tauri 2.x + tauri-plugin-dialog + tauri-plugin-fs

---

## 🎯 核心问题

### 为什么需要修改源代码？

**问题根源**: Tauri 2.x的WebView环境**完全禁用**了浏览器原生下载功能，包括：
- `<a download>` 标签
- `window.open(blobURL)`
- `document.createElement('a').click()`
- `navigator.saveAs()`

**影响范围**: 在浏览器中正常工作的下载代码，在Tauri桌面应用中**完全无响应**。

**解决方案**: 检测Tauri环境，并使用Tauri专用API进行文件保存。

### 美工系统为什么能下载？

美工系统（https://www.yujinkeji.xyz）已经集成了Tauri API，使用`window.__TAURI__.core.invoke()`而不是浏览器原生下载。

---

## 🔧 完整集成方案

### 1. 环境检测函数

```javascript
/**
 * 检测是否在Tauri环境中运行
 * @returns {boolean} true=Tauri环境, false=浏览器环境
 */
function isTauriEnvironment() {
    return typeof window !== 'undefined' &&
           typeof window.__TAURI__ !== 'undefined' &&
           typeof window.__TAURI__.core !== 'undefined' &&
           typeof window.__TAURI__.core.invoke === 'function';
}

// 使用示例
console.log('运行环境:', isTauriEnvironment() ? 'Tauri桌面应用' : '浏览器');
```

### 2. 图片下载函数（✅ 完整版）

```javascript
/**
 * 🎯 通用图片下载函数 - 支持浏览器和Tauri双环境
 *
 * @param {string} imageDataUrl - 图片Data URL (data:image/png;base64,...)
 * @param {string} filename - 保存的文件名 (如: 'image.png')
 * @returns {Promise<boolean>} 下载是否成功
 */
async function downloadImage(imageDataUrl, filename = 'image.png') {
    // 1. 环境检测
    const isTauri = typeof window !== 'undefined' &&
                    typeof window.__TAURI__ !== 'undefined' &&
                    typeof window.__TAURI__.core !== 'undefined';

    // 2. 浏览器环境 - 使用传统下载方法
    if (!isTauri) {
        try {
            const link = document.createElement('a');
            link.href = imageDataUrl;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log('✅ [浏览器] 图片下载成功');
            return true;
        } catch (error) {
            console.error('❌ [浏览器] 下载失败:', error);
            alert('下载失败: ' + error.message);
            return false;
        }
    }

    // 3. Tauri环境 - 使用Tauri API
    try {
        console.log('🖼️ [Tauri] 开始保存图片:', filename);

        // 3.1 显示文件保存对话框
        const filePath = await window.__TAURI__.core.invoke('plugin:dialog|save', {
            options: {
                defaultPath: filename,
                title: '保存图片',
                filters: [{
                    name: '图片文件',
                    extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg']
                }]
            }
        });

        // 3.2 用户取消保存
        if (!filePath) {
            console.log('⚠️ [Tauri] 用户取消了保存');
            return false;
        }

        console.log('📁 [Tauri] 选择的保存路径:', filePath);

        // 3.3 转换Base64为字节数组
        const base64Data = imageDataUrl.includes(',')
            ? imageDataUrl.split(',')[1]
            : imageDataUrl;

        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        console.log('💾 [Tauri] 准备写入文件, 大小:', bytes.length, 'bytes');

        // 3.4 写入文件 (⚠️ 注意: 必须使用3参数格式!)
        await window.__TAURI__.core.invoke(
            'plugin:fs|write_file',  // 参数1: 命令名
            bytes,                    // 参数2: 数据 (Uint8Array)
            {                         // 参数3: 配置对象
                headers: {
                    path: encodeURIComponent(filePath),
                    options: JSON.stringify({})
                }
            }
        );

        console.log('✅ [Tauri] 图片保存成功!');
        alert('图片保存成功!\n保存位置: ' + filePath);
        return true;

    } catch (error) {
        console.error('❌ [Tauri] 保存失败:', error);
        console.error('错误详情:', error.message);
        alert('保存失败: ' + error.message);
        return false;
    }
}
```

### 3. 表格/Excel下载函数（✅ 完整版）

```javascript
/**
 * 🎯 通用表格下载函数 - 支持浏览器和Tauri双环境
 *
 * @param {string} csvContent - CSV格式内容
 * @param {string} filename - 保存的文件名 (如: 'data.csv')
 * @returns {Promise<boolean>} 下载是否成功
 */
async function downloadTable(csvContent, filename = 'table.csv') {
    // 1. 环境检测
    const isTauri = typeof window !== 'undefined' &&
                    typeof window.__TAURI__ !== 'undefined' &&
                    typeof window.__TAURI__.core !== 'undefined';

    // 2. 浏览器环境
    if (!isTauri) {
        try {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log('✅ [浏览器] 表格下载成功');
            return true;
        } catch (error) {
            console.error('❌ [浏览器] 下载失败:', error);
            alert('下载失败: ' + error.message);
            return false;
        }
    }

    // 3. Tauri环境
    try {
        console.log('📊 [Tauri] 开始保存表格:', filename);

        // 3.1 显示文件保存对话框
        const filePath = await window.__TAURI__.core.invoke('plugin:dialog|save', {
            options: {
                defaultPath: filename,
                title: '保存表格',
                filters: [{
                    name: 'CSV文件',
                    extensions: ['csv']
                }, {
                    name: 'Excel文件',
                    extensions: ['xlsx', 'xls']
                }, {
                    name: '所有文件',
                    extensions: ['*']
                }]
            }
        });

        // 3.2 用户取消保存
        if (!filePath) {
            console.log('⚠️ [Tauri] 用户取消了保存');
            return false;
        }

        console.log('📁 [Tauri] 选择的保存路径:', filePath);

        // 3.3 转换字符串为字节数组
        const encoder = new TextEncoder();
        const bytes = encoder.encode(csvContent);

        console.log('💾 [Tauri] 准备写入文件, 大小:', bytes.length, 'bytes');

        // 3.4 写入文件
        await window.__TAURI__.core.invoke(
            'plugin:fs|write_file',
            bytes,
            {
                headers: {
                    path: encodeURIComponent(filePath),
                    options: JSON.stringify({})
                }
            }
        );

        console.log('✅ [Tauri] 表格保存成功!');
        alert('表格保存成功!\n保存位置: ' + filePath);
        return true;

    } catch (error) {
        console.error('❌ [Tauri] 保存失败:', error);
        console.error('错误详情:', error.message);
        alert('保存失败: ' + error.message);
        return false;
    }
}
```

---

## 💡 使用示例

### 示例1: Canvas导出图片

```javascript
// HTML
<canvas id="myCanvas" width="800" height="600"></canvas>
<button onclick="handleDownloadImage()">导出图片</button>

// JavaScript
async function handleDownloadImage() {
    const canvas = document.getElementById('myCanvas');
    const dataUrl = canvas.toDataURL('image/png');
    const success = await downloadImage(dataUrl, 'my-design.png');

    if (success) {
        console.log('图片导出完成');
    }
}
```

### 示例2: 表格导出CSV

```javascript
// HTML
<table id="dataTable">
    <thead>
        <tr><th>姓名</th><th>年龄</th></tr>
    </thead>
    <tbody>
        <tr><td>张三</td><td>25</td></tr>
        <tr><td>李四</td><td>30</td></tr>
    </tbody>
</table>
<button onclick="handleDownloadTable()">导出表格</button>

// JavaScript
function tableToCSV(tableElement) {
    const rows = [];
    const trElements = tableElement.querySelectorAll('tr');

    trElements.forEach(tr => {
        const cells = [];
        tr.querySelectorAll('th, td').forEach(cell => {
            cells.push(cell.textContent.trim());
        });
        rows.push(cells.join(','));
    });

    return rows.join('\n');
}

async function handleDownloadTable() {
    const table = document.getElementById('dataTable');
    const csvContent = tableToCSV(table);
    const success = await downloadTable(csvContent, 'data.csv');

    if (success) {
        console.log('表格导出完成');
    }
}
```

### 示例3: 下载远程图片

```javascript
async function downloadRemoteImage(imageUrl, filename) {
    try {
        // 1. 获取图片数据
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        // 2. 转换为Data URL
        const reader = new FileReader();
        const dataUrl = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        // 3. 下载
        await downloadImage(dataUrl, filename);
    } catch (error) {
        console.error('下载失败:', error);
        alert('下载失败: ' + error.message);
    }
}

// 使用
downloadBtn.onclick = () => downloadRemoteImage(
    'https://example.com/image.png',
    'downloaded-image.png'
);
```

### 示例4: HTML内容转图片下载

```javascript
/**
 * 将DOM元素转为图片并下载
 * 需要引入 html2canvas 库: https://html2canvas.hertzen.com/
 */
async function downloadElementAsImage(element, filename) {
    try {
        // 使用html2canvas转换DOM为canvas
        const canvas = await html2canvas(element);
        const dataUrl = canvas.toDataURL('image/png');
        await downloadImage(dataUrl, filename);
    } catch (error) {
        console.error('生成图片失败:', error);
        alert('生成图片失败: ' + error.message);
    }
}

// 使用
const reportDiv = document.getElementById('report');
downloadBtn.onclick = () => downloadElementAsImage(reportDiv, 'report.png');
```

---

## 🔍 调试指南

### 1. 检测Tauri环境

在浏览器控制台运行：

```javascript
console.log('Tauri可用:', typeof window.__TAURI__ !== 'undefined');
console.log('Core API:', typeof window.__TAURI__?.core?.invoke);
console.log('完整对象:', window.__TAURI__);
```

**期望输出 (Tauri环境)**:
```
Tauri可用: true
Core API: "function"
完整对象: {core: {...}, event: {...}, ...}
```

**期望输出 (浏览器环境)**:
```
Tauri可用: false
Core API: undefined
完整对象: undefined
```

### 2. 测试Dialog API

```javascript
async function testDialog() {
    try {
        const path = await window.__TAURI__.core.invoke('plugin:dialog|save', {
            options: {
                defaultPath: 'test.png',
                title: '测试保存对话框',
                filters: [{ name: '图片', extensions: ['png'] }]
            }
        });
        console.log('✅ Dialog测试成功, 用户选择路径:', path);
        return path;
    } catch (err) {
        console.error('❌ Dialog测试失败:', err);
        throw err;
    }
}

// 运行测试
testDialog();
```

### 3. 测试文件写入

```javascript
async function testFileWrite(filePath) {
    try {
        // 创建测试数据
        const testText = 'Hello from Tauri!';
        const encoder = new TextEncoder();
        const bytes = encoder.encode(testText);

        // 写入文件
        await window.__TAURI__.core.invoke(
            'plugin:fs|write_file',
            bytes,
            {
                headers: {
                    path: encodeURIComponent(filePath),
                    options: JSON.stringify({})
                }
            }
        );

        console.log('✅ 文件写入测试成功');
        alert('文件写入成功: ' + filePath);
    } catch (err) {
        console.error('❌ 文件写入测试失败:', err);
        throw err;
    }
}

// 完整测试流程
async function runFullTest() {
    // 1. 测试对话框
    const path = await testDialog();

    if (path) {
        // 2. 测试写入
        await testFileWrite(path);
    }
}

runFullTest();
```

### 4. 测试完整下载流程

```javascript
async function testCompleteDownload() {
    try {
        // 1. 创建测试canvas
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');

        // 2. 绘制测试图案
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(0, 0, 200, 200);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '30px Arial';
        ctx.fillText('测试图片', 50, 110);

        // 3. 转换为Data URL
        const dataUrl = canvas.toDataURL('image/png');
        console.log('Data URL长度:', dataUrl.length);

        // 4. 测试下载
        const success = await downloadImage(dataUrl, 'test-image.png');
        console.log('下载结果:', success ? '成功' : '失败');
    } catch (error) {
        console.error('测试失败:', error);
    }
}

testCompleteDownload();
```

---

## ⚠️ 常见错误和解决方案

### 错误1: `unexpected invoke body`

**症状**: Tauri控制台显示此错误

**原因**: 使用了错误的API参数格式

**解决方案**:
```javascript
// ❌ 错误 - 2参数格式
await window.__TAURI__.core.invoke('plugin:fs|write_file', {
    path: filePath,
    contents: bytes
});

// ✅ 正确 - 3参数格式
await window.__TAURI__.core.invoke(
    'plugin:fs|write_file',
    bytes,
    {
        headers: {
            path: encodeURIComponent(filePath),
            options: JSON.stringify({})
        }
    }
);
```

### 错误2: `missing required key options`

**症状**: Dialog API调用失败

**原因**: 缺少 `options` 包裹对象

**解决方案**:
```javascript
// ❌ 错误
await window.__TAURI__.core.invoke('plugin:dialog|save', {
    defaultPath: 'file.png'
});

// ✅ 正确
await window.__TAURI__.core.invoke('plugin:dialog|save', {
    options: {
        defaultPath: 'file.png'
    }
});
```

### 错误3: `window.__TAURI__ is undefined`

**症状**: 在Tauri环境中无法访问API

**可能原因**:
1. 页面还在加载中
2. CSP策略阻止了Tauri API注入

**解决方案**:
```javascript
// 方案1: 等待页面完全加载
document.addEventListener('DOMContentLoaded', () => {
    console.log('Tauri可用:', typeof window.__TAURI__ !== 'undefined');
});

// 方案2: 延迟检测
setTimeout(() => {
    console.log('Tauri可用:', typeof window.__TAURI__ !== 'undefined');
}, 100);
```

### 错误4: 路径编码问题

**症状**: Windows路径包含中文或特殊字符导致写入失败

**解决方案**:
```javascript
// ✅ 始终使用 encodeURIComponent
const encodedPath = encodeURIComponent(filePath);

await window.__TAURI__.core.invoke('plugin:fs|write_file', bytes, {
    headers: {
        path: encodedPath,  // ← 编码后的路径
        options: JSON.stringify({})
    }
});
```

### 错误5: 数据类型错误

**症状**: `TypeError: expected Uint8Array`

**原因**: 传递了 `Array` 而不是 `Uint8Array`

**解决方案**:
```javascript
// ❌ 错误
const bytes = Array.from(data);

// ✅ 正确
const bytes = new Uint8Array(data);
// 或者保持原始Uint8Array不变
```

### 错误6: Base64解码失败

**症状**: `atob()` 抛出异常

**原因**: Base64字符串格式不正确

**解决方案**:
```javascript
function decodeBase64(dataUrl) {
    try {
        // 移除Data URL前缀
        const base64Data = dataUrl.includes(',')
            ? dataUrl.split(',')[1]
            : dataUrl;

        // 清理Base64字符串
        const cleanBase64 = base64Data.replace(/\s/g, '');

        // 解码
        const binaryString = atob(cleanBase64);

        // 转换为Uint8Array
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return bytes;
    } catch (error) {
        console.error('Base64解码失败:', error);
        throw new Error('无效的Base64数据');
    }
}
```

---

## 📦 集成检查清单

在部署前，请确认以下所有项：

### 代码集成
- [ ] 已添加 `isTauriEnvironment()` 环境检测函数
- [ ] 已添加 `downloadImage()` 图片下载函数
- [ ] 已添加 `downloadTable()` 表格下载函数（如需要）
- [ ] 已修改所有下载按钮调用新函数
- [ ] 已移除或注释掉旧的浏览器下载代码

### API调用格式
- [ ] Dialog API 使用 2参数格式 + `options` 对象
- [ ] FS API 使用 **3参数格式** + `headers` 对象
- [ ] 数据类型确认为 `Uint8Array` (不是 `Array`)
- [ ] 路径使用 `encodeURIComponent()` 编码

### 测试验证
- [ ] 在浏览器环境测试下载功能正常
- [ ] 在Tauri桌面应用测试下载功能正常
- [ ] 测试取消保存对话框的处理
- [ ] 测试各种文件类型（PNG, JPG, CSV等）
- [ ] 测试中文文件名和路径
- [ ] 查看控制台确保无错误日志

### 用户体验
- [ ] 添加下载进度提示（如适用）
- [ ] 添加成功/失败提示信息
- [ ] 确保用户可以选择保存位置
- [ ] 确保默认文件名有意义

---

## 🚀 快速集成步骤

### 步骤1: 复制函数代码

将以下代码添加到你的 JavaScript 文件顶部：

```javascript
// ========== Tauri下载支持 ==========
// 环境检测
function isTauriEnvironment() {
    return typeof window !== 'undefined' &&
           typeof window.__TAURI__ !== 'undefined' &&
           typeof window.__TAURI__.core !== 'undefined';
}

// 图片下载 (复制前面的完整 downloadImage 函数)
async function downloadImage(imageDataUrl, filename = 'image.png') {
    // ... (完整代码见上文)
}

// 表格下载 (复制前面的完整 downloadTable 函数)
async function downloadTable(csvContent, filename = 'table.csv') {
    // ... (完整代码见上文)
}
// =====================================
```

### 步骤2: 修改下载按钮

**原代码 (仅浏览器)**:
```javascript
document.getElementById('downloadBtn').onclick = function() {
    const canvas = document.getElementById('myCanvas');
    const url = canvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.download = 'image.png';
    link.href = url;
    link.click();
};
```

**修改后 (支持Tauri)**:
```javascript
document.getElementById('downloadBtn').onclick = async function() {
    const canvas = document.getElementById('myCanvas');
    const dataUrl = canvas.toDataURL('image/png');

    await downloadImage(dataUrl, 'image.png');
};
```

### 步骤3: 测试

1. **浏览器测试**: 直接打开HTML文件，测试下载功能
2. **Tauri测试**: 在呈尚策划工具箱中打开工具，测试下载功能

### 步骤4: 部署

确认测试通过后，将修改后的代码部署到生产环境。

---

## 📚 技术细节说明

### Tauri API 参数格式差异

| API命令 | 参数格式 | 示例 |
|---------|---------|------|
| `plugin:dialog\|save` | 2参数: 命令 + `{options: {...}}` | `invoke('plugin:dialog\|save', {options: {...}})` |
| `plugin:dialog\|open` | 2参数: 命令 + `{options: {...}}` | `invoke('plugin:dialog\|open', {options: {...}})` |
| `plugin:fs\|write_file` | **3参数**: 命令 + 数据 + `{headers: {...}}` | `invoke('plugin:fs\|write_file', data, {headers: {...}})` |
| `plugin:fs\|read_file` | 2参数: 命令 + `{headers: {...}}` | `invoke('plugin:fs\|read_file', {headers: {...}})` |

### 为什么FS API是3参数？

Tauri的FS插件设计为支持**流式传输大文件**，因此：
- **第2个参数**: 实际的二进制数据 (`Uint8Array`)
- **第3个参数**: 元数据（路径、选项等）

这种设计可以高效处理大文件传输，而不需要将所有元数据嵌入数据中。

### headers对象结构

```javascript
{
  headers: {
    path: encodeURIComponent(filePath),  // URL编码的文件路径
    options: JSON.stringify({            // 序列化的选项对象
      // 可选配置:
      // append: boolean,      // 追加模式
      // create: boolean,      // 创建文件
      // createNew: boolean,   // 仅当文件不存在时创建
      // mode: number,         // Unix文件权限
      // baseDir: number       // 基础目录枚举值
    })
  }
}
```

---

## 🎓 进阶用法

### 1. 自定义文件过滤器

```javascript
const filePath = await window.__TAURI__.core.invoke('plugin:dialog|save', {
    options: {
        defaultPath: 'report.pdf',
        title: '导出报告',
        filters: [
            {
                name: 'PDF文件',
                extensions: ['pdf']
            },
            {
                name: 'Word文档',
                extensions: ['docx', 'doc']
            },
            {
                name: '所有文件',
                extensions: ['*']
            }
        ]
    }
});
```

### 2. 处理大文件

对于大文件（>10MB），建议添加进度提示：

```javascript
async function downloadLargeFile(dataUrl, filename) {
    try {
        // 显示加载提示
        showLoadingIndicator('正在准备下载...');

        const success = await downloadImage(dataUrl, filename);

        // 隐藏加载提示
        hideLoadingIndicator();

        if (success) {
            showSuccessMessage('文件保存成功');
        }
    } catch (error) {
        hideLoadingIndicator();
        showErrorMessage('下载失败: ' + error.message);
    }
}
```

### 3. 批量下载

```javascript
async function downloadMultipleImages(imagesArray) {
    const results = [];

    for (let i = 0; i < imagesArray.length; i++) {
        const {dataUrl, filename} = imagesArray[i];

        console.log(`正在下载 ${i + 1}/${imagesArray.length}: ${filename}`);

        const success = await downloadImage(dataUrl, filename);
        results.push({filename, success});

        // 避免过快连续弹出对话框
        if (i < imagesArray.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    const successCount = results.filter(r => r.success).length;
    alert(`批量下载完成: 成功 ${successCount}/${imagesArray.length}`);
}
```

### 4. Excel文件支持 (使用SheetJS)

```javascript
/**
 * 导出Excel文件 (需要引入 xlsx 库)
 * CDN: https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js
 */
async function downloadExcel(data, filename = 'data.xlsx') {
    try {
        // 1. 创建工作簿
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

        // 2. 生成二进制数据
        const wbout = XLSX.write(wb, {
            bookType: 'xlsx',
            type: 'array'
        });

        // 3. 转换为Uint8Array
        const bytes = new Uint8Array(wbout);

        // 4. 根据环境选择下载方式
        const isTauri = isTauriEnvironment();

        if (!isTauri) {
            // 浏览器环境
            const blob = new Blob([bytes], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
        } else {
            // Tauri环境
            const filePath = await window.__TAURI__.core.invoke('plugin:dialog|save', {
                options: {
                    defaultPath: filename,
                    title: '保存Excel文件',
                    filters: [{
                        name: 'Excel文件',
                        extensions: ['xlsx']
                    }]
                }
            });

            if (filePath) {
                await window.__TAURI__.core.invoke(
                    'plugin:fs|write_file',
                    bytes,
                    {
                        headers: {
                            path: encodeURIComponent(filePath),
                            options: JSON.stringify({})
                        }
                    }
                );
                alert('Excel文件保存成功!\n' + filePath);
            }
        }
    } catch (error) {
        console.error('Excel导出失败:', error);
        alert('导出失败: ' + error.message);
    }
}

// 使用示例
const tableData = [
    {姓名: '张三', 年龄: 25, 部门: '技术部'},
    {姓名: '李四', 年龄: 30, 部门: '市场部'}
];
downloadExcel(tableData, 'employee-data.xlsx');
```

---

## 📞 技术支持

如果集成过程中遇到问题：

1. **查看控制台日志**: 所有函数都包含详细的调试日志
2. **运行测试函数**: 使用文档中提供的测试函数逐步排查
3. **检查权限配置**: 确认呈尚策划工具箱已正确配置Tauri权限
4. **参考成功案例**: 查看美工系统（https://www.yujinkeji.xyz）的实现

---

## 📝 更新日志

- **2025-01-11**: 初始版本，基于 Tauri 2.x + 已验证的API实现
- **适用版本**: Tauri 2.x, tauri-plugin-fs 2.4.0+, tauri-plugin-dialog 2.0.0+

---

**文档状态**: ✅ 已验证
**测试环境**: 呈尚策划工具箱 v1.0.26+
**维护者**: 呈尚策划技术团队
