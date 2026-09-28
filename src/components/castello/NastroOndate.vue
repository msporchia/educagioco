<script setup>
/* ═══════════════════════════════════════════════════════════════════
   IL PREAVVISO — chi sta per arrivare, prima che serva.

   Il difetto che chiude: quello che un mostro non si fa fare si
   scopriva quando l'ondata era già partita. A quel punto costruire la
   torre giusta non serve più, e la cosa smette di essere una
   decisione: diventa un dettaglio che si legge dopo. La scelta della
   torre — che è il cuore del gioco, perché decide anche *quale
   operazione* si farà — si prendeva a caso.

   Qui le prossime tre ondate si vedono mentre si sta ancora
   scegliendo: chi arriva, quanti sono, e le emoji delle torri a cui
   quel mostro è **immune**, sbarrate. «Fra due ondate arriva il Golem,
   e frecce e magia non lo toccano» vuol dire «per quel giro servono le
   bombe». Con le immunità non è più un consiglio: un'ondata di golem
   con due arcieri in campo passa intera.

   ── perché sbarrate, e non colorate ──
   Il segno dice «non questa», e non può somigliare a uno che dice
   «questa», se no il nastro insegna l'opposto di quello che dice.
   Quindi le pastiglie sono spente, grigie, con la barra sopra: la
   stessa grammatica del divieto che un bambino conosce già dalla
   strada.

   ── e cosa fa, e il capo ──
   Chi si divide o si rialza porta la sua emoji in alto (✂️, 💫), e il
   titolo del riquadro lo dice a parole. L'ondata del capo ha la corona
   e il riquadro dorato: un mostro solo, gigante, e si vede tre ondate
   prima.

   Sta in cima al campo, e solo fra un'ondata e l'altra: durante la
   battaglia quel posto è della scheda del mostro che si ha davanti, e
   le due cose non servono mai insieme.

   ── e l'ondata mista ──
   Due tipi insieme (`con`, vedi `coppiaDellOnda` in `data/mostri.js`):
   due facce, ognuna con **le sue** immunità addosso, e il riquadro a
   righe. Le immunità non si fondono in una fila sola, perché quello che
   c'è da leggere è che non coincidono — nessuna torre li ferisce tutti
   e due — e fuse direbbero «tutte sbarrate».

   Dove gli ingressi sono due, ogni pastiglia dice anche **da che
   parte** arriva quell'ondata. È l'informazione che rende il
   trascinamento di una torre una mossa invece che una carezza: «fra due
   giri scendono da destra» vuol dire «spostala adesso».
   ═══════════════════════════════════════════════════════════════════ */
import { TORRI } from '../../data/ops.js'
import { ABILITA } from '../../data/mostri.js'
import RitrattoMostro from './RitrattoMostro.vue'

/* da che ingresso arriva l'ondata, dove gli ingressi sono più d'uno.
   Non è un dettaglio di colore: è quello che dice se conviene spostare
   una torre adesso, e si legge tre ondate prima. */
const FRECCE = { sinistra: '↙', destra: '↘', ambo: '↙↘' }

defineProps({
  /* [{ onda, fra, id, nome, quanti, vola, immune, abilita, capo, con? }] — le dà il motore */
  prossime: { type: Array, default: () => [] },
  /* i pittori della pelle, se il campo ne ha una: il ritratto è la figura
     che poi scende in campo */
  pittori: { type: Object, default: null },
})

/* la frase del titolo: chi è, a cosa è immune, cosa fa. Il riquadro è
   piccolo e i segni sono emoji; chi ci tiene il dito sopra (o chi non
   vede) si legge la frase intera */
function frase(p) {
  if (p.con) return `${p.nome} e ${p.con.nome} insieme: ` + [p, p.con].map(delTipo).join(' — ')
  return delTipo(p)
}
/* la frase di un tipo solo: in una mista, una per ciascuno */
function delTipo(p) {
  const parti = [p.capo ? `${p.nome} gigante: il capo` : p.nome]
  if (p.immune && p.immune.length)
    parti.push('immune a ' + p.immune.map(k => TORRI[k].nome.toLowerCase()).join(' e '))
  if (p.abilita) parti.push(ABILITA[p.abilita].che)
  return parti.join(' · ')
}
/* le facce del riquadro: una, o due in un'ondata mista */
const facce = p => (p.con ? [p, p.con] : [p])
</script>

<template>
  <div v-if="prossime.length" class="preavviso">
    <span class="titolo">In arrivo</span>
    <div v-for="p in prossime" :key="p.onda" class="avviso"
         :class="{ subito: p.fra === 1, capo: p.capo, mista: p.con }" :title="frase(p)"
         :data-onda-preavviso="p.onda" :data-immune="(p.immune || []).join(',')"
         :data-mista="p.con ? p.con.id : null"
         :data-immune-con="p.con ? p.con.immune.join(',') : null"
         :data-abilita="p.abilita || null" :data-capo="p.capo ? '' : null">
      <span v-for="f in facce(p)" :key="f.id" class="faccia">
        <RitrattoMostro :bestia="f.id" :pittori="pittori" />
        <!-- le immunità stanno *addosso* al mostro, non di fianco: sono
             quelle che si devono leggere insieme alla faccia, non dopo -->
        <span v-if="f.immune && f.immune.length" class="immuni">
          <span v-for="k in f.immune" :key="k" class="punto">{{ TORRI[k].emoji }}</span>
        </span>
        <span v-if="f.abilita" class="abilita">{{ ABILITA[f.abilita].emoji }}</span>
        <span v-if="p.capo" class="corona">👑</span>
      </span>
      <span class="dati">
        <b>{{ p.capo ? 'Capo!' : p.con ? 'Misti!' : p.nome }}</b>
        <i>🌊{{ p.onda }} · ×{{ p.quanti }}<template v-if="p.lato"> ·
          <em :class="p.lato">{{ FRECCE[p.lato] }}</em></template></i>
      </span>
    </div>
  </div>
</template>

<style scoped src="./nastro.css"></style>
