import { AIResponse } from '@/types';
import { KEYWORD_PROMPT, DESCRIPTION_PROMPT } from './prompts';

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
        max_tokens: 2000,
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
 * @param onProgress 进度回调
 * @returns 优化后的关键词数组
 */
export async function optimizeKeywords(
  keywords: string[],
  onProgress?: (index: number, total: number) => void
): Promise<string[]> {
  const results: string[] = [];

  // 将关键词拼接成一个字符串,用换行分隔
  const input = keywords.join('\n');

  try {
    // 调用API获取优化结果
    const output = await callAI(KEYWORD_PROMPT, input);

    // 按换行分割结果
    const lines = output.split('\n').filter(line => line.trim());

    // 确保输出行数与输入行数一致
    if (lines.length !== keywords.length) {
      console.warn(`输入${keywords.length}行,但输出${lines.length}行`);
    }

    return lines;
  } catch (error) {
    console.error('关键词优化失败:', error);
    throw error;
  }
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
  const results: string[] = [];

  // 将产品名称拼接成一个字符串,用换行分隔
  const input = products.join('\n');

  try {
    // 调用API获取描述结果
    const output = await callAI(DESCRIPTION_PROMPT, input);

    // 按换行分割结果
    const lines = output.split('\n').filter(line => line.trim());

    // 确保输出行数与输入行数一致
    if (lines.length !== products.length) {
      console.warn(`输入${products.length}行,但输出${lines.length}行`);
    }

    return lines;
  } catch (error) {
    console.error('描述生成失败:', error);
    throw error;
  }
}
