/* ═══════════════════════════════════════════════════════════════════
   A COSA SERVE UNA ROBA DEL GRANAIO — TUTTE LE USCITE, IN UN POSTO

   `serveA` di `dati/bisogni.js` elenca le tre uscite che stanno in
   quel file: le ricette che la prendono, la ciotola, le coccole. Da
   quando esiste l'albero a più fasi ce ne sono altre due, e stanno in
   tabelle che `bisogni.js` **non può importare**:

     · un **addobbo** pagato col granaio (`da:` in `dati/addobbi.js`,
       il maglione) — e `addobbi.js` importa `animali.js`, che importa
       `bisogni.js`: un anello;
     · un **ordine** del mercato (`vuole` in `dati/mercato.js`) — e
       `mercato.js` importa `livelli.js`, che importa `animali.js`.

   Quindi il conto intero sta qui, un gradino sopra tutte e tre, e chi
   vuole sapere *tutto* quello che si può fare con una merce chiede a
   questo file. Non è solo ordine: la stoffa non si mangia e non si
   mette addosso — la vuole la sarta — e senza gli ordini risultava
   «non serve a niente», cioè roba che riempie uno scomparto per
   sempre. Un ordine consuma la merce quanto una ciotola.

   Torna righe di dato e **non frasi**, come `serveA`: la frase la
   compone chi mostra (`viste/Granaio.vue`).
   ═══════════════════════════════════════════════════════════════════ */
import { PRODOTTI } from './coltivazioni.js'
import { serveA as ciotolaEMacchine } from './bisogni.js'
import { ADDOBBI } from './addobbi.js'
import { CLIENTI } from './mercato.js'

export function serveA(prodotto) {
  const usi = ciotolaEMacchine(prodotto)
  for (const a of ADDOBBI)
    if (a.da === prodotto)
      usi.push({ che: 'addobbo', emoji: a.emoji, nome: a.nome, dove: a.dove })
  /* Un mestiere per riga, e solo chi la chiede **per mestiere**: la
     nonna e il bottegaio prendono tutto, e «serve alla nonna» detto di
     ogni merce non direbbe niente di questa. */
  for (const c of CLIENTI)
    if ((c.vuole || []).includes(prodotto))
      usi.push({ che: 'ordine', emoji: c.emoji, nome: c.nome })
  return usi
}

export function guastiDegliUsi() {
  const g = []
  /* Una roba che non serve a niente si accumula in uno scomparto che
     ha otto posti: dopo un po' è pieno di roba inutile e non entra più
     niente, e non c'è niente a schermo che lo dica. Stava in
     `guastiDeiBisogni`, e lì vedeva solo tre uscite su cinque. */
  for (const id of Object.keys(PRODOTTI))
    if (!serveA(id).length) g.push(`${id}: non serve a niente, e occuperebbe un posto per sempre`)
  for (const id of Object.keys(PRODOTTI))
    for (const u of serveA(id))
      if (!u.nome || !u.emoji) g.push(`${id} → ${u.che}: un uso senza nome o senza faccia`)
  return g
}
