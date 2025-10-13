import { AIResponse } from '@/types';
import { KEYWORD_PROMPT_MEITUAN, KEYWORD_PROMPT_ELEME, DESCRIPTION_PROMPT } from './prompts';

// 平台类型
export type Platform = 'meituan' | 'eleme';

// 获取环境变量配置
const getConfig = () => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const apiModel = process.env.NEXT_PUBLIC_API_MODEL;
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;

  if (!apiBaseUrl || !apiModel || !apiKey) {
    throw new Error('API配置缺失,请检查环境变量');
  }

  return { apiBaseUrl, apiModel, apiKey };
};

/**
 * 调用大模型API
 * @param prompt 系统提示词
 * @param content 用户输入内容
 * @returns AI生成的内容
 */
export async function callAI(prompt: string, content: string): Promise<string> {
  const { apiBaseUrl, apiModel, apiKey } = getConfig();

  try {
    const response = await fetch(apiBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: apiModel,
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: content,
          },
        ],
        temperature: 0.7,
        max_tokens: 8000, // 降低到8000,配合更小的批次大小
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }

    const data: AIResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('API返回数据格式错误');
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('API调用错误:', error);
    throw error;
  }
}

/**
 * 批量优化关键词
 * @param keywords 关键词数组
 * @param platform 平台类型(meituan/eleme)
 * @param onProgress 进度回调
 * @returns 优化后的关键词数组
 */
