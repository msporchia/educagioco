/* Un modulo: dato un grado e una sorte, consegna una domanda. Non sa chi
   gliel'ha chiesta, non disegna, non tiene punteggi. Vedi
   docs/apprendimento/quiz-moduli.md (contratto, tipi, sa) e quiz-livelli.md
   (la scala 0-100, RIPIEGO). I pittori stanno nel modulo perché una scena
   la sa disegnare solo chi l'ha inventata. */

import { pescaClasse, adatta, LIVELLO_MAX, livelloDegliAnni } from './classi.js'

const RIPIEGO = [livelloDegliAnni(6), livelloDegliAnni(11)] // chi non dichiara livelli: vedi quiz-livelli.md

// un numero vale per tutti i gradi, un oggetto { grado: livello } grado per grado; undefined se non dice niente
export function livelloVoluto(tipo, grado) {
  const v = tipo && tipo.livello
  if (Number.isFinite(v)) return v
  if (v && typeof v === 'object' && Number.isFinite(v[grado])) return v[grado]
  return undefined
}

// un livello per grado, col ripiego per chi tace
function perGradoLivello(livelli, gradi) {
  return Array.from({ length: gradi }, (_, i) => {
    const v = livelli?.[i]
    if (Number.isFinite(v)) return Math.min(LIVELLO_MAX, Math.max(0, v))
    return Math.round(gradi > 1
      ? RIPIEGO[0] + (RIPIEGO[1] - RIPIEGO[0]) * (i / (gradi - 1))
      : RIPIEGO[0])
  })
}

// si accetta anche una stringa sola («tutto il modulo vuole questo»): scriverla 5 volte uguale è un modo di sbagliarne una
function perGrado(saperi, gradi) {
  const vuoti = Array.from({ length: gradi }, () => [])
  if (!saperi) return vuoti
  if (typeof saperi === 'string') return vuoti.map(() => [saperi])
  return vuoti.map((_, i) => {
    const v = saperi[i]
    return !v ? [] : (Array.isArray(v) ? v : [v])
  })
}

// un grado si chiude solo se il sapere spento se li porta via tutti (assottigliato ≠ chiuso)
function saperiDaiTipi(tipi, gradi) {
  return Array.from({ length: gradi }, (_, i) => {
    const qui = tipi.filter(t => t.gradi[i + 1] > 0)
    if (!qui.length) return []
    return qui[0].sa.filter(s => qui.every(t => t.sa.includes(s)))
  })
}

// un gradino = mezzo anno (PASSO); oltre 3 non si ritocca più, si spegne il gruppo — vedi docs/genitori/ritocchi.md
export const PASSO = 6
export const RITOCCO_MAX = 3
export const gradini = n => Math.max(-RITOCCO_MAX, Math.min(RITOCCO_MAX, Math.round(n || 0)))

export class Modulo {
  constructor({ id, nome, icona, materia, chiaro, scaletta,
                saperi = null, tipi = null, pittori = {}, livelli = null }) {
    this.id = id                  // 'ortografia' — anche il prefisso delle chiavi
    this.nome = nome              // 'Ortografia' — quello che si legge
    this.icona = icona            // un'emoji sola
    this.materia = materia        // 'italiano' | 'matematica' | 'spazio' | 'tempo'
    this.chiaro = chiaro          // cosa allena, detto a un genitore
    this.scaletta = scaletta      // una riga per grado: cosa si chiede lì
    this.tipi = (tipi || []).map(t => ({ ...t, sa: t.sa ? [].concat(t.sa) : [] }))
    this.saperi = this.tipi.length            // cosa serve aver fatto a scuola
      ? saperiDaiTipi(this.tipi, scaletta.length)
      : perGrado(saperi, scaletta.length)
    this.pittori = pittori        // { nomeScena: (pennello, scena) => … }
    this.livelli = perGradoLivello(livelli, scaletta.length) // 0-100 per grado; chi tace ricade sul ripiego
    this.livelloDichiarato = Array.isArray(livelli) && livelli.length > 0
  }

  get gradi() { return this.scaletta.length }

  serve(grado) { return this.saperi[grado - 1] || [] } // cosa quel grado dà per scontato (vedi data/saperi.js)

  // i tipi di un grado, col peso che hanno lì: le proporzioni senza scriverle dentro il generatore
  tipiDi(grado) {
    return this.tipi.filter(t => t.gradi[grado] > 0)
      .map(t => ({ ...t, peso: t.gradi[grado] }))
  }

  // spento: tolta la tipologia, o tolto il gruppo che se la porta dietro (sono la stessa cosa per chi chiede)
  tipoSpento(tipo, spenti = []) {
    return spenti.includes(tipo.chiave) || tipo.sa.some(s => spenti.includes(s))
  }

  // come il suo grado, a meno di dichiararlo per sé: un numero solo mentirebbe se la stessa tipologia si allunga
  // col grado (livello: { 4: 44, 5: 56 }); un grado non elencato ricade sul livello del grado
  livelloDelTipo(tipo, grado) {
    const suo = livelloVoluto(tipo, grado)
    return Number.isFinite(suo) ? suo : this.livelli[grado - 1]
  }

