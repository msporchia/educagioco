/* ═══════════════════════════════════════════════════════════════════
   L'INTERFACCIA UNICA PER PERSONALIZZARE — docs/core/personalizza.md

   Il modello di Personalizza.vue (personalizza-pura.js), senza Vue.
   Il contratto: UN'INTERAZIONE MODIFICA SOLO LE ZONE SOTTO. Per tocchi
   a ogni livello (oggetto, forma, colore, acquisto, set) le zone sopra
   restano con gli stessi elementi, nello stesso ordine. Poi i prezzi,
   la scelta che torna valida quando quella sopra cambia, e i set.
   (Le posizioni a schermo le prova `integrazione/sotterraneo-personaggio`.)
   ═══════════════════════════════════════════════════════════════════ */
import { STATO_NUOVO, MAX_SET, tocca, zone, costo, costoSet, conto, valoreDi, conForma, mancantiDi, postoPerSalvare, righeDelPannello } from '../../src/components/personalizza/personalizza-pura.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

// un catalogo di prova, come quello della contadina nel mock (poc/personalizza/scenari.js)
const C = (id, prezzo, extra = {}) => ({ id, nome: id, css: '#000', ...(prezzo ? { prezzo } : {}), ...extra })
const DATI = {
  livello: 8, saldo: 60,
  schede: [{ id: 'cappelli', nome: 'Cappelli', tipo: 'oggetti' }, { id: 'aspetto', nome: 'Aspetto', tipo: 'oggetti' }, { id: 'set', nome: 'Set', tipo: 'set' }],
  voci: [
    { id: 'cappello', scheda: 'cappelli', posto: 'testa', nome: 'Cappello', posseduto: true, prezzoColore: 4,
      forme: [{ id: 'paglia', nome: 'Paglia' }, { id: 'tesa', nome: 'Tesa larga', prezzo: 6 }, { id: 'cowboy', nome: 'Cowboy', liv: 12, colori: [C('marrone'), C('nero')] }],
      colori: [C('naturale'), C('rosso'), C('blu')] },
    { id: 'cilindro', scheda: 'cappelli', posto: 'testa', nome: 'Cilindro', prezzo: 18, prezzoColore: 4, colori: [C('nero'), C('viola'), C('oro', 10)] },
    { id: 'corona', scheda: 'cappelli', posto: 'testa', nome: 'Corona', prezzo: 30, liv: 14 },
    { id: 'niente', scheda: 'cappelli', posto: 'testa', nome: 'Nessuno', niente: true },
    { id: 'pelle', scheda: 'aspetto', posto: 'pelle', nome: 'Pelle', tratto: true, colori: [C('chiara'), C('ambra'), C('scura')] },
  ],
  indossato: { testa: { oggetto: 'cappello', forma: 'paglia', colore: 'naturale' }, pelle: { oggetto: 'pelle', forma: null, colore: 'chiara' } },
  setGioco: [{ id: 'festa', nome: 'Festa', prezzo: 20, pezzi: { testa: { oggetto: 'cilindro', forma: null, colore: 'viola' } } }],
  mieiSet: [{ posto: 0, nome: 'Il solito', pezzi: { testa: { oggetto: 'cappello', forma: 'paglia', colore: 'naturale' } } },
    { posto: 2, nome: 'Rodeo', pezzi: { testa: { oggetto: 'cappello', forma: 'cowboy', colore: 'marrone' }, pelle: { oggetto: 'pelle', forma: null, colore: 'ambra' } } }],
}
const LIVELLI = ['schede', 'griglia', 'forme', 'colori']
const firma = (dati, stato) => { const z = zone(dati, stato); return { schede: z.schede, griglia: z.griglia, forme: z.pannello.forme, colori: z.pannello.colori } }
/** Un tocco al livello `liv`: le zone sopra di lui restano con gli stessi elementi, nello stesso ordine. */
function sopraFermo(cosa, dati, stato, ev, liv) {
  const prima = firma(dati, stato), { stato: dopo } = tocca(dati, stato, ev), ora = firma(dati, dopo)
  for (const z of LIVELLI.slice(0, LIVELLI.indexOf(liv) + 1)) stessaLista(`${cosa}: «${z}» non cambia`, ora[z], prima[z])
  return dopo
}

