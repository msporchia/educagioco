// Il giocatore finto in due (docs/sotterraneo/in-due.md): due (o più) eroi nella stessa discesa, mossi a fette di tempo come col
// lockstep, senza rete. Il primo va alla chiave e poi alla scala; gli altri lo seguono, e tutti vanno alla scala quando qualcuno
// aspetta lì. Ogni foglio lo sbriga chi l'ha aperto, coi conti del banco di sempre (`sbriga`); nello scontro risponde chi tocca.
// Serve ai test e ai bambini finti della rete (test/aiuto/sfide/sotterraneo.mjs). Gira in Node.
import { Corsa } from './corsa.js'
import { seminato } from './livello.js'
import { sbriga } from './banco.js'
import { viaVerso, percorso } from '../../../motore/passi.js'

export const FETTA = 0.05            // il passo del lockstep
const TETTO_FETTE = 200000           // ~3 ore di gioco: oltre, la discesa non finisce
const TETTO_PROVE = 40               // quante volte si riprova la stessa meta senza che succeda niente
const VICINO = 3                     // il compagno si riavvicina quando è più lontano di così

const cellaDi = e => ({ x: Math.floor(e.x), y: Math.floor(e.y) })

// dove andare per arrivare a `r`: dritto se si passa, se no la prima porta chiusa o il primo mostro che dorme sulla strada sgombra
function versoDi(corsa, r) {
  const da = cellaDi(corsa.eroe)
  if (viaVerso(corsa.buona(), r, da, { sopra: ['scala', 'fonte'].includes(r.che) })) return r
  const sgombro = percorso((x, y) => corsa.livello.calpestabile(x, y), da, { x: r.x, y: r.y })
  if (!sgombro) return null
  for (const c of sgombro) {
    const v = corsa.livello.robe.find(q => q.x === c.x && q.y === c.y && !q.morto && !q.presa && (q.che === 'mostro' || (q.che === 'porta' && !q.aperta)))
    if (v) return v
  }
  return null
}

// la meta dell'alleato `i`, libero e fermo
function metaDi(corsa, i) {
  const robe = corsa.livello.robe
  const scala = robe.find(r => r.che === 'scala')
  const qualcunoAspetta = corsa.persone.some(p => p.foglio && p.foglio.che === 'aspetta' && p.foglio.perche === 'scala')
  if (qualcunoAspetta && scala) return scala
  if (i > 0) {
    const primo = corsa.persone[0].eroe
    return Math.abs(primo.x - corsa.eroe.x) > VICINO || Math.abs(primo.y - corsa.eroe.y) > VICINO ? { che: 'compagno', ...cellaDi(primo) } : null
  }
  if (!corsa.chiaveDelPiano) return robe.find(r => r.che === 'mostro' && r.chiave && !r.morto) || null
  return scala || null
}

export function giocaInDue(tappa, { eroi = ['cavaliere', 'mago'], roba = [], crescite = [], nomi = [], seme = 7, bravura = 0.8, tetto = TETTO_FETTE } = {}) {
  const sorte = seminato(seme * 31 + 17)
  const corsa = new Corsa(tappa, { seme, rnd: seminato(seme * 7 + 3), eroe: eroi[0], roba: roba[0] || null, crescita: crescite[0] || null })
  corsa.persona.nome = nomi[0] || 'il primo'
  for (let i = 1; i < eroi.length; i++) corsa.aggiungiAlleato({ eroe: eroi[i], roba: roba[i] || null, crescita: crescite[i] || null, nome: nomi[i] || `il ${i + 1}°` })
  const conto = { fonti: 0, pozioni: 0, scale: [] }
  const prove = new Map()
  const turni = corsa.persone.map(() => 0)
  let fette = 0
  while (!corsa.finita && fette++ < tetto) {
    // i fogli: ognuno il suo; nello scontro solo chi ha la domanda (o lo stop del pericolo)
    for (let i = 0; i < corsa.persone.length && !corsa.finita; i++) corsa.come(i, () => {
      const f = corsa.foglio
      if (!f || f.che === 'aspetta') return
      if (f.che === 'scontro') {
        if (!corsa.chiesta && !f.pericolo) return
        turni[i]++
      }
      sbriga(corsa, bravura, sorte, conto)
    })
    if (corsa.finita) break
    // chi è libero e fermo sceglie dove andare
    if (!corsa.scontroAperto()) for (let i = 0; i < corsa.persone.length; i++) corsa.come(i, () => {
      if (corsa.foglio || corsa.strada) return
      const meta = metaDi(corsa, i)
      if (!meta) return
      if (meta.che === 'compagno') { corsa.vaiVerso(meta, false); return }
      const dove = versoDi(corsa, meta)
      if (!dove) return
      const k = `${corsa.piano}:${dove.x},${dove.y}:${i}`
      prove.set(k, (prove.get(k) || 0) + 1)
      if (prove.get(k) > TETTO_PROVE) return
      // prima accanto (da lontano la cosa può essere al buio, e il tocco non la prende), poi la si tocca
      const via = viaVerso(corsa.buona(), dove, cellaDi(corsa.eroe), { sopra: ['scala', 'fonte'].includes(dove.che) })
      if (via && via.strada && via.strada.length) corsa.vaiVerso(via.dove, false)
      else corsa.vaiVerso({ x: dove.x, y: dove.y }, true)
    })
    corsa.passo(FETTA)
  }
  return {
    corsa, esito: corsa.esito, turni, fette,
    persone: corsa.persone.map(p => ({ eroe: p.chiEro, nome: p.nome, vita: p.vita, esp: p.espPresa, domande: p.domande, giuste: p.giuste, svenimenti: p.svenimenti })),
    guasto: corsa.finita ? null : 'la discesa in due non finisce',
  }
}
