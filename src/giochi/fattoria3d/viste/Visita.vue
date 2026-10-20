<script setup>
// La visita, la parte che si tocca: la testata (chi ti ospita e «Torna a casa», sempre in vista), i due tasti per la cassa e il mercato,
// la storia del vicino, i due fogli e il viaggio del trattore. Riceve una fotografia già pronta (`motore/vicini.js` `scheda()`) e dice
// cosa si vuole con gli `emit`: i conti sono del motore. Vedi docs/fattoria3d/vicini.md.
import '../stile-vicini.css'
defineProps({
  fase: { type: String, default: 'visita' },        // andata | visita | ritorno
  verso: { type: String, default: '' },             // dove si va, scritto sul cartello del viaggio
  scheda: { type: Object, default: null },
  foglio: { type: String, default: null },          // null | 'cassa' | 'mercato'
  storia: { type: Boolean, default: false },
  messaggio: { type: String, default: '' },
  toast: { type: Object, default: null },           // { testo }: l'avviso di un livello nuovo
})
defineEmits(['torna', 'apri', 'chiudi-foglio', 'chiudi-storia', 'aiuta', 'compra', 'vendi'])
const tempo = ms => ms >= 60_000 ? Math.ceil(ms / 60_000) + ' min' : Math.max(1, Math.ceil(ms / 1000)) + ' s'
const dati = c => c.righe.reduce((n, r) => n + r.dato, 0), tutti = c => c.righe.reduce((n, r) => n + r.n, 0)
</script>

