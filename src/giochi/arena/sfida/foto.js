// La fotografia della partita, per rimettere la copia dell'ospite dove sta quella dell'host quando le due si separano
// (docs/arena/multigiocatore.md, «Quando le copie si separano»). Tutto quello che cambia mentre si gioca, caso compreso;
// le regole (durata, truppe ammesse, ritmo delle monete) le ha già ogni copia dalla proposta. Le unità sono tante e si
// scrivono in righe di numeri; la fotografia viaggia a pezzi da sola (src/insieme/rete.js).

// l'ordine dei campi di un'unità (`Partita.schiera`): un test controlla che non ne manchi nessuno
export const CAMPI_UNITA = ['id', 'lato', 'x', 'y', 'hp', 'max', 'forza', 'cool', 'fl', 'colpo', 'cammina', 'nasce', 'vola', 'dirY', 'r', 'raduno']

export const fotoDi = p => ({
  t: p.t, fine: p.fine, pensa: p.pensa, caso: p.rnd.stato(), ia: p.ia, lati: p.lati, forza: p.forza,
  castelli: p.castelli, muri: p.muri, caserme: p.caserme, miniere: p.miniere,
  unita: p.unita.map(u => CAMPI_UNITA.map(c => u[c])),
})

/* rimette la partita com'era nella fotografia. Lancia se non è una fotografia. La si copia: chi l'ha mandata (in memoria, nelle
   prove) non deve vedersi cambiare la sua. */
export function applicaFoto(p, foto) {
  const f = JSON.parse(JSON.stringify(foto))
  if (!f || !Array.isArray(f.unita) || f.unita.length > 800 || !Number.isFinite(f.t) || !Number.isInteger(f.caso)) throw new Error('foto')
  p.t = f.t; p.fine = f.fine; p.pensa = f.pensa; p.ia = f.ia; p.lati = f.lati; p.forza = f.forza
  p.castelli = f.castelli; p.muri = f.muri; p.caserme = f.caserme; p.miniere = f.miniere
  p.unita = f.unita.map(riga => Object.fromEntries(CAMPI_UNITA.map((c, i) => [c, riga[i]])))
  p.rnd.imposta(f.caso)
  p.eventi = []
}
