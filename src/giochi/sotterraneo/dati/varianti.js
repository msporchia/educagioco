// Le varianti armate e i gradi (docs/sotterraneo/varianti.md). Una specie con le mani (lo scheletro, lo zombie, il goblin, l'orco)
// può avere un'arma in pugno, disegnata sopra il suo sprite con una figura della roba (`ASPETTI`, docs/sotterraneo/figure.md):
// diventa uno «scheletro guerriero», un «arciere», un «mago». L'utente, 12 ottobre 2026: «basta appiccicarci qualcosa; si possono
// fare vari livelli di scheletro aumentando la qualità dell'arma, quindi c'è molta varianza; nella schermata chiamali scheletro,
// scheletro mago, scheletro spettrale magico, per dargli gradatura ed epicità».
//
// Una variante cambia la FORMA, mai la forza (le ossa e la difesa restano quelle della specie: dentro una discesa si costa uguale,
// docs/sotterraneo/mostri.md): il guerriero resiste ai colpi fisici delle abilità, l'arciere agisce prima nella fila dei turni e
// picchia un po' meno, il mago ha un incantesimo di gelo che a volte ti gela (il tuo colpo dopo fa metà). Il grado (comune, magico,
// raro, leggendario, come la roba: dati/pezzi.js) sale col livello del posto, dà un aggettivo al nome, il colore della rarità e
// un alone, un'arma più ricca, e un filo di velocità: epicità, non un muro.
import { RARITA, ORDINE_RARITA } from './pezzi.js'
import { ASPETTI } from './aspetti.js'

export const GRADI = ORDINE_RARITA
export const coloreDelGrado = g => (RARITA[g] || RARITA.comune).colore
export const rangoDelGrado = g => Math.max(0, GRADI.indexOf(g))

// le varianti di ogni specie: `peso` quanto spesso (quella senza arma è la specie com'è); `armi` le basi della roba da cui
// pescare la figura (chiavi di ASPETTI), `tinte` se l'arma dev'essere di un certo elemento; `velocita` e `att` si sommano alla
// specie; `resiste`/`teme` si aggiungono alle sue difese; `incanto` è l'elemento del colpo di un mago
export const VARIANTI = {
  scheletro: [
    { chiave: 'semplice', peso: 40 },
    { chiave: 'guerriero', nome: 'guerriero', peso: 26, armi: ['spada', 'spada-corta'], velocita: -1, resiste: ['fisico'] },
    { chiave: 'arciere', nome: 'arciere', peso: 20, armi: ['arco-corto', 'arco-lungo'], velocita: 3, att: -1 },
    { chiave: 'mago', nome: 'mago', peso: 14, armi: ['bastone-magico'], tinte: ['ghiaccio'], velocita: -1, incanto: 'gelo', resiste: ['gelo'] },
  ],
  zombie: [
    { chiave: 'semplice', peso: 65 },
    { chiave: 'guerriero', nome: 'guerriero', peso: 35, armi: ['ascia', 'accetta'], velocita: -1, resiste: ['fisico'] },
  ],
  goblin: [
    { chiave: 'semplice', peso: 50 },
    { chiave: 'guerriero', nome: 'guerriero', peso: 30, armi: ['spada-corta'], velocita: -1, resiste: ['fisico'] },
    { chiave: 'arciere', nome: 'arciere', peso: 20, armi: ['arco-corto'], velocita: 3, att: -1 },
  ],
  orco: [
    { chiave: 'semplice', peso: 60 },
    { chiave: 'guerriero', nome: 'guerriero', peso: 40, armi: ['ascia', 'bipenne'], velocita: -1, resiste: ['fisico'] },
  ],
}
export const haLeVarianti = tipo => !!VARIANTI[tipo]

