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
import modulo, { costruisciForme, costruisciCose, costruisciTabella, cfgTabella, CONFIG_GRADI, CONFIG_TABELLA } from '../../src/quiz/moduli/indizi.js'

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

/* ═══════════ 4. la tabella: rigiocata leggendo il testo ═══════════
   Per la tabella, la fila e le due cose collegate il modulo ha un
   risolutore suo, e controllare il modulo col suo stesso risolutore
   direbbe poco. Qui il testo scritto per il bambino si **rilegge** —
   frase per frase, con le forme che un bambino leggerebbe — si
   rimettono in piedi tutte le sistemazioni possibili, e si controlla:

     1. che quelle che reggono a tutti gli indizi siano UNA, e che la
        risposta letta così sia quella buona (niente due risposte
        difendibili: il testo dice quello che il modulo crede);
     2. che ogni indizio serva alla domanda: tolto, la risposta non è
        più una sola;
     3. che la risposta non stia scritta pari pari in un indizio;
     4. che ogni falso sia una delle risposte possibili, abbia il suo
        `perche`, e che quasi sempre quel perché nomini un indizio;
     5. che la domanda resti corta: è il pedaggio di una porta. */
function permutazioni(n) {
  if (n === 1) return [[0]]
  return permutazioni(n - 1).flatMap(p => [...Array(n).keys()].map(i => [...p.slice(0, i), n - 1, ...p.slice(i)]))
}
const scampa = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/* Legge una tabella dal testo e torna { vincoli, domanda }. Un vincolo
   è una funzione su una sistemazione `s` (per cosa `a`, `s[a][persona]`
   è il valore); la domanda è una funzione che legge la risposta — come
   la leggerebbe il bambino, cioè come testo o emoji di un tasto. */
function leggiTabella(t) {
  const righe = t.righe
  const nomi = t.persone.map(p => p.nome)
  const P = `(${nomi.map(scampa).join('|')})`
  const pi = n => nomi.indexOf(n)
  const nascosti = []
  const vincoli = []
  let domanda = null
  if (!t.temi.length) {
    const n = nomi.length
    const posto = { primo: 0, prima: 0, secondo: 1, seconda: 1, terzo: 2, terza: 2, quarto: 3, quarta: 3 }
    for (const r of righe.slice(1, -1)) {
      let m
      if ((m = r.match(new RegExp(`^${P} (non )?è (?:il|la) (primo|prima)\\.$`)))) {
        const p = pi(m[1]); const no = !!m[2]; vincoli.push(s => (s[0][p] === 0) !== no)
      } else if ((m = r.match(new RegExp(`^${P} (non )?è l'ultim[oa]\\.$`)))) {
        const p = pi(m[1]); const no = !!m[2]; vincoli.push(s => (s[0][p] === n - 1) !== no)
      } else if ((m = r.match(new RegExp(`^${P} sta in mezzo\\.$`)))) {
        const p = pi(m[1]); vincoli.push(s => s[0][p] === 1)
      } else if ((m = r.match(new RegExp(`^${P} è subito dopo ${P}\\.$`)))) {
        const p = pi(m[1]); const q = pi(m[2]); vincoli.push(s => s[0][p] === s[0][q] + 1)
      } else if ((m = r.match(new RegExp(`^${P} è subito prima di ${P}\\.$`)))) {
        const p = pi(m[1]); const q = pi(m[2]); vincoli.push(s => s[0][q] === s[0][p] + 1)
      } else if ((m = r.match(new RegExp(`^${P} e ${P} non sono vicin[ie]\\.$`)))) {
        const p = pi(m[1]); const q = pi(m[2]); vincoli.push(s => Math.abs(s[0][p] - s[0][q]) !== 1)
      } else nascosti.push(r)
    }
    const d = righe.at(-1)
    let m
    if (d === 'Chi è il primo della fila?') domanda = s => nomi[s[0].indexOf(0)]
    else if (d === "Chi è l'ultimo della fila?") domanda = s => nomi[s[0].indexOf(n - 1)]
    else if (d === 'Chi sta in mezzo?') domanda = s => nomi[s[0].indexOf(1)]
    else if ((m = d.match(/^Chi è il (secondo|terzo) della fila\?$/))) { const i = posto[m[1]]; domanda = s => nomi[s[0].indexOf(i)] }
    else if ((m = d.match(new RegExp(`^In che posto della fila è ${P}\\?$`)))) {
      const p = pi(m[1]); const f = t.persone[p].g === 'f'
      domanda = s => [f ? 'prima' : 'primo', f ? 'seconda' : 'secondo', f ? 'terza' : 'terzo', f ? 'quarta' : 'quarto'][s[0][p]]
    }
    /* la fila non è nell'ordine in cui la si elenca: la prima riga lo dice */
    controlla('fila: la prima riga non è già la risposta', t.soluzione[0].some((pos, p) => pos !== p))
    return { vincoli, domanda, nascosti, cose: 1 }
  }

  /* le cose: ogni oggetto, con l'articolo, porta la sua cosa e il suo valore */
  const oggetti = t.temi.flatMap((T, a) => T.voci.map((v, i) => ({ a, v: i, ogg: v.ogg, risp: v.em || v.nudo })))
  const O = `(${oggetti.map(o => scampa(o.ogg)).join('|')})`
  const og = x => oggetti.find(o => o.ogg === x)
  const V = `(${[...new Set(t.temi.flatMap(T => [T.verbo, T.verboPl]))].map(scampa).join('|')})`
  for (const r of righe.slice(1, -1)) {
    let m
    if ((m = r.match(new RegExp(`^Né ${P} né ${P} ${V} ${O}\\.$`)))) {
      const [p, q, o] = [pi(m[1]), pi(m[2]), og(m[4])]; vincoli.push(s => s[o.a][p] !== o.v && s[o.a][q] !== o.v)
    } else if ((m = r.match(new RegExp(`^Chi ${V} ${O} (non )?${V} ${O}\\.$`)))) {
      const [x, no, y] = [og(m[2]), !!m[3], og(m[5])]
      vincoli.push(s => (s[y.a][s[x.a].indexOf(x.v)] === y.v) !== no)
    } else if ((m = r.match(new RegExp(`^${P} non ${V} né ${O} né ${O}\\.$`)))) {
      const [p, x, y] = [pi(m[1]), og(m[3]), og(m[4])]; vincoli.push(s => s[x.a][p] !== x.v && s[y.a][p] !== y.v)
    } else if ((m = r.match(new RegExp(`^${P} (non )?${V} ${O}\\.$`)))) {
      const [p, no, o] = [pi(m[1]), !!m[2], og(m[4])]; vincoli.push(s => (s[o.a][p] === o.v) !== no)
    } else nascosti.push(r)
  }
  const d = righe.at(-1)
  let m
  if ((m = d.match(new RegExp(`^Chi ${V} ${O}\\?$`)))) {
    const o = og(m[2]); domanda = s => nomi[s[o.a].indexOf(o.v)]
  } else if ((m = d.match(new RegExp(`^Che \\S+ ${V} chi ${V} ${O}\\?$`)))) {
    const o = og(m[3]); const b = 1 - o.a
    domanda = s => oggetti.find(x => x.a === b && x.v === s[b][s[o.a].indexOf(o.v)]).risp
  } else if ((m = d.match(new RegExp(`^Che (\\S+(?: \\S+)?) ${V} ${P}\\?$`)))) {
    const p = pi(m[3])
    const a = t.temi.findIndex(T => T.chiedi === `Che ${m[1]} ${m[2]}`)
    if (a >= 0) domanda = s => oggetti.find(x => x.a === a && x.v === s[a][p]).risp
  }
  return { vincoli, domanda, nascosti, cose: t.temi.length }
}

