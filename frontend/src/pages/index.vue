<template>
  <div>
    <h1>Hier entsteht bald eine Webseite!</h1>
    <p>In der Zwischenzeit schau doch auf unserem <a href="/events">Eventkalender vorbei</a>!</p>
    <p>Alle Events finden auf den Discords unseres Partnernetzwerks statt.</p>
    <p><a :href="discordAetheris">Aetheris DE</a></p>
    <p><a :href="discordLemmings">Savage Lemminge</a></p>
    <p><a :href="discordURC">URC</a></p>
    <p>Komm doch vorbei! Wir beißen auch nicht, versprochen!</p>
  </div>
  <div>
    <span>Backend-Test</span>
    <button @click="testBackend">Test</button>
    <span v-if="backendResponse">{{ backendResponse }}</span>
    <div>
      <input id="name" type="text" placeholder="Name" />
      <input id="password" type="password" placeholder="Password" />
      <button @click="login">Login</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const discordAetheris: string = 'https://discord.gg/aetherisde';
const discordLemmings: string = 'https://discord.gg/savagelemmings';
const discordURC: string = 'https://discord.gg/V2aGQU9Mad';

const backendResponse = ref<string | null>(null);

function testBackend() {
  fetch('/api/status/health')
    .then((response) => response.json())
    .then((data) => {
      backendResponse.value = data.status;
    })
    .catch((error) => {
      backendResponse.value = `Error: ${error}`;
    });
}

function login() {
  const nameInput = document.getElementById('name') as HTMLInputElement;
  const passwordInput = document.getElementById('password') as HTMLInputElement;

  const username = nameInput.value;
  const password = passwordInput.value;

  fetch('/api/playground/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      backendResponse.value = data.message;
    })
    .catch((error) => {
      backendResponse.value = `Error: ${error}`;
    });
}
</script>
