<template>
  <view class="page">
    <view class="search card">
      <input
        v-model="query"
        class="search-input"
        placeholder="输入学术概念，如「囚徒困境」"
        confirm-type="search"
        @confirm="onSearch"
      />
      <button class="search-btn" @tap="onSearch">探索</button>
    </view>

    <TagBar v-if="meta.show_tags" v-model="category" :tags="meta.categories" @update:modelValue="loadFeed" />

    <view v-if="meta.show_sort_tabs" class="sort-tabs">
      <text
        class="sort-tab"
        :class="{ active: sort === 'hot' }"
        @tap="setSort('hot')"
      >热门</text>
      <text
        class="sort-tab"
        :class="{ active: sort === 'new' }"
        @tap="setSort('new')"
      >最新</text>
    </view>

    <EmptyState v-if="!loading && items.length === 0" />

    <StoryCard
      v-for="item in items"
      :key="item.id"
      :item="item"
      @tap="goStory(item.id)"
    />
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { request } from '../../api/request.js';
import StoryCard from '../../components/StoryCard.vue';
import EmptyState from '../../components/EmptyState.vue';
import TagBar from '../../components/TagBar.vue';

const query = ref('');
const items = ref([]);
const loading = ref(false);
const sort = ref('hot');
const category = ref('');
const meta = ref({ categories: [], show_tags: false, show_sort_tabs: false });

async function loadFeed() {
  loading.value = true;
  try {
    const params = { sort: sort.value };
    if (category.value) params.category = category.value;
    const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    const data = await request(`/api/stories/feed?${qs}`);
    items.value = data.items;
    meta.value = data.meta;
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function setSort(s) {
  sort.value = s;
  loadFeed();
}

async function onSearch() {
  const q = query.value.trim();
  if (!q) return;
  try {
    const result = await request('/api/concepts/normalize', {
      method: 'POST',
      data: { query: q },
    });
    if (result.need_confirm) {
      uni.navigateTo({
        url: `/pages/confirm/index?data=${encodeURIComponent(JSON.stringify(result))}`,
      });
    } else {
      goGenerate(result);
    }
  } catch (e) {
    uni.showToast({ title: e.message || '识别失败', icon: 'none' });
  }
}

function goGenerate(concept) {
  uni.navigateTo({
    url: `/pages/story/index?concept_key=${concept.concept_key}&canonical_name=${encodeURIComponent(concept.canonical_name)}&category=${encodeURIComponent(concept.category)}`,
  });
}

function goStory(id) {
  uni.navigateTo({ url: `/pages/story/index?id=${id}` });
}

onMounted(loadFeed);
</script>

<style scoped lang="scss">
.page {
  padding: 24rpx 32rpx 48rpx;
}
.search {
  display: flex;
  padding: 16rpx;
  margin-bottom: 16rpx;
  gap: 16rpx;
}
.search-input {
  flex: 1;
  font-size: 28rpx;
  padding: 16rpx;
}
.search-btn {
  background: var(--accent);
  color: #fff;
  font-size: 28rpx;
  padding: 0 32rpx;
  line-height: 72rpx;
  border-radius: 12rpx;
  border: none;
}
.sort-tabs {
  display: flex;
  gap: 24rpx;
  margin-bottom: 24rpx;
}
.sort-tab {
  font-size: 28rpx;
  color: var(--text-muted);
  padding-bottom: 8rpx;
}
.sort-tab.active {
  color: var(--accent);
  font-weight: 600;
  border-bottom: 4rpx solid var(--accent);
}
</style>
