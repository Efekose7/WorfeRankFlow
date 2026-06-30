import axios from 'axios';

export interface WordPressConfig {
  baseUrl: string;
  username: string;
  appPassword: string;
}

export interface WPPostPayload {
  title: string;
  content: string;
  slug: string;
  status: 'draft' | 'publish' | 'future';
  excerpt?: string;
  categories?: number[];
  tags?: number[];
  meta?: Record<string, string>;
  date?: string;
  featured_media?: number;
}

export async function publishToWordPress(
  config: WordPressConfig,
  payload: WPPostPayload
): Promise<{ id: number; link: string }> {
  const { baseUrl, username, appPassword } = config;
  const token = Buffer.from(`${username}:${appPassword}`).toString('base64');

  const res = await axios.post(`${baseUrl}/wp-json/wp/v2/posts`, payload, {
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  return { id: res.data.id, link: res.data.link };
}

export async function updateWordPressPost(
  config: WordPressConfig,
  postId: number,
  payload: Partial<WPPostPayload>
): Promise<{ id: number; link: string }> {
  const { baseUrl, username, appPassword } = config;
  const token = Buffer.from(`${username}:${appPassword}`).toString('base64');

  const res = await axios.put(`${baseUrl}/wp-json/wp/v2/posts/${postId}`, payload, {
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  return { id: res.data.id, link: res.data.link };
}

export async function testWordPressConnection(config: WordPressConfig): Promise<boolean> {
  try {
    const { baseUrl, username, appPassword } = config;
    const token = Buffer.from(`${username}:${appPassword}`).toString('base64');
    await axios.get(`${baseUrl}/wp-json/wp/v2/users/me`, {
      headers: { Authorization: `Basic ${token}` },
      timeout: 10000,
    });
    return true;
  } catch {
    return false;
  }
}

export async function uploadMediaToWordPress(
  config: WordPressConfig,
  imageBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ id: number; url: string }> {
  const { baseUrl, username, appPassword } = config;
  const token = Buffer.from(`${username}:${appPassword}`).toString('base64');

  const res = await axios.post(`${baseUrl}/wp-json/wp/v2/media`, imageBuffer, {
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': mimeType,
    },
    timeout: 30000,
  });

  return { id: res.data.id, url: res.data.source_url };
}
