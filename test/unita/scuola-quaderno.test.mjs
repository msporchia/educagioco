/* IL QUADERNO DELLA MAESTRA — classi, lezioni, storico e il file, senza browser

   Gli alunni tengono il loro id quando si riscrive la lista, una lezione viaggia nel link e torna uguale (e un link
   manomesso non entra), lo storico è un riassunto che un rientro non conta due volte, il file storto non rompe niente e
   l'unione è per id. Vedi docs/scuola/quaderno.md.
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
  controlla('una lezione nuova con un nome è valida', Q.lezioneValida(l))
  controlla('senza nome no', !Q.lezioneValida({ ...l, nome: '  ' }))
  controlla('con quante e minuti insieme no', !Q.lezioneValida({ ...l, obiettivo: { esercizio: ES, quante: 10, minuti: 5 } }))
  controlla('con nessuno dei due no', !Q.lezioneValida({ ...l, obiettivo: { esercizio: ES, quante: null, minuti: null } }))
  controlla('coi minuti sì', Q.lezioneValida({ ...l, obiettivo: { esercizio: ES, quante: null, minuti: 15 } }))
  controlla('con un esercizio storto no', !Q.lezioneValida({ ...l, obiettivo: { esercizio: { tipo: 'tabelline', tabelline: [] , modo: 'prodotto' }, quante: 5, minuti: null } }))
  controlla('con un campo in più no', !Q.lezioneValida({ ...l, classe: 3 }))
  controlla('il «se hai finito» valido sì', Q.lezioneValida({ ...l, dopo: OROLOGIO }))
  controlla('il «se hai finito» storto no', !Q.lezioneValida({ ...l, dopo: { tipo: 'modulo' } }))
  uguale('salvaLezione rifiuta una lezione non valida', Q.salvaLezione(q, { ...l, nome: '' }), false)
  uguale('e salva quella valida', Q.salvaLezione(q, l), true)
  Q.salvaLezione(q, { ...l, nome: 'Il nove' })
  uguale('la stessa id si sostituisce', q.lezioni.length, 1)
  const d = Q.duplicaLezione(q, l.id)
  controlla('duplica: id nuovo, «(copia)» nel nome, subito dopo', d.id !== l.id && d.nome === 'Il nove (copia)' && q.lezioni[1] === d)
  Q.cancellaLezione(q, l.id)
  stessaLista('cancella', q.lezioni.map(x => x.id), [d.id])

  const conDopo = { ...l, dopo: OROLOGIO }
  const link = Q.linkDellaLezione(conDopo, 'https://x.it/educagioco/scuola/maestra.html#vecchio')
  controlla('il link è maestra.html#lezione=…', link.startsWith('https://x.it/educagioco/scuola/maestra.html#lezione='), link)
  controlla('in base64url (niente + / =)', /#lezione=[A-Za-z0-9_-]+$/.test(link))
  stessaLista('andata e ritorno, accenti compresi', Q.lezioneDalLink(link), conDopo)
  stessaLista('anche dal solo hash', Q.lezioneDalLink(link.slice(link.indexOf('#'))), conDopo)
  uguale('un link troncato non entra', Q.lezioneDalLink(link.slice(0, -12)), null)
  const manomessa = Q.linkDellaLezione({ ...conDopo, obiettivo: { ...conDopo.obiettivo, esercizio: { ...ES, extra: 1 } } }, 'p')
  uguale('un link con un esercizio manomesso non entra', Q.lezioneDalLink(manomessa), null)
  uguale('senza lezione nel link: null', Q.lezioneDalLink('https://x.it/maestra.html'), null)
  uguale('misura in domande', Q.misura({ quante: 20, minuti: null }), '20 domande')
  uguale('misura in minuti', Q.misura({ quante: null, minuti: 15 }), '15 minuti')
}

/* ══════════ 3. lo storico: un riassunto, e un rientro non conta due volte ══════════ */
const CLASSE = { id: 'c1', nome: '3ª B', alunni: [{ id: 'a1', nome: 'Lorenzo' }, { id: 'a2', nome: 'Marta' }, { id: 'a3', nome: 'Pietro' }] }
const LEZ = { id: 'l1', nome: 'Il nove', obiettivo: { esercizio: ES, quante: 5, minuti: null }, dopo: OROLOGIO }
const r = (n, giusta, fatto = '9 × 7', data = '56', parte = 'obiettivo') => ({ n, parte, chiave: 'tab:prodotto', fatto, data, attesa: fatto === '9 × 7' ? '63' : '72', giusta, ms: 3000 })
let voce
{
  voce = Q.nuovaVoce({ classe: CLASSE, lezione: LEZ, codice: 'ABCDE', chiave: 'k'.repeat(32), scade: 99_999, ora: 1000 })
  stessaLista('la voce nasce con gli alunni della classe', voce.alunni.map(a => a.id), ['a1', 'a2', 'a3'])
  Q.aggiungiRisposta(voce, 'a1', r(1, true))
  Q.aggiungiRisposta(voce, 'a1', r(2, false))
  Q.aggiungiRisposta(voce, 'a1', r(3, false, '9 × 7', '54'))
  Q.aggiungiRisposta(voce, 'a1', r(4, true, '9 × 8', '72', 'dopo'))
  const e = voce.esiti.a1
  stessaLista('obiettivo: fatte e giuste', e.obiettivo, { fatte: 3, giuste: 1 })
  stessaLista('dopo: fatte e giuste', e.dopo, { fatte: 1, giuste: 1 })
  uguale('la stessa domanda sbagliata due volte è una riga sola', e.sbagliate.length, 1)
  stessaLista('con quante volte e cosa ha detto', e.sbagliate[0], { fatto: '9 × 7', attesa: '63', volte: 2, dette: ['56', '54'] })
  uguale('le ultime sbagliate, la più recente prima', e.ultime[0].data, '54')
  controlla('chi risponde è presente', e.presente)
  // in un gioco un colpo sbagliato lascia la domanda aperta (`ultima: false`): è fra le sbagliate, non fra le fatte
  const v2 = Q.nuovaVoce({ classe: CLASSE, lezione: LEZ, codice: 'ABCDE', chiave: 'k'.repeat(32), scade: 99_999, ora: 1000 })
  Q.aggiungiRisposta(v2, 'a1', { ...r(1, false, '9 × 7', '54'), ultima: false })
  Q.aggiungiRisposta(v2, 'a1', r(2, true))
  stessaLista('un colpo sbagliato e poi quello giusto: una domanda fatta e giusta', v2.esiti.a1.obiettivo, { fatte: 1, giuste: 1 })
  uguale('e il colpo sbagliato resta fra le sbagliate', v2.esiti.a1.sbagliate[0]?.volte, 1)

  Q.aggiornaAlunni(voce, [...CLASSE.alunni.map(a => ({ ...a, nuovo: false, collegato: a.id === 'a2', dove: null })),
    { id: 'nxyz12', nome: 'Gioia', nuovo: true, collegato: true, dove: null }])
  controlla('un nuovo entra nella voce, segnato', voce.alunni.some(a => a.id === 'nxyz12' && a.nuovo))
  controlla('chi è collegato è presente', voce.esiti.a2?.presente === true)
  Q.aggiungiRisposta(voce, 'nxyz12', r(1, false, '9 × 8', '81'))

  // il rientro: `tutto` porta di nuovo tutte le risposte, e il nuovo è stato tolto dalla maestra
  const tutto = { t: 'tutto', fase: 'via', scade: 9999, alunni: CLASSE.alunni.map(a => ({ ...a, nuovo: false, collegato: false, dove: null })),
                  risposte: { a1: [r(1, true), r(2, false), r(3, false, '9 × 7', '54'), r(4, true, '9 × 8', '72', 'dopo')], a3: [r(1, true)] } }
  Q.ricalcola(voce, tutto)
  stessaLista('dopo `tutto` i conti sono gli stessi, non il doppio', voce.esiti.a1.obiettivo, { fatte: 3, giuste: 1 })
  uguale('il nuovo tolto non c\'è più', voce.esiti.nxyz12, undefined)
  controlla('chi era presente lo resta anche se ora è scollegato', voce.esiti.a2?.presente === true)
  stessaLista('chi ha risposto solo prima della caduta entra coi suoi conti', voce.esiti.a3.obiettivo, { fatte: 1, giuste: 1 })
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
  const righe = Q.righeResoconto(voce)
  stessaLista('una riga per alunno della voce', righe.map(x => x.nome), ['Lorenzo', 'Marta', 'Pietro'])

  const csv = Q.csvResoconto(voce).split('\r\n')
  uguale('il CSV ha intestazione, tre righe e la riga vuota in fondo', csv.length, 5)
  controlla('col punto e virgola', csv[0].startsWith('Bambino;Nuovo;Obiettivo: fatte'), csv[0])
  uguale('la riga di Lorenzo', csv[1], 'Lorenzo;;3;1;1;1;9 × 7 → 63 (2 volte)')
  const strano = copia(voce)
  strano.alunni[0].nome = '=SOMMA(A1); "x"'
  const riga = Q.csvResoconto(strano).split('\r\n')[1]
  controlla('un nome che sembra una formula non lo diventa, e le virgolette si raddoppiano', riga.startsWith(`"'=SOMMA(A1); ""x""";`), riga)

  const voce2 = Q.nuovaVoce({ classe: CLASSE, lezione: { ...LEZ, nome: 'Ancora il nove' }, codice: 'FGHIL', chiave: null, scade: 0, ora: 5000 })
  Q.aggiungiRisposta(voce2, 'a1', r(1, false, '9 × 7', '56'))
  q.storico.push(voce2)
  stessaLista('le lezioni della classe, la più recente prima', Q.vociDellaClasse(q, 'c1').map(v => v.lezione.nome), ['Ancora il nove', 'Il nove'])
  const s = Q.storicoDelBambino(q, 'c1', 'a1')
  stessaLista('il bambino, lezione per lezione', s.lezioni.map(x => [x.nome, x.obiettivo.fatte]), [['Ancora il nove', 1], ['Il nove', 3]])
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
  const v = Q.nuovaVoce({ classe: CLASSE, lezione: LEZ, codice: 'ABCDE', chiave: 'k'.repeat(32), scade: 10_000, ora: 0 })
  q.storico.push(v)
  q.inCorso = { codice: 'ABCDE', chiave: 'k'.repeat(32), scade: 10_000, avviata: 0, classe: 'c1', lezione: LEZ, voce: v.id }
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
  q.inCorso = { codice: 'ABCDE', chiave: 'k'.repeat(32), scade: 99, avviata: 1, classe: 'c1', lezione: LEZ, voce: voce.id }
  uguale('salva', Q.salva(q, st), true)
  controlla('quattro chiavi, tutte `scuola:` e nessuna come quelle dei bambini',
    [...st.m.keys()].length === 4 && [...st.m.keys()].every(k => k.startsWith('scuola:') && !/^scuola:[A-Z]{5}$/.test(k)), [...st.m.keys()].join(' '))
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
  vecchia.lezioni[0].obiettivo.esercizio = { tipo: 'modulo', modulo: 'non-c-e-piu', da: 1, a: 1, tipologie: [] }
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

  // l'anno da proporre per una lezione nuova
  const conClassi = (...anni) => ({ classi: anni.map((anno, i) => (anno ? { id: `c${i}`, nome: 'x', anno, alunni: [] } : { id: `c${i}`, nome: 'x', alunni: [] })) })
  uguale('nessuna classe: nessun anno', Q.annoDelleClassi(conClassi()), null)
  uguale('le classi con l\'anno dicono tutte la terza: terza', Q.annoDelleClassi(conClassi(3, null, 3)), 3)
  uguale('due anni diversi: nessuno', Q.annoDelleClassi(conClassi(3, 4)), null)
}

riassunto('il quaderno della maestra')
