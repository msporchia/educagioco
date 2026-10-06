/* Il piano del Generale lasciato a metà: si scrive, si rilegge, ed è lo
   stesso piano — con l'aiuto che ci ha scritto dentro, chi si stava
   comandando e quale battaglia si guardava. Vedi docs/generale/lasciare-a-meta.md.
   `node test/esegui.mjs generale-sosta --niente-build` */
import { LIVELLI } from '../../src/data/generale.js'
import { scrivi, leggi, dice, VERSIONE } from '../../src/motore/generale/sosta.js'
import { laSoluzione } from '../../src/views/generale/piano.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const passa = d => JSON.parse(JSON.stringify(d))
const liv = LIVELLI.find(l => l.id === 'attesa')
const altro = LIVELLI.find(l => l.id === 'due-strade')
const soluzione = laSoluzione(liv).piano
// un piano a metà: la soluzione con un ordine ancora senza bersaglio
const aMeta = { ...passa(soluzione), eroe: [...passa(soluzione).eroe, { verbo: 'vai' }] }

/* ══════════ 1. quello che si è scritto non si perde ══════════ */
{
  const dato = passa(scrivi({ piano: aMeta, svelato: 'svela', unita: 'eroe', scena: 2 }, liv))
  uguale('il salvataggio dice la sua versione', dato.v, VERSIONE)
  uguale('e di quale livello è', dato.id, liv.id)
  const r = leggi(dato, liv)
  controlla('si rilegge', !!r)
  const fila = p => JSON.stringify([p.cava, p.eroe])
  uguale('il piano è lo stesso, anche l\'ordine a metà', fila(r.piano), fila(aMeta))
  uguale('l\'aiuto scritto nel piano resta: uscire non ridà la stella', r.svelato, 'svela')
  uguale('si comanda chi si comandava', r.unita, 'eroe')
  uguale('e si guarda la battaglia di prima', r.scena, 2)
  uguale('l\'elenco dice quanti ordini', dice(dato).testo, '5 ordini scritti')
  // la rilettura non si porta dietro il salvataggio: cambiare il piano non lo tocca
  r.piano.eroe.push({ verbo: 'apri' })
  uguale('il piano riletto è una copia', dato.piano.eroe.length, 2)
}

/* ══════════ 2. quello che non è successo, o è finito, non si scrive ══════════ */
{
  const vuoto = { cava: [], eroe: [] }
  uguale('un piano vuoto e niente aiuti: niente da tenere', scrivi({ piano: vuoto }, liv), null)
  controlla('la soluzione vista resta anche a piano svuotato',
            !!scrivi({ piano: vuoto, svelato: 'svela' }, liv))
  uguale('una partita vinta toglie il piano a metà', scrivi({ piano: aMeta, vinto: true }, liv), null)
}

/* ══════════ 3. quello che non torna si butta ══════════ */
{
  const buono = passa(scrivi({ piano: aMeta }, liv))
  const con = f => { const d = passa(buono); f(d); return leggi(d, liv) }
  uguale('un\'altra versione', con(d => { d.v = VERSIONE + 1 }), null)
  uguale('un altro livello', leggi(buono, altro), null)
  uguale('un\'unità che il livello non ha più', con(d => { d.piano.fantasma = [] }), null)
  uguale('un verbo che non esiste', con(d => { d.piano.eroe.push({ verbo: 'vola' }) }), null)
  uguale('un blocco che non esiste', con(d => { d.piano.eroe.push({ blocco: 'salta' }) }), null)
  uguale('una cosa che sulla mappa non c\'è',
         con(d => { d.piano.eroe.push({ verbo: 'prendi', complemento: 'luna' }) }), null)
  uguale('un aiuto che non è un gradino', con(d => { d.svelato = 'tutto' }), null)
  uguale('una lista che non è una lista', con(d => { d.piano.eroe = 'apri' }), null)
  uguale('una battaglia che non c\'è riparte dalla prima', con(d => { d.scena = 9 }).scena, 0)
  uguale('niente da leggere', leggi(null, liv), null)
}

/* ══════════ 4. ogni livello regge il giro con la sua soluzione ══════════ */
for (const l of LIVELLI) {
  const s = laSoluzione(l)
  if (!s) continue
  const r = leggi(passa(scrivi({ piano: s.piano }, l)), l)
  controlla(`«${l.nome}»: la soluzione scritta si rilegge`, !!r && Object.keys(s.piano)
    .every(id => JSON.stringify(r.piano[id]) === JSON.stringify(s.piano[id])))
}

riassunto('generale — il piano lasciato a metà')
