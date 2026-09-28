<script setup>
// La tabella dei record: vedi docs/core/primati.md. Non calcola niente, le
// righe arrivano pronte da tabellaDeiPrimati() (giochi/campagne.js).
defineProps({
  righe: { type: Array, required: true },   // vedi tabellaDeiPrimati(); `id` distingue le sfide
})

const data = ms => ms
  ? new Date(ms).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
  : ''

// scala sul record, non sulla partita migliore della fila: altrimenti cinque partite storte sembrano piene
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
      <p v-if="r.dettagli" class="dettagli">{{ r.dettagli }}</p>

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
.dettagli { margin:2px 0 0; font-size:12.5px; color:var(--tenue, #7a6f5f); font-weight:700 }
</style>
