/* La logica della lezione (`servizio/inoltro/src/lezione.js`), senza Cloudflare: nomi, risposte, fasi, limiti. Docs: docs/scuola/protocollo.md */
import * as L from '../../servizio/inoltro/src/lezione.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const ES = { tipo: 'tabelline', tabelline: [7] }
const blocco = (passa = { giuste: 10 }) => ({ esercizio: ES, passa })
const corpo = (extra = {}) => ({ lezione: { id: 'l1', nome: 'Tabelline', blocchi: [blocco()], inTondo: false, ...extra },
  alunni: [{ id: 'a1', nome: 'Lorenzo' }, { id: 'a2', nome: '  Marta   Rossi ' }] })
const nuova = () => { const l = L.leggiCreazione(corpo()); return L.nuovaLezione(l, 1000, 'hash') }
const ws = nome => ({ nome })
const dest = (r, a, t) => r.invii.filter(i => i.a === a && (!t || i.msg.t === t)).map(i => i.msg)

// la creazione: cosa passa e cosa no
{
  const l = L.leggiCreazione(corpo())
  controlla('una lezione giusta passa', l.ok)
  uguale('il nome si ripulisce', l.alunni[1].nome, 'Marta Rossi')
  uguale('la lezione torna a blocchi', JSON.stringify(l.lezione.blocchi), JSON.stringify([{ esercizio: ES, passa: { giuste: 10 } }]))
  const ok = b => L.leggiCreazione(corpo({ blocchi: b })).ok
  controlla('la forma vecchia (obiettivo) è rifiutata', !L.leggiCreazione({ lezione: { id: 'l1', nome: 'T', obiettivo: { esercizio: ES, quante: 10, minuti: null }, dopo: null }, alunni: [] }).ok)
  controlla('«passa» null (lo dice la maestra): sì', ok([blocco(null)]))
  controlla('giuste, domande, minuti: sì', ok([blocco({ giuste: 5 }), blocco({ domande: 500 }), blocco({ minuti: 180 })]))
  controlla('due chiavi in passa: no', !ok([blocco({ giuste: 5, minuti: 5 })]))
  controlla('passa vuoto o con chiave ignota: no', !ok([blocco({})]) && !ok([blocco({ quante: 5 })]))
  controlla('passa fuori misura o non intero: no', !ok([blocco({ giuste: 0 })]) && !ok([blocco({ giuste: 501 })]) && !ok([blocco({ domande: 501 })]) && !ok([blocco({ minuti: 181 })]) && !ok([blocco({ giuste: 2.5 })]) && !ok([blocco({ giuste: '5' })]))
  controlla('senza passa: no', !ok([{ esercizio: ES }]))
  controlla('un esercizio che non è un oggetto: no', !ok([{ esercizio: 'x', passa: null }]))
  controlla('nessun blocco o più di otto: no', !ok([]) && !ok(Array.from({ length: 9 }, () => blocco())) && ok(Array.from({ length: 8 }, () => blocco())))
  controlla('blocchi che non è una lista: no', !ok('x') && !ok(null))
  controlla('una chiave in più nel blocco: no', !ok([{ ...blocco(), extra: 1 }]))
  controlla('inTondo vuole un booleano', !L.leggiCreazione(corpo({ inTondo: 'sì' })).ok && !L.leggiCreazione(corpo({ inTondo: undefined })).ok && L.leggiCreazione(corpo({ inTondo: true })).ok)
  controlla('una chiave in più nella lezione: no', !L.leggiCreazione(corpo({ dopo: null })).ok)
  const tanti = corpo(); tanti.alunni = Array.from({ length: L.MAX_ALUNNI + 1 }, (_, i) => ({ id: 'a' + i, nome: 'X' + i }))
  controlla('più di 40 alunni: no', !L.leggiCreazione(tanti).ok)
  const doppi = corpo(); doppi.alunni.push({ id: 'a1', nome: 'Altro' })
  controlla('un id doppio: no', !L.leggiCreazione(doppi).ok)
  controlla('un corpo che non è un oggetto: no', !L.leggiCreazione('ciao').ok && !L.leggiCreazione(null).ok)
  uguale('il nome ha al più 24 caratteri e niente controlli', L.nomePulito('a\u0000b' + 'c'.repeat(40)).length, 24)
  const h = await L.hashChiave('k'.repeat(32))
  controlla('l\'hash non è la chiave e riconosce la chiave', h !== 'k'.repeat(32) && L.chiaveGiusta({ chiaveHash: h }, await L.hashChiave('k'.repeat(32))) && !L.chiaveGiusta({ chiaveHash: h }, await L.hashChiave('j'.repeat(32))))
  controlla('la chiave nuova è di 32 caratteri giusti', L.CHIAVE.test(L.nuovaChiave(new Uint8Array(32).map((_, i) => i * 7))))
}

