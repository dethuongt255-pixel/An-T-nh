export interface ApiOptions {
  endpoint: string;
  apiKey: string;
  model: string;
  messages: any[];
  max_tokens?: number;
  temperature?: number;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const safeApiCall = async (options: ApiOptions, retries = 3): Promise<string> => {
  const { endpoint, apiKey, model, messages, max_tokens = 1000, temperature = 0.7 } = options;
  const url = endpoint || 'https://api.openai.com/v1/chat/completions';
  
  // Ensure the endpoint is a full URL
  const fullUrl = url.includes('/chat/completions') ? url : `${url.replace(/\/$/, '')}/chat/completions`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'gpt-3.5-turbo',
          messages,
          max_tokens,
          temperature,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "Không có phản hồi từ AI.";
      }

      const errorData = await response.json().catch(() => ({}));
      const status = response.status;

      // Handle NSFW / Content Filter (Usually 400 or 403 with specific codes)
      if (status === 400 || status === 403) {
        console.warn('Content Filter or Bad Request:', errorData);
        return "*Hành động này bị giới hạn bởi bộ lọc nội dung, nhưng chúng ta có thể tiếp tục câu chuyện theo hướng khác...*";
      }

      // Retry on 5xx errors or 429 (Rate Limit)
      if ([429, 500, 502, 503, 504].includes(status)) {
        if (attempt < retries) {
          console.warn(`API Error ${status}. Retrying attempt ${attempt + 1}...`);
          await sleep(1000 * attempt); // Exponential backoff
          continue;
        }
      }

      throw new Error(`API Error: ${status} - ${JSON.stringify(errorData)}`);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        if (attempt < retries) {
          console.warn(`Request timeout. Retrying attempt ${attempt + 1}...`);
          await sleep(1000 * attempt);
          continue;
        }
        return "*Kết nối quá hạn. Xin vui lòng thử lại sau một chút.*";
      }

      if (attempt === retries) {
        console.error('Final API Error:', error);
        return "*Hệ thống đang bận hoặc gặp sự cố kết nối. Xin vui lòng thử lại sau.*";
      }
      await sleep(1000 * attempt);
    }
  }

  return "*Lỗi không xác định. Vui lòng thử lại.*";
};
