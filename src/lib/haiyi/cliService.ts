import { renderTemplate } from './templateParser';

const BASE = 'https://www.haiyi.art';
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 900_000;

function getToken(): string {
  const token = process.env.HAIYI_TOKEN || import.meta.env.HAIYI_TOKEN;
  if (!token) {
    throw new Error('未配置 HAIYI_TOKEN 环境变量');
  }
  return token.trim();
}

function haiyiHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'token': token,
    'x-app-id': 'web_global_seaart',
    'x-platform': 'web',
    'x-page-id': crypto.randomUUID(),
    'x-request-id': crypto.randomUUID(),
    'x-timezone': 'Asia/Shanghai',
  };
}

async function post(path: string, body: any, token: string) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: haiyiHeaders(token),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    console.error('[haiyi raw response]', text.slice(0, 200));
    throw new Error('海艺返回非 JSON 响应，可能 token 无效或过期');
  }
  if (json?.status?.code !== 10000) {
    console.error('[haiyi raw error]', JSON.stringify(json?.status));
    throw new Error(json?.status?.msg || `API 错误: ${path}`);
  }
  return json.data;
}

function buildContext(prompt: string, params: any, imageUrls?: string[], videoUrl?: string | null) {
  return {
    prompt,
    duration: 5,
    image_list: (imageUrls ?? []).map(url => ({ url, type: 'image' })),
    video_list: videoUrl ? [{ url: videoUrl }] : [],
    ...params,
  };
}

async function createTask(apiIds: any, meta: any, imageUrls: string[] | null, videoUrl: string | null, token: string) {
  if (imageUrls?.length) meta.image_list_1 = imageUrls.map(url => ({ id: url, url }));
  if (videoUrl) meta.video_list_1 = [{ id: videoUrl, url: videoUrl }];

  const body = {
    play_rule_id: apiIds.playRuleId,
    meta,
    model_no: apiIds.modelNo,
    model_ver_no: apiIds.modelVerNo,
    ss: 52,
  };

  console.log('[createTask] meta FULL:', JSON.stringify(meta, null, 2));
  console.log('[createTask] token prefix:', token.slice(0, 20));
  const data = await post('/api/v1/task/v5/create', body, token);
  if (!data?.id) throw new Error('创建任务失败，未返回 task id');
  return data.id;
}

async function pollUntilDone(taskId: string, token: string, extractResult: (item: any) => any) {
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    const data = await post('/api/v1/task/batch-progress', { task_ids: [taskId], ss: 52 }, token);
    const item = (data?.items ?? [])[0];
    if (!item) throw new Error('任务不存在');
    if (item.status === 3) return extractResult(item);
    if (item.status === 4) throw new Error(item.status_desc || '任务失败');
  }
  throw new Error('轮询超时（900秒）');
}

export async function generateImage({ prompt, params, imageUrls, apiIds, payloadTemplate }: any) {
  const token = getToken();
  const context = buildContext(prompt, params, imageUrls, null);
  const meta = renderTemplate(payloadTemplate, context);
  console.log('[generateImage] meta:', JSON.stringify(meta));

  const taskId = await createTask(apiIds, meta, imageUrls, null, token);
  return await pollUntilDone(taskId, token, (item: any) => {
    const urls = (item.img_uris ?? []).map((i: any) => i.url).filter(Boolean);
    if (!urls.length) throw new Error('任务完成但未返回图片 URL');
    return urls;
  });
}

export async function generateVideo({ prompt, params, imageUrls, videoUrl, apiIds, payloadTemplate }: any) {
  const token = getToken();
  const context = buildContext(prompt, params, imageUrls, videoUrl);
  const meta = renderTemplate(payloadTemplate, context);
  console.log('[generateVideo] meta:', JSON.stringify(meta));

  const taskId = await createTask(apiIds, meta, imageUrls, videoUrl, token);
  return await pollUntilDone(taskId, token, (item: any) => {
    const url = item.video_uri?.url ?? item.video_uris?.[0]?.url ?? item.videos?.[0]?.url ?? item.img_uris?.[0]?.url;
    if (!url) throw new Error('任务完成但未返回视频 URL');
    return url;
  });
}
