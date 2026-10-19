// La fotografia della partita, per rimettere la copia dell'ospite dove sta quella dell'host quando le due si separano
// (docs/arena/multigiocatore.md, «Quando le copie si separano»). Tutto quello che cambia mentre si gioca, caso compreso;
// le regole (durata, truppe ammesse, ritmo delle monete) le ha già ogni copia dalla proposta. Le unità sono tante e si
// scrivono in righe di numeri: è il pezzo più grosso, e passa a pezzetti da 512 byte.

// l'ordine dei campi di un'unità (`Partita.schiera`): un test controlla che non ne manchi nessuno
export const CAMPI_UNITA = ['id', 'lato', 'x', 'y', 'hp', 'max', 'forza', 'cool', 'fl', 'colpo', 'cammina', 'nasce', 'vola', 'dirY', 'r', 'raduno']
const PEZZO = 300         // caratteri per messaggio: il servizio ne accetta 512 in tutto, e le virgolette raddoppiano
const MAX_BYTE = 480

export const fotoDi = (p, k) => JSON.stringify({
  k, t: p.t, fine: p.fine, pensa: p.pensa, caso: p.rnd.stato(), ia: p.ia, lati: p.lati, forza: p.forza,
  castelli: p.castelli, muri: p.muri, caserme: p.caserme, miniere: p.miniere,
  unita: p.unita.map(u => CAMPI_UNITA.map(c => u[c])),
})

/* la fotografia in messaggi `{ t: 's', id, i, n, d }`, ciascuno sotto il limite del servizio */
export function aPezzi(testo, id) {
  const parti = []
  for (let da = 0; da < testo.length;) {
    let len = Math.min(PEZZO, testo.length - da)
    while (len > 20 && JSON.stringify({ t: 's', id, i: 99999, n: 99999, d: testo.slice(da, da + len) }).length > MAX_BYTE) len = Math.floor(len * 0.9)
    parti.push(testo.slice(da, da + len))
    da += len
  }
  return parti.map((d, i) => ({ t: 's', id, i, n: parti.length, d }))
}

/* rimette la partita com'era nella fotografia; torna il tick. Lancia se il testo non è una fotografia. */
export function applicaFoto(p, testo) {
  const f = JSON.parse(testo)
  if (!Number.isInteger(f.k) || !Array.isArray(f.unita) || f.unita.length > 800 || !Number.isFinite(f.t) || !Number.isInteger(f.caso)) throw new Error('foto')
  p.t = f.t; p.fine = f.fine; p.pensa = f.pensa; p.ia = f.ia; p.lati = f.lati; p.forza = f.forza
  p.castelli = f.castelli; p.muri = f.muri; p.caserme = f.caserme; p.miniere = f.miniere
  p.unita = f.unita.map(riga => Object.fromEntries(CAMPI_UNITA.map((c, i) => [c, riga[i]])))
  p.rnd.imposta(f.caso)
  p.eventi = []
  return f.k
}
