<template>
  <div class="home">
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
      <p>
        Alle aktuell angezeigten Events finden auf dem Discord
        <a :href="discordAetheris"> Aetheris DE </a> statt.
      </p>
      <!-- <p>Alle Events finden auf den Discords unseres Partnernetzwerks statt.</p> -->

      <!-- <p><a :href="discordLemmings">Savage Lemminge</a></p>
      <p><a :href="discordURC">URC</a></p> -->
      <p>Wir beißen auch nicht, versprochen!</p>
    </div>

    <q-card class="card">
      <q-img :src="heartCat" alt="Katze mit Herz" class="cat" height="150px" fit="contain" />
      <q-card-section>
        Hi! <br />
        Ich bin die Katze von der Spree oder auch Spreekatze genannt.
      </q-card-section>
      <q-card-section>
        <p>
          Mit dieser Webseite möchte ich in erster Linie einen angenehmen Überblick zu Events auf
          deutschen FFXIV-Community-Discords schaffen. Idealerweise auch mit möglicher Anmeldung zu
          den Events direkt via dieser Webseite und vielleicht auch mit der Option eigene
          Static-Events hier mit in die persönliche Übersicht zu werfen. <br />
        </p>
        <p>
          Und damit die Webseite gleich noch einen richtigen Nutzen darüber hinaus hat, möchte ich
          das auch koppeln mit diversen Guides zu Inhalten, Jobs, FunFacts, Einstellungs-Kram ...
          Oh, und wie wäre es mit einer Ansicht um zu schauen, welcher Job welche Gear-Sets gerade
          als BiS und Ultimate-Bis hat. Damit man nicht immer auf Balance danach kramen muss ... Und
          wie wärs mal mit deutschen Mitigation-Plänen? <br />
          Ja ja, Wahnvorstellungen. xD Aber Träume braucht der Mensch. :3 <br />
        </p>
        <p>
          Ich wäre für jegliches Feedback dankbar. Was ihr euch an Inhalt wünscht, wo ihr sagt
          "Webseite XY hat das zwar, aber ist schwer zu lesen" oder falls euch irgendwo Fehler
          auffallen. <br />Über jegliche Art Unterstützung (zB in Form eines Tees) wäre ich sehr
          dankbar.<br />Lasst mir doch gerne eine DM auf Discord (#spreekatze) da!
        </p>
      </q-card-section>
    </q-card>
    <!-- <div>
        <h3>Roadmap</h3>
        <q-timeline layout="loose">
          <q-timeline-entry
            v-for="item in roadmap"
            :key="item.title"
            :title="item.title"
            :subtitle="item.status"
          >
            {{ item.description }}
          </q-timeline-entry>
        </q-timeline>
      </div> -->
  </div>
</template>

<script setup lang="ts">
import heartCat from '../assets/HeartCat.png';

const discordAetheris: string = 'https://discord.gg/aetherisde';

// const discordLemmings: string = 'https://discord.gg/savagelemmings';
// const discordURC: string = 'https://discord.gg/V2aGQU9Mad';

// const roadmap = [
//   {
//     title: 'Eventkalender 0.1',
//     status: 'Erledigt',
//     description: 'Erste Version mit Einbindung der Events von Ætheris DE',
//   },
//   {
//     title: 'Guides',
//     status: 'In Arbeit',
//     description: 'Einstellungen, Jobs, Inhalte,...',
//   },
//   {
//     title: 'Eventkalender',
//     status: 'Geplant',
//     description: 'Anmeldung (via Discord) und Informationen zu Events via der Webseite',
//   },
// ];
</script>

<style lang="css">
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 5vw;

  .card {
    margin: 20px 10px;
    max-width: 1000px;
    padding: 10px;
  }
}
</style>
