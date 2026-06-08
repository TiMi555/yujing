<template>
  <view class="page">
    <view class="card box">
      <text class="label">我们将为你讲述与</text>
      <text class="concept">{{ concept.canonical_name }}</text>
      <text class="label">相关的故事</text>
      <text class="hint">学科：{{ concept.category }}</text>
    </view>
    <button class="btn-primary block" @tap="onStart">开始</button>
    <button class="btn-ghost block" @tap="onBack">重新输入</button>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const concept = ref({});

onLoad((options) => {
  if (options.data) {
    concept.value = JSON.parse(decodeURIComponent(options.data));
  }
});

function onStart() {
  const c = concept.value;
  uni.redirectTo({
    url: `/pages/story/index?concept_key=${c.concept_key}&canonical_name=${encodeURIComponent(c.canonical_name)}&category=${encodeURIComponent(c.category)}`,
  });
}

function onBack() {
  uni.navigateBack();
}
</script>

<style scoped lang="scss">
.page {
  padding: 48rpx 32rpx;
}
.box {
  padding: 48rpx;
  text-align: center;
  margin-bottom: 48rpx;
}
.label {
  font-size: 30rpx;
  color: var(--text-secondary);
  display: block;
}
.concept {
  font-size: 44rpx;
  font-weight: 700;
  color: var(--accent);
  display: block;
  margin: 16rpx 0;
}
.hint {
  font-size: 26rpx;
  color: var(--text-muted);
  margin-top: 24rpx;
  display: block;
}
.block {
  width: 100%;
  margin-bottom: 24rpx;
}
</style>
