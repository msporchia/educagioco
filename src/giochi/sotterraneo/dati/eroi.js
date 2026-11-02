// Chi scende: quattro eroi, ognuno con la sua avventura (docs/sotterraneo/avventure.md). Tre assi, tutti scritti (mai un tratto nascosto): vita,
// braccio, e `porta` (armi/armatura) — vedi docs/sotterraneo/roba.md. Il limite è sull'indossare e mai sul
// prendere: quello che non si può usare si vende come tutto il resto. L'attacco è la manopola velenosa
// (nessuno scende sotto braccio 3, o un mostro costa troppe risposte di fila); il banco di prova lo conferma.

import { pelleDi, capelliDi } from '../../../grafica/persona/aspetto.js'

// il vocabolario condiviso fra cose (famiglia) e classi (porta): il motore chiede al dato, mai un `if` col nome di un eroe
// `car`: la caratteristica che dà l'attacco a quell'arma e ne fa il requisito (docs/sotterraneo/livelli.md)
export const FAMIGLIE = {
  spade: { em: '⚔️', corto: 'spade', nome: 'le spade', verbo: 'impugna', car: 'forza' },
  asce: { em: '🪓', corto: 'asce', nome: 'le asce', verbo: 'impugna', car: 'forza' },
  archi: { em: '🏹', corto: 'archi', nome: 'gli archi', verbo: 'impugna', car: 'destrezza' },
  bacchette: { em: '🪄', corto: 'bacchette', nome: 'le bacchette', verbo: 'impugna', car: 'intelligenza' },
  // il ferro para di suo, la stoffa deve parare per intero: il manto (stoffa, 3) para più della corazza (ferro, 2)
  ferro: { em: '🛡️', corto: 'ferro', nome: 'il ferro', verbo: 'veste' },
  stoffa: { em: '🧥', corto: 'stoffa', nome: 'la stoffa', verbo: 'veste' },
}

// `lanci`: quante abilità di ogni riga dell'albero si lanciano col globo di energia pieno (docs/sotterraneo/abilita.md,
// «L'energia»): il mago è la classe del mana, e da lì vengono i costi (dati/abilita.js, costoAl)
export const EROI = [
  { chiave: 'cavaliere', nome: 'Cavaliere', em: '🛡️', sprite: 'cavaliere',
    chi: 'il cavaliere',
    vita: 18, att: 3, dif: 1,
    // le caratteristiche di partenza (dati/livelli.js): vita, attacco e difesa qui sopra le contano già, la crescita
    // aggiunge quello che sale oltre. La caratteristica della sua arma vale il suo braccio (guastiDegliEroi)
    parte: { forza: 3, destrezza: 2, intelligenza: 1, tempra: 4 }, vitaPerLivello: 3, dote: 'tempra', lanci: [3, 3, 2.5, 2, 1],
    porta: ['spade', 'asce', 'ferro'],
    dice: 'Tiene botta. Se non sai chi scegliere, è questo.' },

  { chiave: 'elfa', nome: 'Elfa', em: '🧝', sprite: 'elfa',
    chi: 'l\'elfa',
    vita: 15, att: 4, dif: 1,
    parte: { forza: 4, destrezza: 4, intelligenza: 2, tempra: 3 }, vitaPerLivello: 3, dote: 'forza', lanci: [3, 3, 2.5, 2, 1],
    porta: ['spade', 'archi', 'stoffa'],
    dice: 'Colpisce più forte, e regge un po\' meno.' },

  // il mago: la bacchetta è la sua arma (il prezzo del braccio 5), fila completa (un'arma per gradino) per
  // tenere in piedi il gioco del bottino; lo scettro a una mano gli lascia lo scudo, misurato dal banco
  { chiave: 'mago', nome: 'Mago', em: '🧙', sprite: 'mago',
    chi: 'il mago',
    vita: 13, att: 5, dif: 1,
    parte: { forza: 1, destrezza: 2, intelligenza: 5, tempra: 2 }, vitaPerLivello: 2, dote: 'tempra', lanci: [6, 6, 6, 4, 1],
    // anche le spade: il mago guerriero (docs/sotterraneo/abilita.md). Il requisito di forza è quello di tutti; la forza del
    // mago è bassa, quindi comincia dalla spada corta e cresce solo se ci mette dei punti. `secondarie`: armi che la classe
    // impugna ma che non sono la sua (la pagina non pretende che la caratteristica combaci col braccio, vedi guastiDegliEroi)
    porta: ['bacchette', 'spade', 'stoffa'], secondarie: ['spade'],
    dice: 'I mostri cadono in metà risposte. Ma ogni sbaglio fa malissimo.' },

  { chiave: 'nano', nome: 'Nano', em: '🧔', sprite: 'nano',
    chi: 'il nano',
    vita: 20, att: 3, dif: 2,
    parte: { forza: 3, destrezza: 2, intelligenza: 1, tempra: 5 }, vitaPerLivello: 3, dote: 'forza', lanci: [3, 3, 2.5, 2, 1],
    porta: ['asce', 'archi', 'ferro'],
    dice: 'Sbagliare gli fa quasi il solletico. Non cade quasi mai.' },
]