export async function optimizeKeywords(
  keywords: string[],
  platform: Platform = 'meituan',
  onProgress?: (index: number, total: number) => void
): Promise<string[]> {
  const BATCH_SIZE = 30; // 减小批次大小,确保稳定性(从80降到30)

  // 根据平台选择提示词
  const keywordPrompt = platform === 'eleme' ? KEYWORD_PROMPT_ELEME : KEYWORD_PROMPT_MEITUAN;

  // 如果数据量较小,直接处理
  if (keywords.length <= BATCH_SIZE) {
    const input = keywords.join('\n');

    try {
      const output = await callAI(keywordPrompt, input);

      console.log('AI 原始输出:', output);
      console.log('输入行数:', keywords.length);

      // 按换行符分割,但保留空行(空行也算一行)
      const lines = output.split('\n').map(line => line.trim());
      console.log('输出行数:', lines.length);

      // 智能修复:如果输出少于输入,补充缺失的行
      if (lines.length < keywords.length) {
        console.warn(`⚠️ 数据不匹配: 输入${keywords.length}行,但输出${lines.length}行`);

        // 找出已处理的行数
        const processedCount = lines.length;

        // 补充剩余未处理的行
        for (let i = processedCount; i < keywords.length; i++) {
          lines.push(keywords[i] + '【待重新生成】');
          console.warn(`⚠️ 第${i + 1}行数据缺失,使用原始关键词: ${keywords[i]}`);
        }
      } else if (lines.length > keywords.length) {
        console.warn(`⚠️ 输出行数多于输入: 输入${keywords.length}行,输出${lines.length}行,将截断多余行`);
        lines.splice(keywords.length);
      }

      // 过滤掉完全空白的行
      const finalLines = lines.filter(line => line.length > 0);
      if (finalLines.length !== keywords.length) {
        console.warn(`⚠️ 过滤空行后数据不匹配,重新补充`);
        // 如果过滤后不够,用原始关键词填充
        while (finalLines.length < keywords.length) {
          const idx = finalLines.length;
          finalLines.push(keywords[idx] + '【待重新生成】');
        }
      }

      return finalLines;
    } catch (error) {
      console.error('关键词优化失败:', error);
      throw error;
    }
  }

  // 数据量大时,分批处理
  console.log(`🔄 数据量较大(${keywords.length}条),启动分批处理模式,每批${BATCH_SIZE}条`);

  const allResults: string[] = [];
  const batchCount = Math.ceil(keywords.length / BATCH_SIZE);

  for (let i = 0; i < batchCount; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, keywords.length);
    const batch = keywords.slice(start, end);

    console.log(`📦 处理第${i + 1}/${batchCount}批: ${start + 1}-${end}行`);

    try {
      const input = batch.join('\n');
      const output = await callAI(keywordPrompt, input);

      const lines = output.split('\n').map(line => line.trim());

      // 智能修复:补充缺失数据或截断多余数据
      if (lines.length < batch.length) {
        console.warn(`⚠️ 第${i + 1}批数据不完整: 输入${batch.length}行,输出${lines.length}行`);
        for (let j = lines.length; j < batch.length; j++) {
          lines.push(batch[j] + '【待重新生成】');
        }
      } else if (lines.length > batch.length) {
        console.warn(`⚠️ 第${i + 1}批输出过多: 输入${batch.length}行,输出${lines.length}行,将截断`);
        lines.splice(batch.length);
      }

      // 过滤空行并补充
      const finalLines = lines.filter(line => line.length > 0);
      while (finalLines.length < batch.length) {
        const idx = finalLines.length;
        finalLines.push(batch[idx] + '【待重新生成】');
      }

      allResults.push(...finalLines);

      // 报告进度
      if (onProgress) {
        onProgress(end, keywords.length);
      }

      // 批次间延迟,避免API限流
      if (i < batchCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ 第${i + 1}批处理失败:`, error);
      // 失败时填充原始关键词
      for (const keyword of batch) {
        allResults.push(keyword + '【待重新生成】');
      }
    }
  }

  console.log(`✅ 分批处理完成,共优化${allResults.length}条关键词`);
  return allResults;
}

/**
 * 批量生成产品描述
 * @param products 产品名称数组
 * @param onProgress 进度回调
 * @returns 产品描述数组
 */
export async function generateDescriptions(
  products: string[],
  onProgress?: (index: number, total: number) => void
): Promise<string[]> {
  const BATCH_SIZE = 20; // 减小批次大小,确保稳定性(从50降到20)

  // 如果数据量较小,直接处理
  if (products.length <= BATCH_SIZE) {
    const input = products.join('\n');

    try {
      const output = await callAI(DESCRIPTION_PROMPT, input);

      console.log('AI 原始输出:', output);
      console.log('输入行数:', products.length);

      const lines = output.split('\n').map(line => line.trim());
      console.log('输出行数:', lines.length);

      // 智能修复
      if (lines.length < products.length) {
        console.warn(`⚠️ 数据不匹配: 输入${products.length}行,但输出${lines.length}行`);
        for (let i = lines.length; i < products.length; i++) {
          lines.push('描述生成失败,请重试: ' + products[i]);
          console.warn(`⚠️ 第${i + 1}行数据缺失,产品名: ${products[i]}`);
        }
      } else if (lines.length > products.length) {
        console.warn(`⚠️ 输出行数多于输入: 输入${products.length}行,输出${lines.length}行,将截断`);
        lines.splice(products.length);
      }

      // 过滤空行并补充
      const finalLines = lines.filter(line => line.length > 0);
      while (finalLines.length < products.length) {
        const idx = finalLines.length;
        finalLines.push('描述生成失败,请重试: ' + products[idx]);
      }

      return finalLines;
    } catch (error) {
      console.error('描述生成失败:', error);
      throw error;
    }
  }

  // 数据量大时,分批处理
  console.log(`🔄 数据量较大(${products.length}条),启动分批处理模式,每批${BATCH_SIZE}条`);

  const allResults: string[] = [];
  const batchCount = Math.ceil(products.length / BATCH_SIZE);

  for (let i = 0; i < batchCount; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, products.length);
    const batch = products.slice(start, end);

    console.log(`📦 处理第${i + 1}/${batchCount}批: ${start + 1}-${end}行`);

    try {
      const input = batch.join('\n');
      const output = await callAI(DESCRIPTION_PROMPT, input);

      const lines = output.split('\n').map(line => line.trim());

      // 智能修复
      if (lines.length < batch.length) {
        console.warn(`⚠️ 第${i + 1}批数据不完整: 输入${batch.length}行,输出${lines.length}行`);
        for (let j = lines.length; j < batch.length; j++) {
          lines.push('描述生成失败,请重试: ' + batch[j]);
        }
      } else if (lines.length > batch.length) {
        console.warn(`⚠️ 第${i + 1}批输出过多: 输入${batch.length}行,输出${lines.length}行,将截断`);
        lines.splice(batch.length);
      }

      // 过滤空行并补充
      const finalLines = lines.filter(line => line.length > 0);
      while (finalLines.length < batch.length) {
        const idx = finalLines.length;
        finalLines.push('描述生成失败,请重试: ' + batch[idx]);
      }

      allResults.push(...finalLines);

      // 报告进度
      if (onProgress) {
        onProgress(end, products.length);
      }

      // 批次间延迟,避免API限流
      if (i < batchCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ 第${i + 1}批处理失败:`, error);
      // 失败时填充错误信息
      for (const product of batch) {
        allResults.push('描述生成失败,请重试: ' + product);
      }
    }
  }

  console.log(`✅ 分批处理完成,共生成${allResults.length}条描述`);
  return allResults;
}