<template>
  <div class="f3-vic" data-f3="visita" :data-fase="fase">
    <template v-if="scheda && fase === 'visita'">
      <header class="f3-vic-testa">
        <div class="f3-vic-chi" data-f3="vicino-chi">
          <span class="em" aria-hidden="true">{{ scheda.proprietario.emoji }}</span>
          <span><b>{{ scheda.nome }}</b><small>{{ scheda.proprietario.nome }}</small></span>
        </div>
        <button class="f3-vic-casa" data-f3="torna-casa" @click="$emit('torna')">🚜 Torna a casa</button>
      </header>

      <div v-if="toast" class="f3-vic-toast" data-f3="avviso-livello-visita">⭐ {{ toast.testo }}</div>

      <div v-if="storia && scheda.storia.length" class="f3-vic-storia" data-f3="storia">
        <b>{{ scheda.proprietario.emoji }} {{ scheda.proprietario.nome }}</b>
        <p v-for="(riga, n) in scheda.storia" :key="n">{{ riga }}</p>
        <button data-f3="storia-ok" @click="$emit('chiudi-storia')">Ciao!</button>
      </div>

      <div v-if="!foglio && !storia" class="f3-vic-azioni">
        <button data-f3="apri-cassa" @click="$emit('apri', 'cassa')">📦 La cassa<em v-if="!scheda.cassa.chiusa" class="f3-n" data-f3="cassa-aperta">!</em></button>
        <button data-f3="apri-mercato" @click="$emit('apri', 'mercato')">🛒 Il mercato</button>
      </div>

      <!-- la cassa: roba precisa, un po' alla volta -->
      <div v-if="foglio === 'cassa'" class="f3-foglio f3-colonna" data-f3="cassa">
        <h2>📦 La cassa di {{ scheda.proprietario.nome }}</h2>
        <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="$emit('chiudi-foglio')">✕</button>
        <div class="f3-corpo">
          <p v-if="messaggio" class="f3-messaggio" data-f3="visita-msg">{{ messaggio }}</p>
          <p v-if="scheda.cassa.chiusa" class="f3-messaggio" data-f3="cassa-chiusa">La cassa è piena, grazie! Riapre fra {{ tempo(scheda.cassa.restoMs) }}.</p>
          <div class="f3-vic-righe">
            <div v-for="r in scheda.cassa.righe" :key="r.k" class="f3-vic-riga" :class="{ finita: r.finita }" :data-chiede="r.k">
              <span class="em" aria-hidden="true">{{ r.emoji }}</span>
              <span class="testo">
                <b>{{ r.nome }}: {{ r.dato }}/{{ r.n }}</b>
                <small :class="r.ha > 0 ? 'ok' : 'manca'">Ne hai {{ r.ha }}</small>
                <i class="f3-vic-barra"><u :style="{ width: 100 * r.dato / r.n + '%' }"></u></i>
              </span>
              <!-- aria-disabled e non disabled: un tasto spento non si tocca, e toccarlo deve dire cosa manca -->
              <button :class="{ spenta: !r.puoi }" :aria-disabled="!r.puoi" :data-puoi="r.puoi" :data-aiuta="r.k" @click="$emit('aiuta', r.k)">{{ r.finita ? '✓ Fatto' : '🤝 Dai' }}</button>
            </div>
          </div>
          <p v-if="scheda.cassa.dono" class="f3-vic-dono" data-f3="cassa-dono">A cassa piena {{ scheda.proprietario.nome }} ti regala {{ scheda.cassa.dono.emoji }} ×{{ scheda.cassa.dono.n }}.</p>
          <p class="f3-nota">Ogni consegna dà esperienza ⭐ ({{ dati(scheda.cassa) }}/{{ tutti(scheda.cassa) }} pezzi), mai monete.</p>
        </div>
      </div>

      <!-- il mercato: compri con le monete, vendi in cambio di esperienza e di roba sua -->
      <div v-if="foglio === 'mercato'" class="f3-foglio f3-colonna" data-f3="mercato">
        <h2>🛒 Il mercato di {{ scheda.proprietario.nome }}</h2>
        <button class="f3-chiudi" data-chiudi aria-label="chiudi" @click="$emit('chiudi-foglio')">✕</button>
        <div class="f3-corpo">
          <p v-if="messaggio" class="f3-messaggio" data-f3="visita-msg">{{ messaggio }}</p>
          <h3>Compri da lui</h3>
          <div class="f3-vic-righe">
            <div v-for="v in scheda.mercato.vende" :key="v.k" class="f3-vic-riga" :data-vende="v.k">
              <span class="em" aria-hidden="true">{{ v.emoji }}</span>
              <span class="testo"><b>{{ v.nome }}</b><small>{{ v.esaurito ? 'Finito' : v.rimasti + ' disponibili' }} · ne hai {{ v.ha }}</small></span>
              <button :class="{ spenta: !v.puoi }" :aria-disabled="!v.puoi" :data-puoi="v.puoi" :data-compra="v.k" @click="$emit('compra', v.k)">🪙 {{ v.prezzo }}</button>
            </div>
          </div>
          <h3>Gli vendi</h3>
          <div class="f3-vic-righe">
            <div v-for="b in scheda.mercato.compra" :key="b.i" class="f3-vic-riga" :data-baratto="b.i">
              <span class="em" aria-hidden="true">{{ b.emoji }}</span>
              <span class="testo">
                <b>Dai {{ b.emoji }} ×{{ b.n }}</b>
                <small>Ricevi +{{ b.premio }} ⭐<template v-if="b.da"> e {{ b.da.emoji }} ×{{ b.da.n }}</template></small>
                <small :class="b.ha >= b.n ? 'ok' : 'manca'">Ne hai {{ b.ha }} · {{ b.rimasti > 0 ? b.rimasti + (b.rimasti === 1 ? ' volta' : ' volte') : 'finito' }}</small>
              </span>
              <button :class="{ spenta: !b.puoi }" :aria-disabled="!b.puoi" :data-puoi="b.puoi" :data-vendi="b.i" @click="$emit('vendi', b.i)">Scambia</button>
            </div>
          </div>
          <p v-if="scheda.mercato.restoMs" class="f3-nota" data-f3="mercato-rinnovo">Il banco si rifornisce fra {{ tempo(scheda.mercato.restoMs) }}.</p>
          <p class="f3-nota">Qui si compra con le monete; vendendo non si prendono monete ma esperienza ⭐ e roba del vicino.</p>
        </div>
      </div>
    </template>

    <!-- il trattore che parte o che torna -->
    <div v-if="fase !== 'visita'" class="f3-vic-viaggio" :class="{ ritorno: fase === 'ritorno' }" data-f3="viaggio">
      <span class="trattore" aria-hidden="true">🚜</span>
      <b>{{ fase === 'ritorno' ? 'Si torna a casa…' : 'Si va da ' + verso + '…' }}</b>
    </div>
  </div>
</template>
