/* I FONDALI DIPINTI della bancarella: il posto è pronto, le immagini no.
   Quando arrivano si mettono in `src/assets/bancarella/` — `mondo.webp` per il
   giro del mondo, `piazza-<città>.webp` per ogni piazza (bologna, roma,
   parigi, new-york, rio, tokyo, cairo) — e prendono da sole il posto del
   mare, delle terre e del cielo disegnati in codice; le misure e i prompt
   stanno in strumenti/sprite/sorgenti/bancarella/PROMPT-mappa.md. Senza file
   non entra niente nel file unico. I punti delle città (`x, y` in
   `data/bancarella-mondo.js`) e dei banchi (`motore/bancarella/mondo.js`)
   vanno poi riletti sul dipinto: vedi docs/bancarella/mappa.md. */
let trovati = {}
// fuori da Vite import.meta.glob non esiste: in un test Node la lista è vuota
try { trovati = import.meta.glob('../assets/bancarella/*.{webp,png}', { eager: true, query: '?url', import: 'default' }) } catch { trovati = {} }

const per = nome => {
  const k = Object.keys(trovati).find(p => /\/([^/]+)\.(webp|png)$/.exec(p)?.[1] === nome)
  return k ? trovati[k] : null
}

export const fondaleMondo = () => per('mondo')
export const fondalePiazza = id => per('piazza-' + id)
