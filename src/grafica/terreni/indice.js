/* ═══════════════════════════════════════════════════════════════════
   I TERRENI DEL CASTELLO — l'indice

   Tre terreni e quindici tavolozze, una per tappa. Il terreno è
   **come** si dipinge il campo (che posa ha il fondo, com'è fatta la
   via, che cosa ci sta intorno); la tavolozza è **con che colori**. Una
   tappa nomina una tavolozza — `ambiente: 'bosco-guado'` — e da lì si
   risale al suo terreno.

   È la stessa divisione che regge le stanze del Generale
   (`grafica/ambienti/` più `grafica/materiali/`), e da lì questo posto
   prende a prestito quasi tutto: le pose del pavimento, le variazioni,
   i dettagli minuti, il velo di buio bucato dalle torce. Quello che
   **non** si può prendere è la posa a griglia — le stanze del Generale
   sono fatte di caselle piene e vuote, il campo del castello è libero
   e ha una strada che lo attraversa. Perciò qui ci sono tre cose che
   là non esistono: le vie (`vie.js`), la roba disposta *lontano dalla
   strada e dalle piazzole*, e le piazzole stesse.

   ── che cosa espone un terreno ──
     nome
     via                 quale tecnica di `vie.js` usa
     maglia              quanto è grossa la texture del fondo, in unità
     fondo(p, A, scena)      il terreno, sotto tutto
     strada(p, A, scena)     la via
     minuti(p, A, scena)     ciuffi, crepe, ossa: mai sulla strada
     sparso(p, A, scena)     alberi, spuntoni, casse: mai sulle piazzole
     piazzola(p, x, y, A, caso)
     velo(p, A, scena)       buio e luce, l'ultimo passaggio

   `scena` è { caso, vicino, lato, reg, via, postazioni }: `caso` è il
   dado della tappa (stesso seme, stessa scena, sempre), `vicino(x,y)`
   dice quanto si è lontani dalla strada.

   ── come si aggancia al gioco ──
   `campo()` qui sotto ha la stessa firma di quella che oggi sta in
   `grafica/castello.js`, più un `ambiente`. Chi dipinge il fondale è
   `components/castello/CampoDiBattaglia.vue`: basta cambiare da dove
   si importa `campo` (riga 22) e passargli l'ambiente della tappa
   dove chiama `disegnaCampo` (riga 73). Senza `ambiente` si dipinge
   il bosco di mezzogiorno, quindi il primo cambio funziona da solo.
   ═══════════════════════════════════════════════════════════════════ */
import { seminato } from '../tela.js'
import { BOSCO, VARIANTI_BOSCO, TERRENO_BOSCO } from './bosco.js'
import { SOTTERRANEO, VARIANTI_SOTTERRANEO, TERRENO_SOTTERRANEO } from './sotterraneo.js'
import { MURA, VARIANTI_MURA, TERRENO_MURA } from './mura.js'

/* una tavolozza è la base della sua campagna più le tinte che la tappa
   sposta: scriverle per differenza è il motivo per cui una tappa nuova
   costa cinque righe e non cinquanta */
function tavolozze(base, varianti, terreno) {
  const out = {}
  for (const k in varianti) out[k] = { ...base, ...varianti[k], terreno }
  return out
}

export const TERRENI = {
  ...tavolozze(BOSCO, VARIANTI_BOSCO, TERRENO_BOSCO),
  ...tavolozze(SOTTERRANEO, VARIANTI_SOTTERRANEO, TERRENO_SOTTERRANEO),
  ...tavolozze(MURA, VARIANTI_MURA, TERRENO_MURA),
}

export const NOMI_TERRENI = Object.keys(TERRENI)

/* Se una tappa nomina un terreno che non c'è, si dipinge il bosco di
   mezzogiorno invece di lasciare il campo bianco: uno sfondo sbagliato
   si gioca, uno sfondo assente no. */
export const terrenoDi = nome => TERRENI[nome] || TERRENI['bosco-chiaro']

/* Il fondale intero. Torna la funzione che `tela.dipingiFondale` vuole:
   il gioco dice *dov'è* la strada e *dove* sono le piazzole, non come
   si dipingono. */
export function campo({ via, postazioni, seme = 1, ambiente }) {
  const A = terrenoDi(ambiente)
  const T = A.terreno
  return p => {
    const { W, H, S } = p
    const caso = seminato(seme * 7919 + 13)
    /* la maglia delle texture. La sceglie il terreno: le lastre del
       castello vogliono essere piccole — grandi come quelle di una
       stanza del Generale, su un campo di 390 px, il pavimento leggeva
       come un **muro di mattoni visto di fronte** invece che come un
       selciato guardato dall'alto. */
    const lato = (T.maglia || 26) * S
    const reg = { x0: 0, y0: 0, x1: W, y1: H }

    /* la distanza dalla strada, campionata una volta sola: la chiedono
       i dettagli minuti (per non fiorire in mezzo al passaggio) e la
       roba sparsa (per non piantare un albero sulla via) */
    const lungoStrada = via.campiona(8)
    const vicino = (x, y) => {
      let m = Infinity
      for (const c of lungoStrada) {
        const d = (c.x - x) ** 2 + (c.y - y) ** 2
        if (d < m) m = d
      }
      return Math.sqrt(m)
    }

    const scena = { caso, vicino, lato, reg, via, postazioni }
    T.fondo(p, A, scena)
    T.strada(p, A, scena)
    T.minuti(p, A, scena)
    T.sparso(p, A, scena)
    for (const q of postazioni) T.piazzola(p, q.x, q.y, A, caso)
    T.velo(p, A, scena)
  }
}
