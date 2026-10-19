// I mostri grossi: uno in fondo a ogni discesa della storia, uno ogni GROSSO_OGNI piani nell'abisso
// (docs/sotterraneo/grossi.md). Il nome è suo, sta nella stanza della scala e ne porta la chiave, e quando cade
// lascia di sicuro un pezzo raro o meglio più il suo pezzo col nome (dati/pezzi.js, DEI_GROSSI). Come si vede:
// `figuraDelGrosso` più sotto (lo sprite della sua specie ingrandito con la corona, finché non c'è quello dipinto).
// `tipo`: il mostro del bestiario su cui si regge (dati/mostri.js): ossa, attacco e velocità di partenza e il rincaro della
// domanda; `ossa` moltiplica le sue ossa, `att` aggiunge al suo attacco. `figura`: la creatura che veste, ingrandita con la corona
// (una specie del bestiario o una del catalogo comune, docs/core/creature.md); senza, quella di `tipo`: così Zannaverde è un ragno
// e Carbonchio un drago di lava pur contando come l'orco e il gigante, e i numeri della taratura restano quelli. `tinta`: il colore
// del chiarore che gli sta intorno, per distinguere due grossi della stessa specie (Re Ossuto e Carbonchio).
// `difese`: le sue resistenze, debolezze e immunità (dati/elementi.js) al posto di quelle della specie: Carbonchio, il re di
// brace, non brucia; senza `difese` ha quelle di `tipo`.
import { MOSTRI } from './mostri.js'
import { guastiDelleDifese } from './elementi.js'
import { DEI_GROSSI } from './pezzi.js'
import { PEZZI } from './atlante.js'
import { quantiFotogrammi } from './fotogrammi.js'

export const GROSSI = {
  ossuto: { nome: 'Re Ossuto', tipo: 'scheletro', figura: 'negromante', ossa: 1.15, att: 0, tinta: '#e8dcc0',
            pezzo: 'ciondolo-di-ossuto', dice: 'Il re delle ossa vecchie, col suo bastone e la sua corona. Scricchiola, ma picchia.' },
  grumo: { nome: 'Grumo', tipo: 'orco', ossa: 1.9, att: 3, tinta: '#7fd16a',
           pezzo: 'mazza-di-grumo', dice: 'Un orco grosso come una porta, con la sua mazza preferita.' },
  fiammetta: { nome: 'Fiammetta', genere: 'f', tipo: 'troll', figura: 'spirito-fuoco', ossa: 1.1, att: 1, tinta: '#ff8a3c',
               difese: { resiste: ['fuoco'], teme: ['gelo'], immune: ['brucia'] },
               pezzo: 'scudo-di-fiammetta', dice: 'Uno spirito di fuoco grande come una porta: dove passa, i sassi fumano.' },
  zannaverde: { nome: 'Zannaverde', tipo: 'orco', figura: 'ragno', ossa: 1.95, att: 3, tinta: '#9cff4a',
                difese: { resiste: ['veleno'], teme: ['fuoco'], immune: ['avvelena'] },
                pezzo: 'anello-di-zannaverde', dice: 'Un ragno lungo come un carro, con otto zampe e otto occhi.' },
  gorgo: { nome: 'Gorgo', tipo: 'gigante', figura: 'polpo', ossa: 1.15, att: 1, tinta: '#5aa8ff',
           difese: { resiste: ['fuoco', 'gelo'], teme: ['fulmine'], immune: ['brucia'] },
           pezzo: 'amuleto-di-gorgo', dice: 'Un polpo grosso come una barca, che gorgoglia nell\'acqua nera.' },
  minotto: { nome: 'Minotto', tipo: 'troll', figura: 'bestia-cornuta', ossa: 1.1, att: 1, tinta: '#d49a55',
             difese: { resiste: ['veleno'], teme: ['fuoco'], immune: ['stordisce'] },
             pezzo: 'giubbone-di-minotto', dice: 'Ha le corna, e la porta dell\'inferno è casa sua.' },
  carbonchio: { nome: 'Carbonchio', tipo: 'gigante', figura: 'drago-lava', ossa: 1.1, att: 1, tinta: '#ff5a1c',
                difese: { resiste: ['fuoco'], teme: ['gelo'], immune: ['brucia'] },
                pezzo: 'martello-di-carbonchio', dice: 'Il drago di lava delle miniere: le sue squame sono carbone acceso.' },
}

