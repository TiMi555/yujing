<template>
  <view class="page">
    <view class="skeleton card">
      <view class="shimmer cover" />
      <view class="lines">
        <view class="shimmer line w80" />
        <view class="shimmer line w60" />
        <view class="shimmer line w40" />
      </view>
    </view>
    <text class="status">{{ statusText }}</text>
    <button v-if="failed" class="btn-primary" @tap="retry">重试</button>
    <button v-if="failed" class="btn-ghost" @tap="goHome">返回首页</button>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { request } from '../../api/request.js';

const conceptKey = ref('');
const statusText = ref('相关故事正在撰写中…');
const failed = ref(false);
let timer = null;
let elapsed = 0;

async function poll() {
  try {
    const data = await request(`/api/stories/generate/status?concept_key=${encodeURIComponent(conceptKey.value)}`);
    if (data.status === 'ready') {
      clearInterval(timer);
      uni.redirectTo({ url: `/pages/story/index?id=${data.story_id}` });
    } else if (data.status === 'failed') {
      failed.value = true;
      statusText.value = data.message || '创作失败，请重试';
      clearInterval(timer);
    }
  } catch {
    // keep polling
  }
  elapsed += 3;
  if (elapsed >= 90) {
    failed.value = true;
    statusText.value = '等待超时，请重试';
    clearInterval(timer);
  }
}

function retry() {
  failed.value = false;
  elapsed = 0;
  statusText.value = '相关故事正在撰写中…';
  timer = setInterval(poll, 3000);
  poll();
}

function goHome() {
  uni.switchTab({ url: '/pages/explore/index' });
}

onLoad((options) => {
  conceptKey.value = options.concept_key || '';
  timer = setInterval(poll, 3000);
  poll();
});

onUnload(() => clearInterval(timer));
</script>

<style scoped lang="scss">
.page {
  padding: 48rpx 32rpx;
  text-align: center;
}
.skeleton {
  display: flex;
  padding: 24rpx;
  margin-bottom: 48rpx;
  overflow: hidden;
}
.cover {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  margin-right: 24rpx;
}
.lines {
  flex: 1;
  padding-top: 16rpx;
}
.line {
  height: 28rpx;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
}
.w80 { width: 80%; }
.w60 { width: 60%; }
.w40 { width: 40%; }
.shimmer {
  background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.status {
  font-size: 30rpx;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 32rpx;
}
.btn-primary, .btn-ghost {
  margin-bottom: 16rpx;
}
</style>
