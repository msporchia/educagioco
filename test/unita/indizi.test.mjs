/* ═══════════════════════════════════════════════════════════════════
   INDIZI — nessuno è superfluo, e la risposta è sempre una sola

   Il banco di prova (`strumenti/quiz/banco.mjs`, richiamato qui sotto)
   controlla la FORMA di una domanda: risposte doppie, scene senza
   pittore, varietà. Non può controllare la cosa che conta davvero per
   questo modulo — che il gruppo di indizi scelto sia MINIMO — perché
   quello non si legge dalla forma, si legge rigiocando la deduzione.

   Per questo `indizi.js` esporta anche `costruisciForme`/`costruisciCose`
   e `CONFIG_GRADI`: il materiale grezzo (le candidate sul tavolo, il
   bersaglio, gli indizi con la loro `verifica`) prima che diventi una
   `domanda()` scritta per un bambino. Qui si rigioca ESATTAMENTE quella
   costruzione, con la stessa `cfg` di ogni grado, e si controlla a forza
   bruta — proprio come fa il modulo — che:

     1. fra le candidate sul tavolo, il gruppo di indizi ne lasci in
        piedi UNA sola, ed è il bersaglio;
     2. togliendo uno qualunque degli indizi la risposta smetta di
        essere unica — se no quell'indizio non serviva a niente, ed è
        esattamente il difetto che il prototipo (`poc/indovinelli.html`)
        voleva impedire a monte invece di scoprire a valle.
   ═══════════════════════════════════════════════════════════════════ */
import { nota, controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { provaModulo } from '../../strumenti/quiz/banco.mjs'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'
import modulo, { costruisciForme, costruisciCose, CONFIG_GRADI } from '../../src/quiz/moduli/indizi.js'

/* ═══════════ 1. la forma: quello che il banco sa già controllare ═══════════ */
const banco = provaModulo(modulo, { tiri: 600 })
controlla('indizi: le domande stanno in piedi', banco.guasti.length === 0, banco.guasti.slice(0, 6).join(' | '))
for (const r of banco.righe) nota(`grado ${r.grado} — ${r.dice}: ${r.diverse} domande diverse`)

/* ═══════════ 2. quello che il banco non può sapere: nessun indizio superfluo ═══════════ */
function superstiti(candidati, indizi) {
  return candidati.filter(c => indizi.every(ind => ind.verifica(c)))
}

function provaMinimalita(nome, costruisci, giri) {
  let controllati = 0
  let senzaIndizi = 0
  let contoIndizi = new Map()
  for (const [grado, { famiglia, cfg }] of CONFIG_GRADI.entries()) {
    if (famiglia !== nome) continue
    for (let i = 0; i < giri; i++) {
      const sorte = new Sorte((grado + 1) * 92821 + i)
      const trovato = costruisci(sorte, cfg)
      const { candidati, bersaglio, indizi } = trovato

      if (!indizi.length) { senzaIndizi++; continue }
      contoIndizi.set(indizi.length, (contoIndizi.get(indizi.length) || 0) + 1)

      /* 1. il gruppo isola esattamente il bersaglio */
      const rimasti = superstiti(candidati, indizi)
      controlla(`${nome} grado ${grado + 1}: gli indizi isolano una sola candidata`,
        rimasti.length === 1,
        `ne restano ${rimasti.length} con [${indizi.map(x => x.testo).join(' · ')}]`)
      controlla(`${nome} grado ${grado + 1}: la candidata isolata è il bersaglio`,
        rimasti[0] === bersaglio)

      /* 2. NESSUN indizio è superfluo: toglierne uno qualunque fa
         tornare ambigua la risposta (o comunque non-unica) */
      for (let k = 0; k < indizi.length; k++) {
        const senza = indizi.filter((_, j) => j !== k)
        const conMeno = superstiti(candidati, senza)
        controlla(`${nome} grado ${grado + 1}: l'indizio «${indizi[k].testo}» non è superfluo`,
          conMeno.length !== 1,
          `tolto, resta comunque una sola candidata (${conMeno.length}) — indizio decorativo`)
      }
      controllati++
    }
  }
  uguale(`${nome}: nessuna costruzione è saltata`, senzaIndizi, 0)
  nota(`${nome}: ${controllati} domande rigiocate, indizi per gruppo: ` +
    [...contoIndizi.entries()].sort((a, b) => a[0] - b[0]).map(([n, q]) => `${n}→${q}`).join(' '))
}

provaMinimalita('forme', costruisciForme, 400)
provaMinimalita('cose', costruisciCose, 400)

/* ═══════════ 3. la stessa garanzia vale per le reti di sicurezza ═══════════
   `costruisciForme`/`costruisciCose` non tornano mai `null`: quando la
   forza bruta non trova niente in tempo c'è un ripiego. Il ripiego deve
   rispettare la stessa regola — nessun indizio inutile — non solo «non
   deve lanciare un'eccezione». Qui lo si forza a scattare sempre dando
   una `cfg` che la forza bruta normale non può soddisfare. */
{
  const cfgImpossibile = { nCandidati: 999, poolAssi: ['colore'], nAssi: 1, quantiProva: [1], filtro: null }
  const sorte = new Sorte(4)
  const { candidati, bersaglio, indizi } = costruisciForme(sorte, cfgImpossibile)
  controlla('forme: il ripiego produce comunque una domanda valida', candidati.length >= 2 && indizi.length > 0)
  const rimasti = superstiti(candidati, indizi)
  uguale('forme: il ripiego isola una sola candidata', rimasti.length, 1)
  uguale('forme: ed è il bersaglio', rimasti[0], bersaglio)
  for (let k = 0; k < indizi.length; k++) {
    const senza = indizi.filter((_, j) => j !== k)
    controlla(`forme: il ripiego non ha indizi superflui (${indizi[k].testo})`,
      superstiti(candidati, senza).length !== 1)
  }
}
{
  const cfgImpossibile = { nCandidati: 999, vicini: [0, 0], soloConcreti: true, quantiProva: [1] }
  const sorte = new Sorte(4)
  const { candidati, bersaglio, indizi } = costruisciCose(sorte, cfgImpossibile)
  controlla('cose: il ripiego produce comunque una domanda valida', candidati.length >= 2 && indizi.length > 0)
  const rimasti = superstiti(candidati, indizi)
  uguale('cose: il ripiego isola una sola candidata', rimasti.length, 1)
  uguale('cose: ed è il bersaglio', rimasti[0], bersaglio)
  for (let k = 0; k < indizi.length; k++) {
    const senza = indizi.filter((_, j) => j !== k)
    controlla(`cose: il ripiego non ha indizi superflui (${indizi[k].testo})`,
      superstiti(candidati, senza).length !== 1)
  }
}

/* ═══════════ 4. il caso è ripetibile ═══════════ */
{
  const a = modulo.chiedi(3, new Sorte(55))
  const b = modulo.chiedi(3, new Sorte(55))
  uguale('stesso seme, stessa domanda', JSON.stringify(a), JSON.stringify(b))
}

riassunto('gli indizi: nessuno superfluo, la risposta sempre una sola')