// Le difese di un mostro del piano (`m.tipo`, e `m.grosso` se è un grosso; `m.difese` se la sua variante le cambia): { resiste, teme, immune }
export function difeseDi(m) {
  const g = m && m.grosso && GROSSI[m.grosso]
  const d = (g && g.difese) || (m && m.difese) || (m && MOSTRI[m.tipo]) || {}
  return { resiste: d.resiste || [], teme: d.teme || [], immune: d.immune || [] }
}

// chi aspetta in fondo a ogni discesa della storia (la chiave della tappa in dati/campagna.js)
export const GROSSO_DELLA_DISCESA = {
  altare: 'ossuto', cantine: 'grumo', torre: 'fiammetta', gallerie: 'zannaverde',
  cisterna: 'gorgo', labirinto: 'minotto', fondo: 'carbonchio',
}

// nell'abisso uno ogni cinque piani (il 5°, il 10°…), a giro: tornano più forti, perché cresce il piano
export const GROSSO_OGNI = 5
export const GIRO_DELL_ABISSO = ['grumo', 'zannaverde', 'fiammetta', 'ossuto', 'minotto', 'gorgo', 'carbonchio']

// il mostro grosso del piano `piano` (da 0) della tappa, o null: nella storia l'ultimo piano, nell'abisso ogni GROSSO_OGNI
export function grossoDi(tappa, piano) {
  if (!tappa) return null
  if (tappa.abisso) {
    if ((piano + 1) % GROSSO_OGNI) return null
    return GIRO_DELL_ABISSO[(Math.floor((piano + 1) / GROSSO_OGNI) - 1) % GIRO_DELL_ABISSO.length]
  }
  return piano >= tappa.piani - 1 ? GROSSO_DELLA_DISCESA[tappa.chiave] || null : null
}

// Come si vede un mostro grosso (docs/sotterraneo/grossi.md, «Come si vede»). Se l'atlante ha il suo sprite dipinto
// (`grosso-<chiave>-fermo-0`, come `armaiolo-fermo-0` per i mercanti) si usa quello, a misura vera: 32×32 pixel di
// gioco, due caselle per due. Se no la creatura che veste (`figura`, o la specie di `tipo`): il suo sprite del catalogo,
// ingrandito nella sua scatola (`ingrandimentoDelGrosso`: 1,9 altezze dell'eroe, 3 larghezze) e con la corona sopra la testa.
// Torna { sprite, dipinto, alto, k, unaPosa, fermoDaiPassi } (`alto`: l'altezza dello sprite in pixel, `k` il suo ingrandimento) o null.
export const LATO_DEL_GROSSO = 32
// La scatola di un grosso ripiego, in altezze e larghezze dell'eroe (sprite di 28×16): né più alto di GROSSO_ALTO né più largo di
// GROSSO_LARGO, a quarti di ingrandimento (docs/sotterraneo/grossi.md, «Come si vede»). Un ragno è largo e basso, un negromante alto
// e stretto: con una misura sola uno debordava e l'altro restava un nano (l'utente, 13 ottobre: Zannaverde e la sua corona troppo grandi)
export const EROE = { alto: 28, largo: 16 }
export const GROSSO_ALTO = 1.9
export const GROSSO_LARGO = 3
export const ingrandimentoDelGrosso = (alto, largo) =>
  Math.max(1, Math.floor(Math.min(GROSSO_ALTO * EROE.alto / alto, GROSSO_LARGO * EROE.largo / largo) * 4) / 4)
