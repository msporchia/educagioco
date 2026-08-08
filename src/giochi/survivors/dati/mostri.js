/* ═══════════════════════════════════════════════════════════════════
   I MOSTRI — chi ti corre dietro

   Cinque bestie, e ognuna cambia una cosa sola rispetto alle altre: la
   melma è lenta e va giù subito, il pipistrello è svelto ma di carta, la
   roccia è un muro che cammina. Un bambino non legge le statistiche:
   impara che «quello grigio non muore» guardandolo.

   `da` è **una quota di tappa**, non un numero di secondi: 0 vuol dire
   dal primo istante, 0.6 vuol dire dopo il sessanta per cento del tempo.
   Così una tappa da 40 secondi e una da 120 raccontano la stessa storia
   — prima uno solo, poi la folla — invece di far comparire la roccia
   solo nelle tappe lunghe.

   `peso` è quanto spesso esce fra quelli già ammessi.

   Le forme e i colori li legge chi disegna (`scena/campo.js`): il motore
   di questa tabella usa soltanto `r`, `vita`, `passo`, `da`, `peso`.
   ═══════════════════════════════════════════════════════════════════ */

export const MOSTRI = {
  melma:       { nome: 'melma',       colore: '#63d16b', scuro: '#2f9a49',
                 r: 15, vita: 1, passo: 62,  da: 0,    peso: 3 },
  pipistrello: { nome: 'pipistrello', colore: '#a97ce8', scuro: '#6b45a8',
                 r: 12, vita: 1, passo: 96,  da: 0.12, peso: 3 },
  /* lo sciame: minuscolo, muore soffiandoci sopra, ma non viene mai da
     solo. Serve a rompere il ritmo — con lui in campo sparare al più
     vicino non basta più, bisogna spostarsi */
  moscerino:   { nome: 'moscerino',   colore: '#f0e05a', scuro: '#b39a1e',
                 r: 8,  vita: 1, passo: 104, da: 0.18, peso: 3.5 },
  fungo:       { nome: 'fungo',       colore: '#ff7b6b', scuro: '#c33a34',
                 r: 17, vita: 3, passo: 54,  da: 0.28, peso: 2.5 },
  /* il ragno è quello che ti raggiunge: 112 di passo, appena sotto
     l'eroe fermo. Da lui non si scappa in linea retta, si scarta */
  ragno:       { nome: 'ragno',       colore: '#c2724a', scuro: '#7a3f22',
                 r: 13, vita: 2, passo: 112, da: 0.35, peso: 2 },
  spettro:     { nome: 'spettro',     colore: '#8fdcff', scuro: '#3f8fc4',
                 r: 14, vita: 2, passo: 76,  da: 0.42, peso: 2.5 },
  /* il cinghiale: grosso, duro e svelto insieme. È la bestia che nelle
     tappe lunghe ti costringe a comprare qualcosa che picchi davvero */
  cinghiale:   { nome: 'cinghiale',   colore: '#8a6b4f', scuro: '#4e3a28',
                 r: 20, vita: 5, passo: 86,  da: 0.48, peso: 1.8 },
  roccia:      { nome: 'roccia',      colore: '#b9b2a6', scuro: '#6f685e',
                 r: 22, vita: 6, passo: 40,  da: 0.55, peso: 2 },
  /* il colosso è il muro vero: dieci di vita e cammina piano. Non si
     ammazza di striscio, si decide se ammazzarlo o girargli intorno */
  colosso:     { nome: 'colosso',     colore: '#9aa6c9', scuro: '#4c5675',
                 r: 27, vita: 10, passo: 34, da: 0.7,  peso: 1.4 },
}

export const CHIAVI_MOSTRI = Object.keys(MOSTRI)

export const mostro = chiave => MOSTRI[chiave] || MOSTRI.melma

/* Quali bestie sono già in scena, data la squadra della tappa e quanta
   tappa è passata. Torna sempre almeno una: un momento senza mostri è
   una schermata vuota, e il primo istante di una tappa è proprio quello
   in cui `q` vale zero. */
export function ammessi(squadra, quota) {
  const dentro = squadra.filter(k => MOSTRI[k] && quota >= MOSTRI[k].da)
  if (dentro.length) return dentro
  /* nessuno è ancora ammesso: entra il più mattiniero della squadra */
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
    /* nessuno deve poter correre più dell'eroe fermo alla velocità base:
       un mostro che ti raggiunge sempre toglie l'unica cosa che il
       bambino può fare, cioè scappare */
    if (!(m.passo < 120)) guasti.push(`${dove}: passo ${m.passo}, ti prende comunque`)
  }
  /* qualcuno deve esserci dal primo istante */
  if (!Object.values(tabella).some(m => m.da === 0))
    guasti.push('nessun mostro nasce all\'inizio della tappa')
  return guasti
}
