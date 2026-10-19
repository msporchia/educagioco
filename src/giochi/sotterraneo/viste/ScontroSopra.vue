<script setup>
// Lo scontro di sopra, la parte che si tocca (docs/sotterraneo/mondo-aperto-mostri.md, «La scena»): in fondo il pannello dello scontro
// delle discese (viste/Pannello3d.vue con la scelta del colpo e la domanda, gli stessi pezzi di Gioco.vue), sopra il prato le feste e
// gli avvisi, e se si sviene il foglio del risveglio in città. Le figure e le scritte sopra di loro le disegna il mondo (il palco di
// scena3d/mondo/palco.js e viste/Scontro3d.vue). Non calcola niente: tutto arriva da Gioco.vue, che lo gioca come uno scontro di giù.
import Pannello3d from './Pannello3d.vue'
import CaselleAbilita from './CaselleAbilita.vue'
import Medaglione from './Medaglione.vue'
import Foglio from './Foglio.vue'
import Icona from './Icona.vue'
import ScegliPozione from './ScegliPozione.vue'
import Domanda from '../../../quiz/Domanda.vue'

defineProps({
  abilita: { type: Object, default: null },      // la scelta del colpo (Gioco.vue, abilitaScontro)
  sceltaFatta: { type: Boolean, default: false },
  animando: { type: Boolean, default: false },
  domanda: { type: Object, default: null },
  risveglio: { type: Object, default: null },    // svenuti: la città dove ci si sveglia ({ nome })
  festa: { type: Object, default: null },
  avviso: { type: Object, default: null },
  pozioni: { type: Array, default: null },        // con più stadi di cura, quale bere (viste/ScegliPozione.vue)
  manca: { type: Number, default: 0 },
})
defineEmits(['scegli', 'bevi', 'bevi-energia', 'scappa', 'risposto', 'risveglio', 'bevuta', 'chiudi-pozioni'])
</script>

<template>
  <div class="sot3d-sopra-scontro" data-scontro-sopra>
    <div v-if="festa && festa.che === 'livello'" class="sot-festa sot-festa-livello" data-livello-su :data-livello="festa.livello">
      <b>✨ Livello {{ festa.livello }}!</b>
      <small>Un punto per l'eroe e uno per le abilità</small>
    </div>
    <div v-else-if="festa && festa.che === 'leggendario'" class="sot-festa sot-festa-leggendario" data-leggendario :data-cosa="festa.cosa">
      <Icona :sprite="festa.sprite" :em="festa.em" :scala="3" :emAlto="34" />
      <b>{{ festa.nome }}</b>
      <i>{{ festa.storia }}</i>
    </div>
    <p v-if="avviso" class="sot-avviso" :class="avviso.rarita ? 'sot-r-' + avviso.rarita : null">
      <Icona v-if="avviso.cosa" :sprite="avviso.sprite" :em="avviso.em" :emAlto="20" />
      {{ avviso.testo }}
    </p>

    <!-- svenuti sopra (la decisione 6 dell'utente): ci si sveglia nella città più vicina, con metà delle gemme; dalle tasche resta solo
         quello che è raro o leggendario, e quello che si ha addosso -->
    <Foglio v-if="risveglio" em="💫" titolo="Ti hanno portato in salvo" data-risveglio-sopra :data-citta="risveglio.citta"
            :dice="`Qualcuno ti ha trascinato ${risveglio.dove}. Metà delle gemme non c'è più, e dalle tasche resta solo quello che è raro o leggendario; quello che avevi addosso è ancora tuo.`">
      <button class="sot-grosso" data-azione="risveglio" @click="$emit('risveglio')">mi rialzo</button>
    </Foglio>

    <Pannello3d v-else-if="abilita || domanda" scontro>
      <div class="sot3d-scelta">
        <CaselleAbilita v-if="abilita && (!sceltaFatta || animando)" :key="animando ? 'racconto' : 'scelta'" v-bind="abilita"
                        :ferma="animando" :pericolo="animando ? null : abilita.pericolo"
                        @scegli="id => $emit('scegli', id)" @bevi="$emit('bevi')" @bevi-energia="$emit('bevi-energia')" @scappa="$emit('scappa')" />
        <template v-else-if="domanda">
          <div v-if="abilita && abilita.scelta" class="sot-scelta sot-pronta sot-scelta-fatta" data-scelta-fatta>
            <Medaglione :glifo="abilita.scelta.glifo" :tinta="abilita.scelta.tinta" stato="preso" :misura="28" />
            <span class="sot-scelta-testo"><b>{{ abilita.scelta.nome }}</b><small>{{ abilita.scelta.dice }}</small></span>
          </div>
          <div class="sot-domanda">
            <Domanda :domanda="domanda.domanda" :pittori="domanda.pittori" :origine="domanda" gioco="sotterraneo" :respiro="900"
                     @risposto="e => $emit('risposto', e)" />
          </div>
        </template>
      </div>
    </Pannello3d>

    <ScegliPozione v-if="pozioni && pozioni.length > 1" :scelte="pozioni" :manca="manca" nello-scontro
                   @bevi="i => $emit('bevuta', i)" @chiudi="$emit('chiudi-pozioni')" @fuori="$emit('chiudi-pozioni')" />
  </div>
</template>
