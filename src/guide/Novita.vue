<script setup>
// La pagina delle novità per un bambino: vedi docs/genitori/novita-bambini.md.
// L'elenco si fotografa all'apertura e non si ricalcola: «Letto» non deve svuotarla sotto il dito.
import Barra from '../components/Barra.vue'
import { daLeggere } from './novita-bambini.js'
import { novitaLette, segnaNovitaLette } from '../store/profile.js'
import { inCasa } from '../data/portata-giochi.js'
import { GIOCHI } from '../data/giochi.js'

const emit = defineEmits(['vai'])

const gruppi = daLeggere(novitaLette(), inCasa)

function testata (chiave) {
  if (!chiave) return { ico: '✨', nome: 'In tutti i giochi' }
  const g = GIOCHI.find(x => x.chiave === chiave)
  return g ? { ico: g.ico, nome: g.nome } : { ico: '✨', nome: chiave }
}

// si spezza la stringa invece di passare da Date, che leggerebbe in UTC e sbaglierebbe il giorno
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio',
              'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
function giorno (quando) {
  const [a, m, g] = String(quando || '').split('-').map(Number)
  if (!a || !m || !g) return ''
  return `${g} ${MESI[m - 1]}${a !== new Date().getFullYear() ? ' ' + a : ''}`
}

async function letto () {
  await segnaNovitaLette()
  emit('vai', 'home')
}
</script>

<template>
  <div class="schermo pulito" data-novita-pagina>
    <Barra titolo="Novità" :audio="false" @indietro="$emit('vai','home')" />

    <div class="corpo">
      <template v-if="gruppi.length">
        <section v-for="gr in gruppi" :key="gr.gioco || 'tutti'" class="gruppo"
                 :data-novita-gioco="gr.gioco || 'tutti'">
          <h2 class="testata"><span class="ico">{{ testata(gr.gioco).ico }}</span>
            {{ testata(gr.gioco).nome }}</h2>
          <ul>
            <li v-for="v in gr.voci" :key="v.id" :data-novita="v.id">
              <span class="frase">{{ v.testo }}</span>
              <small class="quando">{{ giorno(v.quando) }}</small>
            </li>
          </ul>
        </section>

        <div class="piede">
          <button class="bottone" data-azione="novita-letto" @click="letto">👍 Letto!</button>
        </div>
      </template>

      <template v-else>
        <p class="testo vuoto">Niente di nuovo, per ora.</p>
        <button class="bottone chiaro torna" @click="$emit('vai','home')">← Torna ai giochi</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.corpo { flex:1; overflow-y:auto; padding:12px 14px 0;
         display:flex; flex-direction:column; gap:11px;
         width:min(var(--colonna),100%); margin:0 auto }
.gruppo { padding:13px 16px 10px; border-radius:var(--raggio); background:var(--superficie);
          box-shadow:var(--ombra) }
.testata { display:flex; align-items:center; gap:9px; margin:0 0 7px;
           font-size:15px; font-weight:600; color:var(--inchiostro) }
.testata .ico { font-size:26px }
.gruppo ul { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:7px }
.gruppo li { display:flex; align-items:baseline; gap:10px; justify-content:space-between }
.frase { font-size:14px; font-weight:400; color:var(--inchiostro); line-height:1.35 }
.quando { flex:none; font-size:11.5px; color:var(--grigio); white-space:nowrap }
.piede { position:sticky; bottom:0; margin-top:auto; display:flex; justify-content:center;
         padding:14px 0 calc(16px + env(safe-area-inset-bottom));
         background:linear-gradient(180deg,#f6f7f900,var(--fondo) 40%) }
.vuoto { align-self:center; text-align:center; margin-top:24px }
.torna { align-self:center; margin-top:10px; padding:11px 26px; font-size:15px }
</style>
