<template>
  <view class="page">
    <view v-if="!loggedIn" class="guest card">
      <text class="title">我的藏书阁</text>
      <text class="desc">登录后查看已解锁的寓言与概念</text>
      <button class="btn-primary" @tap="doLogin">微信登录</button>
    </view>
    <view v-else-if="empty" class="guest card">
      <text class="desc">还没有解锁的故事，去探索页输入概念吧</text>
    </view>
    <view v-else>
      <view v-for="(list, cat) in library" :key="cat" class="group">
        <text class="cat-title">{{ cat }}</text>
        <view
          v-for="item in list"
          :key="item.id"
          class="item card"
          @tap="openStory(item.id)"
        >
          <text class="item-title">{{ item.title }}</text>
          <text class="item-meta">{{ item.concept_name }} · 约 {{ item.reading_minutes }} 分钟</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '../../api/request.js';
import { getToken, login } from '../../utils/auth.js';

const library = ref({});
const loggedIn = ref(false);

const empty = computed(() => Object.keys(library.value).length === 0);

async function loadLibrary() {
  loggedIn.value = !!getToken();
  if (!loggedIn.value) return;
  try {
    const data = await request('/api/me/library');
    library.value = data.library || {};
  } catch {
    library.value = {};
  }
}

async function doLogin() {
  try {
    await login();
    loggedIn.value = true;
    await loadLibrary();
  } catch (e) {
    uni.showToast({ title: e.message || '登录失败', icon: 'none' });
  }
}

function openStory(id) {
  uni.navigateTo({ url: `/pages/story/index?id=${id}&mode=full` });
}

onShow(loadLibrary);
</script>

<style scoped lang="scss">
.page {
  padding: 32rpx;
}
.guest {
  padding: 64rpx 32rpx;
  text-align: center;
}
.title {
  font-size: 36rpx;
  font-weight: 600;
  display: block;
  margin-bottom: 16rpx;
}
.desc {
  font-size: 28rpx;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 32rpx;
}
.group {
  margin-bottom: 32rpx;
}
.cat-title {
  font-size: 28rpx;
  color: var(--accent);
  font-weight: 600;
  margin-bottom: 16rpx;
  display: block;
}
.item {
  padding: 28rpx;
  margin-bottom: 16rpx;
}
.item-title {
  font-size: 30rpx;
  font-weight: 600;
  display: block;
  margin-bottom: 8rpx;
}
.item-meta {
  font-size: 24rpx;
  color: var(--text-muted);
}
</style>
