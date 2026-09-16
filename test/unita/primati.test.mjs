/* ═══════════════════════════════════════════════════════════════════
   I PRIMATI — il quaderno dei giochi che non finiscono

   Quello che si prova qui è la parte che decide **cosa si dice a un
   bambino alla fine di una partita che non si può vincere**: è record?
   di quanto? e la prima volta in assoluto, che non batte niente?

   I tre guasti che questo test esiste per fermare:

     1. «Nuovo record! (0 m meglio di prima)» alla prima partita, cioè
        una frase che si smonta da sola — quale record?
     2. un pareggio contato come record: chi rifà esattamente lo stesso
        numero non ha migliorato niente, e i coriandoli a ogni partita
        uguale non sono più una notizia
     3. il record del mese scorso buttato via. La corsa e Survivors lo
        tenevano in `cfg.primato`: se `apriQuaderno` non leggesse più
        quel posto, gli unici a ripartire da zero sarebbero i due
        bambini che avevano giocato di più, e a schermo non si vedrebbe
        nessun errore — solo un primato sparito.

   `node test/esegui.mjs primati --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { VUOTO, ULTIME, MISURE, apriQuaderno, conRisultato, inParole,
         scartoInParole, fraseDiFine, primatoInParole, guastiDelleSfide,
         dettagliInParole, recordInParole }
  from '../../src/giochi/primati.js'
/* tutti i giochi, non solo i nuovi: la partita libera del castello
   dichiara la sua sfida nella riga di `data/giochi.js` */
import { GIOCHI } from '../../src/data/giochi.js'
import { primatoDi, segnaPrimato, tabellaDeiPrimati } from '../../src/giochi/campagne.js'
import { state, init, creaGiocatore } from '../../src/store/profile.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. come si scrive un risultato ══════════ */
uguale('i metri si scrivono con l\'unità', inParole(312, 'metri'), '312 m')
uguale('il tempo in minuti e secondi', inParole(125, 'tempo'), '2:05')
uguale('anche sotto il minuto', inParole(9, 'tempo'), '0:09')
uguale('e un conto è un numero e basta', inParole(7, 'quanti'), '7')
/* uno scarto di tempo NON si scrive come un orario: «0:32» sembra un
   momento della partita, «32s» sembra quello che è */
uguale('uno scarto di tempo è in secondi', scartoInParole(32, 'tempo'), '32s')
uguale('uno scarto di metri è in metri', scartoInParole(32, 'metri'), '32 m')
/* i motori danno metri e secondi con la virgola: «311.9999 m» non è un
   record, è un arrotondamento che si legge a schermo */
uguale('i decimali si tagliano', inParole(311.9999, 'metri'), '311 m')
uguale('un valore storto vale zero', inParole(NaN, 'metri'), '0 m')
uguale('e un negativo pure', inParole(-8, 'metri'), '0 m')
uguale('una misura sconosciuta non pianta niente', inParole(7, 'boh'), '7')

/* ══════════ 2. il quaderno si crea leggendo ══════════ */
{
  const nuovo = apriQuaderno({})
  stessaLista('un gioco mai giocato ha un quaderno vuoto',
              [nuovo.best, nuovo.partite, nuovo.ultime.length], [0, 0, 0])
  uguale('e la riga corta non dice niente', primatoInParole(nuovo, 'metri'), '')

  /* IL POSTO VECCHIO: `cfg.primato`, un numero e basta */
  const vecchio = apriQuaderno({ cfg: { primato: 900 } })
  uguale('il record di ieri si ritrova', vecchio.best, 900)
  uguale('e si scrive come gli altri', primatoInParole(vecchio, 'metri'), '900 m')

  const q = apriQuaderno({ primato: { best: 312, quando: 5, partite: 4, ultime: [{ v: 10, t: 1 }] },
                           cfg: { primato: 900 } })
  uguale('quando c\'è il posto nuovo, il vecchio non conta più', q.best, 312)

  const rotto = apriQuaderno({ primato: { best: 'x', ultime: 'niente' } })
  stessaLista('un quaderno rovinato si rimette in piedi invece di piantare',
              [rotto.best, rotto.partite, rotto.ultime.length], [0, 0, 0])
}