export const DI_PARTENZA = 'cavaliere'

// Maschio o femmina (docs/sotterraneo/personaggio.md): la classe resta quella, con le sue armi e i suoi numeri; cambia chi si vede
// (il modello 3D, il nome, «il mago»/«la maga»). `SESSO_DI_SERIE` è quello di prima che esistesse la scelta: chi non l'ha mai
// fatta ritrova il suo eroe com'era. Il sesso sta nell'avventura (`cfg.avventure[eroe].sesso`), mai nella chiave dell'eroe.
export const SESSI = ['m', 'f']
export const SESSO_DI_SERIE = { cavaliere: 'm', elfa: 'f', mago: 'm', nano: 'm' }
export const VARIANTI = {
  cavaliere: { m: { sprite: 'cavaliere', nome: 'Cavaliere', chi: 'il cavaliere' }, f: { sprite: 'cavaliera', nome: 'Cavaliera', chi: 'la cavaliera' } },
  elfa: { m: { sprite: 'elfo', nome: 'Elfo', chi: 'l\'elfo' }, f: { sprite: 'elfa', nome: 'Elfa', chi: 'l\'elfa' } },
  mago: { m: { sprite: 'mago', nome: 'Mago', chi: 'il mago' }, f: { sprite: 'maga', nome: 'Maga', chi: 'la maga' } },
  nano: { m: { sprite: 'nano', nome: 'Nano', chi: 'il nano' }, f: { sprite: 'nana', nome: 'Nana', chi: 'la nana' } },
}
export const sessoValido = (chiave, sesso) => (SESSI.includes(sesso) ? sesso : SESSO_DI_SERIE[chiave] || 'm')
// tutti i modelli 3D che un eroe può avere, per chiave: i quattro di prima e le quattro varianti
export const MODELLI_EROI = EROI.flatMap(e => SESSI.map(x => VARIANTI[e.chiave][x].sprite))

// L'aspetto scelto (pelle e capelli, toni di `src/grafica/persona/aspetto.js`, in comune con la fattoria): due id, `null` dove non si
// è scelto (restano i colori di serie del modello). Viaggia dentro la chiave del modello, `sprite`: `maga~ambra.rossi` (un `-` per
// il campo non scelto), così tutto quello che passa lo sprite (la corsa, il mondo di sopra, la fila dei turni, le chiavi delle
// anteprime) porta anche i colori senza un campo in più; chi disegna lo apre con `daSprite`.
export const aspettoValido = a => ({ pelle: a && pelleDi(a.pelle) ? a.pelle : null, capelli: a && capelliDi(a.capelli) ? a.capelli : null })
export function spriteConAspetto(sprite, a) {
  const v = aspettoValido(a)
  return v.pelle || v.capelli ? `${sprite}~${v.pelle || '-'}.${v.capelli || '-'}` : sprite
}
/** La chiave del modello con i colori, aperta: `{ modello, pelle, capelli, colori: { pelle?, capelli? } (numeri 0xRRGGBB), chiave }`, o null se il modello non c'è. */
export function daSprite(s) {
  const [modello, resto = ''] = String(s || '').split('~')
  if (!MODELLI_EROI.includes(modello)) return null
  const [p, c] = resto.split('.')
  const a = aspettoValido({ pelle: p, capelli: c })
  const colori = {}
  if (a.pelle) colori.pelle = pelleDi(a.pelle).c
  if (a.capelli) colori.capelli = capelliDi(a.capelli).c
  return { modello, ...a, colori, chiave: spriteConAspetto(modello, a) }
}

