/* Le voci della Fattoria 3D per il catalogo (strumenti/banco/catalogo-3d.html). Formato e regole: docs/core/catalogo-3d.md.
   Niente copie dei modelli: `crea` chiama i costruttori veri di scena3d/ (modelli.js, modelli-compagni.js) e, per ciò che il
   gioco monta a istanze (alberi, sassi, cespugli), ricompone la stessa forma con le stesse geometrie. `dove` si ricava dai dati
   (dati/catalogo.js, colture.js, compagni.js), così non invecchia quando un livello si sposta. Chi aggiunge un `crea…` nuovo a
   modelli.js aggiunge qui una voce (il test `catalogo-3d` controlla solo il formato, non che nessuno manchi). */
import * as THREE from 'three'
import {
  ASPETTO, FORME, mat, creaCampo, aggiornaCampo, creaPasticceria, creaMongolfiera, creaMulino, creaPanificio, creaConserviera,
  creaGelateria, creaCaseificio, creaSegnaposto, creaAiuola, creaPanchina, creaPozzo, creaSpaventapasseri, creaBancarella,
  creaFontana, creaPecora, creaRecinto, muoviPecore, creaGallina, creaPollaio, creaStalla, muoviBestie, creaMucca,
  creaFienile, creaCasa, creaTrattore, creaCassa,
} from '../../../src/giochi/fattoria3d/scena3d/modelli.js'
import { creaContadino, creaCane, posaCane, creaGatto, posaGatto } from '../../../src/giochi/fattoria3d/scena3d/modelli-compagni.js'
import { PEZZI, EDIFICI } from '../../../src/giochi/fattoria3d/dati/catalogo.js'
import { COLTURE } from '../../../src/giochi/fattoria3d/dati/colture.js'
import { COMPAGNI } from '../../../src/giochi/fattoria3d/dati/compagni.js'
import { FISSI } from '../../../src/giochi/fattoria3d/dati/mondo.js'

const M = 'src/giochi/fattoria3d/scena3d/modelli.js'
const MC = 'src/giochi/fattoria3d/scena3d/modelli-compagni.js'
const T = 'src/giochi/fattoria3d/scena3d/terreno.js'

const pezzo = t => `pezzo del vassoio, livello ${PEZZI[t].liv}, ${PEZZI[t].w}×${PEZZI[t].d} celle`
const unico = t => `edificio unico al posto ${EDIFICI[t].slot.i},${EDIFICI[t].slot.j}, livello ${EDIFICI[t].liv} (fantasma finché non si compra)`
const celle = d => `${d.w}×${d.d}`
const FINE = Date.now() - 1000          // «pronta»: la gallina mostra l'uovo, la mucca il secchio

/** Le animazioni che il gioco fa nei pezzi.js, riprese una per una (le firme di `userData.anima` non sono uguali). */
const animaCosa = (g, dt, t) => g.userData.anima && g.userData.anima(t)                     // fontana, spaventapasseri
const animaEdificio = (g, dt, t) => { if (g.userData.gira) g.userData.gira.rotation.y += dt * 0.8; if (g.userData.anima) g.userData.anima(dt, t) }

const mesh = (geo, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = o.receiveShadow = true; return o
}

