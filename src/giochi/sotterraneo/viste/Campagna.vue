<script setup>
// Le sei discese: riceve le tappe già decise, sceglie solo dove andare. Una tappa chiusa dice cosa ci sarà,
// non "prima finisci quella di prima". La discesa lasciata a metà sta in cima; toccarne un'altra avverte
// invece di buttare la partita in silenzio.
import { riprendiSeChiesta } from '../../ripresa.js'
import { ref, computed } from 'vue'
import { figura } from './figura.js'
import { pezzoAndante } from '../dati/tessere.js'

const props = defineProps({
  tappe: { type: Array, required: true },   // [{ indice, nome, icona, dritta, piani, aperta, adesso, stelle }]
  ripresa: { type: Object, default: null }, // { tappa, nome, icona, piano, piani, vita, gemme, chi }
  eroe: { type: Object, required: true },   // la scheda di chi scende, da dati/eroi.js
  abisso: { type: Object, default: null },   // { indice, nome, icona, dritta, fondo }; in fondo, la ripresa è più urgente
})
const emit = defineEmits(['gioca', 'riprendi', 'scorda', 'eroe'])
riprendiSeChiesta(() => props.ripresa, () => emit('riprendi'))

const ritratto = computed(() => figura(pezzoAndante(props.eroe.sprite, 'fermo', 0), { scala: 2 }))

const chiede = ref(null)   // quale tappa si sta per cominciare avendo una discesa in sospeso

function tocca(t, cSospeso) {
  if (!cSospeso) return emit('gioca', t.indice)
  chiede.value = t
}

function comincia() {
  const t = chiede.value
  chiede.value = null
  emit('gioca', t.indice)
}
</script>

<template>
  <div class="sot-tappe">
    <p class="sot-invito">
      Sotto c'è un posto solo, e si gira col dito.
      <b>Ogni cosa che vale ha un prezzo, e il prezzo è rispondere.</b>
    </p>

    <!-- chi scende: si sceglie una volta e resta, di qui si cambia -->
    <button class="sot-chi" data-azione="eroe" @click="$emit('eroe')">
      <span class="sot-ritratto" :style="ritratto ? ritratto.gabbia : null">
        <i v-if="ritratto" :style="ritratto.pezzo"></i>
        <b v-else class="em">{{ eroe.em }}</b>
      </span>
      <span class="sot-testo">
        <b>{{ eroe.nome }}</b>
        <i class="em">❤️ {{ eroe.vita }} · ⚔️ {{ eroe.att }}<template v-if="eroe.dif"> · 🛡️ {{ eroe.dif }}</template></i>
      </span>
      <span class="sot-cambia">cambio</span>
    </button>

    <div v-if="ripresa" class="sot-ripresa" data-ripresa="1">
      <p class="sot-dove">
        <span class="em">{{ ripresa.icona }}</span>
        <b>{{ ripresa.nome }}</b>
        <!-- con chi si riprende: chi è sceso è sceso, anche se nel frattempo si è cambiato eroe -->
        <i>{{ ripresa.chi ? ripresa.chi + ' · ' : '' }}piano {{ ripresa.piano
           }}<template v-if="ripresa.piani"> di {{ ripresa.piani }}</template> ·
           ❤️ {{ ripresa.vita }} · 💎 {{ ripresa.gemme }}</i>
      </p>
      <button class="sot-grosso" data-azione="riprendi" @click="$emit('riprendi')">
        <span class="em">🕳️</span> torno giù da dove ero
      </button>
      <button class="sot-grosso sot-chiaro" data-azione="scorda" @click="$emit('scorda')">
        lascio perdere quella discesa
      </button>
    </div>

    <button v-for="t in tappe" :key="t.indice"
            class="sot-tappa" :class="{ 'sot-chiusa': !t.aperta, 'sot-adesso': t.adesso }"
            :data-tappa="t.indice" :disabled="!t.aperta"
            @click="tocca(t, !!ripresa)">
      <span class="sot-faccia em">{{ t.aperta ? t.icona : '🔒' }}</span>
      <span class="sot-testo">
        <b>{{ t.nome }}</b>
        <i>{{ t.dritta }}</i>
      </span>
      <span class="sot-conto em">
        {{ t.stelle ? '⭐'.repeat(t.stelle) : `${t.piani} 🪜` }}
      </span>
    </button>

    <!-- l'abisso non è la settima discesa: niente stelle, niente lucchetto. A destra il record -->
    <button v-if="abisso" class="sot-tappa sot-abisso" data-abisso="1"
            @click="tocca(abisso, !!ripresa)">
      <span class="sot-faccia em">{{ abisso.icona }}</span>
      <span class="sot-testo">
        <b>{{ abisso.nome }}</b>
        <i>{{ abisso.dritta }}</i>
      </span>
      <span class="sot-conto em" data-fondo>
        {{ abisso.fondo ? `piano ${abisso.fondo}` : 'mai sceso' }}
      </span>
    </button>

    <!-- detto prima, mai dopo: quello che si perde non torna -->
    <div v-if="chiede" class="sot-velo" @click.self="chiede = null">
      <div class="sot-modale">
        <h2><span class="em">⚠️</span> Hai una discesa a metà</h2>
        <p>
          Se cominci <b>{{ chiede.nome }}</b> perdi quella che avevi lasciato
          in sospeso, con tutto quello che avevi trovato.
        </p>
        <button class="sot-grosso" data-azione="riprendi-invece"
                @click="chiede = null; $emit('riprendi')">
          no, torno a quella di prima
        </button>
        <button class="sot-grosso sot-chiaro" data-azione="comincia" @click="comincia">
          va bene, comincio {{ chiede.nome.toLowerCase() }}
        </button>
      </div>
    </div>
  </div>
</template>
