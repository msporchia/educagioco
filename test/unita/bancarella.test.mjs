/* ═══════════════════════════════════════════════════════════════════
   LA BANCARELLA, SENZA BROWSER

   Le spese sono generate, e la promessa da non rompere è una sola ma
   grossa: **il resto deve essere componibile esattamente** con le
   monete che ci sono nel cassetto in quella giornata. Se non lo fosse,
   il bambino resterebbe lì a provare monete finché il cliente se ne
   va, senza aver sbagliato niente.

   Poi ci sono le promesse del mercato a tappe: il cliente chiede solo
   roba che è sul banco davanti a lui (non c'è più nessun reparto da
   aprire, quindi non può esistere merce invisibile), su un banco ci
   stanno al massimo otto ceste, e ogni banco ne ha abbastanza da
   riempirsi in tutte le giornate.

   E il tempo, che è il punto della campagna: si stringe di tappa in
   tappa dentro la giornata, e di giornata in giornata — ma non
   diventa mai la corsa punitiva di prima.

   `node test/esegui.mjs bancarella --niente-build` */
import { generaCliente, esposizione, tappaDi, campagnaDi,
         merceDi, scaffale, scomponi, euro, chiaveResto, fasciaDi,
         LISTINO, BANCHI, CAMPAGNE, LIBERA, FASCE, TAGLI,
         MAX_CESTE, CLIENTI_PER_TAPPA } from '../../src/data/bancarella.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const GIRI = 400            // clienti per tappa

const guasti = new Set()
const spese = new Set()
const fasceViste = {}
const pezziResto = {}       // giornata -> quante monete ci sono volute, per cliente
let clienti = 0, monetePerResto = 0, conCopie = 0

for (const camp of [...CAMPAGNE, LIBERA]) {
  fasceViste[camp.id] = new Set()
  pezziResto[camp.id] = []
  const quante = camp.libera ? camp.tappe.length * 2 : camp.tappe.length
  for (let n = 0; n < quante; n++) {
    const t = tappaDi(camp, n)
    const esposti = esposizione(t)

    /* --- il banco --- */
    if (esposti.length > MAX_CESTE) guasti.add(`${camp.id}: ${esposti.length} ceste sul banco`)
    if (esposti.length < camp.articoli[1])
      guasti.add(`${camp.id}/${t.banco}: solo ${esposti.length} prodotti per spese da ${camp.articoli[1]}`)
    if (esposti.some(p => p.banco !== t.banco)) guasti.add(`${camp.id}: merce di un altro banco`)
    if (new Set(esposti.map(p => p.emoji)).size !== esposti.length)
      guasti.add(`${camp.id}: cesta doppia sul banco`)

    for (let g = 0; g < GIRI; g++) {
      const c = generaCliente(t, esposti)
      clienti++
      spese.add(c.articoli.map(a => a.emoji).sort().join(''))
      fasceViste[camp.id].add(fasciaDi(c.resto).id)

      /* --- la spesa --- */
      if (c.articoli.reduce((s, a) => s + a.prezzo * a.quanti, 0) !== c.totale)
        guasti.add('totale incoerente')
      if (c.totale <= 0) guasti.add('totale nullo')
      if (new Set(c.articoli.map(a => a.emoji)).size !== c.articoli.length)
        guasti.add('merce doppia nella stessa spesa')
      if (c.articoli.length < camp.articoli[0] || c.articoli.length > camp.articoli[1])
        guasti.add(`${camp.id}: spesa da ${c.articoli.length} articoli`)

      /* --- «due angurie»: le copie dello stesso prodotto --- */
      const pezzi = c.articoli.reduce((s, a) => s + a.quanti, 0)
      if (pezzi !== c.pezzi) guasti.add('conto dei pezzi incoerente')
      if (c.articoli.some(a => a.quanti < 1 || a.quanti > 3))
        guasti.add(`${camp.id}: ${c.articoli.map(a => a.quanti).join('+')} pezzi dello stesso prodotto`)
      if (pezzi > c.articoli.length + (camp.copie || 0))
        guasti.add(`${camp.id}: ${pezzi} pezzi per ${c.articoli.length} articoli`)
      if (pezzi > c.articoli.length) conCopie++
      if (!camp.copie && pezzi !== c.articoli.length)
        guasti.add(`${camp.id}: copie dove non dovrebbero essercene`)

      /* --- IL PUNTO DELLE TAPPE: si chiede solo quello che si vede --- */
      for (const a of c.articoli) {
        if (!esposti.some(p => p.emoji === a.emoji))
          guasti.add(`${camp.id}/${t.banco}: chiede ${a.nome}, che non è sul banco`)
        const voce = LISTINO.find(([e]) => e === a.emoji)
        if (!voce) guasti.add('articolo fuori listino: ' + a.emoji)
        else if (voce[2] !== a.prezzo) guasti.add(`${a.nome} a ${a.prezzo} invece di ${voce[2]}`)
        if (a.prezzo % camp.passo) guasti.add(`${camp.id}: ${a.nome} non è multiplo di ${camp.passo}`)
      }

      /* --- il resto --- */
      if (c.resto !== c.paga - c.totale) guasti.add('resto incoerente')
      if (c.resto <= 0) guasti.add('resto nullo: il cliente pagherebbe esatto')
      if (c.chiave !== chiaveResto(c.resto)) guasti.add('chiave del resto sbagliata')

      /* deve venir fuori esatto con le monete del cassetto, e `minimo` deve
         essere davvero il minimo, non una stima */
      const dp = new Array(c.resto + 1).fill(Infinity); dp[0] = 0
      for (let v = 1; v <= c.resto; v++)
        for (const m of c.monete) if (m <= v) dp[v] = Math.min(dp[v], dp[v - m] + 1)
      if (!Number.isFinite(dp[c.resto]))
        guasti.add(`resto ${euro(c.resto)} non componibile con [${c.monete}]`)
      else if (dp[c.resto] !== c.minimo)
        guasti.add(`${euro(c.resto)}: minimo ${c.minimo} invece di ${dp[c.resto]}`)
      else monetePerResto += c.minimo
      pezziResto[camp.id].push(c.minimo)

      /* --- con cosa paga: roba che si tira fuori dal portafoglio --- */
      if (c.pagaCon.reduce((a, b) => a + b, 0) !== c.paga) guasti.add('pagamento incoerente')
      if (c.pagaCon.length > 3) guasti.add(`paga con ${c.pagaCon.length} pezzi`)

      /* --- il tempo dato a QUESTO cliente --- */
      if (c.pazienza < 40) guasti.add(`${camp.id}: solo ${c.pazienza}s per ${pezzi} pezzi`)
      if (c.pazienza !== t.tempo + 8 * (pezzi - 3))
        guasti.add(`${camp.id}: pazienza scollegata dalla spesa`)
    }
  }
}