// i nomi: uno preso non si ruba, libera lo restituisce
{
  const s = nuova(), m = ws('m'), b1 = ws('b1'), b2 = ws('b2')
  let col = [{ ws: m, ruolo: 'maestra' }]
  let r = L.entraBambino(s, col, b1, 'posto0001')
  col.push({ ws: b1, ruolo: 'bambino', posto: 'posto0001' })
  uguale('chi entra riceve lo stato con io null', dest(r, b1, 'stato')[0].io, null)
  controlla('la maestra vede il bambino collegato... (nessun nome ancora)', dest(r, m, 'alunni')[0].alunni.every(a => !a.collegato))
  r = L.daBambino(s, col, b1, 'posto0001', { k: 'sono', alunno: 'a1' })
  uguale('sceglie un nome: io è lui', dest(r, b1, 'stato')[0].io.id, 'a1')
  controlla('e la maestra lo vede collegato', dest(r, m, 'alunni')[0].alunni.find(a => a.id === 'a1').collegato)
  r = L.entraBambino(s, col, b2, 'posto0002'); col.push({ ws: b2, ruolo: 'bambino', posto: 'posto0002' })
  controlla('il secondo vede il nome già preso', dest(r, b2, 'stato')[0].alunni.find(a => a.id === 'a1').preso)
  r = L.daBambino(s, col, b2, 'posto0002', { k: 'sono', alunno: 'a1' })
  stessaLista('un nome preso non si ruba', dest(r, b2), [{ t: 'no', perche: 'preso' }])
  uguale('e resta di chi lo aveva', s.alunni[0].posto, 'posto0001')
  r = L.daBambino(s, col, b2, 'posto0002', { k: 'sono', alunno: 'inventato' })
  uguale('un nome che non c\'è: storto', dest(r, b2)[0].perche, 'storto')
  r = L.daMaestra(s, col, { k: 'libera', alunno: 'a1' })
  uguale('libera: il posto di prima torna alla lista', dest(r, b1, 'stato')[0].io, null)
  controlla('e il nome risulta libero a tutti', dest(r, b2, 'stato')[0].alunni.find(a => a.id === 'a1').preso === false)
  r = L.daBambino(s, col, b2, 'posto0002', { k: 'sono', alunno: 'a1' })
  uguale('adesso lo prende l\'altro', dest(r, b2, 'stato')[0].io.id, 'a1')
  // chi ha già un nome non ne prende un altro
  r = L.daBambino(s, col, b2, 'posto0002', { k: 'sono', alunno: 'a2' })
  uguale('un bambino con un nome non ne prende un secondo', dest(r, b2)[0].perche, 'storto')
  // un nome nuovo
  r = L.daBambino(s, col, b1, 'posto0001', { k: 'sono', nome: ' Giulia   B ' })
  const nuovo = s.alunni.at(-1)
  controlla('«non trovo il mio nome» crea un alunno nuovo con id n…', nuovo.nuovo && nuovo.id.startsWith('n') && nuovo.nome === 'Giulia B' && nuovo.posto === 'posto0001')
  controlla('la maestra lo vede nuovo', dest(r, m, 'alunni')[0].alunni.find(a => a.id === nuovo.id).nuovo)
  // togli: solo i nuovi
  r = L.daMaestra(s, col, { k: 'togli', alunno: 'a1' })
  controlla('togli non tocca un alunno della lista', s.alunni.some(a => a.id === 'a1') && r.invii.length === 0)
  r = L.daMaestra(s, col, { k: 'togli', alunno: nuovo.id })
  controlla('togli toglie un nuovo, e chi lo teneva torna alla lista', !s.alunni.some(a => a.id === nuovo.id) && dest(r, b1, 'stato')[0].io === null && r.elimina[0] === nuovo.id)
  // dieci nuovi al massimo
  for (let i = 0; i < L.MAX_NUOVI; i++) { const w = ws('x' + i), p = 'postoXXX' + i; L.daBambino(s, [...col, { ws: w, ruolo: 'bambino', posto: p }], w, p, { k: 'sono', nome: 'N' + i }) }
  const w = ws('x'), rr = L.daBambino(s, col, w, 'postoYYYY', { k: 'sono', nome: 'Undicesimo' })
  uguale('più di dieci nuovi: no', dest(rr, w)[0].perche, 'storto')
}

