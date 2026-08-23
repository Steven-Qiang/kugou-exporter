<template>
  <button
    class="theme-toggle"
    type="button"
    :title="theme === 'dark' ? '切换浅色模式' : '切换深色模式'"
    @click="onToggle"
  >
    <svg
      v-if="theme === 'dark'"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
    <svg
      v-else
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { applyTheme, currentTheme } from '@/utils/theme';

const theme = ref<'light' | 'dark'>(currentTheme());

function onToggle() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  applyTheme(theme.value);
}
</script>

<style scoped>
  .theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-2);
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease,
    border-color 0.15s ease;
}

.theme-toggle:hover {
  color: var(--text-1);
  background: var(--surface-hover);
  border-color: var(--border-strong);
}
</style>
