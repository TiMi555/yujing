<template>
  <view class="page">
    <view v-if="error" class="error">
      <text>{{ error }}</text>
      <button class="btn-primary" @tap="retry">重试</button>
    </view>
    <StoryReader
      v-else
      ref="readerRef"
      :title="story.title"
      :story-content="displayContent"
      :mode="mode"
      :concept-name="story.concept_name"
      :academic-definition="story.academic_definition"
      :metaphor-mappings="story.metaphor_mappings || []"
      :show-replay="mode === 'full'"
      :typing-active="true"
      @unlock="onUnlock"
    />
    <view v-if="unlocked && !savedHint" class="library-cta">
      <button class="btn-primary" @tap="saveToLibrary">收入藏书阁</button>
    </view>
    <text v-if="savedHint" class="saved">{{ savedHint }}</text>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app';
import { request } from '../../api/request.js';
import { sseGenerate } from '../../api/sse.js';
import { getDeviceId } from '../../utils/device.js';
import { getToken, login } from '../../utils/auth.js';
import StoryReader from '../../components/StoryReader.vue';

const readerRef = ref(null);
const story = reactive({
  id: null,
  title: '',
  story_content: '',
  concept_name: '',
  academic_definition: '',
  metaphor_mappings: [],
});
const displayContent = ref('');
const mode = ref('blind');
const error = ref('');
const unlocked = ref(false);
const savedHint = ref('');
let conceptParams = null;

onShareAppMessage(() => ({
  title: story.title || '寓境 · 一则寓言',
  path: `/pages/story/index?id=${story.id}`,
}));

async function loadStory(id, forceFull = false) {
  const deviceId = getDeviceId();
  const data = await request(
    `/api/stories/${id}?mode=${forceFull ? 'full' : 'blind'}&device_id=${deviceId}`,
  );
  Object.assign(story, data);
  displayContent.value = data.story_content || '';
  if (data.concept_name || forceFull || data.unlocked) {
    mode.value = 'full';
    unlocked.value = true;
  }
}

async function startGenerate(params) {
  displayContent.value = '';
  sseGenerate(params, {
    onEvent: (evt) => {
      if (evt.type === 'locked') {
        uni.redirectTo({
          url: `/pages/waiting/index?concept_key=${params.concept_key}`,
        });
        return;
      }
      if (evt.type === 'chunk' && evt.field === 'story_content') {
        displayContent.value += evt.delta;
      }
      if (evt.type === 'complete') {
        Object.assign(story, evt.story);
        if (typeof evt.story.metaphor_mappings === 'string') {
          story.metaphor_mappings = JSON.parse(evt.story.metaphor_mappings);
        }
        if (evt.from_cache) {
          displayContent.value = evt.story.story_content;
        }
      }
      if (evt.type === 'error') {
        error.value = evt.message || '生成失败';
      }
    },
    onError: (e) => {
      error.value = e.message || '网络错误';
    },
  });
}

async function onUnlock() {
  try {
    const data = await request(`/api/stories/${story.id}/unlock`, {
      method: 'POST',
      data: { device_id: getDeviceId() },
    });
    Object.assign(story, data);
    story.metaphor_mappings = data.metaphor_mappings || [];
    mode.value = 'full';
    unlocked.value = true;
    readerRef.value?.showRevealed();
  } catch (e) {
    uni.showToast({ title: e.message || '解锁失败', icon: 'none' });
  }
}

async function saveToLibrary() {
  try {
    if (!getToken()) {
      await login();
    }
    savedHint.value = '已收入藏书阁';
  } catch (e) {
    uni.showToast({ title: e.message || '登录失败', icon: 'none' });
  }
}

function retry() {
  error.value = '';
  if (conceptParams) startGenerate(conceptParams);
}

onLoad(async (options) => {
  if (options.id) {
    await loadStory(options.id, options.mode === 'full');
    return;
  }
  if (options.concept_key) {
    conceptParams = {
      concept_key: options.concept_key,
      canonical_name: decodeURIComponent(options.canonical_name || ''),
      category: decodeURIComponent(options.category || ''),
    };
    startGenerate(conceptParams);
  }
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding-bottom: 48rpx;
}
.error {
  padding: 80rpx 32rpx;
  text-align: center;
}
.library-cta {
  padding: 32rpx;
  text-align: center;
}
.saved {
  display: block;
  text-align: center;
  color: var(--accent);
  font-size: 28rpx;
  padding: 24rpx;
}
</style>
