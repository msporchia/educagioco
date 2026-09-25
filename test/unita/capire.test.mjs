/* ═══════════════════════════════════════════════════════════════════
   CAPIRE UN TESTO — quello che il banco non può vedere

   Il banco di prova (`strumenti/quiz/banco.mjs`) controlla la forma:
   risposte doppie, varietà, caso ripetibile. Per un modulo che genera
   testi da leggere contano altre quattro cose, che dalla forma non si
   leggono e che qui si contano giocando:

     1. il testo è CORTO — sotto le trentacinque parole sempre, e le due
        frasi del primo grado molto sotto: è il pedaggio di una porta,
        non una verifica di lettura;
     2. ogni falso dice il suo perché, e ogni domanda il suo come si fa;
     3. le risposte che sono nomi sono nomi DEL TESTO — il falso vero di
        questo modulo è il nome citato ma non quello giusto, e un nome che
        nel testo non c'è si scarterebbe a occhio;
     4. un «lui»/«lei» ha nel testo UNA persona sola di quel genere: è
        la regola che lo rende univoco, e una svista nei dati la
        romperebbe senza che niente a schermo sembri strano.

   E una quinta, sull'ordine: la risposta giusta non può stare sempre
   dalla stessa parte del testo, se no si impara la parte e non il
   «prima di».
   ═══════════════════════════════════════════════════════════════════ */
import { nota, controlla, uguale, dentro, riassunto } from '../aiuto/verifica.mjs'
import { provaModulo } from '../../strumenti/quiz/banco.mjs'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'
import modulo, { PERSONE } from '../../src/quiz/moduli/capire.js'

/* ═══════════ 0. la forma, che il banco sa già controllare ═══════════ */
const banco = provaModulo(modulo, { tiri: 600 })
controlla('capire: le domande stanno in piedi', banco.guasti.length === 0, banco.guasti.slice(0, 6).join(' | '))
for (const r of banco.righe) nota(`grado ${r.grado} — ${r.dice}: ${r.diverse} domande diverse`)

const parole = s => s.trim().split(/\s+/).length
const GENERE = new Map(PERSONE.map(p => [p.nome, p.g]))
const TIRI = 600

/* tutte le domande di una tipologia, grado per grado */
function giocate(tipo) {
  const out = []
  for (const g of Object.keys(tipo.gradi).map(Number))
    for (let i = 0; i < TIRI; i++) out.push({ g, d: modulo.genera(g, new Sorte(g * 7717 + i), tipo.chiave) })
  return out
}

for (const tipo of modulo.tipi) {
  const tutte = giocate(tipo)
  const lunghe = [], senzaPerche = [], forestieri = [], html = [], stonate = [], diverse = new Set()
  let piuLunga = 0
  for (const { g, d } of tutte) {
    const t = d.soggetto?.testo || ''
    diverse.add(t + '§' + d.testo + '§' + d.risposte.map(r => r.testo).sort().join('|'))
    const n = parole(t)
    piuLunga = Math.max(piuLunga, n)
    /* 1. corto: sotto le 35 parole, e le due frasi del grado 1 sotto le 23 */
    if (n >= 35 || (g === 1 && n > 22)) lunghe.push(`${n}: ${t}`)
    /* 2. il perché di ogni falso, e il come si fa */
    if (!d.aiuto || d.risposte.some((r, i) => i !== d.giusta && !r.perche)) senzaPerche.push(t)
    /* 3. i nomi fra le risposte stanno nel testo */
    for (const r of d.risposte)
      if (GENERE.has(r.testo) && !new RegExp(`\\b${r.testo}\\b`).test(t)) forestieri.push(`${r.testo} in «${t}»`)
    /* niente HTML nei dati, da nessuna parte */
    const scritto = [d.testo, t, d.aiuto, ...d.risposte.flatMap(r => [r.testo, r.perche])].join(' ')
    if (/[<>]/.test(scritto)) html.push(scritto)
    /* la d eufonica: «e Elisa» e «a Alice» non si scrivono */
    if (/(^|\s)e [Ee]|(^|\s)a [Aa]/.test(scritto)) stonate.push(scritto.slice(0, 120))
  }
  uguale(`${tipo.chiave}: il testo sta sotto le 35 parole (e sotto le 23 al grado 1)`, lunghe.slice(0, 2).join(' | '), '')
  uguale(`${tipo.chiave}: ogni falso ha il suo perché, ogni domanda il suo come si fa`, senzaPerche.slice(0, 2).join(' | '), '')
  uguale(`${tipo.chiave}: i nomi fra le risposte sono nomi del testo`, forestieri.slice(0, 3).join(' | '), '')
  uguale(`${tipo.chiave}: niente HTML`, html.slice(0, 1).join(''), '')
  uguale(`${tipo.chiave}: «ed» e «ad» davanti alla stessa vocale`, stonate.slice(0, 2).join(' | '), '')
  /* la varietà per TIPOLOGIA, non solo per grado: una tipologia che fa
     venti domande si impara in tre partite anche se il grado ne mescola
     altre due */
  controlla(`${tipo.chiave}: centinaia di domande diverse`, diverse.size >= 300, `${diverse.size} su ${tutte.length}`)
  nota(`${tipo.chiave}: ${diverse.size} diverse su ${tutte.length}, la più lunga ${piuLunga} parole`)
}