// le risposte: n progressivo, conferma idempotente, tetto, fasi
{
  const s = nuova(), m = ws('m'), b = ws('b')
  const col = [{ ws: m, ruolo: 'maestra' }, { ws: b, ruolo: 'bambino', posto: 'posto0001' }]
  L.daBambino(s, col, b, 'posto0001', { k: 'sono', alunno: 'a1' })
  const ris = n => ({ k: 'risposta', n, blocco: 0, chiave: 'c', fatto: '7x8', data: '56', attesa: '56', giusta: true, ms: 1200 })
  let r = L.daBambino(s, col, b, 'posto0001', ris(1))
  uguale('in attesa non si risponde', dest(r, b)[0].perche, 'storto')
  L.daMaestra(s, col, { k: 'via' })
  uguale('«via» cambia fase', s.fase, 'via')
  r = L.daBambino(s, col, b, 'posto0001', ris(1))
  stessaLista('la risposta presa è confermata', dest(r, b), [{ t: 'preso', n: 1 }])
  uguale('e la maestra la riceve, subito', dest(r, m, 'risposta')[0].alunno, 'a1')
  r = L.daBambino(s, col, b, 'posto0001', ris(1))
  stessaLista('rimandata dopo una caduta: solo la conferma', dest(r, b), [{ t: 'preso', n: 1 }])
  controlla('e la maestra non la riceve due volte', dest(r, m).length === 0 && s.risposte.a1.length === 1)
  L.daBambino(s, col, b, 'posto0001', ris(2))
  r = L.daBambino(s, col, b, 'posto0001', ris(1))
  controlla('una n più vecchia non si conta', s.risposte.a1.length === 2 && dest(r, m).length === 0)
  uguale('la ultima presa è 2', s.presi.posto0001, 2)
  uguale('lo stato la dice al rientro', L.msgStato(s, 'posto0001').preso, 2)
  // risposte storte
  r = L.daBambino(s, col, b, 'posto0001', { ...ris(3), blocco: 'zero' })
  stessaLista('blocco che non è un intero: storto, con la n', dest(r, b), [{ t: 'no', perche: 'storto', n: 3 }])
  controlla('blocco negativo o oltre 10000: storto', dest(L.daBambino(s, col, b, 'posto0001', { ...ris(3), blocco: -1 }), b)[0].perche === 'storto' && dest(L.daBambino(s, col, b, 'posto0001', { ...ris(3), blocco: 10001 }), b)[0].perche === 'storto')
  controlla('senza blocco: storto', dest(L.daBambino(s, col, b, 'posto0001', { ...ris(3), blocco: undefined }), b)[0].perche === 'storto')
  controlla('un blocco lontano (giri in tondo) passa', dest(L.daBambino(s, col, b, 'posto0001', { ...ris(3), blocco: 25 }), b)[0].t === 'preso')
  s.risposte.a1.pop(); s.presi.posto0001 = 2
  r = L.daBambino(s, col, b, 'posto0001', { ...ris(3), fatto: 'x'.repeat(41) })
  uguale('un testo troppo lungo: storto', dest(r, b)[0].perche, 'storto')
  r = L.daBambino(s, col, b, 'posto0001', { ...ris(3), ultima: 'no' })
  uguale('`ultima` che non è un sì o un no: storto', dest(r, b)[0].perche, 'storto')
  r = L.daBambino(s, col, b, 'posto0001', { ...ris(3), giusta: 'sì' })
  uguale('giusta non booleana: storto', dest(r, b)[0].perche, 'storto')
  uguale('niente di storto è entrato', s.risposte.a1.length, 2)
  // dove
  r = L.daBambino(s, col, b, 'posto0001', { k: 'dove', dove: 3 })
  uguale('«dove» arriva alla maestra', dest(r, m, 'alunni')[0].alunni.find(a => a.id === 'a1').dove, 3)
  uguale('«finito» è un «dove»', dest(L.daBambino(s, col, b, 'posto0001', { k: 'dove', dove: 'finito' }), m, 'alunni')[0].alunni[0].dove, 'finito')
  controlla('«dove» storto: negativo, oltre 10000, non intero, testo', ['boh', -1, 10001, 1.5, null].every(d => dest(L.daBambino(s, col, b, 'posto0001', { k: 'dove', dove: d }), b)[0]?.perche === 'storto'))
  // «Avanti tutti»
  uguale('all\'inizio avanti è 0', s.avanti, 0)
  r = L.daMaestra(s, col, { k: 'avanti' })
  uguale('avanti cresce di uno', s.avanti, 1)
  controlla('e lo sanno il bambino (stato) e la maestra', dest(r, b, 'stato')[0].avanti === 1 && dest(r, m, 'avanti')[0].avanti === 1)
  controlla('stato e tutto lo portano', L.msgStato(s, 'posto0001').avanti === 1 && L.msgTutto(s, col).avanti === 1)
  s.avanti = 999; L.daMaestra(s, col, { k: 'avanti' }); L.daMaestra(s, col, { k: 'avanti' })
  uguale('al più 1000', s.avanti, 1000)
  s.avanti = 1
  // chiusa
  r = L.daMaestra(s, col, { k: 'chiudi' })
  controlla('chiudi: tutti lo sanno', dest(r, m, 'fase')[0].fase === 'chiusa' && dest(r, b, 'stato')[0].fase === 'chiusa')
  r = L.daBambino(s, col, b, 'posto0001', ris(3))
  stessaLista('chiusa: la risposta è rifiutata', dest(r, b), [{ t: 'no', perche: 'chiusa', n: 3 }])
  uguale('e non entra', s.risposte.a1.length, 2)
  r = L.daBambino(s, col, ws('nuovo'), 'posto0009', { k: 'sono', alunno: 'a2' })
  uguale('chiusa: nemmeno un nome', r.invii[0].msg.perche, 'chiusa')
  r = L.daMaestra(s, col, { k: 'avanti' })
  controlla('chiusa: «avanti» non fa niente', r.invii.length === 0 && s.avanti === 1)
  controlla('chiusa non si riapre', L.daMaestra(s, col, { k: 'via' }).invii.length === 0 && s.fase === 'chiusa')
}

