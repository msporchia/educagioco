<script setup>
// Il foglio del banco: tre posti, ognuno con un cliente che chiede qualche raccolto o prodotto e paga in esperienza (mai monete).
// «Consegna» è spento finché manca roba, ma toccarlo dice cosa manca; «Cambia» manda via l'ordine (il posto riposa qualche minuto).
// Un posto che riposa mostra il conto alla rovescia. Riceve una fotografia già pronta e dice cosa si vuole con gli `emit`.
// Banco chiuso (livello o bancarella che mancano): spiega cosa fare. Vedi docs/fattoria3d/ordini.md.
defineProps({
  aperto: { type: Boolean, default: false },
  perche: { type: String, default: '' },           // banco chiuso: cosa fare per aprirlo
  ordini: { type: Array, default: () => [] },      // motore.ordini(): ordine { idx, cliente, chiede, premio, pronto } | { idx, attesa, restoMs }
  messaggio: { type: String, default: '' },        // l'esito dell'ultimo tocco (manca roba, consegnato)
})
defineEmits(['consegna', 'cambia', 'chiudi'])

const tempo = ms => { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') }
</script>

<template>
  <div class="f3-foglio f3-colonna f3-banco" data-f3="banco">
    <h2>🧺 Il banco</h2>
    <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="$emit('chiudi')">✕</button>
    <div class="f3-corpo">
      <p v-if="!aperto" class="f3-messaggio" data-f3="banco-chiuso">{{ perche }}</p>
      <template v-else>
        <p v-if="messaggio" class="f3-messaggio" data-f3="banco-msg">{{ messaggio }}</p>
        <div class="f3-ordini">
          <div v-for="o in ordini" :key="o.idx" class="ordine" :class="{ attesa: o.attesa, pronto: o.pronto }" :data-ordine="o.idx" :data-pronto="!!o.pronto">
            <template v-if="o.attesa">
              <span class="em">⏳</span>
              <div><b>Posto libero</b><small data-f3="ordine-attesa">Torna fra {{ tempo(o.restoMs) }}</small></div>
            </template>
            <template v-else>
              <div class="cliente"><span class="em">{{ o.cliente.emoji }}</span><b>{{ o.cliente.nome }}</b><span class="premio" data-f3="premio">+{{ o.premio }} ⭐</span></div>
              <div class="dischi">
                <span v-for="c in o.chiede" :key="c.k" class="disco" :class="c.manca ? 'manca' : 'ok'" :data-chiede="c.k">
                  <span class="em">{{ c.emoji }}</span><b>×{{ c.n }}</b><small>{{ c.ha }}/{{ c.n }}</small>
                </span>
              </div>
              <div class="tasti">
                <!-- aria-disabled e non disabled: un tasto spento non si tocca, e toccarlo deve dire cosa manca -->
                <button class="consegna" :class="{ spenta: !o.pronto }" :aria-disabled="!o.pronto" :data-puoi="o.pronto" data-f3="consegna" @click="$emit('consegna', o.idx)">Consegna</button>
                <button class="cambia" data-f3="cambia" @click="$emit('cambia', o.idx)">Cambia</button>
              </div>
            </template>
          </div>
        </div>
        <p class="f3-nota">Ogni consegna dà esperienza ⭐, non monete. «Cambia» manda via l'ordine, ma il posto resta vuoto per qualche minuto.</p>
      </template>
    </div>
  </div>
</template>