// Gli aggettivi, per grado: parole che un bambino conosce e che suonano da tesoro (come «Spada fiammeggiante» o «Spadone demoniaco»
// della roba, docs/sotterraneo/rarita.md). Il leggendario ne porta due: «Scheletro mago spettrale arcano».
export const AGGETTIVI = {
  magico: ['antico', 'tetro', 'cupo'],
  raro: ['spettrale', 'runico', 'oscuro'],
  leggendario: ['arcano', 'immortale', 'eterno'],
}
// quanto il grado alza la forma: un filo di velocità, e basta (le ossa e la difesa non si toccano)
export const VELOCITA_DEL_GRADO = { comune: 0, magico: 0, raro: 1, leggendario: 1 }
// e quanto lo rende più duro (docs/sotterraneo/varianti.md, «Il grado pesa»): un nome epico è un mostro più forte, non solo più bello
export const OSSA_DEL_GRADO = { comune: 1, magico: 1.25, raro: 1.5, leggendario: 2 }
export const ATT_DEL_GRADO = { comune: 0, magico: 0.5, raro: 1, leggendario: 2 }
// e quanto vale di più, in gemme e in esperienza, abbatterlo
export const PREMIO_DEL_GRADO = { comune: 1, magico: 1.3, raro: 1.7, leggendario: 2.5 }
// L'incanto del mago: la probabilità, in cento, che un colpo del mago che ti arriva ti geli; sale col grado
export const GELO_DEL_MAGO = { comune: 30, magico: 40, raro: 50, leggendario: 60 }

// Con che pesi esce un grado al livello `L` del posto: il comune fa la gran parte dei casi sempre, e i gradi alti diventano
// frequenti solo in fondo (nelle zone, dove il livello va oltre 60). Un caporale non è mai comune (sta nell'anticamera del grosso:
// «buoni posti per i gradi alti»), e i suoi gradi alti pesano di più.
export function pesiDeiGradi(L, caporale = false) {
  const l = Math.max(1, L || 1)
  const p = { comune: 100, magico: 15 + 1.5 * l, raro: 3 + 0.8 * l, leggendario: 0.3 + 0.25 * l }
  if (caporale) { p.comune = 0; p.raro *= 2; p.leggendario *= 3 }
  return p
}

// Pesca con `rnd` (un numero in [0,1)) un grado al livello `L`
export function pescaIlGrado(L, rnd, caporale = false) {
  const p = pesiDeiGradi(L, caporale)
  const tot = GRADI.reduce((a, g) => a + p[g], 0)
  let t = rnd * tot
  for (const g of GRADI) { t -= p[g]; if (t < 0) return g }
  return 'comune'
}

// Pesca una variante della specie `tipo` con `rnd` in [0,1); null se la specie non ne ha
export function pescaLaVariante(tipo, rnd) {
  const v = VARIANTI[tipo]
  if (!v) return null
  const tot = v.reduce((a, x) => a + x.peso, 0)
  let t = rnd * tot
  for (const x of v) { t -= x.peso; if (t < 0) return x.chiave }
  return v[0].chiave
}

// L'arma di una variante a un grado: fra le figure della roba delle sue basi (e delle sue tinte, se ne ha), quelle col pregio più
// vicino a quello del grado (1 comune … 4 leggendario); `k` sceglie fra pari. Sempre la stessa per la stessa `k`
export function armaDi(tipo, chiave, grado, k = 0) {
  const v = (VARIANTI[tipo] || []).find(x => x.chiave === chiave)
  if (!v || !v.armi) return null
  const voglia = 1 + rangoDelGrado(grado)
  const tinte = v.tinte ? [...v.tinte, ...(grado === 'leggendario' ? ['arcano'] : [])] : null
  const tutte = v.armi.flatMap(b => ASPETTI[b] || []).filter(a => !tinte || tinte.includes(a.tinta))
  if (!tutte.length) return null
  const migliore = Math.min(...tutte.map(a => Math.abs(a.pregio - voglia)))
  const pari = tutte.filter(a => Math.abs(a.pregio - voglia) === migliore)
  return pari[Math.abs(k) % pari.length].sprite
}

