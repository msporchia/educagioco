/* ═══════════════════════════════════════════════════════════════════
   COME STA ANDANDO — le righe della terza scheda, e come si ordinano

   Il conto c'è da sempre e non lo leggeva nessuno. Ogni risposta finisce
   in `store/srs.js` sotto la chiave della **tipologia** (`orto:doppie`)
   e lascia lì cinque numeri: quante volte l'ha vista, quante bene,
   quante male, quanto ci mette ultimamente, quand'è stata l'ultima
   volta. Qui si mettono insieme a quello che il catalogo sa dire di
   quella tipologia — come si chiama, di che pezzo di scuola è, a che età
   servirebbe — e ne esce una riga da guardare.

   PURO, e per il solito motivo: le soglie e l'ordine sono la parte che
   si sbaglia, e una regola che si prova solo col telefono in mano non la
   prova nessuno. Qui non si importa né il profilo né il registro dei
   moduli: entrano le righe del catalogo e la mappa degli item, esce
   l'elenco. Il test è `test/unita/andamento`.

   ── L'UNITÀ È LA TIPOLOGIA, NON LA CLASSE ─────────────────────────
   Nel catalogo «le ore intere» compare due volte, al grado 1 e al grado
   4: sono due classi diverse e va bene così, lì si guarda cosa esiste.
   Ma il conto delle risposte è **uno solo**, perché sta sotto la chiave
   della tipologia — elencando le classi, lo stesso identico «7 su 10»
   comparirebbe due volte come se fossero due problemi. Era già successo
   nella prima versione di «Come va», che infatti le accorpava.

   ── I CUORI, E PERCHÉ SBIADISCONO ─────────────────────────────────
   Cinque cuori sulla percentuale di giuste. Ma **una su tre non è il
   33%**: è un bambino che ha visto quella cosa tre volte, e su tre
   risposte il caso conta più della bravura. `consiglio.js` non apre
   bocca sotto le otto risposte apposta, e questa scheda non può dire
   qualcosa di più forte da dati più deboli — quindi sotto quella soglia
   i cuori si mostrano **sbiaditi**, con accanto quante prove ci sono.
   Il segnale c'è, il verdetto no.

   ── L'ORDINE È IL CONTENUTO ───────────────────────────────────────
   Prima quelle che vanno male, in fondo quelle che vanno bene: è la
   domanda che si fa chi apre questa scheda, e un elenco alfabetico gli
   chiederebbe di leggerlo tutto per trovare le tre righe che contano.
   Le mai incontrate stanno in coda, tutte insieme: non hanno un voto e
   non ne possono avere uno, ma si tengono perché è da lì che si spegne
   in anticipo una cosa che a scuola non hanno ancora fatto.
   ═══════════════════════════════════════════════════════════════════ */

import { MINIME } from './consiglio.js'

/* ── i cuori ──
   Da 1 a 5, mai zero: uno zero accanto a un nome si legge come «questo
   bambino non vale niente», e non è quello che dice il numero — dice
   che quella cosa lì non gli è ancora entrata. Il pavimento a 1 è la
   stessa gentilezza che si usa dappertutto nel gioco, e non costa
   informazione: chi ha un cuore solo sta al fondo dell'elenco comunque. */
export const CUORI = 5
export const cuoriPer = quota =>
  Math.max(1, Math.min(CUORI, Math.round(quota * CUORI)))

/* ── una riga ──
   `classi` sono tutte le righe del catalogo che hanno questa tipologia
   (una o più, un grado ciascuna); `it` è quello che il profilo si
   ricorda. Un item che non c'è vuol dire «mai vista», che è diverso da
   «vista e sbagliata sempre» — e le due cose non devono finire vicine. */