// ── il contratto: un tocco cambia solo le zone sotto ──
let st = { ...STATO_NUOVO(DATI.schede), scheda: 'cappelli' }
st = sopraFermo('toccare un oggetto', DATI, st, { tipo: 'voce', id: 'cilindro' }, 'griglia')
st = sopraFermo('toccare un colore del cilindro', DATI, st, { tipo: 'colore', id: 'viola' }, 'colori')
st = sopraFermo('toccare il cappello', DATI, st, { tipo: 'voce', id: 'cappello' }, 'griglia')
st = sopraFermo('toccare una forma', DATI, st, { tipo: 'forma', id: 'tesa' }, 'forme')
st = sopraFermo('toccare un colore della tesa', DATI, st, { tipo: 'colore', id: 'blu' }, 'colori')
st = sopraFermo('una forma bloccata', DATI, st, { tipo: 'forma', id: 'cowboy' }, 'forme')
st = sopraFermo('rimettere la forma di prima (toglie la prova)', DATI, st, { tipo: 'forma', id: 'paglia' }, 'forme')
st = sopraFermo('«Nessuno»', DATI, st, { tipo: 'voce', id: 'niente' }, 'griglia')
st = sopraFermo('un oggetto bloccato', DATI, st, { tipo: 'voce', id: 'corona' }, 'griglia')
st = sopraFermo('un tratto (si apre e basta)', DATI, { ...st, scheda: 'aspetto' }, { tipo: 'voce', id: 'pelle' }, 'griglia')
let ss = { ...STATO_NUOVO(DATI.schede), scheda: 'set' }
ss = sopraFermo('un set salvato', DATI, ss, { tipo: 'set-mio', posto: 2 }, 'griglia')
ss = sopraFermo('un set del gioco', DATI, ss, { tipo: 'set-gioco', id: 'festa' }, 'griglia')
ss = sopraFermo('«Salva questo set»', DATI, ss, { tipo: 'salva' }, 'griglia')
// cambiare scheda cambia tutto sotto, niente sopra; e l'ordine dei tocchi su zone indipendenti non conta
sopraFermo('cambiare scheda', DATI, st, { tipo: 'scheda', id: 'set' }, 'schede')
const giro = evs => evs.reduce((s, ev) => tocca(DATI, s, ev).stato, { ...STATO_NUOVO(DATI.schede), scheda: 'cappelli' })
const a = giro([{ tipo: 'voce', id: 'cilindro' }, { tipo: 'colore', id: 'viola' }, { tipo: 'scheda', id: 'aspetto' }, { tipo: 'voce', id: 'pelle' }, { tipo: 'scheda', id: 'cappelli' }])
const b = giro([{ tipo: 'scheda', id: 'aspetto' }, { tipo: 'voce', id: 'pelle' }, { tipo: 'scheda', id: 'cappelli' }, { tipo: 'voce', id: 'cilindro' }, { tipo: 'colore', id: 'viola' }])
uguale('lo stesso stato finale in qualunque ordine', JSON.stringify(a.prova), JSON.stringify(b.prova))

// ── la scelta sotto torna valida quando quella sopra cambia ──
const cap = DATI.voci[0]
uguale('un oggetto toccato parte dalla prima forma e dal primo colore', JSON.stringify(valoreDi(DATI.voci[1], DATI.indossato.testa)), JSON.stringify({ oggetto: 'cilindro', forma: null, colore: 'nero' }))
uguale('con l\'oggetto addosso, com\'è addosso', valoreDi(cap, DATI.indossato.testa).forma, 'paglia')
uguale('un\'altra forma tiene il colore se ce l\'ha', conForma(cap, { oggetto: 'cappello', forma: 'paglia', colore: 'blu' }, 'tesa').colore, 'blu')
uguale('se no torna al primo colore della forma', conForma(cap, { oggetto: 'cappello', forma: 'paglia', colore: 'blu' }, 'cowboy').colore, 'marrone')
stessaLista('i colori del pannello sono quelli della forma', zone(DATI, { ...STATO_NUOVO(DATI.schede), prova: { testa: { oggetto: 'cappello', forma: 'cowboy', colore: 'marrone' } } }).pannello.colori, ['marrone', 'nero'])
stessaLista('«Nessuno» non ha forme né colori', [...zone(DATI, { ...STATO_NUOVO(DATI.schede), aperto: { cappelli: 'niente' } }).pannello.forme, ...zone(DATI, { ...STATO_NUOVO(DATI.schede), aperto: { cappelli: 'niente' } }).pannello.colori], [])
stessaLista('un oggetto con una forma sola non ha la riga delle forme', zone(DATI, { ...STATO_NUOVO(DATI.schede), aperto: { cappelli: 'cilindro' } }).pannello.forme, [])

