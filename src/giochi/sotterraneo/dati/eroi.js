// Chi scende: quattro eroi, ognuno con la sua avventura (docs/sotterraneo/avventure.md). Tre assi, tutti scritti (mai un tratto nascosto): vita,
// braccio, e `porta` (armi/armatura) — vedi docs/sotterraneo/roba.md. Il limite è sull'indossare e mai sul
// prendere: quello che non si può usare si vende come tutto il resto. L'attacco è la manopola velenosa
// (nessuno scende sotto braccio 3, o un mostro costa troppe risposte di fila); il banco di prova lo conferma.

// il vocabolario condiviso fra cose (famiglia) e classi (porta): il motore chiede al dato, mai un `if` col nome di un eroe
export const FAMIGLIE = {
  spade: { em: '⚔️', corto: 'spade', nome: 'le spade', verbo: 'impugna' },
  asce: { em: '🪓', corto: 'asce', nome: 'le asce', verbo: 'impugna' },
  archi: { em: '🏹', corto: 'archi', nome: 'gli archi', verbo: 'impugna' },
  bacchette: { em: '🪄', corto: 'bacchette', nome: 'le bacchette', verbo: 'impugna' },
  // il ferro para di suo, la stoffa deve parare per intero: il manto (stoffa, 3) para più della corazza (ferro, 2)
  ferro: { em: '🛡️', corto: 'ferro', nome: 'il ferro', verbo: 'veste' },
  stoffa: { em: '🧥', corto: 'stoffa', nome: 'la stoffa', verbo: 'veste' },
}

export const EROI = [
  { chiave: 'cavaliere', nome: 'Cavaliere', em: '🛡️', sprite: 'cavaliere',
    chi: 'il cavaliere',
    vita: 18, att: 3, dif: 1,
    // le caratteristiche di partenza (dati/livelli.js): sono già dentro vita, attacco e difesa qui sopra
    parte: { forza: 3, tempra: 4, scorza: 2, fortuna: 1 }, vitaPerLivello: 3, dote: 'tempra',
    porta: ['spade', 'asce', 'ferro'],
    dice: 'Tiene botta. Se non sai chi scegliere, è questo.' },

  { chiave: 'elfa', nome: 'Elfa', em: '🧝', sprite: 'elfa',
    chi: 'l\'elfa',
    vita: 15, att: 4, dif: 1,
    parte: { forza: 4, tempra: 3, scorza: 2, fortuna: 2 }, vitaPerLivello: 3, dote: 'forza',
    porta: ['spade', 'archi', 'stoffa'],
    dice: 'Colpisce più forte, e regge un po\' meno.' },

  // il mago: una famiglia d'arma sola (il prezzo del braccio 5), fila completa (un'arma per gradino) per
  // tenere in piedi il gioco del bottino; lo scettro a una mano gli lascia lo scudo, misurato dal banco
  { chiave: 'mago', nome: 'Mago', em: '🧙', sprite: 'mago',
    chi: 'il mago',
    vita: 12, att: 5, dif: 0,
    parte: { forza: 5, tempra: 2, scorza: 0, fortuna: 3 }, vitaPerLivello: 2, dote: 'scorza',
    porta: ['bacchette', 'stoffa'],
    dice: 'I mostri cadono in metà risposte. Ma ogni sbaglio fa malissimo.' },

  { chiave: 'nano', nome: 'Nano', em: '🧔', sprite: 'nano',
    chi: 'il nano',
    vita: 20, att: 3, dif: 2,
    parte: { forza: 3, tempra: 5, scorza: 4, fortuna: 1 }, vitaPerLivello: 3, dote: 'forza',
    porta: ['asce', 'archi', 'ferro'],
    dice: 'Sbagliare gli fa quasi il solletico. Non cade quasi mai.' },
]

export const DI_PARTENZA = 'cavaliere'

export const eroeDi = chiave => EROI.find(e => e.chiave === chiave) || EROI[0]

// prende la scheda della cosa, non la sua chiave: senza famiglia se la mette chiunque
export const portaLa = (eroe, cosa) =>
  !cosa || !cosa.famiglia || (eroe.porta || []).includes(cosa.famiglia)

// «Il mago non impugna le asce», torna '' quando non c'è niente da dire
export function nonLaPorta(eroe, cosa) {
  if (!eroe || portaLa(eroe, cosa)) return ''
  const f = FAMIGLIE[cosa.famiglia]
  if (!f) return ''
  const detto = `${eroe.chi} non ${f.verbo} ${f.nome}`
  return detto.charAt(0).toUpperCase() + detto.slice(1)
}

export function guastiDegliEroi() {
  const g = []
  const viste = new Set()
  const portate = new Set()
  for (const e of EROI) {
    if (viste.has(e.chiave)) g.push(`due eroi con la chiave "${e.chiave}"`)
    viste.add(e.chiave)
    if (!e.nome || !e.em || !e.dice) g.push(`${e.chiave}: senza nome, emoji o frase`)
    if (!e.chi) g.push(`${e.chiave}: non sa come si chiama in mezzo a una frase`)
    for (const f of e.porta || []) {
      if (!FAMIGLIE[f]) g.push(`${e.chiave}: porta "${f}", che non è una famiglia`)
      portate.add(f)
    }
    if (!(e.porta || []).length) g.push(`${e.chiave}: non porta niente`)
    if (!e.sprite) g.push(`${e.chiave}: senza sprite, e a schermo sarebbe un buco`)
    if (e.att < 3) g.push(`${e.chiave}: braccio ${e.att}, i mostri diventano lunghi invece che duri`)
    if (e.vita < 11) g.push(`${e.chiave}: ${e.vita} di vita, si sviene al terzo sbaglio`)
    if (e.dif < 0) g.push(`${e.chiave}: difesa sotto zero`)
    // la pagina dell'eroe mostra le caratteristiche: devono raccontare i numeri di partenza, non contraddirli
    const p = e.parte || {}
    if (p.forza !== e.att) g.push(`${e.chiave}: forza ${p.forza} e attacco ${e.att}, la pagina direbbe due cose`)
    if (Math.floor((p.scorza || 0) / 2) !== e.dif) g.push(`${e.chiave}: scorza ${p.scorza} e difesa ${e.dif} non tornano`)
    if (!(e.vitaPerLivello >= 1)) g.push(`${e.chiave}: salendo di livello non prende vita`)
    if (!['forza', 'tempra', 'scorza', 'fortuna'].includes(e.dote)) g.push(`${e.chiave}: la dote "${e.dote}" non è una caratteristica`)
  }
  if (!EROI.some(e => e.chiave === DI_PARTENZA))
    g.push(`chi si parte (${DI_PARTENZA}) non è fra gli eroi`)
  for (const f of Object.keys(FAMIGLIE))
    if (!portate.has(f)) g.push(`la famiglia "${f}" non la porta nessuno: è catalogo morto`)
  for (const [k, f] of Object.entries(FAMIGLIE))
    if (!f.em || !f.corto || !f.nome || !f.verbo)
      g.push(`famiglia ${k}: senza icona, nome o verbo, e la riga del perché no non si scrive`)
  return g
}