/* ══════════ 3. una partita finita ══════════ */
{
  /* ── la prima in assoluto ── */
  const uno = conRisultato(VUOTO(), 120, 1000)
  controlla('la prima partita non batte nessun record', uno.esito.primo === true)
  controlla('ma un record lo fa nascere', uno.esito.record === true)
  uguale('e non c\'è nessun «prima»', uno.esito.prima, 0)
  uguale('la frase non parla di record battuti',
         fraseDiFine(uno.esito, 'metri'), 'Il tuo primo risultato: 120 m')
  uguale('il quaderno tiene il numero', uno.quaderno.best, 120)
  uguale('e conta la partita', uno.quaderno.partite, 1)

  /* ── una migliore ── */
  const due = conRisultato(uno.quaderno, 312, 2000)
  controlla('la seconda non è più «la prima»', due.esito.primo === false)
  controlla('è un record', due.esito.record === true)
  uguale('e si sa di quanto', due.esito.meglio, 192)
  uguale('la frase porta i due numeri', fraseDiFine(due.esito, 'metri'),
         'Nuovo record! 312 m (192 m meglio di prima)')
  uguale('il quaderno segna quando', due.quaderno.quando, 2000)

  /* ── una peggiore: il record resta, e si dice quanto è mancato ── */
  const tre = conRisultato(due.quaderno, 280, 3000)
  controlla('non è un record', tre.esito.record === false)
  uguale('il record resta quello di prima', tre.quaderno.best, 312)
  uguale('e la data del record non si muove', tre.quaderno.quando, 2000)
  uguale('mancavano 32 metri', tre.esito.mancano, 32)
  uguale('e lo dice', fraseDiFine(tre.esito, 'metri'),
         'Il tuo record è 312 m · ti sono mancati 32 m')
  uguale('la partita si conta lo stesso', tre.quaderno.partite, 3)

  /* ── il pareggio NON è un record ── */
  const pari = conRisultato(due.quaderno, 312, 4000)
  controlla('rifare lo stesso numero non è migliorare', pari.esito.record === false)
  uguale('e la frase lo dice senza rimproverare',
         fraseDiFine(pari.esito, 'tempo'), 'Il tuo record resta 5:12')

  /* ── le ultime partite: la più recente in testa, e non crescono ── */
  let q = VUOTO()
  for (let i = 1; i <= ULTIME + 4; i++) q = conRisultato(q, i * 10, i).quaderno
  uguale(`si tengono ${ULTIME} risultati`, q.ultime.length, ULTIME)
  uguale('la più recente sta in testa', q.ultime[0].v, (ULTIME + 4) * 10)
  uguale('la più vecchia delle tenute è quella giusta', q.ultime.at(-1).v, 5 * 10)
  uguale('le partite si contano tutte', q.partite, ULTIME + 4)
}

/* il record di chi arriva dal posto vecchio non è «la prima partita»:
   c'è già un numero da battere, e dirgli «il tuo primo risultato» dopo
   un mese di corse sarebbe la stessa bugia al contrario */
{
  const q = apriQuaderno({ cfg: { primato: 900 } })
  const e = conRisultato(q, 400, 1).esito
  controlla('chi ha un record vecchio non è alla prima partita', e.primo === false)
  uguale('e sa quanto gli è mancato', e.mancano, 500)
}

/* ══════════ 4. quello che i giochi dichiarano ══════════ */
{
  const guasti = guastiDelleSfide(GIOCHI)
  controlla('nessuna sfida senza fine è dichiarata male', guasti.length === 0, guasti.join(' · '))

  const sfide = GIOCHI.filter(g => g.senzaFine)
  controlla('almeno due giochi hanno una modalità senza fine', sfide.length >= 2,
            `ne ho trovate ${sfide.length}`)
  controlla('e fra loro c\'è anche la partita libera del castello, che è un gioco vecchio',
            sfide.some(g => g.chiave === 'torri'))
  nota('sfide senza fine:', sfide.map(g => `${g.chiave} (${g.senzaFine.misura})`).join(' · '))

  /* la misura è una chiave di `MISURE` e non un'unità scritta a mano:
     se fosse libera, «sec» e «secondi» farebbero due tabelle */
  controlla('ogni misura dichiarata esiste davvero',
            sfide.every(g => MISURE[g.senzaFine.misura]))

  const storta = guastiDelleSfide([{ chiave: 'finto', senzaFine: { nome: '', misura: 'secondi' } }])
  controlla('una dichiarazione sbagliata diventa rossa', storta.length >= 3, storta.join(' · '))
  const dettagliStorti = guastiDelleSfide([{ chiave: 'finto',
    senzaFine: { nome: 'x', icona: 'x', che: 'x', misura: 'metri', dettagli: '580 mostri' } }])
  controlla('i dettagli scritti a mano invece che come funzione sono un guasto',
            dettagliStorti.length === 1, dettagliStorti.join(' · '))
}