// in un gioco un colpo sbagliato lascia aperta la domanda: `ultima: false` arriva alla maestra, una risposta normale non lo porta
{
  const s = nuova(), m = ws('m'), b = ws('b')
  const col = [{ ws: m, ruolo: 'maestra' }, { ws: b, ruolo: 'bambino', posto: 'posto0001' }]
  L.daBambino(s, col, b, 'posto0001', { k: 'sono', alunno: 'a1' })
  L.daMaestra(s, col, { k: 'via' })
  const ris = n => ({ k: 'risposta', n, blocco: 0, chiave: 'c', fatto: '7x8', data: '54', attesa: '56', giusta: false, ms: 900 })
  let r = L.daBambino(s, col, b, 'posto0001', { ...ris(1), ultima: false })
  controlla('un colpo con la domanda ancora aperta arriva alla maestra col suo segno', dest(r, m, 'risposta')[0]?.r.ultima === false)
  r = L.daBambino(s, col, b, 'posto0001', ris(2))
  controlla('e una risposta normale non lo porta', !('ultima' in dest(r, m, 'risposta')[0].r))
}

// le risposte oltre il tetto e i risultati che restano
{
  const s = nuova(), b = ws('b')
  const col = [{ ws: b, ruolo: 'bambino', posto: 'posto0001' }]
  L.daBambino(s, col, b, 'posto0001', { k: 'sono', alunno: 'a1' })
  s.fase = 'via'
  let ultima
  for (let n = 1; n <= L.MAX_RISPOSTE + 5; n++) ultima = L.daBambino(s, col, b, 'posto0001', { k: 'risposta', n, blocco: 1, chiave: 'c', fatto: 'f', data: 'd', attesa: 'a', giusta: false, ms: 5 })
  uguale('al massimo 600 risposte per alunno', s.risposte.a1.length, L.MAX_RISPOSTE)
  stessaLista('oltre il tetto: ignorata ma confermata', ultima.invii.map(i => i.msg), [{ t: 'preso', n: L.MAX_RISPOSTE + 5 }])
  // la maestra che entra riceve tutto, anche a lezione chiusa
  s.fase = 'chiusa'
  const m = ws('m')
  const t = L.entraMaestra(s, [], m).invii[0].msg
  controlla('«tutto» ha fase, scadenza, alunni e risposte', t.t === 'tutto' && t.fase === 'chiusa' && t.scade === s.scade && t.alunni.length === 2 && t.risposte.a1.length === L.MAX_RISPOSTE)
  controlla('la chiave non viaggia mai (nemmeno l\'hash)', !JSON.stringify(t).includes('hash') && !JSON.stringify(L.msgStato(s, 'posto0001')).includes('hash'))
}

