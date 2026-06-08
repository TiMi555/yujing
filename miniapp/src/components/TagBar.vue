<template>
  <scroll-view v-if="tags.length" scroll-x class="tag-bar">
    <view
      class="tag"
      :class="{ active: !modelValue }"
      @tap="$emit('update:modelValue', '')"
    >全部</view>
    <view
      v-for="tag in tags"
      :key="tag"
      class="tag"
      :class="{ active: modelValue === tag }"
      @tap="$emit('update:modelValue', tag)"
    >{{ tag }}</view>
  </scroll-view>
</template>

<script setup>
defineProps({
  tags: { type: Array, default: () => [] },
  modelValue: { type: String, default: '' },
});
defineEmits(['update:modelValue']);
</script>

<style scoped lang="scss">
.tag-bar {
  white-space: nowrap;
  padding: 16rpx 0 24rpx;
}
.tag {
  display: inline-block;
  padding: 12rpx 28rpx;
  margin-right: 16rpx;
  border-radius: 32rpx;
  font-size: 26rpx;
  background: var(--bg-card);
  color: var(--text-secondary);
  border: 2rpx solid var(--border);
}
.tag.active {
  background: var(--accent-light);
  color: var(--accent);
  border-color: var(--accent);
}
</style>