// la scheda dell'eroe, col sesso e l'aspetto scelti se li si dicono (senza, quella di serie: tutti i chiamanti di prima restano com'erano)
export function eroeDi(chiave, sesso = null, aspetto = null) {
  const e = EROI.find(x => x.chiave === chiave) || EROI[0]
  const v = SESSI.includes(sesso) && VARIANTI[e.chiave][sesso].sprite !== e.sprite ? { ...e, ...VARIANTI[e.chiave][sesso] } : e
  const a = aspettoValido(aspetto)
  return a.pelle || a.capelli ? { ...v, sprite: spriteConAspetto(v.sprite, a), aspetto: a } : v
}

// prende la scheda della cosa, non la sua chiave: senza famiglia se la mette chiunque
export const portaLa = (eroe, cosa) =>
  !cosa || !cosa.famiglia || (eroe.porta || []).includes(cosa.famiglia)

// Il requisito di un'arma (l'utente, 9 ottobre: rigido, sotto non si indossa): la caratteristica della sua famiglia,
// tanta quanto il gradino e il livello del pezzo. Mite apposta: chi alza la caratteristica della sua arma non lo
// sente, chi la lascia indietro sì. null per quello che non ha famiglia (scudi, armature, gioielli, i pezzi dei grossi)
export const REQUISITO_DEL_GRADINO = [0, 1, 3]
export const LIVELLI_PER_REQUISITO = 4
export function requisitoDi(cosa) {
  const f = cosa && cosa.dove === 'mano' && FAMIGLIE[cosa.famiglia]
  if (!f || !f.car) return null
  const serve = (REQUISITO_DEL_GRADINO[(cosa.grado || 1) - 1] || 0) + Math.floor(((cosa.liv || 1) - 1) / LIVELLI_PER_REQUISITO)
  return serve > 0 ? { car: f.car, serve } : null
}

// Un pezzo si indossa dal suo livello (l'utente, 14 ottobre: «anche se ti offre un oggetto super bello non dovresti poterlo
// equipaggiare»): sotto si compra e si raccoglie, e sta nello zaino col 🔒. `MARGINE_DEL_LIVELLO`: quanti livelli sotto il
// suo si può già portare (docs/sotterraneo/livelli.md)
export const MARGINE_DEL_LIVELLO = 0
export const livelloRichiesto = cosa => (cosa && cosa.dove ? Math.max(1, (cosa.liv || 1) - MARGINE_DEL_LIVELLO) : 1)

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
    // la pagina dell'eroe mostra le caratteristiche: devono raccontare i numeri di partenza, non contraddirli. La
    // caratteristica di ogni arma che la classe porta vale almeno il suo braccio meno uno (l'elfa: spade e archi)
    const p = e.parte || {}
    const CAR = ['forza', 'destrezza', 'intelligenza', 'tempra']
    for (const k of CAR) if (!Number.isInteger(p[k]) || p[k] < 1) g.push(`${e.chiave}: ${k} di partenza ${p[k]}, serve un intero da 1`)
    for (const f of e.porta || []) {
      const car = FAMIGLIE[f] && FAMIGLIE[f].car
      if ((e.secondarie || []).includes(f)) continue
      if (car && Math.abs(p[car] - e.att) > 1) g.push(`${e.chiave}: ${car} ${p[car]} e braccio ${e.att} con ${f}, la pagina direbbe due cose`)
    }
    if (!(e.vitaPerLivello >= 1)) g.push(`${e.chiave}: salendo di livello non prende vita`)
    const v = VARIANTI[e.chiave]
    if (!v || !SESSI.every(x => v[x] && v[x].sprite && v[x].nome && v[x].chi)) g.push(`${e.chiave}: manca una variante (maschio o femmina)`)
    else if (v[SESSO_DI_SERIE[e.chiave]].sprite !== e.sprite) g.push(`${e.chiave}: il sesso di serie non è il suo modello di sempre`)
    if (!CAR.includes(e.dote)) g.push(`${e.chiave}: la dote "${e.dote}" non è una caratteristica`)
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
