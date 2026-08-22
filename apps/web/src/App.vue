<template>
  <div class="bg-scene" aria-hidden="true" />
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<script setup lang="ts">
import { initTheme } from '@/utils/theme';

onMounted(() => {
  initTheme();
});
</script>