controlla('nessuna spesa impossibile', guasti.size === 0, [...guasti].slice(0, 6).join(' · '))
nota(`${clienti} clienti generati · ${spese.size} spese diverse · ` +
     `${(monetePerResto / clienti).toFixed(1)} monete a resto in media`)

/* ── le fasce di apprendimento crescono di giornata in giornata ──
   Nelle prime giornate i prezzi vanno a scatti di 10c e i centesimi non
   compaiono: è giusto così, ed è la ragione per cui il motore le tiene
   separate invece di avere un solo «resto». */
uguale('nella prima giornata non si scende sotto le decine',
       [...fasceViste[CAMPAGNE[0].id]].every(f => ['euro', 'mezzi', 'decine'].includes(f)), true)
const finale = CAMPAGNE.filter(c => !c.mente).pop()   // la cassa rotta è un'altra cosa
controlla('nell\'ultima giornata a prezzi pieni si arriva ai centesimi',
          fasceViste[finale.id].has('centesimi'), [...fasceViste[finale.id]].join(' · '))
const tutte = new Set(Object.values(fasceViste).flatMap(s => [...s]))
uguale('prima o poi si incontrano tutte le fasce', tutte.size, FASCE.length)
nota('fasce per giornata: ' + CAMPAGNE.map(c => `${c.emoji}→${fasceViste[c.id].size}`).join(' · '))

/* ── i banchi: arrivare a una tappa non deve mai deludere ── */
for (const camp of [...CAMPAGNE, LIBERA])
  for (const b of camp.tappe) {
    const quanti = merceDi(camp.passo, b).length
    controlla(`${camp.id}: il banco ${b} è pieno`, quanti >= 6, `solo ${quanti} prodotti`)
  }