// collegamenti: il rientro sostituisce, l'uscita si vede
{
  const s = nuova(), m = ws('m'), b1 = ws('b1'), b1bis = ws('b1bis')
  let col = [{ ws: m, ruolo: 'maestra' }, { ws: b1, ruolo: 'bambino', posto: 'posto0001' }]
  L.daBambino(s, col, b1, 'posto0001', { k: 'sono', alunno: 'a1' })
  let r = L.entraBambino(s, col, b1bis, 'posto0001')
  stessaLista('chi rientra sostituisce il filo vecchio', r.sostituiti, [b1])
  uguale('e ritrova il suo nome', dest(r, b1bis, 'stato')[0].io.id, 'a1')
  r = L.esceBambino(s, col.filter(c => c.ws !== b1), 'posto0001')
  uguale('se esce l\'ultimo filo del posto la maestra lo vede scollegato', dest(r, m, 'alunni')[0].alunni.find(a => a.id === 'a1').collegato, false)
  r = L.esceBambino(s, [...col.filter(c => c.ws !== b1), { ws: b1bis, ruolo: 'bambino', posto: 'posto0001' }], 'posto0001')
  uguale('se è già rientrato non si dice niente', r.invii.length, 0)
}

// messaggi: forma e ritmo
{
  controlla('un messaggio giusto passa', L.leggiMessaggio('{"k":"via"}', [], 1000).ok)
  uguale('troppo grande: 1009', L.leggiMessaggio(JSON.stringify({ k: 'x', d: 'y'.repeat(L.MAX_BYTE) }), [], 1000).codice, 1009)
  uguale('non JSON: 1003', L.leggiMessaggio('boh', [], 1000).codice, 1003)
  uguale('senza k: 1003', L.leggiMessaggio('{"a":1}', [], 1000).codice, 1003)
  let recenti = [], ultimo
  for (let i = 0; i < L.MAX_AL_SECONDO + 1; i++) { ultimo = L.leggiMessaggio('{"k":"a"}', recenti, 5000 + i); if (ultimo.ok) recenti = ultimo.recenti }
  uguale('venti al secondo e non uno di più: 1008', ultimo.codice, 1008)
  controlla('dopo un secondo si riparte', L.leggiMessaggio('{"k":"a"}', recenti, 7000).ok)
  uguale('i tetti per indirizzo di una classe', [L.CODICI_SBAGLIATI_AL_MINUTO, L.LEZIONI_ORA, L.DURATA].join(), [60, 20, 10800000].join())
}
riassunto('scuola-servizio')
