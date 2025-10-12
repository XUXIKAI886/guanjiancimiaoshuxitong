// 产品优化类型
export type OptimizationType = 'keyword' | 'description';

// 产品项
export interface ProductItem {
  id: string;
  original: string;
  optimized: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

// API响应
export interface AIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// 配置
export interface Config {
  apiBaseUrl: string;
  apiModel: string;
  apiKey: string;
}
