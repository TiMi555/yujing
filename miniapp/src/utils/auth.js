const TOKEN_KEY = 'yujing_token';

export function getToken() {
  return uni.getStorageSync(TOKEN_KEY) || '';
}

export function setToken(token) {
  uni.setStorageSync(TOKEN_KEY, token);
}

export async function login() {
  const { code } = await uni.login({ provider: 'weixin' });
  const { request } = await import('../api/request.js');
  const { getDeviceId } = await import('./device.js');
  const data = await request('/api/auth/wechat', { method: 'POST', data: { code } });
  setToken(data.token);
  await request('/api/auth/merge-device', {
    method: 'POST',
    data: { device_id: getDeviceId() },
  });
  return data;
}
