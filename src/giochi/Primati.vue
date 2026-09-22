<script setup>
/* ═══════════════════════════════════════════════════════════════════
   LA TABELLA DEI RECORD

   I giochi che non finiscono — la corsa infinita, la Sopravvivenza —
   non danno né stelle né tappe: quello che danno è **un numero che
   cresce**, e finché quel numero viveva dentro il gioco a cui
   apparteneva non c'era nessun posto dove vederli insieme. Qui ci
   sono, nella pagina che risponde già a «a che punto sono?».

   Tre cose, per ogni riga:

     il record        grosso, perché è quello che si viene a vedere
     le ultime volte  una barretta per partita, la più vecchia a
                      sinistra: è il pezzo che dice **sei migliorato**,
                      che dal record da solo non si legge — quello dice
                      soltanto che il te di ieri era più bravo
     quante partite   e quando è stato fatto il record

   Non decide niente e non calcola niente: le righe arrivano già pronte
   da `tabellaDeiPrimati()` (`giochi/campagne.js`), che è l'unico posto
   che mette insieme i manifesti e il profilo. Qui si disegna, con dei
   `div` alti una percentuale e nessuna libreria, come vuole la casa.
   ═══════════════════════════════════════════════════════════════════ */
defineProps({
  /* [{ id, chiave, sfida, gioco, icona, nome, che, parole, best, quando,
        partite, ultime: [{ v, t, parole }] }] — vedi `tabellaDeiPrimati()`.
     `id` è la riga (`torri/libera-bosco`): un gioco può avere più sfide,
     e la chiave del gioco da sola non le distingue */
  righe: { type: Array, required: true },
})

const data = ms => ms
  ? new Date(ms).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
  : ''

/* La barretta più alta è il record, non il risultato migliore di questa
   fila: se la scala fosse sull'ultima manciata di partite, cinque
   partite storte sembrerebbero cinque partite piene. */
const alta = (u, r) => Math.max(6, Math.round(u.v / Math.max(1, r.best) * 100)) + '%'
</script>

<template>
  <div class="primati" data-primati>
    <div v-for="r in righe" :key="r.id" class="sfida" :data-primato="r.id">
      <div class="capo">
        <span class="ico em">{{ r.icona }}</span>
        <span class="chi">
          <b>{{ r.nome }}</b>
          <i>{{ r.gioco }} · {{ r.che }}</i>
        </span>
        <span class="cifra em">{{ r.parole }}</span>
      </div>
      <!-- com'era la partita del record, nelle parole del gioco -->
      <p v-if="r.dettagli" class="dettagli">{{ r.dettagli }}</p>

      <!-- le ultime partite: dalla più vecchia alla più nuova, come si
           legge il tempo. La barretta del record è d'oro. -->
      <div v-if="r.ultime.length > 1" class="ultime">
        <span v-for="(u, i) in r.ultime" :key="i" class="colonna"
              :title="u.parole">
          <span class="asta">
            <i :style="{ height: alta(u, r) }" :class="{ oro: u.v >= r.best }"></i>
          </span>
          <small>{{ u.parole }}</small>
        </span>
      </div>

      <p class="mini">
        {{ r.partite }} {{ r.partite === 1 ? 'partita' : 'partite' }}
        <template v-if="r.quando"> · record del {{ data(r.quando) }}</template>
      </p>
    </div>
  </div>
</template>

<style scoped>
.primati { display: flex; flex-direction: column; gap: 9px; width: 100%; text-align: left }

.sfida { background: var(--carta); border-radius: 17px; padding: 11px 13px;
         box-shadow: 0 4px 0 #e9ddf5 }

.capo { display: flex; align-items: center; gap: 9px }
.capo .ico { font-size: 22px; flex: none }
.chi { flex: 1; min-width: 0 }
.chi b { display: block; font-size: 14.5px; font-weight: 900; color: var(--viola-scuro) }
.chi i { font-style: normal; font-size: 11px; color: var(--tenue); line-height: 1.25 }
.cifra { flex: none; font-size: 19px; font-weight: 900; color: var(--arancio) }

.ultime { display: flex; gap: 6px; align-items: flex-end; margin-top: 9px }
.colonna { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px }
.asta { width: 100%; height: 34px; display: flex; align-items: flex-end;
        background: #efe8fa; border-radius: 6px; overflow: hidden }
.asta i { display: block; width: 100%; border-radius: 6px;
          background: linear-gradient(180deg, var(--viola), var(--rosa)) }
.asta i.oro { background: linear-gradient(180deg, var(--giallo), var(--arancio)) }
.colonna small { font-size: 9.5px; font-weight: 700; color: var(--tenue); white-space: nowrap }

.mini { margin-top: 7px }
/* com'era la partita del record: sotto la cifra, in piccolo */
.dettagli { margin:2px 0 0; font-size:12.5px; color:var(--tenue, #7a6f5f); font-weight:700 }
</style>
