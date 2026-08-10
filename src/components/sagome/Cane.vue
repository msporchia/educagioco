<script setup>
/* IL CANE, in sei tagli.

   La sagoma è una sola — un cucciolo seduto, tondo — e il `taglio`
   cambia le tre cose che fanno riconoscere una razza a un bambino: le
   orecchie, il pelo e la coda. Il bobtail ha il pelo che gli fa da
   cappello e il moncone, il bassotto le orecchie lunghe fino a terra,
   il barboncino i pon-pon, il lupo le orecchie dritte, il chihuahua due
   orecchie più grandi della testa. Tutto il resto è colore, e il colore
   sta in data/pets.js.

   **La faccia si vede sempre.** È la regola che questo file aveva perso:
   la testa è del colore del manto (come nel gatto, non della pancia), il
   musetto chiaro sta in basso, e sopra gli occhi non passa niente. Il
   pelo del bobtail arriva a sfiorarli e si ferma lì: un cane con gli
   occhi coperti non ha un'espressione, e l'espressione è metà del gioco
   — è da lì che si capisce se ha fame o è contento.

   `muso` e `sella` sono facoltativi: il primo colora il musetto — chiaro
   nell'husky, nero nel pastore — la seconda mette il mantello scuro
   sulla schiena. Chi non li dichiara ha il musetto del colore della
   pancia, che è il caso normale. `sopracciglia` sono le due macchiette
   fulve del pastore: cambiano la faccia più di quanto costino. */
import { computed } from 'vue'

const props = defineProps({
  pet:    { type: Object, required: true },
  felice: { type: Boolean, default: false },
  uid:    { type: String, default: 'x' },
})

/* il bassotto e il lupo hanno il grugno che sporge; gli altri il musetto
   corto, tutto dentro la testa */
const grugno = computed(() => ['orecchione', 'lupo'].includes(props.pet.taglio))
/* il colore del musetto: dichiarato, o il chiaro della pancia */
const musetto = computed(() => props.pet.muso || props.pet.pancia)

/* Il contorno di pelo: il bobtail e il barboncino non hanno un profilo
   liscio ma una frangia di ciuffi. Sono la stessa idea del persiano fra
   i gatti — la sagoma resta quella, è il bordo a sfrangiarsi — ma **la
   forma del ciuffo è la differenza fra le due razze**: tondo è un
   ricciolo e fa il barboncino, lungo è una ciocca che cade e fa il
   bobtail. Con gli stessi cerchi per tutti e due, Watson veniva fuori un
   barboncino grigio. `[cx, cy, rx, ry]`. */
const CIUFFI = {
  bobtail: [[28, 76, 8, 11], [26, 90, 9, 13], [28, 104, 9, 13], [34, 114, 9, 11],
            [92, 76, 8, 11], [94, 90, 9, 13], [92, 104, 9, 13], [86, 114, 9, 11],
            [45, 120, 9, 8], [60, 122, 9, 8], [75, 120, 9, 8]],
  riccio:  [[30, 74, 8, 8], [28, 86, 8, 8], [30, 98, 9, 9], [35, 110, 8, 8],
            [90, 74, 8, 8], [92, 86, 8, 8], [90, 98, 9, 9], [85, 110, 8, 8],
            [47, 118, 9, 9], [60, 120, 9, 9], [73, 118, 9, 9]],
}
const ciuffi = computed(() => CIUFFI[props.pet.taglio] || [])
</script>

