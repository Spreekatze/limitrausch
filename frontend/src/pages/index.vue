<template>
  <div class="column align-center text-center">
    <div>
      <h1>Hier entsteht bald eine Webseite!</h1>
    </div>
    <div>
      <p>
        In der Zwischenzeit schau doch mal auf unserem
        <q-btn label="> Eventkalender <" flat color="primary" to="/events" />, was demnächst so los
        ist!
      </p>
    </div>
    <div>
      <p>Alle Events finden auf den Discords unseres Partnernetzwerks statt.</p>
      <p><a :href="discordAetheris">Aetheris DE</a></p>
      <p><a :href="discordLemmings">Savage Lemminge</a></p>
      <p><a :href="discordURC">URC</a></p>
      <p>Wir beißen auch nicht, versprochen!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const discordAetheris: string = 'https://discord.gg/aetherisde';
const discordLemmings: string = 'https://discord.gg/savagelemmings';
const discordURC: string = 'https://discord.gg/V2aGQU9Mad';
</script>