// i pixel di schermo per pixel di sprite di un grosso quando l'eroe ha scala `s`: il dipinto (scatola di 32×32) riempie la scatola, il ripiego
// ha il suo ingrandimento; a quarti, mai sotto mezzo
export const scalaDelGrosso = (chiave, s) => {
  const f = figuraDelGrosso(chiave)
  if (!f) return s
  return Math.max(0.5, Math.round(s * (f.dipinto ? GROSSO_ALTO * EROE.alto / LATO_DEL_GROSSO : f.k) * 4) / 4)
}
export function figuraDelGrosso(chiave) {
  const G = GROSSI[chiave]
  if (!G) return null
  const dipinto = `grosso-${chiave}`
  if (PEZZI[`${dipinto}-fermo-0`]) return { sprite: dipinto, dipinto: true, alto: PEZZI[`${dipinto}-fermo-0`][3], k: 1, unaPosa: false }
  const nome = G.figura || G.tipo
  const scheda = MOSTRI[nome]
  const sprite = scheda ? scheda.sprite : nome   // una creatura del catalogo che non è una specie di strada (il drago di lava) è solo uno sprite
  const p = PEZZI[`${sprite}-fermo-0`]
  if (!p) return null
  return { sprite, dipinto: false, alto: p[3], k: ingrandimentoDelGrosso(p[3], p[2]), unaPosa: scheda ? !!scheda.unaPosa : !PEZZI[`${sprite}-corsa-0`],
           fermoDaiPassi: !!(scheda && scheda.fermoDaiPassi) }
}

// il nome del fotogramma da posare: da sveglio la corsa (se la sua specie ce l'ha), da addormentato il fermo; `fr` gira sui
// fotogrammi che ci sono. Chi ha il respiro rotto (il drago) sta fermo sul primo passo. `sveglio === 'scontro'`: la posa di lato
// ferma di chi ha i passi (nello scontro guarda l'eroe di profilo), il respiro per gli altri
export function spriteDelGrosso(f, sveglio, fr = 0) {
  const haPassi = !f.unaPosa && quantiFotogrammi(f.sprite, 'corsa') > 0
  const posa = haPassi && (sveglio || f.fermoDaiPassi) ? 'corsa' : 'fermo'
  const n = quantiFotogrammi(f.sprite, posa)
  const k = sveglio === 'scontro' || (posa === 'corsa' && !sveglio) ? 0 : fr
  return `${f.sprite}-${posa}-${n ? k % n : 0}`
}

export function guastiDeiGrossi(campagna = []) {
  const g = []
  for (const [k, x] of Object.entries(GROSSI)) {
    if (!x.nome || !x.dice) g.push(`${k}: senza nome o senza frase`)
    if (!MOSTRI[x.tipo]) g.push(`${k}: si regge su "${x.tipo}", che non è nel bestiario`)
    if (!DEI_GROSSI[x.pezzo]) g.push(`${k}: il suo pezzo "${x.pezzo}" non c'è`)
    if (!(x.ossa >= 1 && x.ossa <= 3)) g.push(`${k}: ossa ×${x.ossa}, fuori da 1..3`)
    if (!/^#[0-9a-f]{6}$/i.test(x.tinta || '')) g.push(`${k}: la tinta "${x.tinta}" non è un colore #rrggbb`)
    if (!figuraDelGrosso(k)) g.push(`${k}: lo sprite di "${x.tipo}" non è nell'atlante`)
    g.push(...guastiDelleDifese(k, x.difese))
  }
  for (const t of campagna) if (!GROSSI[GROSSO_DELLA_DISCESA[t.chiave]]) g.push(`${t.chiave}: in fondo non c'è nessun mostro grosso`)
  for (const k of GIRO_DELL_ABISSO) if (!GROSSI[k]) g.push(`l'abisso chiama "${k}", che non c'è`)
  const pezzi = Object.values(GROSSI).map(x => x.pezzo)
  if (new Set(pezzi).size !== pezzi.length) g.push('due mostri grossi lasciano lo stesso pezzo')
  return g
}
