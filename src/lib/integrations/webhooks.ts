import axios from 'axios';
import crypto from 'crypto';

export async function sendWebhook(
  url: string,
  payload: Record<string, unknown>,
  secret?: string
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'WorfeRankFlow/1.0',
    };

    if (secret) {
      const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');
      headers['X-Worfe-Signature'] = `sha256=${sig}`;
    }

    const res = await axios.post(url, body, { headers, timeout: 15000 });
    return { success: true, statusCode: res.status };
  } catch (err: any) {
    return {
      success: false,
      statusCode: err.response?.status,
      error: err.message,
    };
  }
}

export interface ShopifyConfig {
  shopDomain: string;
  accessToken: string;
}

export async function publishToShopify(
  config: ShopifyConfig,
  payload: {
    title: string;
    body_html: string;
    handle: string;
    published: boolean;
    metafields?: Array<{ key: string; value: string; namespace: string; type: string }>;
  }
): Promise<{ id: number; handle: string; url: string }> {
  const res = await axios.post(
    `https://${config.shopDomain}/admin/api/2024-01/articles.json`,
    { article: payload },
    {
      headers: {
        'X-Shopify-Access-Token': config.accessToken,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  const article = res.data.article;
  return {
    id: article.id,
    handle: article.handle,
    url: `https://${config.shopDomain}/blogs/news/${article.handle}`,
  };
}

export async function publishToCustomRest(
  baseUrl: string,
  endpoint: string,
  apiKey: string,
  payload: Record<string, unknown>
): Promise<{ id: string; url?: string }> {
  const res = await axios.post(`${baseUrl}${endpoint}`, payload, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  return { id: String(res.data.id ?? res.data._id ?? ''), url: res.data.url };
}
