/* IL QUADERNO DELLA MAESTRA — classi, lezioni, storico e il file, senza browser

   Gli alunni tengono il loro id quando si riscrive la lista, una lezione viaggia nel link e torna uguale (e un link
   manomesso non entra), lo storico è un riassunto per blocco che un rientro non conta due volte, il file storto non rompe
   niente e l'unione è per id; le lezioni e lo storico di prima (obiettivo e «se hai finito») si leggono a blocchi.
   Vedi docs/scuola/quaderno.md.
   `node test/esegui.mjs scuola-quaderno --niente-build` */
import * as Q from '../../src/scuola/maestra/quaderno.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const ES = { tipo: 'tabelline', tabelline: [9], modo: 'prodotto' }
const OROLOGIO = { tipo: 'modulo', modulo: 'orologio', da: 1, a: 3, tipologie: [] }
const copia = x => JSON.parse(JSON.stringify(x))
const storageFinto = () => {
  const m = new Map()
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }
}

/* ══════════ 1. gli alunni, uno per riga, con l'id stabile ══════════ */
{
  const a = Q.alunniDaTesto('Lorenzo\nMarta\n\n  Giulia   Rossi  \n')
  stessaLista('un nome per riga, spazi ripuliti, righe vuote via', a.alunni.map(x => x.nome), ['Lorenzo', 'Marta', 'Giulia Rossi'])
  controlla('ogni alunno ha un id valido per il servizio', a.alunni.every(x => /^[A-Za-z0-9_-]{1,32}$/.test(x.id)))
  uguale('gli id sono diversi', new Set(a.alunni.map(x => x.id)).size, 3)

  const b = Q.alunniDaTesto('Marta\nlorenzo\nPietro', a.alunni)
  uguale('riscritta la lista, Marta tiene il suo id', b.alunni[0].id, a.alunni[1].id)
  uguale('anche con la minuscola Lorenzo tiene il suo', b.alunni[1].id, a.alunni[0].id)
  controlla('un nome nuovo ha un id nuovo', !a.alunni.some(x => x.id === b.alunni[2].id))

  const incollati = Q.alunniDaTesto('1. Rossi\tMario\n2) Bianchi Anna\n- Verdi Luca\n• Neri Sara')
  stessaLista('da un elenco numerato o da un foglio di calcolo', incollati.alunni.map(x => x.nome),
    ['Rossi Mario', 'Bianchi Anna', 'Verdi Luca', 'Neri Sara'])

  const lungo = Q.alunniDaTesto('Maria Vittoria Anna Lucia Benedetta')
  controlla('un nome lungo si accorcia a 24 e lo si dice', lungo.alunni[0].nome.length <= 24 && lungo.accorciati.length === 1)
  stessaLista('due nomi uguali si dicono', Q.alunniDaTesto('Luca\nMarta\nluca').doppi, ['luca'])
  uguale('più di 40 sono troppi', Q.alunniDaTesto(Array.from({ length: 41 }, (_, i) => `Bimbo ${i}`).join('\n')).troppi, true)
}

