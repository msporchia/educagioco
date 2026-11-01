// I mostri grossi: uno in fondo a ogni discesa della storia, uno ogni GROSSO_OGNI piani nell'abisso
// (docs/sotterraneo/grossi.md). Il nome è suo, sta nella stanza della scala e ne porta la chiave, e quando cade
// lascia di sicuro un pezzo raro o meglio più il suo pezzo col nome (dati/pezzi.js, DEI_GROSSI). Come si vede: il suo modello 3D
// (scena3d/mostri3d/registro.js, MODELLO_DEL_GROSSO) con la corona, grande quanto dice dati/altezze.js (ALTO_DEL_GROSSO).
// `tipo`: il mostro del bestiario su cui si regge (dati/mostri.js): ossa, attacco e velocità di partenza e il rincaro della
// domanda; `ossa` moltiplica le sue ossa, `att` aggiunge al suo attacco. `figura`: la specie del bestiario che somiglia (il suo modello
// sta nel registro dei modelli); senza, quella di `tipo`: così Zannaverde è un ragno e Carbonchio un drago di lava pur contando come
// l'orco e il gigante, e i numeri della taratura restano quelli. `tinta`: il colore
// del chiarore che gli sta intorno, per distinguere due grossi della stessa specie (Re Ossuto e Carbonchio).
// `difese`: le sue resistenze, debolezze e immunità (dati/elementi.js) al posto di quelle della specie: Carbonchio, il re di
// brace, non brucia; senza `difese` ha quelle di `tipo`.
// `copricapo`: un secondo pezzo col nome, da testa, che cade solo dove i copricapi sono accesi (dati/pezzi.js, COPRICAPI_DEI_GROSSI).
// `ruolo: 'superboss'`: tre mosse invece di due (dati/mosse.js, docs/sotterraneo/mosse.md): l'ultimo della storia e il più forte dei sei nuovi.
import { MOSTRI } from './mostri.js'
import { guastiDelleDifese } from './elementi.js'
import { DEI_GROSSI } from './pezzi.js'
import { ALTO_DEL_GROSSO } from './altezze.js'

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
  carbonchio: { nome: 'Carbonchio', tipo: 'gigante', figura: 'drago-lava', ossa: 1.1, att: 1, tinta: '#ff5a1c', ruolo: 'superboss',
                difese: { resiste: ['fuoco'], teme: ['gelo'], immune: ['brucia'] },
                pezzo: 'martello-di-carbonchio', dice: 'Il drago di lava delle miniere: le sue squame sono carbone acceso.' },
  // i sei dei dungeon nuovi del mondo a percorso (dati/dungeon-del-mondo.js): creature del catalogo ingrandite con la
  // corona, sulle basi e coi numeri dei sette (il troll fino al 9, poi il gigante); da tarare col banco a lavoro finito
  barbamuschio: { nome: 'Roccaverde', tipo: 'troll', figura: 'golem-muschio', ossa: 1.1, att: 1, tinta: '#6fbf4a',
                  difese: { resiste: ['veleno', 'fisico'], teme: ['fuoco'], immune: ['stordisce', 'avvelena'] },
                  pezzo: 'scudo-di-barbamuschio', dice: 'Un golem di pietra coperto di muschio: quando cammina, il prato trema.' },
  piumanera: { nome: 'Piumanera', genere: 'f', tipo: 'troll', figura: 'grifone', ossa: 1.1, att: 1, tinta: '#8c7bd6',
               difese: { resiste: ['gelo'], teme: ['fulmine'], immune: ['stordisce'] },
               pezzo: 'medaglione-di-piumanera', copricapo: 'elmo-di-piumanera', dice: 'Un grifone con le penne nere come la notte, e un becco che spacca i sassi.' },
  sibilla: { nome: 'Sibilla', genere: 'f', tipo: 'gigante', figura: 'serpente', ossa: 1.1, att: 1, tinta: '#9ad14a',
             difese: { resiste: ['veleno'], teme: ['gelo'], immune: ['avvelena'] },
             pezzo: 'giubba-di-sibilla', dice: 'Un serpente lungo come il ponte del guado, che sibila nel fango.' },
  brontolava: { nome: 'Vulcanor', tipo: 'gigante', figura: 'golem-magma', ossa: 1.15, att: 1, tinta: '#ff7a2c',
                difese: { resiste: ['fuoco', 'fisico'], teme: ['gelo'], immune: ['brucia', 'stordisce'] },
                pezzo: 'scudo-di-brontolava', dice: 'Un golem di lava che brontola come una pentola: dove passa, la pietra si scioglie.' },
  brinaldo: { nome: 'Gelomagno', tipo: 'gigante', figura: 'golem-ghiaccio', ossa: 1.15, att: 1, tinta: '#8fd8ff',
              difese: { resiste: ['gelo'], teme: ['fuoco'], immune: ['gela', 'stordisce'] },
              pezzo: 'amuleto-di-brinaldo', dice: 'Un golem di ghiaccio: ogni cosa che tocca diventa brina.' },
  falcenera: { nome: 'Falcenera', genere: 'f', tipo: 'gigante', figura: 'mietitore', ossa: 1.2, att: 2, tinta: '#b58cff', ruolo: 'superboss',
               difese: { resiste: ['gelo'], teme: ['sacro'], immune: ['avvelena', 'sanguina'] },
               pezzo: 'scudo-di-falcenera', dice: 'Il mietitore delle tombe del vento, con la falce più lunga di un albero.' },
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
  // i dungeon nuovi del 3D (dati/dungeon-del-mondo.js)
  cerchio: 'barbamuschio', corvaia: 'piumanera', palafitta: 'sibilla', fornace: 'brontolava', cava: 'brinaldo', tombe: 'falcenera',
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

export function guastiDeiGrossi(campagna = []) {
  const g = []
  for (const [k, x] of Object.entries(GROSSI)) {
    if (!x.nome || !x.dice) g.push(`${k}: senza nome o senza frase`)
    if (!MOSTRI[x.tipo]) g.push(`${k}: si regge su "${x.tipo}", che non è nel bestiario`)
    if (!DEI_GROSSI[x.pezzo]) g.push(`${k}: il suo pezzo "${x.pezzo}" non c'è`)
    if (!(x.ossa >= 1 && x.ossa <= 3)) g.push(`${k}: ossa ×${x.ossa}, fuori da 1..3`)
    if (!/^#[0-9a-f]{6}$/i.test(x.tinta || '')) g.push(`${k}: la tinta "${x.tinta}" non è un colore #rrggbb`)
    if (x.figura && !MOSTRI[x.figura]) g.push(`${k}: veste "${x.figura}", che non è nel bestiario`)
    if (!(ALTO_DEL_GROSSO[k] > 0)) g.push(`${k}: non ha la sua misura in dati/altezze.js`)
    g.push(...guastiDelleDifese(k, x.difese))
  }
  for (const t of campagna) if (!GROSSI[GROSSO_DELLA_DISCESA[t.chiave]]) g.push(`${t.chiave}: in fondo non c'è nessun mostro grosso`)
  for (const k of GIRO_DELL_ABISSO) if (!GROSSI[k]) g.push(`l'abisso chiama "${k}", che non c'è`)
  const pezzi = Object.values(GROSSI).map(x => x.pezzo)
  if (new Set(pezzi).size !== pezzi.length) g.push('due mostri grossi lasciano lo stesso pezzo')
  return g
}