// ── i prezzi ──
uguale('quello che è tuo non costa', costo(cap, DATI.indossato.testa, 8).tot, 0)
uguale('un altro colore di un oggetto tuo costa il prezzo del colore', costo(cap, { oggetto: 'cappello', forma: 'paglia', colore: 'rosso' }, 8).tot, 4)
uguale('un\'altra forma ha il suo prezzo', costo(cap, { oggetto: 'cappello', forma: 'tesa', colore: 'naturale' }, 8).tot, 6)
uguale('chi compra prende l\'oggetto nel colore che prova', costo(DATI.voci[1], { oggetto: 'cilindro', forma: null, colore: 'viola' }, 8).tot, 18)
uguale('un colore speciale si paga anche al primo acquisto', costo(DATI.voci[1], { oggetto: 'cilindro', forma: null, colore: 'oro' }, 8).tot, 28)
uguale('un pezzo di un livello che non hai è bloccato', costo(cap, { oggetto: 'cappello', forma: 'cowboy', colore: 'marrone' }, 8).liv, 12)
uguale('un set costa il suo prezzo se è meno della somma', costoSet(DATI, DATI.setGioco[0]).tot, 18)
let s1 = tocca(DATI, { ...STATO_NUOVO(DATI.schede), scheda: 'cappelli' }, { tipo: 'voce', id: 'cilindro' })
uguale('provare una cosa da pagare la mette in prova', s1.eventi[0][0], 'prova')
uguale('e il conto lo dice', conto(DATI, s1.stato).tot, 18)
const pagato = tocca(DATI, s1.stato, { tipo: 'paga' })
uguale('«Acquista e indossa» manda l\'acquisto', pagato.eventi[0][0], 'acquista')
uguale('col totale', pagato.eventi[0][1].totale, 18)
uguale('e la prova si svuota', Object.keys(pagato.stato.prova).length, 0)
uguale('quello che è tuo si sceglie subito', tocca(DATI, { ...STATO_NUOVO(DATI.schede), scheda: 'cappelli' }, { tipo: 'colore', id: 'naturale' }).eventi[0][0], 'scegli')
const povero = { ...DATI, saldo: 5 }
uguale('senza monete non si paga', tocca(povero, s1.stato, { tipo: 'paga' }).eventi.length, 0)

// ── i set ──
uguale('i miei set hanno sei posti', zone(DATI, { ...STATO_NUOVO(DATI.schede), scheda: 'set' }).griglia.filter(x => x.startsWith('mio:')).length, MAX_SET)
uguale('si salva nel primo posto libero', postoPerSalvare(DATI, STATO_NUOVO(DATI.schede)), 1)
uguale('o in quello toccato', postoPerSalvare(DATI, { ...STATO_NUOVO(DATI.schede), setAperto: 2 }), 2)
const pieni = { ...DATI, mieiSet: Array.from({ length: MAX_SET }, (_, i) => ({ posto: i, nome: 'x', pezzi: {} })) }
uguale('coi sei posti pieni bisogna toccarne uno', postoPerSalvare(pieni, STATO_NUOVO(DATI.schede)), null)
uguale('un set col cowboy (livello 12) ha un pezzo che manca', mancantiDi(DATI, DATI.mieiSet[1]), 1)
const ind = tocca(DATI, { ...STATO_NUOVO(DATI.schede), scheda: 'set' }, { tipo: 'set-mio', posto: 2 }).eventi[0]
uguale('indossarlo mette il resto', JSON.stringify([ind[0], Object.keys(ind[1].pezzi), ind[1].saltati]), JSON.stringify(['indossa-set', ['pelle'], 1]))
let sv = tocca(DATI, STATO_NUOVO(DATI.schede), { tipo: 'salva' }).stato
uguale('salvare chiede il nome, con uno proposto', sv.nomina.nome, 'Il mio set 2')
const salvato = tocca(DATI, sv, { tipo: 'nome-ok', nome: '  Domenica in festa con la nonna  ' }).eventi[0]
uguale('e salva quello che si ha addosso, col nome corto', JSON.stringify([salvato[0], salvato[1].posto, salvato[1].nome, salvato[1].pezzi.testa.oggetto]), JSON.stringify(['salva-set', 1, 'Domenica in fest', 'cappello']))
const via1 = tocca(DATI, { ...STATO_NUOVO(DATI.schede), setAperto: 0 }, { tipo: 'togli' })
uguale('togliere chiede un secondo tocco', via1.eventi.length, 0)
uguale('al secondo si toglie', tocca(DATI, via1.stato, { tipo: 'togli' }).eventi[0][0], 'togli-set')

// ── il pannello è alto uguale per tutta la scheda ──
const r = righeDelPannello({ ...DATI, voci: [...DATI.voci, { id: 'lunga', scheda: 'cappelli', posto: 'testa', nome: 'l', forme: Array.from({ length: 8 }, (_, i) => ({ id: 'f' + i, nome: 'f' })) }] }, 'cappelli', 5, 6)
uguale('otto forme con cinque per riga: due righe per tutta la scheda', r.forme, 2)
controlla('i colori stanno in una riga', r.colori === 1)

riassunto('l\'interfaccia unica per personalizzare')
