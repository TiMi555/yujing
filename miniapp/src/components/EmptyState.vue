<template>
  <view class="empty">
    <text class="icon">📖</text>
    <text class="title">还没有故事</text>
    <text class="desc">输入一个概念，成为第一个解锁者</text>
  </view>
</template>

<style scoped lang="scss">
.empty {
  padding: 120rpx 48rpx;
  text-align: center;
}
.icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 24rpx;
}
.title {
  font-size: 34rpx;
  font-weight: 600;
  display: block;
  margin-bottom: 12rpx;
}
.desc {
  font-size: 28rpx;
  color: var(--text-secondary);
}
</style>