export function rigaDi(tipo, classi, it, { minime = MINIME } = {}) {
  const prima = classi[0] || {}
  const ok = it?.ok || 0
  const err = it?.err || 0
  const quante = ok + err
  /* `seen` conta le volte che è stata **mostrata**, `ok + err` quelle a
     cui è arrivata una risposta: sono lo stesso numero salvo che per una
     domanda mostrata e abbandonata a metà. Si mostra il secondo, perché
     è quello di cui si può dire com'è andato. */
  return {
    tipo,
    nome: prima.nome || tipo,
    icona: prima.icona || '',
    gruppo: prima.gruppo || null,
    gruppoNome: prima.gruppoNome || '',
    modulo: prima.nomeModulo || '',
    /* l'età a cui serve: se la tipologia esce a più gradi è un
       intervallo, e dirlo con due numeri è l'unico modo onesto — uno
       solo sarebbe una media che non corrisponde a nessuna domanda */
    da: classi.length ? Math.min(...classi.map(c => c.anni)) : 0,
    a: classi.length ? Math.max(...classi.map(c => c.anni)) : 0,
    ritocco: prima.ritocco || 0,
    spenta: !!prima.spenta,
    /* per il ▶: la prima classe basta a rigenerare una domanda vera */
    sorgente: prima.sorgente || null,
    classi,

    quante, ok, err,
    quota: quante ? ok / quante : 0,
    cuori: quante ? cuoriPer(ok / quante) : 0,
    /* il verdetto è debole finché le prove sono poche: chi disegna
       sbiadisce i cuori e scrive «3 prove» invece della percentuale */
    poche: quante > 0 && quante < minime,
    mai: quante === 0,
    /* Il tempo NON è la media di sempre: `store/srs.js` lo tiene come
       media mobile (55% storia, 45% ultima risposta), cioè dice **quanto
       ci mette ultimamente**. Chiamarlo «tempo medio» a schermo sarebbe
       una piccola bugia che nessuno potrebbe smentire. */
    secondi: it?.t ? Math.round(it.t / 100) / 10 : 0,
    ultima: it?.last || 0,
  }
}

/* ── l'elenco intero, in ordine ──
   `righe` sono le classi del catalogo (`fasceDelBambino().righe`
   concatenate, o `classiNude()`); `items` è `state.profile.items`.

   L'ordine, in una riga: **peggio prima**. A parità di quota vince chi
   ha più prove alle spalle — fra un 50% su venti risposte e un 50% su
   otto, quello su cui c'è più da dire è il primo. Le mai incontrate in
   coda, dalla più facile alla più difficile, perché lì l'ordine utile
   non è più «come va» ma «quando arriverà». */
export function andamentoDi(righe = [], items = {}, { minime = MINIME } = {}) {
  const per = new Map()
  for (const c of righe) {
    /* una classe senza tipologia non ha un conto suo: sono i moduli
       vecchi, che le tipologie non le dichiarano. Si tacciono invece di
       mostrarle senza voto in mezzo alle altre — la loro riga esiste già
       nel quadro dell'età, che è dove si guarda cosa esiste. */
    if (!c.tipo) continue
    if (!per.has(c.tipo)) per.set(c.tipo, [])
    per.get(c.tipo).push(c)
  }
  const fuori = []
  for (const [tipo, classi] of per) fuori.push(rigaDi(tipo, classi, items[tipo], { minime }))

  const viste = fuori.filter(r => !r.mai)
    .sort((a, b) => a.quota - b.quota || b.quante - a.quante || a.nome.localeCompare(b.nome))
  const mai = fuori.filter(r => r.mai)
    .sort((a, b) => a.da - b.da || a.nome.localeCompare(b.nome))
  return { viste, mai, tutte: viste.concat(mai) }
}

/* ── il riassunto in cima ──
   Tre numeri e non venti: quante ne ha incontrate, quante gli vanno
   male, e quante risposte ha dato in tutto. Serve a dare la misura di
   quanto pesa il resto della pagina — «ne ha sbagliate 7 su 10» detto
   dopo dodici risposte in tutta la vita è un'altra cosa che detto dopo
   duemila. */
export function riassuntoDi(elenco, { minime = MINIME } = {}) {
  const viste = elenco.viste || []
  const risposte = viste.reduce((n, r) => n + r.quante, 0)
  const male = viste.filter(r => !r.poche && r.quota <= 0.5).length
  const bene = viste.filter(r => !r.poche && r.quota >= 0.9).length
  return { incontrate: viste.length, mai: (elenco.mai || []).length, risposte, male, bene, minime }
}