function provaTabella(grado, cfg, giri, etichetta = `grado ${grado}`) {
  const storte = { nascosti: [], unica: [], serve: [], scritta: [], falsi: [], lunga: [], forme: [] }
  let senzaIndizio = 0
  let totFalsi = 0
  let ripieghi = 0
  const diverse = new Set()
  for (let k = 0; k < giri; k++) {
    const t = costruisciTabella(new Sorte((grado + 1) * 7919 + k), cfg)
    if (t.ripiego) ripieghi++
    diverse.add(t.righe.join('|'))
    const { vincoli, domanda, nascosti, cose } = leggiTabella(t)
    if (nascosti.length || !domanda) { storte.nascosti.push(nascosti[0] || t.righe.at(-1)); continue }

    const perm = permutazioni(t.persone.length)
    const tutte = cose === 1 ? perm.map(p => [p]) : perm.flatMap(p => perm.map(q => [p, q]))
    const reggono = vv => tutte.filter(s => vv.every(v => v(s)))

    const qui = reggono(vincoli)
    const buona = t.buona.emoji || t.buona.testo
    if (qui.length !== 1 || domanda(qui[0]) !== buona)
      storte.unica.push(`${t.righe.join(' / ')} → ${qui.length} sistemazioni, letta «${qui[0] && domanda(qui[0])}» invece di «${buona}»`)

    for (let i = 0; i < vincoli.length; i++) {
      const risposte = new Set(reggono(vincoli.filter((_, j) => j !== i)).map(domanda))
      if (risposte.size < 2) storte.serve.push(`«${t.righe[i + 1]}» non serve a «${t.righe.at(-1)}»`)
    }

    if (t.indizi.some(i => i.lega.some(([x, y]) => [x, y].includes(t.domanda.da) && [x, y].includes(t.giusta))))
      storte.scritta.push(t.righe.join(' / '))

    const possibili = new Set(t.domanda.opzioni.map(o => o.risposta.emoji || o.risposta.testo))
    if (t.falsi.length !== possibili.size - 1 ||
        t.falsi.some(f => !f.perche || !possibili.has(f.emoji || f.testo) || (f.emoji || f.testo) === buona))
      storte.falsi.push(t.righe.join(' / '))
    totFalsi += t.falsi.length
    senzaIndizio += t.falsi.filter(f => !f.dimentica).length

    const parole = t.righe.join(' ').split(/\s+/).length
    if (parole > cfg.parole) storte.lunga.push(`${parole} parole: ${t.righe.join(' ')}`)
    if (t.indizi.length < cfg.indizi[0] || t.indizi.length > cfg.indizi[1] ||
        !cfg.vuole.every(g => t.indizi.some(i => g.includes(i.forma))) ||
        (cfg.vieta && t.indizi.some(i => cfg.vieta.includes(i.forma))))
      storte.forme.push(t.indizi.map(i => i.forma).join(','))
  }
  const dove = `${cfg.chiave} ${etichetta}`
  uguale(`${dove}: ogni frase si rilegge`, storte.nascosti.slice(0, 2).join(' | ') || '—', '—')
  uguale(`${dove}: la sistemazione è una sola, e la risposta letta è la buona`, storte.unica.slice(0, 2).join(' | ') || '—', '—')
  uguale(`${dove}: ogni indizio serve alla domanda`, storte.serve.slice(0, 2).join(' | ') || '—', '—')
  uguale(`${dove}: la risposta non è scritta in un indizio`, storte.scritta.slice(0, 2).join(' | ') || '—', '—')
  uguale(`${dove}: i falsi sono tutte le altre risposte, ognuna col suo perché`, storte.falsi.slice(0, 2).join(' | ') || '—', '—')
  uguale(`${dove}: la domanda resta corta`, storte.lunga.slice(0, 2).join(' | ') || '—', '—')
  uguale(`${dove}: forme e numero degli indizi come dice il grado`, storte.forme.slice(0, 2).join(' | ') || '—', '—')
  uguale(`${dove}: nessun ripiego in ${giri} costruzioni`, ripieghi, 0)
  controlla(`${dove}: quasi ogni falso nomina l'indizio dimenticato`, senzaIndizio / totFalsi < 0.05,
    `${senzaIndizio} su ${totFalsi} col perché generico`)
  controlla(`${dove}: tante domande diverse`, diverse.size > giri * 0.9, `${diverse.size} su ${giri}`)
  nota(`${dove}: ${giri} domande rilette, ${diverse.size} diverse, perché generico ${senzaIndizio}/${totFalsi}`)
}