/* ══════════ 4b. com'era la partita del record ══════════
   «2:05» è il numero; «580 mostri · livello 6» è il racconto, e sta sul
   tasto prima di entrare. I dettagli sono della partita del record: una
   partita storta non li sovrascrive. */
{
  const sfida = { misura: 'tempo', dettagli: d => [`${d.uccisi} mostri`, `livello ${d.livello}`] }
  const primo = conRisultato(VUOTO(), 125, 1, { uccisi: 580, livello: 6 })
  uguale('il record porta con sé com\'era fatta la partita',
         primo.quaderno.dettagli.uccisi, 580)
  uguale('e si legge in parole', recordInParole(primo.quaderno, sfida), '2:05 · 580 mostri · livello 6')
  const storta = conRisultato(primo.quaderno, 60, 2, { uccisi: 12, livello: 1 })
  uguale('una partita che non batte il record non tocca il racconto',
         storta.quaderno.dettagli.uccisi, 580)
  uguale('l\'esito però dice com\'era questa', storta.esito.dettagli.uccisi, 12)
  const migliore = conRisultato(storta.quaderno, 200, 3, { uccisi: 900, livello: 8 })
  uguale('e il record nuovo si porta il racconto nuovo', migliore.quaderno.dettagli.livello, 8)
  uguale('un record senza racconto resta il numero e basta',
         recordInParole(conRisultato(VUOTO(), 312, 1).quaderno, { misura: 'metri' }), '312 m')
  uguale('un gioco che non dichiara i dettagli non li scrive',
         dettagliInParole(primo.quaderno, { misura: 'tempo' }), '')
  const riletto = apriQuaderno({ primato: { ...primo.quaderno } })
  uguale('e i dettagli sopravvivono alla rilettura dal profilo', riletto.dettagli.livello, 6)
}

/* ══════════ 5. il pezzo che tocca il profilo ══════════
   Fuori dal browser l'archivio degrada da solo in memoria, quindi il
   giro vero si può fare qui: finire una partita, salvare, rileggere.
   È la parte che a rompersi non dà nessun errore — dà un record che al
   riavvio non c'è più. */
{
  await init()
  await creaGiocatore('Prova')

  const uno = segnaPrimato('corsa', 312.7, 1000)
  controlla('la prima corsa infinita nasce un record', uno.record && uno.primo)
  uguale('il record finisce accanto alle stelle',
         state.profile.campagne.corsa.primato.best, 312)
  uguale('e si rilegge da lì', primatoDi('corsa').best, 312)

  const due = segnaPrimato('corsa', 280, 2000)
  controlla('una corsa più corta non è un record', !due.record)
  uguale('e il record non si muove', primatoDi('corsa').best, 312)
  uguale('le partite si contano', primatoDi('corsa').partite, 2)

  /* il posto vecchio si abbandona alla prima scrittura: due numeri che
     dicono la stessa cosa divergono al primo giro */
  state.profile.campagne.survivors = { tappa: 9, libera: true, stelle: {}, cfg: { primato: 90 } }
  const sv = segnaPrimato('survivors', 125, 3000)
  controlla('il record vecchio di Survivors è stato battuto', sv.record === true)
  uguale('e si sa di quanti secondi', sv.meglio, 35)
  uguale('il posto vecchio si svuota',
         state.profile.campagne.survivors.cfg.primato, undefined)

  /* ── la tabella dell'albo ── */
  const righe = tabellaDeiPrimati()
  uguale('due sfide giocate, due righe', righe.length, 2)
  const corsa = righe.find(r => r.chiave === 'corsa')
  uguale('il record è già scritto in parole', corsa.parole, '312 m')
  uguale('e le ultime partite vanno dalla più vecchia alla più nuova',
         corsa.ultime.map(u => u.v).join(','), '312,280')
  uguale('il tempo si scrive come tempo',
         righe.find(r => r.chiave === 'survivors').parole, '2:05')

  /* un gioco senza fine a cui non si è mai giocato non fa riga: una
     tabella di record a zero è un elenco di cose che non hai fatto */
  delete state.profile.campagne.corsa
  uguale('resta solo quello giocato', tabellaDeiPrimati().length, 1)

  /* il castello è un gioco vecchio, senza manifesto: la sua partita
     libera passa dalla stessa strada, e la sua riga porta il racconto */
  const td = segnaPrimato('torri', 12, 4000, { uccisi: 580, torri: 9 })
  controlla('la prima partita libera del castello nasce un record', td.record && td.primo)
  const rigaTd = tabellaDeiPrimati().find(r => r.chiave === 'torri')
  uguale('le ondate si scrivono come ondate', rigaTd.parole, '12 ondate')
  uguale('e accanto c\'è com\'era fatta quella partita', rigaTd.dettagli, '580 nemici fermati · 9 torri')
}

riassunto('I primati')