export const VOCI = [
  // ── le colture: lo stesso campo, dieci aspetti (ASPETTO in modelli.js), cresciuto del tutto ──
  ...Object.keys(ASPETTO).map(k => ({
    id: `fattoria:campo-${k}`, nome: `Campo di ${COLTURE[k].nome.toLowerCase()}`, gioco: 'fattoria', categoria: 'pianta',
    dove: `pezzo «campo» ${celle(PEZZI.campo)} quando ci si semina ${COLTURE[k].nome.toLowerCase()} (dal livello ${COLTURE[k].liv}), qui maturo`,
    file: `${M}:creaCampo`, misure: celle(PEZZI.campo),
    crea: () => { const g = creaCampo(3); aggiornaCampo(g, [1, 1, 1, 1], 0, k, false); return g },
    anima: (g, dt, t) => aggiornaCampo(g, [1, 1, 1, 1], t, k, true),
  })),

  // ── i pezzi che il bambino mette dove vuole ──
  { id: 'fattoria:recinto', nome: 'Recinto con le pecore', gioco: 'fattoria', categoria: 'edificio', dove: pezzo('recinto') + ': due pecore adulte e un agnello che vagano',
    file: `${M}:creaRecinto`, misure: celle(PEZZI.recinto),
    crea: () => creaRecinto([{ eta: 'adulta', t0: FINE }, { eta: 'adulta', t0: FINE }, { eta: 'agnello', t0: FINE }]),
    anima: (g, dt, t) => muoviPecore(g, dt, t, null, [{ eta: 'adulta', t0: FINE }, { eta: 'adulta', t0: FINE }, { eta: 'agnello', t0: FINE }], Date.now()) },
  { id: 'fattoria:pollaio', nome: 'Pollaio', gioco: 'fattoria', categoria: 'edificio', dove: pezzo('pollaio') + ': casetta su palafitte e fino a sei galline',
    file: `${M}:creaPollaio`, misure: celle(PEZZI.pollaio),
    crea: () => creaPollaio([{ fine: FINE }, { fine: null }, { fine: Date.now() + 9e6 }, { fine: null }]),
    anima: (g, dt, t) => muoviBestie(g, dt, t, [{ fine: FINE }, { fine: null }, { fine: Date.now() + 9e6 }, { fine: null }], Date.now()) },
  { id: 'fattoria:stalla', nome: 'Stalla', gioco: 'fattoria', categoria: 'edificio', dove: pezzo('stalla') + ': il fienile con fino a quattro mucche in fila',
    file: `${M}:creaStalla`, misure: celle(PEZZI.stalla),
    crea: () => creaStalla([{ fine: FINE }, { fine: null }, { fine: Date.now() + 9e6 }]),
    anima: (g, dt, t) => muoviBestie(g, dt, t, [{ fine: FINE }, { fine: null }, { fine: Date.now() + 9e6 }], Date.now()) },
  { id: 'fattoria:bancarella', nome: 'Bancarella', gioco: 'fattoria', categoria: 'prop', dove: pezzo('bancarella') + ' (con la scritta in trama canvas)', file: `${M}:creaBancarella`, misure: celle(PEZZI.bancarella), crea: () => creaBancarella() },
  { id: 'fattoria:aiuola', nome: 'Aiuola', gioco: 'fattoria', categoria: 'pianta', dove: pezzo('aiuola'), file: `${M}:creaAiuola`, misure: celle(PEZZI.aiuola), crea: () => creaAiuola() },
  { id: 'fattoria:panchina', nome: 'Panchina', gioco: 'fattoria', categoria: 'prop', dove: pezzo('panchina'), file: `${M}:creaPanchina`, misure: celle(PEZZI.panchina), crea: () => creaPanchina() },
  { id: 'fattoria:fontana', nome: 'Fontana', gioco: 'fattoria', categoria: 'prop', dove: pezzo('fontana') + ', con le gocce che zampillano', file: `${M}:creaFontana`, misure: celle(PEZZI.fontana), crea: () => creaFontana(), anima: animaCosa },
  { id: 'fattoria:pozzo', nome: 'Pozzo', gioco: 'fattoria', categoria: 'prop', dove: pezzo('pozzo'), file: `${M}:creaPozzo`, misure: celle(PEZZI.pozzo), crea: () => creaPozzo() },
  { id: 'fattoria:spaventapasseri', nome: 'Spaventapasseri', gioco: 'fattoria', categoria: 'prop', dove: pezzo('spaventapasseri') + ', dondola piano', file: `${M}:creaSpaventapasseri`, misure: celle(PEZZI.spaventapasseri), crea: () => creaSpaventapasseri(), anima: animaCosa },
  { id: 'fattoria:segnaposto', nome: 'Segnaposto grigio', gioco: 'fattoria', categoria: 'altro', dove: 'ripiego: lo mostra la scena per un tipo di pezzo senza disegno (pezzi.js, modelloDi)', file: `${M}:creaSegnaposto`, misure: '2×2', crea: () => creaSegnaposto(2, 2) },

  { id: 'fattoria:trattore', nome: 'Trattore', gioco: 'fattoria', categoria: 'altro', dove: 'in lavorazione: il costruttore c\'è in modelli.js, non è ancora montato in scena', file: `${M}:creaTrattore`, crea: () => creaTrattore() },
  { id: 'fattoria:cassa', nome: 'Cassa di legno', gioco: 'fattoria', categoria: 'prop', dove: 'in lavorazione: il costruttore c\'è in modelli.js, non è ancora montato in scena', file: `${M}:creaCassa`, misure: '1×1', crea: () => creaCassa() },

  // ── gli edifici unici, uno per tipo, in lotti fissi ──
  { id: 'fattoria:pasticceria', nome: 'Pasticceria', gioco: 'fattoria', categoria: 'edificio', dove: unico('pasticceria') + ': forno, torta che gira', file: `${M}:creaPasticceria`, misure: celle(EDIFICI.pasticceria), crea: () => creaPasticceria(), anima: animaEdificio },
  { id: 'fattoria:mongolfiera', nome: 'Mongolfiera', gioco: 'fattoria', categoria: 'edificio', dove: unico('mongolfiera') + ': parte per i viaggi di vendita', file: `${M}:creaMongolfiera`, misure: celle(EDIFICI.mongolfiera),
    crea: () => creaMongolfiera(), anima: (g, dt, t) => { const u = g.userData; u.volo.position.y = Math.sin(t * 1.3) * 0.08; u.volo.rotation.z = Math.sin(t * 0.9) * 0.02; u.fiamma.scale.set(1, 1.2 + Math.sin(t * 14) * 0.4, 1) } },
  { id: 'fattoria:mulino', nome: 'Mulino', gioco: 'fattoria', categoria: 'edificio', dove: unico('mulino') + ': pale a vento, macina il grano', file: `${M}:creaMulino`, misure: celle(EDIFICI.mulino), crea: () => creaMulino(), anima: animaEdificio },
  { id: 'fattoria:panificio', nome: 'Panificio', gioco: 'fattoria', categoria: 'edificio', dove: unico('panificio') + ': forno con la bocca accesa', file: `${M}:creaPanificio`, misure: celle(EDIFICI.panificio), crea: () => creaPanificio(), anima: animaEdificio },
  { id: 'fattoria:conserviera', nome: 'Conserviera', gioco: 'fattoria', categoria: 'edificio', dove: unico('conserviera'), file: `${M}:creaConserviera`, misure: celle(EDIFICI.conserviera), crea: () => creaConserviera(), anima: animaEdificio },
  { id: 'fattoria:gelateria', nome: 'Gelateria', gioco: 'fattoria', categoria: 'edificio', dove: unico('gelateria') + ': il cono che gira sul tetto', file: `${M}:creaGelateria`, misure: celle(EDIFICI.gelateria), crea: () => creaGelateria(), anima: animaEdificio },
  { id: 'fattoria:caseificio', nome: 'Caseificio', gioco: 'fattoria', categoria: 'edificio', dove: unico('caseificio') + ': la ruota del formaggio', file: `${M}:creaCaseificio`, misure: celle(EDIFICI.caseificio), crea: () => creaCaseificio(), anima: animaEdificio },

  // ── solo di scena: nascono col terreno ──
  ...FISSI.map(f => ({
    id: `fattoria:${f.tipo}`, nome: f.tipo === 'fienile' ? 'Fienile' : 'Casa del contadino', gioco: 'fattoria', categoria: 'edificio',
    dove: `scenario fisso (non si compra) al posto ${f.i},${f.j}, ${f.w}×${f.d} celle (terreno.js, _fisse)`,
    file: `${M}:${f.tipo === 'fienile' ? 'creaFienile' : 'creaCasa'}`, misure: `${f.w}×${f.d}`, crea: () => f.tipo === 'fienile' ? creaFienile() : creaCasa(),
    anima: animaEdificio,
  })),

  // ── gli animali ──
  { id: 'fattoria:pecora', nome: 'Pecora', gioco: 'fattoria', categoria: 'animale', dove: 'dentro il recinto (si tosa, fa gli agnelli)', file: `${M}:creaPecora`, crea: () => creaPecora() },
  { id: 'fattoria:gallina-bianca', nome: 'Gallina bianca', gioco: 'fattoria', categoria: 'animale', dove: 'nel pollaio, posti pari (con l\'uovo da raccogliere)', file: `${M}:creaGallina`,
    crea: () => { const g = creaGallina(0); g.userData.uovo.visible = true; return g } },
  { id: 'fattoria:gallina-bruna', nome: 'Gallina bruna', gioco: 'fattoria', categoria: 'animale', dove: 'nel pollaio, posti dispari', file: `${M}:creaGallina`, crea: () => creaGallina(1) },
  { id: 'fattoria:mucca', nome: 'Mucca', gioco: 'fattoria', categoria: 'animale', dove: 'nella stalla (col secchio del latte da raccogliere)', file: `${M}:creaMucca`,
    crea: () => { const g = creaMucca(0); g.userData.dono.visible = true; return g } },
  { id: 'fattoria:mucca-2', nome: 'Mucca (variante)', gioco: 'fattoria', categoria: 'animale', dove: 'nella stalla, altri posti: le chiazze cambiano', file: `${M}:creaMucca`, crea: () => creaMucca(1) },

  // ── chi gira per la fattoria ──
  { id: 'fattoria:contadino', nome: 'Contadino (l\'eroe)', gioco: 'fattoria', categoria: 'personaggio', dove: 'il giocatore, sempre in scena (eroe.js); semina, falcia, abbatte', file: `${MC}:creaContadino`, crea: () => creaContadino('contadino') },
  { id: 'fattoria:contadina', nome: 'Contadina', gioco: 'fattoria', categoria: 'personaggio', dove: 'aspetto alternativo dell\'eroe (ASPETTO_ERO in dati/compagni.js), oggi non scelto', file: `${MC}:creaContadino`, crea: () => creaContadino('contadina') },
  { id: 'fattoria:watson', nome: `${COMPAGNI.watson.nome} (bobtail)`, gioco: 'fattoria', categoria: 'animale', dove: `il cane di casa, arriva al livello ${COMPAGNI.watson.liv} (scena3d/compagni.js)`, file: `${MC}:creaCane`,
    crea: () => creaCane(), anima: (g, dt, t) => posaCane(g, { stato: 'sta', t }) },
  // le pose di Watson, ferme nell'anteprima e mosse nella vista grande: per giudicarle senza giocare (posaCane)
  ...[['seduto', 'siede', 0, 'quando il contadino lavora, o dopo averlo raggiunto'], ['sdraiato', 'dorme', 0, 'dorme se il contadino sta fermo da un quarto d\'ora'],
    ['che cammina', 'vaga', 0.5, 'segue il contadino, va ai campi'], ['che corre', 'vaga', 1, 'corre dal contadino quando è lontano'],
    ['che annusa', 'annusa', 0, 'annusa un campo, fermo a due celle'], ['che fa festa', 'festa', 0, 'appena toccato: «Bau!», cuoricini']].map(([nome, stato, vel, dove]) => ({
    id: `fattoria:watson-${stato}${vel ? '-' + vel : ''}`, nome: `${COMPAGNI.watson.nome} ${nome}`, gioco: 'fattoria', categoria: 'animale', dove: `posa «${stato}»: ${dove}`, file: `${MC}:posaCane`,
    crea: () => { const g = creaCane(); posaCane(g, { stato, vel, fase: 1.2, t: 0.4 }); return g },
    anima: (g, dt, t) => posaCane(g, { stato, vel, fase: t * (vel > 0.7 ? 11 : 7), t }),
  })),
  ...['briciola', 'zenzero', 'pepe'].map(id => ({
    id: `fattoria:${id}`, nome: `${COMPAGNI[id].nome} (gatto ${COMPAGNI[id].variante})`, gioco: 'fattoria', categoria: 'animale',
    dove: `gatto che gira per il terreno, arriva al livello ${COMPAGNI[id].liv} (scena3d/compagni.js)`, file: `${MC}:creaGatto`,
    crea: () => creaGatto(COMPAGNI[id].variante), anima: (g, dt, t) => posaGatto(g, { stato: 'sta', t }),
  })),

  // ── il terreno: a istanze nel gioco, qui un esemplare con le stesse geometrie ──
  { id: 'fattoria:albero', nome: 'Abete', gioco: 'fattoria', categoria: 'pianta', dove: 'alberi del bosco e dei lotti, si abbattono con l\'ascia (terreno.js, _alberi; geometrie FORME di modelli.js)', file: `${T}:_alberi`, misure: '1×1',
    crea: () => { const g = new THREE.Group(), c = mat(new THREE.Color().setHSL(0.29, 0.5, 0.35).getHex()); g.add(mesh(FORME.tronco, mat(0x7a5232)), mesh(FORME.chioma, c), mesh(FORME.chioma2, c)); return g } },
  { id: 'fattoria:cespuglio', nome: 'Cespuglio', gioco: 'fattoria', categoria: 'pianta', dove: 'ostacolo nei lotti, si toglie toccandolo (terreno.js, _ostacoli)', file: `${T}:_ostacoli`, misure: '1×1',
    crea: () => mesh(new THREE.IcosahedronGeometry(0.4, 0), mat(new THREE.Color().setHSL(0.3, 0.55, 0.32).getHex()), 0, 0.28, 0, 1.15, 0.85, 1.15) },
  { id: 'fattoria:sasso', nome: 'Sasso', gioco: 'fattoria', categoria: 'prop', dove: 'ostacolo nei lotti, si toglie toccandolo (terreno.js, _ostacoli)', file: `${T}:_ostacoli`, misure: '1×1',
    crea: () => mesh(new THREE.IcosahedronGeometry(0.32, 0), mat(new THREE.Color().setHSL(0.1, 0.05, 0.57).getHex()), 0, 0.15, 0, 1.1, 0.75, 1) },
]