<template>
  <defs>
    <clipPath :id="'ct-' + uid"><circle cx="60" cy="44" r="27" /></clipPath>
    <clipPath :id="'cc-' + uid">
      <path d="M30,118 C24,86 34,58 60,58 C86,58 96,86 90,118 Z" />
    </clipPath>
    <!-- le due metà del bobtail: il grigio dietro e il bianco davanti.
         Servono a tenere dentro i bordi le ciocche e le macchie -->
    <template v-if="pet.taglio === 'bobtail'">
      <clipPath :id="'cb-' + uid">
        <path d="M27,120 C20,88 31,54 60,52 C89,54 100,88 93,120 Z" />
      </clipPath>
      <clipPath :id="'cd-' + uid">
        <path d="M37,114 C33,88 36,62 60,57 C84,62 87,88 83,114 a5,5 0 0 1 -5,5
                 H42 a5,5 0 0 1 -5,-5 Z" />
      </clipPath>
    </template>
  </defs>

  <!-- la coda: moncone, dritta, col pon-pon o a pennacchio -->
  <g class="coda">
    <!-- Il bobtail prende il nome dalla coda mozza (*bob tail*), e per un
         po' qui c'era il moncone. Ma quella coda gliela tagliavano: da
         quando non si fa più, un bobtail la coda ce l'ha — lunga e
         piumata — e i cani veri che conosciamo sono questi. Quindi non è
         una licenza per far contenta una bambina: è il cane giusto. -->
    <!-- La porta alta e le gira attorno un filo di chiaro: appoggiata sul
         fianco, grigia su grigio, non si leggeva come una coda ma come
         altro pelo. È lo stesso bordo che stacca le orecchie. -->
    <template v-if="pet.taglio === 'bobtail'">
      <g fill="none" stroke-linecap="round">
        <path d="M84,106 C105,104 111,88 104,73" :stroke="pet.pancia" stroke-width="17" />
        <path d="M84,106 C105,104 111,88 104,73" :stroke="pet.manto" stroke-width="12" />
      </g>
      <ellipse cx="103" cy="71" rx="10.5" ry="11.5" :fill="pet.pancia" />
      <ellipse cx="103" cy="71" rx="8" ry="9" :fill="pet.manto" />
    </template>
    <template v-else-if="pet.taglio === 'riccio'">
      <path d="M86,108 C98,104 100,92 96,84" :stroke="pet.manto" stroke-width="7"
            stroke-linecap="round" fill="none" />
      <circle cx="96" cy="80" r="9" :fill="pet.manto" />
    </template>
    <template v-else-if="pet.taglio === 'lupo'">
      <path d="M86,110 C102,110 110,96 104,82" :stroke="pet.manto" stroke-width="13"
            stroke-linecap="round" fill="none" />
      <path d="M100,86 C106,92 108,100 104,106" :stroke="pet.pancia" stroke-width="6"
            stroke-linecap="round" fill="none" opacity=".8" />
    </template>
    <path v-else d="M86,110 C98,108 104,98 102,88" :stroke="pet.manto" stroke-width="9"
          stroke-linecap="round" fill="none" />
  </g>

  <!-- ═══ IL CORPO DEL BOBTAIL, che è fatto a modo suo ═══
       Guardato in una foto, un bobtail seduto **non è** un cane grigio
       con una pettorina bianca: il davanti — testa, collo, petto e zampe
       — è un blocco bianco solo che arriva a terra, e il grigio si vede
       dietro e sui fianchi. E le zampe sono due colonne dritte, che
       finiscono nette: il pelo lungo ce l'ha addosso, non *intorno*.
       Con i ciuffi tondi anche in fondo veniva fuori una pecora. -->
  <g v-if="pet.taglio === 'bobtail'" class="corpo">
    <!-- il posteriore grigio -->
    <ellipse v-for="(c, i) in [[28,74,7,11],[26,90,7,13],[92,74,7,11],[94,90,7,13]]" :key="'f' + i"
             :cx="c[0]" :cy="c[1]" :rx="c[2]" :ry="c[3]" :fill="pet.manto" />
    <path d="M27,120 C20,88 31,54 60,52 C89,54 100,88 93,120 Z" :fill="pet.manto" />
    <!-- le ciocche chiare dentro il grigio: è il pelo brizzolato, e senza
         di loro il grigio è una campitura piatta -->
    <path v-if="pet.brizzolo" :clip-path="'url(#cb-' + uid + ')'"
          d="M33,66 q-3,16 -1,30 M40,58 q-3,14 -2,26 M88,66 q3,16 1,30 M81,58 q3,14 2,26
             M60,54 q-8,3 -14,9 M60,54 q8,3 14,9"
          fill="none" :stroke="pet.brizzolo" stroke-width="3.8" stroke-linecap="round"
          opacity=".85" />
    <!-- due pieghe sui fianchi, tenui: il pelo cade, non riga -->
    <path d="M34,72 q-3,18 -1,34 M86,72 q3,18 1,34"
          fill="none" stroke="#0000000e" stroke-width="2.6" stroke-linecap="round" />
    <!-- il davanti bianco, dal collo fino a terra -->
    <path :fill="pet.pancia"
          d="M37,114 C33,88 36,62 60,57 C84,62 87,88 83,114 a5,5 0 0 1 -5,5 H42 a5,5 0 0 1 -5,-5 Z" />
    <!-- le chiazze che sconfinano sul bianco: il confine fra i due colori
         non è una linea, e finché lo è restano due campiture affiancate
         invece di un cane a macchie -->
    <g v-if="pet.brizzolo" :clip-path="'url(#cd-' + uid + ')'" :fill="pet.manto">
      <ellipse cx="36" cy="82" rx="8" ry="11" opacity=".9" />
      <ellipse cx="85" cy="96" rx="7.5" ry="10" opacity=".9" />
      <ellipse cx="37" cy="103" rx="6" ry="8" opacity=".55" />
      <ellipse cx="84" cy="70" rx="6" ry="7.5" opacity=".55" />
    </g>
    <!-- il solco fra le due zampe, e le dita in fondo: sono loro a dire
         che quelle sono zampe e non un grembiule -->
    <path d="M60,92 V116" fill="none" stroke="#00000014" stroke-width="2.6" stroke-linecap="round" />
    <path d="M47,110 v6 M53,110 v6 M67,110 v6 M73,110 v6"
          stroke="#00000022" stroke-width="1.4" stroke-linecap="round" />
  </g>

  <g v-else class="corpo">
    <!-- i ciuffi vanno sotto la sagoma: sbucano dal bordo e basta -->
    <ellipse v-for="(c, i) in ciuffi" :key="'f' + i"
             :cx="c[0]" :cy="c[1]" :rx="c[2]" :ry="c[3]" :fill="pet.manto" />
    <path d="M30,118 C24,86 34,58 60,58 C86,58 96,86 90,118 Z" :fill="pet.manto" />
    <!-- il mantello scuro sulla schiena: è quello che fa il pastore -->
    <path v-if="pet.sella" :clip-path="'url(#cc-' + uid + ')'"
          d="M26,54 H94 V96 q-17,-12 -34,-12 q-17,0 -34,12 Z" :fill="pet.sella" />
    <ellipse cx="60" cy="96" rx="20" ry="22" :fill="pet.pancia" />
    <!-- i tre lobi: è come cade il pelo sul davanti -->
    <circle v-for="(c, i) in [[46,106,9],[60,111,9],[74,106,9]]" :key="'p' + i"
            :cx="c[0]" :cy="c[1]" :r="c[2]" :fill="pet.pancia" />
    <ellipse cx="46" cy="116" rx="11" ry="7" :fill="pet.pancia" />
    <ellipse cx="74" cy="116" rx="11" ry="7" :fill="pet.pancia" />
    <path d="M42,114 v5 M50,114 v5 M70,114 v5 M78,114 v5"
          stroke="#00000022" stroke-width="1.4" stroke-linecap="round" />
  </g>

  <g class="testa">
    <!-- orecchie, sotto la testa così restano dietro -->
    <template v-if="pet.taglio === 'orecchione'">
      <path d="M33,34 C16,40 14,74 26,88 C38,92 42,72 42,50 Z" :fill="pet.orecchie || pet.manto" />
      <path d="M87,34 C104,40 106,74 94,88 C82,92 78,72 78,50 Z" :fill="pet.orecchie || pet.manto" />
    </template>
    <template v-else-if="pet.taglio === 'riccio'">
      <circle cx="30" cy="52" r="14" :fill="pet.manto" />
      <circle cx="90" cy="52" r="14" :fill="pet.manto" />
      <circle cx="34" cy="38" r="11" :fill="pet.manto" />
      <circle cx="86" cy="38" r="11" :fill="pet.manto" />
    </template>
    <!-- dritte a punta: il lupo. Sono la cosa che si guarda per prima -->
    <template v-else-if="pet.taglio === 'lupo'">
      <polygon points="38,34 32,4 60,24" :fill="pet.orecchie || pet.manto" />
      <polygon points="82,34 88,4 60,24" :fill="pet.orecchie || pet.manto" />
      <polygon points="40,32 36,13 53,25" fill="#f2a3b6" />
      <polygon points="80,32 84,13 67,25" fill="#f2a3b6" />
    </template>
    <!-- più grandi della testa: il chihuahua è tutto orecchie -->
    <template v-else-if="pet.taglio === 'chihuahua'">
      <polygon points="34,42 14,6 58,24" :fill="pet.orecchie || pet.manto" />
      <polygon points="86,42 106,6 62,24" :fill="pet.orecchie || pet.manto" />
      <polygon points="36,38 22,15 52,27" fill="#f2a3b6" />
      <polygon points="84,38 98,15 68,27" fill="#f2a3b6" />
    </template>
    <!-- Nel bobtail sono due bandiere grigie che cadono lungo le guance e
         incorniciano la faccia bianca: nelle foto sono la cosa più scura
         della testa, e senza di loro il muso si perde nel pelo. -->
    <template v-else-if="pet.taglio === 'bobtail'">
      <path d="M36,34 C24,40 24,62 32,74 C41,74 43,60 43,46 Z"
            :fill="pet.orecchie || pet.manto" :stroke="pet.pancia" stroke-width="1.6" />
      <path d="M84,34 C96,40 96,62 88,74 C79,74 77,60 77,46 Z"
            :fill="pet.orecchie || pet.manto" :stroke="pet.pancia" stroke-width="1.6" />
    </template>
    <template v-else>
      <path d="M34,32 C20,34 16,54 25,68 C34,75 41,65 41,50 Z" :fill="pet.orecchie || pet.manto" />
      <path d="M86,32 C100,34 104,54 95,68 C86,75 79,65 79,50 Z" :fill="pet.orecchie || pet.manto" />
    </template>

    <!-- il collare di pelo del bobtail: gli fa la testa grande e
         squadrata che ha dal vero, e sta sotto la testa come i ciuffi
         stanno sotto il corpo -->
    <!-- il grugno del bassotto e del lupo: sporge sotto la testa, e per
         questo si disegna fuori dal ritaglio -->
    <ellipse v-if="grugno" cx="60" cy="66" rx="12.5" ry="13" :fill="musetto" />

    <!-- Nel bobtail la testa è chiara e il posteriore grigio — è così dal
         vero, ed è anche il modo di farlo riconoscere da lontano: un cane
         grigio col testone bianco. Gli altri hanno la testa del manto. -->
    <circle cx="60" cy="44" r="27" :fill="pet.taglio === 'bobtail' ? pet.pancia : pet.manto" />

    <g :clip-path="'url(#ct-' + uid + ')'">
      <!-- Il musetto: la macchia di colore attorno a naso e bocca, non
           mezza faccia. Larga quanto basta a tenerci dentro il tartufo —
           più grande diventa una barba, e il pastore ne aveva una. -->
      <ellipse v-if="pet.taglio !== 'bobtail'" cx="60" :cy="grugno ? 66 : 62"
               :rx="grugno ? 15 : 17" :ry="grugno ? 14 : 13" :fill="musetto" />
      <!-- Il pelo che cade dalla fronte, a ciocche. Si ferma sopra gli
           occhi: sotto ci deve stare una faccia. È appena più scuro del
           resto della testa, se no su un cane bianco non si vedrebbe. -->
      <template v-if="pet.taglio === 'bobtail'">
        <path :fill="pet.frangia || pet.pancia"
              d="M31,12 H89 V26 q-6,12 -11.6,1 q-6,12 -11.6,1 q-6,13 -11.6,0
                 q-6,12 -11.6,-1 q-6,11 -11.6,-2 Z" />
        <path d="M43,17 V30 M54.5,15 V32 M66,15 V32 M77,17 V30"
              stroke="#0000001f" stroke-width="2" stroke-linecap="round" />
        <!-- l'ombra sotto le ciocche: senza, il pelo bianco sulla testa
             bianca non si vede che c'è -->
        <path d="M31,26 q6,12 11.6,1 q6,12 11.6,1 q6,13 11.6,0 q6,12 11.6,-1 q6,11 11.6,-2"
              fill="none" stroke="#00000018" stroke-width="2.2" stroke-linecap="round" />
      </template>
      <!-- il ciuffo di riccioli del barboncino -->
      <circle v-for="(c, i) in (pet.taglio === 'riccio' ?
                                [[46,24,10],[60,18,11],[74,24,10],[52,16,8],[68,16,8]] : [])"
              :key="'r' + i" :cx="c[0]" :cy="c[1]" :r="c[2]" :fill="pet.manto" />
    </g>

    <!-- le due macchiette sopra gli occhi: il pastore le ha fulve, e da
         sole gli danno la faccia da cane che ti guarda -->
    <template v-if="pet.sopracciglia">
      <ellipse cx="49" cy="39" rx="5" ry="3" :fill="pet.sopracciglia" />
      <ellipse cx="71" cy="39" rx="5" ry="3" :fill="pet.sopracciglia" />
    </template>

    <!-- occhi: sclera, iride e riflesso, come nel gatto. Un cerchio nero
         solo non guarda da nessuna parte -->
    <template v-if="felice">
      <path d="M42,50 Q49,42 56,50" :stroke="pet.occhi" stroke-width="3.4"
            stroke-linecap="round" fill="none" />
      <path d="M64,50 Q71,42 78,50" :stroke="pet.occhi" stroke-width="3.4"
            stroke-linecap="round" fill="none" />
    </template>
    <template v-else>
      <g v-for="cx in [49, 71]" :key="cx">
        <ellipse :cx="cx" cy="48" :rx="pet.taglio === 'chihuahua' ? 7.5 : 6.5"
                 :ry="pet.taglio === 'chihuahua' ? 8 : 7" fill="#fffdf8" />
        <circle :cx="cx" cy="48" :r="pet.taglio === 'chihuahua' ? 5.8 : 5" :fill="pet.occhi" />
        <circle :cx="cx" cy="48" r="2.6" fill="#1b1622" />
        <circle :cx="cx - 1.8" cy="45.6" r="1.9" fill="#fff" />
      </g>
    </template>

    <!-- tartufo e bocca. Il tartufo è la cosa più scura della faccia:
         resta nero anche sul musetto nero del pastore, e a distinguerlo
         basta il riflesso -->
    <ellipse cx="60" :cy="grugno ? 60 : 58" rx="8" ry="6" fill="#231f2b" />
    <ellipse cx="57" :cy="grugno ? 58 : 56" rx="2.4" ry="1.4" fill="#ffffff44" />
    <path :d="grugno ? 'M60,66 Q54,74 48,70 M60,66 Q66,74 72,70'
                     : 'M60,64 Q54,72 48,68 M60,64 Q66,72 72,68'"
          stroke="#00000055" stroke-width="2.2" stroke-linecap="round" fill="none" />
    <ellipse v-if="felice" cx="60" :cy="grugno ? 75 : 73" rx="5" ry="7.5" fill="#f08a9b" />
  </g>
</template>
