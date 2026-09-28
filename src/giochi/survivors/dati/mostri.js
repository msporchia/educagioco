// I mostri: ognuno cambia una cosa sola rispetto agli altri, e un
// bambino impara "quello grigio non muore" guardandolo, non leggendo
// statistiche. `da` è una quota di tappa (0 = dal primo istante, 0.6 =
// dopo il 60% del tempo), non secondi: così una tappa corta e una lunga
// raccontano la stessa storia. `peso` è quanto spesso esce fra quelli
// già ammessi. Le forme e i colori li legge scena/campo.js; il motore
// usa solo r, vita, passo, da, peso.

export const MOSTRI = {
  melma:       { nome: 'melma',       colore: '#63d16b', scuro: '#2f9a49',
                 r: 15, vita: 1, passo: 62,  da: 0,    peso: 3 },
  pipistrello: { nome: 'pipistrello', colore: '#a97ce8', scuro: '#6b45a8',
                 r: 12, vita: 1, passo: 96,  da: 0.12, peso: 3 },
  // lo sciame: minuscolo, muore soffiandoci sopra, ma non viene mai da
  // solo — rompe il ritmo, con lui in campo sparare al più vicino non basta
  moscerino:   { nome: 'moscerino',   colore: '#f0e05a', scuro: '#b39a1e',
                 r: 8,  vita: 1, passo: 104, da: 0.18, peso: 3.5 },
  fungo:       { nome: 'fungo',       colore: '#ff7b6b', scuro: '#c33a34',
                 r: 17, vita: 3, passo: 54,  da: 0.28, peso: 2.5 },
  // il ragno raggiunge (112 di passo, appena sotto l'eroe fermo): da lui
  // non si scappa in linea retta, si scarta
  ragno:       { nome: 'ragno',       colore: '#c2724a', scuro: '#7a3f22',
                 r: 13, vita: 2, passo: 112, da: 0.35, peso: 2 },
  spettro:     { nome: 'spettro',     colore: '#8fdcff', scuro: '#3f8fc4',
                 r: 14, vita: 2, passo: 76,  da: 0.42, peso: 2.5 },
  // il cinghiale: grosso, duro e svelto insieme — costringe a comprare
  // qualcosa che picchi davvero
  cinghiale:   { nome: 'cinghiale',   colore: '#8a6b4f', scuro: '#4e3a28',
                 r: 20, vita: 5, passo: 86,  da: 0.48, peso: 1.8 },
  roccia:      { nome: 'roccia',      colore: '#b9b2a6', scuro: '#6f685e',
                 r: 22, vita: 6, passo: 40,  da: 0.55, peso: 2 },
  // il colosso è il muro vero: non si ammazza di striscio, si decide se
  // ammazzarlo o girargli intorno
  colosso:     { nome: 'colosso',     colore: '#9aa6c9', scuro: '#4c5675',
                 r: 27, vita: 10, passo: 34, da: 0.7,  peso: 1.4 },
}

export const CHIAVI_MOSTRI = Object.keys(MOSTRI)

export const mostro = chiave => MOSTRI[chiave] || MOSTRI.melma

// Quali bestie sono già in scena, data la squadra della tappa e quanta
// tappa è passata. Torna sempre almeno una: il primo istante di una
// tappa è proprio quello in cui `quota` vale zero.
export function ammessi(squadra, quota) {
  const dentro = squadra.filter(k => MOSTRI[k] && quota >= MOSTRI[k].da)
  if (dentro.length) return dentro
  const primo = squadra.filter(k => MOSTRI[k])
    .sort((a, b) => MOSTRI[a].da - MOSTRI[b].da)[0]
  return primo ? [primo] : ['melma']
}

export function guastiDeiMostri(tabella = MOSTRI) {
  const guasti = []
  const nomi = new Set()
  for (const [chiave, m] of Object.entries(tabella)) {
    const dove = `mostro "${chiave}"`
    if (nomi.has(m.nome)) guasti.push(`${dove}: nome ripetuto ("${m.nome}")`)
    nomi.add(m.nome)
    if (!(m.r >= 8)) guasti.push(`${dove}: raggio ${m.r}, non si vede`)
    if (!(m.vita >= 1)) guasti.push(`${dove}: vita ${m.vita}`)
    if (!(m.passo > 0)) guasti.push(`${dove}: passo ${m.passo}`)
    if (!(m.da >= 0 && m.da <= 1)) guasti.push(`${dove}: "da" ${m.da} non è una quota di tappa`)
    if (!(m.peso > 0)) guasti.push(`${dove}: peso ${m.peso}`)
    if (!/^#[0-9a-f]{6}$/i.test(m.colore || '')) guasti.push(`${dove}: colore "${m.colore}"`)
    if (!/^#[0-9a-f]{6}$/i.test(m.scuro || '')) guasti.push(`${dove}: colore scuro "${m.scuro}"`)
    // nessuno deve poter correre più dell'eroe fermo alla velocità base,
    // o togli l'unica cosa che il bambino può fare: scappare
    if (!(m.passo < 120)) guasti.push(`${dove}: passo ${m.passo}, ti prende comunque`)
  }
  if (!Object.values(tabella).some(m => m.da === 0))
    guasti.push('nessun mostro nasce all\'inizio della tappa')
  return guasti
}
