<template>
  <view class="reader">
    <view class="story-section">
      <text class="story-title">{{ title }}</text>
      <TypewriterText
        :text="storyContent"
        :active="typingActive"
        @complete="onTypingComplete"
      />
    </view>

    <view v-if="mode === 'blind' && typingDone" class="unlock-zone">
      <view class="blur-panel" :class="{ revealed }">
        <view v-if="!revealed" class="unlock-cta">
          <button class="unlock-btn" @tap="handleUnlock">
            解锁背后的学术真相
          </button>
        </view>
        <view v-else class="reveal-content slide-up">
          <text class="concept-name">{{ conceptName }}</text>
          <text class="definition">{{ academicDefinition }}</text>
          <MetaphorTable :rows="metaphorMappings" />
        </view>
      </view>
    </view>

    <view v-if="mode === 'full'" class="full-content">
      <text class="concept-name">{{ conceptName }}</text>
      <text class="definition">{{ academicDefinition }}</text>
      <MetaphorTable :rows="metaphorMappings" />
      <button v-if="showReplay" class="btn-ghost replay" @tap="startReplay">
        重温盲盒模式
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue';
import TypewriterText from './TypewriterText.vue';
import MetaphorTable from './MetaphorTable.vue';

const props = defineProps({
  title: String,
  storyContent: { type: String, default: '' },
  mode: { type: String, default: 'blind' },
  conceptName: String,
  academicDefinition: String,
  metaphorMappings: { type: Array, default: () => [] },
  showReplay: { type: Boolean, default: false },
  typingActive: { type: Boolean, default: true },
});

const emit = defineEmits(['unlock']);

const typingDone = ref(false);
const revealed = ref(false);
const replayMode = ref(false);

watch(
  () => props.mode,
  (m) => {
    if (m === 'full' && !replayMode.value) {
      typingDone.value = true;
      revealed.value = true;
    }
  },
  { immediate: true },
);

watch(
  () => props.storyContent,
  () => {
    typingDone.value = false;
    revealed.value = props.mode === 'full' && !replayMode.value;
  },
);

function onTypingComplete() {
  typingDone.value = true;
}

function handleUnlock() {
  emit('unlock');
}

function startReplay() {
  replayMode.value = true;
  revealed.value = false;
  typingDone.value = false;
}

function showRevealed() {
  revealed.value = true;
}

defineExpose({ showRevealed, startReplay });
</script>

<style scoped lang="scss">
.reader {
  padding: 32rpx;
}
.story-title {
  font-size: 40rpx;
  font-weight: 700;
  display: block;
  margin-bottom: 32rpx;
  line-height: 1.3;
}
.story-section {
  margin-bottom: 48rpx;
}
.unlock-zone {
  position: relative;
}
.blur-panel {
  position: relative;
  min-height: 200rpx;
}
.blur-panel:not(.revealed)::before {
  content: '';
  position: absolute;
  inset: -40rpx 0 0;
  backdrop-filter: blur(12px);
  background: var(--blur-overlay);
  border-radius: 16rpx;
  z-index: 1;
}
.unlock-cta {
  position: relative;
  z-index: 2;
  padding: 80rpx 0;
  text-align: center;
}
.unlock-btn {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 48rpx;
  padding: 28rpx 56rpx;
  font-size: 30rpx;
  animation: breathe 2s ease-in-out infinite;
}
@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.04); opacity: 0.92; }
}
.reveal-content.slide-up {
  animation: slideUp 0.5s ease-out;
}
@keyframes slideUp {
  from { transform: translateY(40rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.concept-name {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 20rpx;
}
.definition {
  display: block;
  font-size: 30rpx;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: 24rpx;
}
.replay {
  margin-top: 40rpx;
}
</style>
