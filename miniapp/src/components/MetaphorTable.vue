<template>
  <view class="table">
    <view class="row head">
      <text class="cell">故事隐喻</text>
      <text class="cell">学术要素</text>
    </view>
    <view v-for="(row, i) in rows" :key="i" class="row">
      <text class="cell">{{ row.story_element }}</text>
      <text class="cell">{{ row.concept_element }}</text>
      <text class="explain">{{ row.explanation }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  rows: { type: Array, default: () => [] },
});
</script>

<style scoped lang="scss">
.table {
  margin-top: 24rpx;
  border: 2rpx solid var(--border);
  border-radius: 12rpx;
  overflow: hidden;
}
.row {
  padding: 20rpx;
  border-bottom: 2rpx solid var(--border);
}
.row.head {
  background: #fafafa;
  font-weight: 600;
  display: flex;
}
.row.head .cell {
  flex: 1;
  font-size: 26rpx;
}
.cell {
  display: block;
  font-size: 28rpx;
  margin-bottom: 8rpx;
}
.explain {
  font-size: 24rpx;
  color: var(--text-secondary);
  line-height: 1.5;
}
</style>
