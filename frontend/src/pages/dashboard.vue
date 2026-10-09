<template>
  <div class="column align-center text-center">
    <div v-if="authStore.loggedIn && !authStore.isAdmin" class="column align-center text-center">
      <p>Hier stehen später spannende Dinge für dich!</p>
      <p>Aktuell ist es aber nur für die Admins nützlich. :c</p>
    </div>
    <div v-else-if="authStore.loggedIn && authStore.isAdmin">
      <p>Spannende Dinge für die Admins</p>
    </div>
    <div v-else>
      <p>Leider bist du aktuell nicht angemeldet.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth-store';

const authStore = useAuthStore();
</script>