/* ═══════════ 4. «lui» e «lei» sono univoci ═══════════ */
{
  const tipo = modulo.tipi.find(t => t.chiave === 'capire:pronome')
  const storti = []
  let visti = 0
  for (const { d } of giocate(tipo)) {
    const p = d.soggetto.evidenzia
    if (p !== 'Lui' && p !== 'Lei') continue
    visti++
    const g = p === 'Lui' ? 'm' : 'f'
    const nomi = (d.soggetto.testo.match(/\p{Lu}\p{Ll}+/gu) || []).filter(x => GENERE.has(x))
    const giusti = [...new Set(nomi)].filter(x => GENERE.get(x) === g)
    if (giusti.length !== 1 || giusti[0] !== d.risposte[d.giusta].testo) storti.push(d.soggetto.testo)
  }
  controlla('capire:pronome: «lui» e «lei» escono davvero', visti > 50, String(visti))
  uguale('capire:pronome: nel testo c\'è una persona sola del genere del pronome, ed è la giusta',
    storti.slice(0, 2).join(' | '), '')
}

/* ═══════════ 5. l'ordine non si impara per posizione ═══════════ */
{
  const tipo = modulo.tipi.find(t => t.chiave === 'capire:ordine')
  let coincide = 0, tot = 0
  for (const { d } of giocate(tipo)) {
    /* dove sta scritta ogni azione: il suo complemento («la finestra»)
       è unico nel testo */
    const dove = r => d.soggetto.testo.indexOf(r.testo.split(' ').slice(1).join(' '))
    const posti = d.risposte.map(dove)
    if (posti.some(x => x < 0)) continue
    const giusta = posti[d.giusta]
    const prima = d.testo.includes('prima cosa')
    const estremo = prima ? Math.min(...posti) : Math.max(...posti)
    tot++
    if (giusta === estremo) coincide++
  }
  controlla('capire:ordine: si ritrova dove sta scritta ogni azione', tot > TIRI * 0.9, `${tot} su ${TIRI}`)
  /* se la giusta fosse sempre quella scritta per prima (o sempre quella
     scritta dall'altra parte) il trucco basterebbe a rispondere */
  dentro('capire:ordine: la giusta a volte è scritta dove succede, a volte no',
    Math.round(coincide / tot * 100), 30, 70)
  nota(`capire:ordine: la giusta è scritta al suo posto ${Math.round(coincide / tot * 100)}% delle volte`)
}

/* ═══════════ 6. il perché giusto è scritto, quello plausibile no ═══════════ */
{
  const tipo = modulo.tipi.find(t => t.chiave === 'capire:perche')
  const storti = []
  for (const { d } of giocate(tipo)) {
    const t = d.soggetto.testo.toLowerCase()
    const motivo = d.risposte[d.giusta].testo.replace(/^perché /, '')
    if (!t.includes(motivo.toLowerCase())) storti.push(`manca «${motivo}» in «${d.soggetto.testo}»`)
    for (const [i, r] of d.risposte.entries()) {
      if (i === d.giusta || !r.perche.startsWith('può succedere')) continue
      const altro = r.testo.replace(/^perché /, '').toLowerCase()
      if (t.includes(altro)) storti.push(`«${altro}» c'è nel testo, e il falso diventa difendibile`)
    }
  }
  uguale('capire:perche: il motivo giusto sta nel testo e quello plausibile no', storti.slice(0, 2).join(' | '), '')
}

riassunto('capire un testo')
