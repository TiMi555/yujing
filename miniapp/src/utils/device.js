const DEVICE_KEY = 'yujing_device_id';

export function getDeviceId() {
  let id = uni.getStorageSync(DEVICE_KEY);
  if (!id) {
    id = 'd_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    uni.setStorageSync(DEVICE_KEY, id);
  }
  return id;
}
