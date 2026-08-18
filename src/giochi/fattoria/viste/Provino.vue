<script setup>
/* Un pezzo dell'atlante su un canvas suo, per le carte e i tastini.
   Sta a parte perché lo usano in quattro, e perché è l'unico punto in
   cui una vista tocca l'atlante: se domani i pezzi si disegnassero in un
   altro modo, si cambia qui e non in quattro template.

   ── IL RIQUADRO È SEMPRE QUELLO, E IL PEZZO CI STA DENTRO ─────────
   *Ribalta la versione di prima*, che dava al canvas la misura del pezzo
   ingrandito di un intero. Andava bene finché il catalogo era fatto di
   tessere da 16 px; con l'atlante di adesso il pezzo più largo è una
   casa da 80 px e il più piccolo un fiorellino da 9, e succedevano due
   cose brutte in una volta:

     · **le cose grosse sbordavano dalla carta.** Lo zoom minimo è 1, e
       un canvas da 80 px dentro una carta da 76 esce dai bordi: la casa
       copriva il prezzo e la carta accanto.
     · **le cose stavano a misure diverse a caso.** Il fiorellino veniva
       ingrandito tre volte e la panchina no, quindi in uno scaffale di
       provini il fiore sembrava grande come la panchina — che è
       esattamente l'informazione che uno scaffale deve dare giusta.

   Adesso il riquadro è **sempre `lato × lato`** e il pezzo ci sta dentro
   in scala, ingrandito di un intero quando è piccolo (la pixel art
   ingrandita a metà pixel si sfrangia) e rimpicciolito quanto serve
   quando è grosso. Le proporzioni fra i pezzi si vedono: una casa è
   grande, un fiorellino è piccolo, e si capisce prima di leggere.

   ── E STA IN PIEDI SUL FONDO ──────────────────────────────────────
   Bottom-aligned, non centrato: è la stessa regola con cui la scena
   posa uno sprite sul suo piede (`scena/tela.js`), e in uno scaffale
   vuol dire che tutte le cose poggiano sulla stessa riga invece di
   galleggiare ognuna alla propria altezza.

   `imageSmoothingEnabled = false` non è un dettaglio: senza, il canvas
   sfoca la pixel art e in una carta piccola si vede tutto. Il `dpr` non
   lo è nemmeno: su un telefono un canvas disegnato a 1× e steso a 3× è
   sfocato uguale, e questi provini si guardano solo dal telefono. */
import { onMounted, ref, watch } from 'vue'
import { ATLANTE, PEZZI } from '../dati/atlante.js'

const props = defineProps({
  pezzo: { type: String, required: true },
  lato: { type: Number, default: 42 },
  /* quanto lasciare libero attorno, in pixel del riquadro: serve a non
     far toccare i bordi della carta alle cose larghe */
  aria: { type: Number, default: 2 },
})

const tela = ref(null)
let immagine = null

function disegna() {
  const c = tela.value, p = PEZZI[props.pezzo]
  if (!c || !immagine || !immagine.complete) return
  const dpr = Math.min(3, Math.max(1, Math.round(globalThis.devicePixelRatio || 1)))
  c.width = c.height = props.lato * dpr
  const g = c.getContext('2d')
  g.imageSmoothingEnabled = false
  g.clearRect(0, 0, c.width, c.height)
  if (!p) return

  const dentro = Math.max(1, props.lato - props.aria * 2)
  let z = Math.min(dentro / p[2], dentro / p[3])
  /* ingrandire si ingrandisce solo di un intero; rimpicciolire no —
     mezzo pixel in meno non si vede, mezzo pixel in più sì */
  if (z > 1) z = Math.floor(z)
  const w = Math.round(p[2] * z * dpr), h = Math.round(p[3] * z * dpr)
  g.drawImage(immagine, p[0], p[1], p[2], p[3],
    Math.round((c.width - w) / 2), Math.round(c.height - props.aria * dpr - h), w, h)
}

onMounted(() => {
  immagine = new Image()
  immagine.onload = disegna
  immagine.src = ATLANTE
  disegna()
})
watch(() => [props.pezzo, props.lato], disegna)
</script>

<template>
  <canvas ref="tela" class="fa-provino"
          :style="{ width: lato + 'px', height: lato + 'px' }"></canvas>
</template>