/* ══════════ 2. le lezioni e il link ══════════ */
{
  const q = Q.vuoto()
  const l = { ...Q.nuovaLezione(ES), nome: 'Il nove · ripasso è più' }
  stessaLista('una lezione nuova: un blocco che passa quando lo dice la maestra, non in tondo', [l.blocchi, l.inTondo], [[{ esercizio: ES, passa: null }], false])
  controlla('una lezione nuova con un nome è valida', Q.lezioneValida(l))
  controlla('senza nome no', !Q.lezioneValida({ ...l, nome: '  ' }))
  controlla('con un id che non sta in un attributo no', !Q.lezioneValida({ ...l, id: 'l 1' }))
  controlla('coi minuti sì', Q.lezioneValida({ ...l, blocchi: [{ esercizio: ES, passa: { minuti: 15 } }] }))
  controlla('con due soglie insieme no', !Q.lezioneValida({ ...l, blocchi: [{ esercizio: ES, passa: { domande: 10, minuti: 5 } }] }))
  controlla('con un esercizio storto no', !Q.lezioneValida({ ...l, blocchi: [{ esercizio: { tipo: 'tabelline', tabelline: [], modo: 'prodotto' }, passa: null }] }))
  controlla('con un campo in più no', !Q.lezioneValida({ ...l, classe: 3 }))
  controlla('la forma di prima no (si converte prima)', !Q.lezioneValida({ id: 'l1', nome: 'x', obiettivo: { esercizio: ES, quante: 5, minuti: null }, dopo: null }))
  controlla('un secondo blocco della maestra, in tondo, sì', Q.lezioneValida({ ...l, blocchi: [...l.blocchi, { esercizio: OROLOGIO, passa: null }], inTondo: true }))
  uguale('salvaLezione rifiuta una lezione non valida', Q.salvaLezione(q, { ...l, nome: '' }), false)
  uguale('e salva quella valida', Q.salvaLezione(q, l), true)
  Q.salvaLezione(q, { ...l, nome: 'Il nove' })
  uguale('la stessa id si sostituisce', q.lezioni.length, 1)
  const d = Q.duplicaLezione(q, l.id)
  controlla('duplica: id nuovo, «(copia)» nel nome, subito dopo', d.id !== l.id && d.nome === 'Il nove (copia)' && q.lezioni[1] === d)
  Q.cancellaLezione(q, l.id)
  stessaLista('cancella', q.lezioni.map(x => x.id), [d.id])

  const conDopo = { ...l, blocchi: [...l.blocchi, { esercizio: OROLOGIO, passa: null }] }
  const link = Q.linkDellaLezione(conDopo, 'https://x.it/educagioco/scuola/maestra.html#vecchio')
  controlla('il link è maestra.html#lezione=…', link.startsWith('https://x.it/educagioco/scuola/maestra.html#lezione='), link)
  controlla('in base64url (niente + / =)', /#lezione=[A-Za-z0-9_-]+$/.test(link))
  stessaLista('andata e ritorno, accenti compresi', Q.lezioneDalLink(link), conDopo)
  stessaLista('anche dal solo hash', Q.lezioneDalLink(link.slice(link.indexOf('#'))), conDopo)
  uguale('un link troncato non entra', Q.lezioneDalLink(link.slice(0, -12)), null)
  const manomessa = Q.linkDellaLezione({ ...conDopo, blocchi: [{ esercizio: { ...ES, extra: 1 }, passa: null }] }, 'p')
  uguale('un link con un esercizio manomesso non entra', Q.lezioneDalLink(manomessa), null)
  uguale('senza lezione nel link: null', Q.lezioneDalLink('https://x.it/maestra.html'), null)
  // un link mandato prima dei blocchi: obiettivo e «se hai finito» diventano due blocchi
  const vecchio = Q.linkDellaLezione({ id: 'lv', nome: 'Il nove', obiettivo: { esercizio: ES, quante: 15, minuti: null }, dopo: OROLOGIO }, 'p')
  stessaLista('un link di prima entra a blocchi', Q.lezioneDalLink(vecchio),
    { id: 'lv', nome: 'Il nove', blocchi: [{ esercizio: ES, passa: { domande: 15 } }, { esercizio: OROLOGIO, passa: null }], inTondo: false })
  stessaLista('si dice una riga per blocco, e il giro', Q.righeDellaLezione({ ...conDopo, inTondo: true }).map(r => r.slice(0, 3)), ['1. ', '2. ', 'In '])
}

/* ══════════ 3. lo storico: un riassunto, e un rientro non conta due volte ══════════ */
const CLASSE = { id: 'c1', nome: '3ª B', alunni: [{ id: 'a1', nome: 'Lorenzo' }, { id: 'a2', nome: 'Marta' }, { id: 'a3', nome: 'Pietro' }] }
const LEZ = { id: 'l1', nome: 'Il nove', blocchi: [{ esercizio: ES, passa: { domande: 5 } }, { esercizio: OROLOGIO, passa: null }], inTondo: false }
// `blocco`: la posizione del bambino quando ha risposto
const r = (n, giusta, fatto = '9 × 7', data = '56', blocco = 0) => ({ n, blocco, chiave: 'tab:prodotto', fatto, data, attesa: fatto === '9 × 7' ? '63' : '72', giusta, ms: 3000 })
let voce
{
  voce = Q.nuovaVoce({ classe: CLASSE, lezione: LEZ, codice: '4821', chiave: 'k'.repeat(32), scade: 99_999, ora: 1000 })
  stessaLista('la voce nasce con gli alunni della classe', voce.alunni.map(a => a.id), ['a1', 'a2', 'a3'])
  Q.aggiungiRisposta(voce, 'a1', r(1, true))
  Q.aggiungiRisposta(voce, 'a1', r(2, false))
  Q.aggiungiRisposta(voce, 'a1', r(3, false, '9 × 7', '54'))
  Q.aggiungiRisposta(voce, 'a1', r(4, true, '9 × 8', '72', 1))
  const e = voce.esiti.a1
  stessaLista('fatte e giuste per blocco', e.blocchi, [{ fatte: 3, giuste: 1 }, { fatte: 1, giuste: 1 }])
  uguale('la stessa domanda sbagliata due volte è una riga sola', e.sbagliate.length, 1)
  stessaLista('con quante volte e cosa ha detto', e.sbagliate[0], { fatto: '9 × 7', attesa: '63', volte: 2, dette: ['56', '54'] })
  uguale('le ultime sbagliate, la più recente prima', e.ultime[0].data, '54')
  controlla('chi risponde è presente', e.presente)
  // in un gioco un colpo sbagliato lascia la domanda aperta (`ultima: false`): è fra le sbagliate, non fra le fatte
  const v2 = Q.nuovaVoce({ classe: CLASSE, lezione: LEZ, codice: '4821', chiave: 'k'.repeat(32), scade: 99_999, ora: 1000 })
  Q.aggiungiRisposta(v2, 'a1', { ...r(1, false, '9 × 7', '54'), ultima: false })
  Q.aggiungiRisposta(v2, 'a1', r(2, true))
  stessaLista('un colpo sbagliato e poi quello giusto: una domanda fatta e giusta', v2.esiti.a1.blocchi[0], { fatte: 1, giuste: 1 })
  uguale('e il colpo sbagliato resta fra le sbagliate', v2.esiti.a1.sbagliate[0]?.volte, 1)
  uguale('l\'ultima sbagliata dice il suo blocco', v2.esiti.a1.ultime[0].blocco, 0)

  // in tondo la posizione cresce a ogni giro: il riassunto somma per blocco, il pannello conta per posizione
  const giro = { ...LEZ, inTondo: true }
  const v3 = Q.nuovaVoce({ classe: CLASSE, lezione: giro, codice: '4821', chiave: null, scade: 0, ora: 0 })
  const tondo = [r(1, true, '9 × 7', '63', 0), r(2, true, '9 × 7', '63', 1), r(3, false, '9 × 7', '56', 2), r(4, true, '9 × 7', '63', 3)]
  for (const x of tondo) Q.aggiungiRisposta(v3, 'a1', x)
  stessaLista('in tondo i giri si sommano per blocco', v3.esiti.a1.blocchi, [{ fatte: 2, giuste: 1 }, { fatte: 2, giuste: 2 }])
  const conti = Q.contiDelleRisposte({ a1: tondo })
  stessaLista('e per il pannello ogni posizione ha i suoi conti', [conti.a1[0], conti.a1[2]], [{ fatte: 1, giuste: 1 }, { fatte: 1, giuste: 0 }])
  Q.contaPosizione(conti, 'a1', { ...r(5, false, '9 × 7', '54', 3), ultima: false })
  stessaLista('un colpo che lascia aperta la domanda non conta nella posizione', conti.a1[3], { fatte: 1, giuste: 1 })
  // una risposta di prima dei blocchi porta `parte`
  const v4 = Q.nuovaVoce({ classe: CLASSE, lezione: LEZ, codice: '4821', chiave: null, scade: 0, ora: 0 })
  Q.aggiungiRisposta(v4, 'a1', { ...r(1, true), blocco: undefined, parte: 'dopo' })
  stessaLista('una risposta col «dopo» di prima va nel secondo blocco', v4.esiti.a1.blocchi, [{ fatte: 0, giuste: 0 }, { fatte: 1, giuste: 1 }])

  Q.aggiornaAlunni(voce, [...CLASSE.alunni.map(a => ({ ...a, nuovo: false, collegato: a.id === 'a2', dove: null })),
    { id: 'nxyz12', nome: 'Gioia', nuovo: true, collegato: true, dove: null }])
  controlla('un nuovo entra nella voce, segnato', voce.alunni.some(a => a.id === 'nxyz12' && a.nuovo))
  controlla('chi è collegato è presente', voce.esiti.a2?.presente === true)
  Q.aggiungiRisposta(voce, 'nxyz12', r(1, false, '9 × 8', '81'))

  // il rientro: `tutto` porta di nuovo tutte le risposte, e il nuovo è stato tolto dalla maestra
  const tutto = { t: 'tutto', fase: 'via', scade: 9999, alunni: CLASSE.alunni.map(a => ({ ...a, nuovo: false, collegato: false, dove: null })),
                  risposte: { a1: [r(1, true), r(2, false), r(3, false, '9 × 7', '54'), r(4, true, '9 × 8', '72', 1)], a3: [r(1, true)] } }
  Q.ricalcola(voce, tutto)
  stessaLista('dopo `tutto` i conti sono gli stessi, non il doppio', voce.esiti.a1.blocchi, [{ fatte: 3, giuste: 1 }, { fatte: 1, giuste: 1 }])
  uguale('il nuovo tolto non c\'è più', voce.esiti.nxyz12, undefined)
  controlla('chi era presente lo resta anche se ora è scollegato', voce.esiti.a2?.presente === true)
  stessaLista('chi ha risposto solo prima della caduta entra coi suoi conti', voce.esiti.a3.blocchi[0], { fatte: 1, giuste: 1 })
  uguale('la scadenza viene dal servizio', voce.scade, 9999)
}

/* ══════════ 4. il resoconto, le più sbagliate, il CSV, lo storico del bambino ══════════ */
{
  const q = Q.vuoto()
  q.classi.push(copia(CLASSE))
  q.storico.push(voce)
  Q.aggiungiRisposta(voce, 'a2', r(1, false, '9 × 7', '56'))
  Q.aggiungiRisposta(voce, 'a3', r(2, false, '9 × 8', '81'))
  Q.aggiungiRisposta(voce, 'a3', r(3, false, '9 × 8', '81'))
  Q.aggiungiRisposta(voce, 'a3', r(4, false, '9 × 8', '81'))
  const piu = Q.piuSbagliate(voce)
  uguale('la più sbagliata è quella di più bambini', piu[0].fatto, '9 × 7')
  stessaLista('…con quanti bambini e quante volte', [piu[0].quanti, piu[0].volte], [2, 3])
  stessaLista('poi le altre', [piu[1].fatto, piu[1].quanti, piu[1].volte], ['9 × 8', 1, 3])
  stessaLista('…e chi l\'ha sbagliata, con cosa ha detto (non «un bambino»)', piu[1].chi.map(c => [c.nome, c.dette.join()]), [['Pietro', '81']])
  controlla('le risposte date stanno anche nella somma', piu[1].dette.includes('81'))
  const righe = Q.righeResoconto(voce)
  stessaLista('una riga per alunno della voce', righe.map(x => x.nome), ['Lorenzo', 'Marta', 'Pietro'])
  stessaLista('con un conto per blocco, anche a zero', righe[1].blocchi, [{ fatte: 1, giuste: 0 }, { fatte: 0, giuste: 0 }])

  const csv = Q.csvResoconto(voce).split('\r\n')
  uguale('il CSV ha intestazione, tre righe e la riga vuota in fondo', csv.length, 5)
  uguale('col punto e virgola, due colonne per blocco', csv[0], 'Bambino;Nuovo;Blocco 1: fatte;Blocco 1: giuste;Blocco 2: fatte;Blocco 2: giuste;Domande sbagliate')
  uguale('la riga di Lorenzo', csv[1], 'Lorenzo;;3;1;1;1;9 × 7 → 63 (2 volte)')
  const strano = copia(voce)
  strano.alunni[0].nome = '=SOMMA(A1); "x"'
  const riga = Q.csvResoconto(strano).split('\r\n')[1]
  controlla('un nome che sembra una formula non lo diventa, e le virgolette si raddoppiano', riga.startsWith(`"'=SOMMA(A1); ""x""";`), riga)

  const voce2 = Q.nuovaVoce({ classe: CLASSE, lezione: { ...LEZ, nome: 'Ancora il nove' }, codice: '5730', chiave: null, scade: 0, ora: 5000 })
  Q.aggiungiRisposta(voce2, 'a1', r(1, false, '9 × 7', '56'))
  q.storico.push(voce2)
  stessaLista('le lezioni della classe, la più recente prima', Q.vociDellaClasse(q, 'c1').map(v => v.lezione.nome), ['Ancora il nove', 'Il nove'])
  const s = Q.storicoDelBambino(q, 'c1', 'a1')
  stessaLista('il bambino, lezione per lezione e blocco per blocco', s.lezioni.map(x => [x.nome, x.blocchi.map(c => c.fatte)]), [['Ancora il nove', [1, 0]], ['Il nove', [3, 1]]])
  stessaLista('e la domanda che sbaglia più spesso, in quante lezioni', [s.sbaglia[0].fatto, s.sbaglia[0].volte, s.sbaglia[0].quanti], ['9 × 7', 3, 2])
  const assente = Q.storicoDelBambino(q, 'c1', 'a2').lezioni[0]
  uguale('chi non c\'era risulta assente', assente.presente, false)

  // un «nuovo» entra nella classe con l'id della lezione: lo storico lo ritrova
  uguale('aggiungi alla classe', Q.aggiungiAllaClasse(q, 'c1', { id: 'nxyz12', nome: 'Gioia' }), true)
  uguale('due volte no', Q.aggiungiAllaClasse(q, 'c1', { id: 'nxyz12', nome: 'Gioia' }), false)
  Q.cancellaClasse(q, 'c1')
  stessaLista('cancellata la classe, il suo storico resta e si trova', Q.classiNelloStorico(q).map(c => [c.nome, c.lezioni, c.cancellata]), [['3ª B', 2, true]])
}

/* ══════════ 5. la scadenza: la lezione in corso si chiude da sé ══════════ */
{
  const q = Q.vuoto()
  const v = Q.nuovaVoce({ classe: CLASSE, lezione: LEZ, codice: '4821', chiave: 'k'.repeat(32), scade: 10_000, ora: 0 })
  q.storico.push(v)
  q.inCorso = { codice: '4821', chiave: 'k'.repeat(32), scade: 10_000, avviata: 0, classe: 'c1', lezione: LEZ, voce: v.id }
  controlla('prima della scadenza si può recuperare', Q.recuperabile(v, 9_999))
  uguale('prima della scadenza non cambia niente', Q.pulisciScadute(q, 9_999), false)
  uguale('dopo sì', Q.pulisciScadute(q, 10_000), true)
  controlla('la lezione in corso è chiusa, senza chiave', q.inCorso === null && v.chiusa && v.chiave === null)
  controlla('e non si recupera più', !Q.recuperabile(v, 10_000))
}

/* ══════════ 6. localStorage: le chiavi `scuola:` e la lezione in corso ══════════ */
{
  const st = storageFinto()
  const q = Q.vuoto()
  q.classi.push(copia(CLASSE))
  Q.salvaLezione(q, LEZ)
  q.storico.push(copia(voce))
  q.inCorso = { codice: '4821', chiave: 'k'.repeat(32), scade: 99, avviata: 1, classe: 'c1', lezione: LEZ, voce: voce.id }
  uguale('salva', Q.salva(q, st), true)
  controlla('quattro chiavi, tutte `scuola:` e nessuna come quelle dei bambini',
    [...st.m.keys()].length === 4 && [...st.m.keys()].every(k => k.startsWith('scuola:') && !/^scuola:\d{4}$/.test(k)), [...st.m.keys()].join(' '))
  stessaLista('e ricarica uguale', Q.carica(st), copia(q))
  q.inCorso = null
  Q.salva(q, st, ['inCorso'])
  uguale('senza lezione in corso la chiave sparisce', st.m.has(Q.CHIAVI.inCorso), false)
  st.setItem(Q.CHIAVI.classi, '{rotto')
  stessaLista('una chiave rovinata dà un elenco vuoto, il resto si legge', [Q.carica(st).classi.length, Q.carica(st).lezioni.length], [0, 1])
  uguale('un browser che non scrive lo dice', Q.salva(q, { setItem() { throw new Error('pieno') }, removeItem() {} }), false)
}

/* ══════════ 7. il file del quaderno: la forma e l'unione per id ══════════ */
{
  const q = Q.vuoto()
  q.classi.push(copia(CLASSE))
  Q.salvaLezione(q, LEZ)
  q.storico.push(copia(voce))
  const file = JSON.stringify(Q.esporta(q, Date.UTC(2026, 10, 18)))
  const letto = Q.leggiQuaderno(file)
  controlla('il file si rilegge', letto.ok && letto.scartate === 0)
  stessaLista('uguale a quello salvato', letto.quaderno, { classi: q.classi, lezioni: q.lezioni, storico: q.storico })
  uguale('il nome del file ha la data', Q.nomeDelFile(Date.UTC(2026, 10, 18)), 'quaderno-scuola-2026-11-18.json')
  controlla('la lezione in corso non viaggia nel file', !('inCorso' in Q.esporta({ ...q, inCorso: { codice: 'X' } })))

  for (const [cosa, testo] of [['non JSON', '{rotto'], ['un altro JSON', '{"a":1}'], ['una lista', '[]'], ['null', 'null'],
    ['una versione futura', JSON.stringify({ formato: Q.FORMATO, versione: 99 })], ['vuoto', '']]) {
    const x = Q.leggiQuaderno(testo)
    controlla(`un file storto (${cosa}) è rifiutato con una frase`, !x.ok && typeof x.errore === 'string' && x.errore.length > 10)
  }
  const misto = JSON.parse(file)
  misto.classi.push({ id: 'c2', nome: 'x', alunni: [{ id: 'senza nome' }] }, 'pippo')
  misto.lezioni.push({ id: 'l9' })
  misto.storico.push({ id: 'v9', classe: 'c1' })
  const m = Q.leggiQuaderno(JSON.stringify(misto))
  controlla('le voci rovinate si lasciano fuori e si contano', m.ok && m.scartate === 4 && m.quaderno.classi.length === 1, JSON.stringify(m.scartate))
  const vecchia = JSON.parse(file)
  vecchia.lezioni[0].blocchi[0].esercizio = { tipo: 'modulo', modulo: 'non-c-e-piu', da: 1, a: 1, tipologie: [] }
  uguale('una lezione con un esercizio sparito dal catalogo si tiene (non si avvia)', Q.leggiQuaderno(JSON.stringify(vecchia)).quaderno.lezioni.length, 1)

  // l'unione: stesso id si sostituisce, il resto si aggiunge, niente si cancella
  const qui = Q.vuoto()
  qui.classi.push({ id: 'c1', nome: 'vecchio nome', alunni: [] }, { id: 'c9', nome: 'solo qui', alunni: [] })
  const conto = Q.unisci(qui, letto.quaderno)
  stessaLista('le classi: c1 sostituita, c9 resta', qui.classi.map(c => [c.id, c.nome]), [['c1', '3ª B'], ['c9', 'solo qui']])
  stessaLista('il conto', conto, { nuove: 2, sostituite: 1 })
  const ancora = Q.unisci(qui, letto.quaderno)
  stessaLista('riaprire lo stesso file non raddoppia niente', [qui.classi.length, qui.lezioni.length, qui.storico.length, ancora.nuove], [2, 1, 1, 0])
  qui.inCorso = { voce: voce.id }
  qui.storico[0].esiti = {}
  Q.unisci(qui, letto.quaderno)
  stessaLista('la voce della lezione in corso non si sovrascrive col file', qui.storico[0].esiti, {})
}

/* ══════════ 8. l'anno della classe, facoltativo ══════════ */
{
  stessaLista('una classe nuova senza anno non ha il campo', Object.keys(Q.nuovaClasse('3ª B')), ['id', 'nome', 'alunni'])
  uguale('con l\'anno lo tiene', Q.nuovaClasse('3ª B', 3).anno, 3)
  controlla('un anno fuori dalla primaria non entra', !('anno' in Q.nuovaClasse('x', 6)) && !('anno' in Q.nuovaClasse('x', '3')))

  // un quaderno di prima del campo si apre uguale, e uno col campo lo tiene
  const vecchio = { formato: Q.FORMATO, versione: 1, salvato: '', classi: [copia(CLASSE)], lezioni: [], storico: [] }
  stessaLista('un quaderno senza anno si apre uguale', Q.leggiQuaderno(JSON.stringify(vecchio)).quaderno.classi, [CLASSE])
  const conAnno = { id: CLASSE.id, nome: CLASSE.nome, anno: 3, alunni: copia(CLASSE.alunni) }
  const letto = Q.leggiQuaderno(JSON.stringify({ ...vecchio, classi: [conAnno, { id: 'c2', nome: 'y', anno: 9, alunni: [] }] }))
  stessaLista('l\'anno buono resta, quello storto si toglie e la classe si tiene', letto.quaderno.classi,
    [conAnno, { id: 'c2', nome: 'y', alunni: [] }])
  uguale('niente voci scartate per un anno storto', letto.scartate, 0)
  const st = storageFinto()
  const q = Q.vuoto()
  q.classi.push(copia(conAnno))
  Q.salva(q, st)
  stessaLista('e dal browser torna uguale', Q.carica(st).classi, [conAnno])

}

/* ══════════ 9. le cose di prima dei blocchi: lezioni, storico, lezione in corso ══════════ */
{
  const VECCHIA = { id: 'l7', nome: 'Il nove', obiettivo: { esercizio: ES, quante: 15, minuti: null }, dopo: OROLOGIO }
  const A_BLOCCHI = { id: 'l7', nome: 'Il nove', blocchi: [{ esercizio: ES, passa: { domande: 15 } }, { esercizio: OROLOGIO, passa: null }], inTondo: false }
  const vecchiaVoce = {
    id: 'v7', classe: 'c1', nomeClasse: '3ª B', lezione: VECCHIA, avviata: 1000, codice: '4821', chiave: null, scade: 2000, chiusa: true,
    alunni: [{ id: 'a1', nome: 'Lorenzo', nuovo: false }],
    esiti: { a1: { presente: true, obiettivo: { fatte: 15, giuste: 12 }, dopo: { fatte: 4, giuste: 4 },
                   sbagliate: [{ fatto: '9 × 7', attesa: '63', volte: 2, dette: ['56'] }],
                   ultime: [{ parte: 'dopo', fatto: 'Che ore sono?', data: '3', attesa: '4' }, { parte: 'obiettivo', fatto: '9 × 7', data: '56', attesa: '63' }] } },
  }
  const st = storageFinto()
  st.setItem(Q.CHIAVI.lezioni, JSON.stringify([VECCHIA, { ...VECCHIA, id: 'l8', obiettivo: { esercizio: ES, quante: null, minuti: 10 }, dopo: null }]))
  st.setItem(Q.CHIAVI.storico, JSON.stringify([vecchiaVoce]))
  st.setItem(Q.CHIAVI.inCorso, JSON.stringify({ codice: '4821', chiave: 'k'.repeat(32), scade: 9, avviata: 1, classe: 'c1', lezione: VECCHIA, voce: 'v7' }))
  const q = Q.carica(st)
  stessaLista('una lezione salvata prima si legge a blocchi', q.lezioni[0], A_BLOCCHI)
  stessaLista('a minuti, senza «se hai finito»: un blocco', q.lezioni[1].blocchi, [{ esercizio: ES, passa: { minuti: 10 } }])
  controlla('ed è una lezione che si avvia', q.lezioni.every(Q.lezioneValida))
  stessaLista('la voce dello storico di prima ha la lezione a blocchi', q.storico[0].lezione, A_BLOCCHI)
  stessaLista('e obiettivo e «se hai finito» sono i blocchi 1 e 2', q.storico[0].esiti.a1.blocchi, [{ fatte: 15, giuste: 12 }, { fatte: 4, giuste: 4 }])
  stessaLista('le ultime sbagliate dicono il blocco', q.storico[0].esiti.a1.ultime.map(u => u.blocco), [1, 0])
  uguale('le sbagliate restano', q.storico[0].esiti.a1.sbagliate[0].volte, 2)
  stessaLista('anche la lezione in corso si legge a blocchi', q.inCorso.lezione, A_BLOCCHI)
  uguale('e il CSV ha due blocchi', Q.csvResoconto(q.storico[0]).split('\r\n')[1], 'Lorenzo;;15;12;4;4;9 × 7 → 63 (2 volte)')
  // un file salvato prima: la stessa conversione, e niente voci scartate
  const file = Q.leggiQuaderno(JSON.stringify({ formato: Q.FORMATO, versione: 1, salvato: '', classi: [], lezioni: [VECCHIA], storico: [vecchiaVoce] }))
  controlla('un file di prima si apre senza scartare niente', file.ok && file.scartate === 0)
  stessaLista('con le lezioni e lo storico a blocchi', [file.quaderno.lezioni[0], file.quaderno.storico[0].esiti.a1.blocchi[1]], [A_BLOCCHI, { fatte: 4, giuste: 4 }])
  // una voce di prima senza «se hai finito» ha un blocco solo
  const senzaDopo = Q.leggiQuaderno(JSON.stringify({ formato: Q.FORMATO, versione: 1, salvato: '', classi: [], lezioni: [],
    storico: [{ ...vecchiaVoce, lezione: { ...VECCHIA, dopo: null } }] })).quaderno.storico[0]
  stessaLista('senza «se hai finito», un blocco solo', senzaDopo.esiti.a1.blocchi, [{ fatte: 15, giuste: 12 }])
  uguale('e un\'ultima del «dopo» che non c\'è va nel blocco che c\'è', senzaDopo.esiti.a1.ultime[0].blocco, 0)
}

riassunto('il quaderno della maestra')