const emoji = LISTINO.map(x => x[0])
uguale('nessun prodotto ripetuto nel listino', new Set(emoji).size, emoji.length)
controlla('ogni prodotto sta su un banco che esiste',
          LISTINO.every(([, , , b]) => BANCHI[b]),
          LISTINO.filter(([, , , b]) => !BANCHI[b]).map(x => x[1]).join(', '))
controlla('ogni banco è una tappa di qualche giornata',
          Object.keys(BANCHI).every(b => CAMPAGNE.some(c => c.tappe.includes(b))),
          Object.keys(BANCHI).filter(b => !CAMPAGNE.some(c => c.tappe.includes(b))).join(', '))
nota('prodotti in vendita per passo: ' +
     [10, 5, 1].map(p => `${p}c→${scaffale(p).length}`).join(' · ') + ` su ${LISTINO.length}`)

/* ══ IL TEMPO: la campagna deve stringere, non strozzare ══
   È la ragione per cui la bancarella è diventata una campagna: prima
   c'erano 45 secondi secchi e bastava un cliente sfortunato per perdere. */
const primi = CAMPAGNE.map(c => tappaDi(c, 0).tempo)
const ultimi = CAMPAGNE.map(c => tappaDi(c, c.tappe.length - 1).tempo)
controlla('dentro la giornata il tempo si stringe',
          CAMPAGNE.every((c, i) => ultimi[i] <= primi[i]),
          CAMPAGNE.map((c, i) => `${c.id} ${primi[i]}→${ultimi[i]}s`).join(' · '))
/* la giornata a mente è fuori dalla scala apposta: lì la fatica è il conto,
   e il tempo torna largo — vedi il commento in `CAMPAGNE` */
const aTempo = CAMPAGNE.filter(c => !c.mente).map(c => tappaDi(c, 0).tempo)
controlla('e di giornata in giornata si stringe ancora',
          aTempo.every((p, i) => i === 0 || p <= aTempo[i - 1]), aTempo.join('s → ') + 's')
controlla('la prima giornata è larga: un minuto e mezzo buono', primi[0] >= 90, `${primi[0]}s`)
controlla('e nemmeno l\'ultima scende sotto i cinquanta secondi',
          Math.min(...ultimi) >= 50, `${Math.min(...ultimi)}s`)
controlla('la giornata libera si ferma prima di diventare impossibile',
          tappaDi(LIBERA, 200).tempo >= 45, `${tappaDi(LIBERA, 200).tempo}s`)
/* ══ QUANTE MONETE VUOLE IL RESTO ══
   È la difficoltà vera: 4,90 € da comporre con cinque monete al primo
   livello era il gioco sbagliato. Il cliente sceglie con cosa pagare
   apposta perché il resto venga della misura della giornata. */
const media = a => a.reduce((s, n) => s + n, 0) / a.length
const medie = CAMPAGNE.map(c => media(pezziResto[c.id]))
for (const camp of CAMPAGNE) {
  const [min, max] = camp.pezzi
  const fuori = pezziResto[camp.id].filter(n => n < min || n > max)
  controlla(`${camp.id}: il resto è della misura promessa (${min}-${max} monete)`,
            fuori.length / pezziResto[camp.id].length < 0.02,
            `${fuori.length} resti fuori misura su ${pezziResto[camp.id].length}` +
            (fuori.length ? ` (fino a ${Math.max(...fuori)} monete)` : ''))
}
const aResto = CAMPAGNE.filter(c => !c.mente).map(c => media(pezziResto[c.id]))
controlla('e di giornata in giornata il resto chiede più monete',
          aResto.every((m, i) => i === 0 || m >= aResto[i - 1] - 0.05),
          aResto.map(m => m.toFixed(1)).join(' → '))
controlla('nella prima giornata bastano una o due monete', medie[0] <= 2,
          `${medie[0].toFixed(2)} monete di media`)
nota('monete per resto: ' +
     CAMPAGNE.map((c, i) => `${c.emoji} ${medie[i].toFixed(1)}`).join(' · '))

/* ══ «due angurie, per favore» ══ */
controlla('nella prima giornata si chiede una cosa per volta',
          pezziResto[CAMPAGNE[0].id].length > 0 && CAMPAGNE[0].copie === 0)
controlla('più avanti si chiedono anche due o tre pezzi uguali', conCopie > 0,
          `${conCopie} spese con copie su ${clienti}`)