const aggFem = a => a.replace(/o$/, 'a')

// Il nome: «Uno scheletro», «Uno scheletro mago», «Uno scheletro mago spettrale», «Uno scheletro mago spettrale arcano». L'articolo
// resta quello della specie; gli aggettivi vanno al femminile dove la specie lo è (una tartaruga corazzata antica)
export function nomeDelMostro(base, variante, grado, k = 0) {
  const fem = /^(Una|Un')/.test(base)
  const agg = a => (fem ? aggFem(a) : a)
  const parti = [base]
  if (variante && variante.nome) parti.push(variante.nome)
  const r = rangoDelGrado(grado)
  if (r === 1) parti.push(agg(AGGETTIVI.magico[k % 3]))
  if (r >= 2) parti.push(agg(AGGETTIVI.raro[k % 3]))
  if (r === 3) parti.push(agg(AGGETTIVI.leggendario[(k >> 1) % 3]))
  return parti.join(' ')
}

// L'etichetta sullo schermo: il nome senza l'articolo, con la maiuscola («Scheletro mago spettrale»)
export const etichettaDi = nome => {
  const s = String(nome || '').replace(/^(Uno|Una|Un'|Un|Il|Lo|La|L')\s*/i, '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Veste un mostro appena fatto (`m`: l'istanza di Livello.mostro) della sua variante e del suo grado: nome, arma, velocità e difese.
// `scheda`: la specie in dati/mostri.js. Tocca la forma e, dal grado magico in su, le ossa e l'attacco (OSSA_DEL_GRADO, ATT_DEL_GRADO); mai la difesa
export function vesti(m, scheda, { variante = null, grado = 'comune', k = 0, peso = 1 } = {}) {
  const v = variante ? (VARIANTI[m.tipo] || []).find(x => x.chiave === variante) : null
  if ((!v || !v.nome) && grado === 'comune') return m
  m.grado = grado
  m.ossa = m.ossaMax = Math.round(m.ossa * (1 + (OSSA_DEL_GRADO[grado] - 1) * peso))   // `peso` 0 nella cripta, dove si impara: il grado è solo un nome
  m.att += ATT_DEL_GRADO[grado] * peso
  m.nome = nomeDelMostro(scheda.nome, v, grado, k)
  let vel = (scheda.velocita || 8) + VELOCITA_DEL_GRADO[grado]
  if (v) {
    if (v.nome) m.variante = v.chiave
    vel += v.velocita || 0
    m.att += v.att || 0
    const arma = armaDi(m.tipo, v.chiave, grado, k)
    if (arma) m.arma = arma
    if (v.incanto) m.incanto = v.incanto
    if (v.resiste || v.teme) {
      const resiste = [...new Set([...(scheda.resiste || []), ...(v.resiste || [])])]
      const teme = [...new Set([...(scheda.teme || []), ...(v.teme || [])])].filter(e => !resiste.includes(e))
      m.difese = { resiste, teme, immune: scheda.immune || [] }
    }
  }
  if (vel !== scheda.velocita) m.velocita = vel
  return m
}

export function guastiDelleVarianti() {
  const g = []
  for (const [tipo, lista] of Object.entries(VARIANTI)) {
    if (!lista.length || lista[0].chiave !== 'semplice') g.push(`${tipo}: la prima variante è quella senza arma`)
    for (const v of lista) {
      if (v.chiave !== 'semplice' && !(v.nome && v.armi && v.armi.length)) g.push(`${tipo} ${v.chiave}: senza nome o senza armi`)
      for (const gr of GRADI) if (v.armi && !armaDi(tipo, v.chiave, gr)) g.push(`${tipo} ${v.chiave}: nessuna arma al grado ${gr}`)
    }
  }
  for (const g2 of ['magico', 'raro', 'leggendario']) if ((AGGETTIVI[g2] || []).length !== 3) g.push(`${g2}: tre aggettivi`)
  return g
}