for (const [tipo, perGrado] of Object.entries(CONFIG_TABELLA))
  for (const grado of Object.keys(perGrado)) provaTabella(+grado, cfgTabella(tipo, +grado), 300)

/* la fila in quattro non sta in nessun grado (vedi la scala dei gradi in
   `indizi.js`), ma il modulo dice che è pronta: qui lo si tiene vero */
provaTabella(0, { chiave: 'indizi:fila', persone: 4, cose: 0,
  forme: ['testa', 'fondo', 'nonTesta', 'nonFondo', 'dopo', 'lontani'],
  indizi: [3, 4], vuole: [['dopo'], ['lontani', 'nonTesta', 'nonFondo']], parole: 45 }, 300, 'in quattro')

/* la rete di sicurezza della tabella: forzata con un numero di indizi
   impossibile, deve dare lo stesso una domanda che regge alla rilettura */
for (const cose of [0, 1]) {
  const cfg = { chiave: 'indizi:tabella', persone: 3, cose, forme: cose ? ['ha', 'non'] : ['testa'], indizi: [9, 9], vuole: [], parole: 45 }
  const t = costruisciTabella(new Sorte(8), cfg)
  controlla(`tabella (${cose ? 'cose' : 'fila'}): il ripiego scatta`, t.ripiego === true)
  const { vincoli, domanda, nascosti } = leggiTabella(t)
  uguale(`tabella (${cose ? 'cose' : 'fila'}): il ripiego si rilegge`, nascosti.length, 0)
  const tutte = permutazioni(3).map(p => [p])
  const qui = tutte.filter(s => vincoli.every(v => v(s)))
  uguale(`tabella (${cose ? 'cose' : 'fila'}): il ripiego ha una sola sistemazione`, qui.length, 1)
  uguale(`tabella (${cose ? 'cose' : 'fila'}): ed è la risposta buona`, domanda(qui[0]), t.buona.emoji || t.buona.testo)
  for (let i = 0; i < vincoli.length; i++)
    controlla(`tabella (${cose ? 'cose' : 'fila'}): il ripiego non ha indizi superflui`,
      new Set(tutte.filter(s => vincoli.every((v, j) => j === i || v(s))).map(domanda)).size > 1)
}

/* ═══════════ 5. il caso è ripetibile ═══════════ */
{
  const a = modulo.chiedi(3, new Sorte(55))
  const b = modulo.chiedi(3, new Sorte(55))
  uguale('stesso seme, stessa domanda', JSON.stringify(a), JSON.stringify(b))
}

riassunto('gli indizi: nessuno superfluo, la risposta sempre una sola')