const scala = CAMPAGNE.filter(c => !c.mente)
controlla('le copie crescono con le giornate',
          scala.every((c, i, v) => i === 0 || c.copie >= v[i - 1].copie),
          scala.map(c => c.copie).join(' → '))
nota('tempo per giornata: ' + CAMPAGNE.map((c, i) => `${c.emoji} ${primi[i]}→${ultimi[i]}s`).join(' · '))

/* ══ L'ULTIMA GIORNATA: la cassa rotta ══
   Il resto lo conta il bambino, quindi il gioco deve dargli aria: tempo largo
   e resto corto. Due conti insieme sarebbero uno di troppo. */
const rotta = CAMPAGNE.find(c => c.mente)
controlla('c\'è una giornata in cui la cassa non calcola', !!rotta,
          'nessuna campagna con `mente`')
uguale('ed è l\'ultima, dopo tutte le altre', CAMPAGNE.indexOf(rotta), CAMPAGNE.length - 1)
controlla('lì il cliente lo sa di essere un conto a mente',
          generaCliente(tappaDi(rotta, 0)).mente === true)
controlla('il tempo torna largo', tappaDi(rotta, 0).tempo >= 90,
          `${tappaDi(rotta, 0).tempo}s`)
/* corto rispetto a dov'era arrivato: alla fiera il resto è da cinque monete,
   qui torna a tre — perché la fatica adesso è il conto */
const restoRotta = media(pezziResto[rotta.id])
const restoFiera = media(pezziResto[finale.id])
controlla('e il resto torna corto', restoRotta <= restoFiera - 1,
          `${restoRotta.toFixed(1)} monete di media contro ${restoFiera.toFixed(1)} alla fiera`)
controlla('le altre giornate la cassa la fanno loro',
          CAMPAGNE.filter(c => !c.mente).every(c => !generaCliente(tappaDi(c, 0)).mente))
controlla('nella giornata libera la cassa funziona', !generaCliente(tappaDi(LIBERA, 0)).mente)

/* ── la forma della campagna ── */
controlla('le giornate sono più di una', CAMPAGNE.length >= 3, `${CAMPAGNE.length} giornate`)
controlla('le giornate si allungano', CAMPAGNE.every((c, i, v) =>
            i === 0 || c.tappe.length >= v[i - 1].tappe.length),
          CAMPAGNE.map(c => c.tappe.length).join(' → ') + ' banchi')
controlla('il cassetto si arricchisce', scala.every((c, i, v) =>
            i === 0 || c.monete.length >= v[i - 1].monete.length),
          scala.map(c => c.monete.length).join(' → ') + ' tagli')
controlla('i prezzi diventano più precisi', scala.every((c, i, v) =>
            i === 0 || c.passo <= v[i - 1].passo),
          scala.map(c => c.passo + 'c').join(' → '))
uguale('fuori dall\'elenco si finisce nella giornata libera', campagnaDi(-1).id, 'libera')
uguale('la giornata libera gira su tutti i banchi',
       LIBERA.tappe.length, Object.keys(BANCHI).length)
uguale('e il suo giro ricomincia da capo', tappaDi(LIBERA, LIBERA.tappe.length).banco, LIBERA.tappe[0])
dentro('tre clienti a banco: una fila che si vede tutta', CLIENTI_PER_TAPPA, 2, 4)
nota('giornate: ' + CAMPAGNE.map(c => `${c.nome} (${c.tappe.length}×${CLIENTI_PER_TAPPA})`).join(' · '))

/* ── i conti di contorno ── */
uguale('un euro si scrive come lo scrive un italiano', euro(150), '1,50 €')
uguale('anche zero virgola cinque', euro(50), '0,50 €')
uguale('col taglio più grande si compone il minimo', scomponi(385, TAGLI).length, 6)
uguale('la scomposizione fa la cifra giusta',
       scomponi(385, TAGLI).reduce((a, b) => a + b, 0), 385)
uguale('gli euro tondi finiscono nella fascia degli euro', chiaveResto(300), 'bancarella:euro')
uguale('due e trentasette finisce nei centesimi', chiaveResto(237), 'bancarella:centesimi')
uguale('due e quaranta finisce nelle decine', chiaveResto(240), 'bancarella:decine')
dentro('le fasce sono cinque, quanto i gradini dei tagli', FASCE.length, 5, 5)

riassunto('la bancarella')
