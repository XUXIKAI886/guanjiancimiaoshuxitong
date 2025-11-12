# ⚡ Tauri下载功能快速集成 - 5分钟上手

## 🎯 问题说明

你的工具在**浏览器中下载正常**，但在**呈尚策划工具箱桌面应用**中点击下载按钮**没有任何反应**。

**原因**: Tauri禁用了浏览器原生下载功能，必须使用Tauri API。

---

## ✅ 解决方案（复制即用）

### 步骤1: 复制这段代码到你的JS文件

```javascript
// ============ 复制开始 ============

/**
 * 通用图片下载函数 - 支持浏览器和Tauri
 */
async function downloadImage(imageDataUrl, filename = 'image.png') {
    const isTauri = typeof window !== 'undefined' &&
                    typeof window.__TAURI__ !== 'undefined' &&
                    typeof window.__TAURI__.core !== 'undefined';

    if (!isTauri) {
        // 浏览器环境
        const link = document.createElement('a');
        link.href = imageDataUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
    }

    // Tauri环境
    try {
        const filePath = await window.__TAURI__.core.invoke('plugin:dialog|save', {
            options: {
                defaultPath: filename,
                title: '保存图片',
                filters: [{name: '图片文件', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif']}]
            }
        });

        if (!filePath) return false;

        const base64Data = imageDataUrl.includes(',') ? imageDataUrl.split(',')[1] : imageDataUrl;
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        await window.__TAURI__.core.invoke('plugin:fs|write_file', bytes, {
            headers: {
                path: encodeURIComponent(filePath),
                options: JSON.stringify({})
            }
        });

        alert('图片保存成功!\n' + filePath);
        return true;
    } catch (error) {
        alert('保存失败: ' + error.message);
        return false;
    }
}

/**
 * 通用表格下载函数 - 支持浏览器和Tauri
 */
async function downloadTable(csvContent, filename = 'table.csv') {
    const isTauri = typeof window !== 'undefined' &&
                    typeof window.__TAURI__ !== 'undefined' &&
                    typeof window.__TAURI__.core !== 'undefined';

    if (!isTauri) {
        // 浏览器环境
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
        return true;
    }

    // Tauri环境
    try {
        const filePath = await window.__TAURI__.core.invoke('plugin:dialog|save', {
            options: {
                defaultPath: filename,
                title: '保存表格',
                filters: [{name: 'CSV文件', extensions: ['csv']}, {name: 'Excel文件', extensions: ['xlsx', 'xls']}]
            }
        });

        if (!filePath) return false;

        const encoder = new TextEncoder();
        const bytes = encoder.encode(csvContent);

        await window.__TAURI__.core.invoke('plugin:fs|write_file', bytes, {
            headers: {
                path: encodeURIComponent(filePath),
                options: JSON.stringify({})
            }
        });

        alert('表格保存成功!\n' + filePath);
        return true;
    } catch (error) {
        alert('保存失败: ' + error.message);
        return false;
    }
}

// ============ 复制结束 ============
```

### 步骤2: 修改你的下载按钮

**修改前**:
```javascript
downloadBtn.onclick = function() {
    const canvas = document.getElementById('myCanvas');
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'image.png';
    link.href = url;
    link.click();
};
```

**修改后**:
```javascript
downloadBtn.onclick = async function() {
    const canvas = document.getElementById('myCanvas');
    const dataUrl = canvas.toDataURL('image/png');
    await downloadImage(dataUrl, 'image.png');
};
```

### 步骤3: 测试

1. **浏览器测试**: 直接打开HTML，点击下载按钮
2. **桌面应用测试**: 在呈尚策划工具箱中打开工具，点击下载按钮

✅ 完成！

---

## 📋 常用场景

### 场景1: Canvas导出图片

```javascript
// HTML
<button id="exportBtn">导出图片</button>

// JS
document.getElementById('exportBtn').onclick = async function() {
    const canvas = document.getElementById('myCanvas');
    const dataUrl = canvas.toDataURL('image/png');
    await downloadImage(dataUrl, 'design.png');
};
```

### 场景2: 表格导出CSV

```javascript
// 将table转为CSV
function tableToCSV(tableElement) {
    const rows = [];
    tableElement.querySelectorAll('tr').forEach(tr => {
        const cells = [];
        tr.querySelectorAll('th, td').forEach(cell => {
            cells.push(cell.textContent.trim());
        });
        rows.push(cells.join(','));
    });
    return rows.join('\n');
}

// 导出
document.getElementById('exportTableBtn').onclick = async function() {
    const table = document.getElementById('dataTable');
    const csv = tableToCSV(table);
    await downloadTable(csv, 'data.csv');
};
```

### 场景3: 下载远程图片

```javascript
async function downloadRemoteImage(imageUrl, filename) {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    const reader = new FileReader();
    const dataUrl = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });

    await downloadImage(dataUrl, filename);
}

// 使用
downloadBtn.onclick = () => downloadRemoteImage('https://example.com/pic.jpg', 'photo.jpg');
```

---

## 🐛 如果还是不工作？

### 调试步骤1: 检测环境

在控制台运行：
```javascript
console.log('Tauri环境:', typeof window.__TAURI__ !== 'undefined');
```

- 输出 `true` = 在Tauri桌面应用中
- 输出 `false` = 在浏览器中

### 调试步骤2: 测试Dialog

在控制台运行：
```javascript
window.__TAURI__.core.invoke('plugin:dialog|save', {
    options: {defaultPath: 'test.png'}
}).then(path => console.log('选择路径:', path));
```

- 应该弹出保存对话框
- 如果没反应 = Tauri配置有问题

### 调试步骤3: 查看错误

打开开发者工具(F12)，查看Console标签是否有错误信息。

---

## ⚠️ 重要提醒

### ✅ 正确的API格式

```javascript
// Dialog API (2参数)
await window.__TAURI__.core.invoke('plugin:dialog|save', {
    options: { defaultPath: 'file.png' }
});

// FS API (3参数) ← 注意是3个参数！
await window.__TAURI__.core.invoke(
    'plugin:fs|write_file',
    bytes,  // 第2个参数: 数据
    {       // 第3个参数: 配置
        headers: {
            path: encodeURIComponent(filePath),
            options: JSON.stringify({})
        }
    }
);
```

### ❌ 错误的格式（会报错）

```javascript
// ❌ 这样写会报 "unexpected invoke body"
await window.__TAURI__.core.invoke('plugin:fs|write_file', {
    path: filePath,
    contents: bytes
});
```

---

## 📞 需要帮助？

如果遇到问题：

1. 查看完整文档: `TAURI_DOWNLOAD_INTEGRATION_GUIDE.md`
2. 参考成功案例: 美工系统（https://www.yujinkeji.xyz）已集成
3. 查看控制台日志获取详细错误信息

---

**文档版本**: v1.0
**适用环境**: 呈尚策划工具箱 v1.0.26+
**更新日期**: 2025-01-11
