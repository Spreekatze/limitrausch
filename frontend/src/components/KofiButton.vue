<template>
  <q-page-sticky position="bottom-right" :offset="[18, 18]">
    <q-btn round class="kofi-button" :href="kofiLink" target="_blank" rel="noopener noreferrer">
      <q-tooltip class="text-body2" transition-show="flip-right" transition-hide="flip-left">
        Unterstütze mich <br />mit einem Tee!</q-tooltip
      >
      <q-img :src="teaCat" class="kofi-button__img" no-spinner />
    </q-btn>
  </q-page-sticky>
</template>

<script setup lang="ts">
import teaCat from '../assets/TeaCat.png';
const kofiLink = 'https://ko-fi.com/spreekatze';
</script>

<style lang="scss">
.kofi-button {
  border: 1px solid black;
  height: 80px;
  width: 80px;

  &__img {
    position: absolute;
    height: 90px;
  }
}
</style>
