<template>
  <text class="typewriter">{{ displayed }}</text>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';

const props = defineProps({
  text: { type: String, default: '' },
  speed: { type: Number, default: 30 },
  active: { type: Boolean, default: true },
});

const emit = defineEmits(['complete']);

const displayed = ref('');
let timer = null;
let index = 0;

function clearTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function startTyping() {
  clearTimer();
  displayed.value = '';
  index = 0;
  if (!props.text || !props.active) {
    displayed.value = props.text || '';
    emit('complete');
    return;
  }
  timer = setInterval(() => {
    if (index >= props.text.length) {
      clearTimer();
      emit('complete');
      return;
    }
    displayed.value += props.text[index];
    index += 1;
  }, props.speed);
}

watch(() => props.text, startTyping, { immediate: true });
onUnmounted(clearTimer);
</script>

<style scoped>
.typewriter {
  font-size: 32rpx;
  line-height: 1.5;
  white-space: pre-wrap;
}
</style>