  // la media di quello che ancora si può chiedere: se un grado spegne la metà difficile, si abbassa davvero
  livelloDi(grado, spenti = [], regole = null) {
    return this.mediaDei(grado, spenti, regole, t => this.livelloDelTipo(t, grado))
  }

  // come lo vede QUESTO bambino: lo stesso numero meno il ritocco. Il livello vero (del catalogo) non si tocca mai
  livelloVistoDelTipo(tipo, grado, regole = null) {
    return this.livelloDelTipo(tipo, grado) - this.ritoccoDelTipo(tipo, regole?.ritocchi)
  }

  livelloVisto(grado, spenti = [], regole = null) {
    return this.mediaDei(grado, spenti, regole, t => this.livelloVistoDelTipo(t, grado, regole))
  }

  // arrotondata a un decimale: una media di dieci noni si presenta come 95.00000000001 in ogni elenco
  mediaDei(grado, spenti, regole, quanto) {
    const qui = this.tipiLiberi(grado, spenti, regole)
    if (!qui.length) return this.livelli[grado - 1]
    const tot = qui.reduce((s, t) => s + t.peso, 0)
    if (!(tot > 0)) return this.livelli[grado - 1]
    return Math.round(qui.reduce((s, t) => s + t.peso * quanto(t), 0) / tot * 10) / 10
  }

  // somma dei ritocchi sulla tipologia e sui gruppi che se la portano dietro (si sommano: sono affermazioni diverse)
  ritoccoDelTipo(tipo, ritocchi) {
    if (!ritocchi) return 0
    let somma = 0
    for (const chiave of [tipo.chiave, ...tipo.sa]) somma += ritocchi[chiave] || 0
    return gradini(somma) * PASSO
  }

  tipiLiberi(grado, spenti = [], regole = null) {
    let qui = this.tipiDi(grado)
    if (spenti.length) qui = qui.filter(t => !this.tipoSpento(t, spenti))
    if (!regole) return qui
    // il livello visto da questo bambino: il ritocco abbassa o alza la classe, e decide chi entra
    return qui.filter(t => adatta(this.livelloVistoDelTipo(t, grado, regole), regole.finestra))
  }

  puo(grado, spenti = [], regole = null) {
    if (this.tipi.length) return this.tipiLiberi(grado, spenti, regole).length > 0
    if (this.serve(grado).some(s => spenti.includes(s))) return false
    return !regole || adatta(this.livelli[grado - 1], regole.finestra)
  }

  // vuoto vuol dire che il modulo intero non ha più niente da chiedere: sparisce invece di consegnare domande mute
  gradiLiberi(spenti = [], regole = null) {
    const out = []
    for (let g = 1; g <= this.gradi; g++) if (this.puo(g, spenti, regole)) out.push(g)
    return out
  }

  // se il grado chiesto è chiuso si scende (mai si sale, un grado più difficile insegnerebbe cose non ancora viste)
  gradoVicino(grado, spenti = [], regole = null) {
    const liberi = this.gradiLiberi(spenti, regole)
    if (!liberi.length) return null
    const sotto = liberi.filter(g => g <= grado)
    return sotto.length ? sotto[sotto.length - 1] : liberi[0]
  }

  // l'unico metodo che un modulo deve scrivere; `tipo` è già pescato, null per i moduli senza tipi
  genera(grado, sorte, tipo) { // eslint-disable-line no-unused-vars
    throw new Error(`il modulo ${this.id} non sa generare domande`)
  }

  // bisogno: chiave → fattore (1 = neutro), da nucleo/bisogno.js. Media pesata: la banda vale il rapporto giusto
  // (una sola volta, non al quadrato) solo scegliendo la classe con la media — vedi docs/apprendimento/quiz-ripasso.md
  bisognoMedio(grado, spenti = [], bisogno = null, regole = null) {
    if (!bisogno || !this.tipi.length) return 1
    const qui = this.tipiLiberi(grado, spenti, regole)
    const tot = qui.reduce((s, t) => s + t.peso, 0)
    if (!(tot > 0)) return 1
    return qui.reduce((s, t) => s + t.peso * bisogno(t.chiave), 0) / tot
  }

  // tiene il grado dentro i binari (un gioco può chiedere «grado 9» a un modulo che ne ha 5); se non resta niente si tira lo stesso
  chiedi(grado, sorte, spenti = [], bisogno = null, regole = null) {
    const g = Math.max(1, Math.min(this.gradi, Math.round(grado || 1)))
    if (!this.tipi.length) return this.genera(g, sorte)
    let liberi = this.tipiLiberi(g, spenti, regole)
    if (bisogno && liberi.length)
      liberi = liberi.map(t => ({ ...t, peso: t.peso * bisogno(t.chiave) }))
    const scelto = pescaClasse(sorte, liberi) || pescaClasse(sorte, this.tipiDi(g))
    return this.genera(g, sorte, scelto?.chiave || null)
  }
}
