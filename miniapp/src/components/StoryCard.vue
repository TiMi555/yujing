<template>
  <view class="story-card card" @tap="$emit('tap')">
    <image class="cover" :src="cover" mode="aspectFill" />
    <view class="body">
      <text class="title">{{ item.title }}</text>
      <view class="meta">
        <text class="tag">{{ item.category }}</text>
        <text class="dot">·</text>
        <text class="time">约 {{ item.reading_minutes }} 分钟</text>
      </view>
      <text class="unlock">{{ item.unlock_count }} 人已解锁</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';
import { getCategoryCover } from '../utils/categoryCover.js';

const props = defineProps({
  item: { type: Object, required: true },
});

defineEmits(['tap']);

const cover = computed(() =>
  props.item.cover_image_url || getCategoryCover(props.item.category),
);
</script>

<style scoped lang="scss">
.story-card {
  display: flex;
  overflow: hidden;
  margin-bottom: 24rpx;
}
.cover {
  width: 200rpx;
  height: 200rpx;
  flex-shrink: 0;
  background: var(--accent-light);
}
.body {
  flex: 1;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.title {
  font-size: 32rpx;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 12rpx;
}
.meta {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-bottom: 8rpx;
}
.tag {
  color: var(--accent);
}
.dot {
  margin: 0 8rpx;
}
.unlock {
  font-size: 22rpx;
  color: var(--text-muted);
}
</style>
