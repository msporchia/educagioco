/* Le voci della Fattoria 3D per il catalogo (strumenti/banco/catalogo-3d.html). Formato e regole: docs/core/catalogo-3d.md.
   Casa, bancarella, bacheca e cespuglio sono le copie adattate di scena3d/dal-sotterraneo.js (`gioco: 'entrambi'`, `file` punta lì).
   Niente copie dei modelli: `crea` chiama i costruttori veri di scena3d/ (modelli.js, modelli-compagni.js) e, per ciò che il
   gioco monta a istanze (alberi, sassi, cespugli), ricompone la stessa forma con le stesse geometrie. `dove` si ricava dai dati
   (dati/catalogo.js, colture.js, compagni.js), così non invecchia quando un livello si sposta. Chi aggiunge un `crea…` nuovo a
   modelli.js aggiunge qui una voce (il test `catalogo-3d` controlla solo il formato, non che nessuno manchi). */
import * as THREE from 'three'
import {
  ASPETTO, FORME, mat, creaCampo, aggiornaCampo, creaPasticceria, creaMongolfiera, creaMulino, creaPanificio, creaConserviera,
  creaGelateria, creaCaseificio, creaSegnaposto, creaAiuola, creaPanchina, creaPozzo, creaSpaventapasseri, creaBancarella,
  creaFontana, creaPecora, creaRecinto, muoviPecore, creaGallina, creaPollaio, creaStalla, muoviBestie, creaMucca,
  creaFienile, creaCasa, creaTrattore, creaCassa, creaBacheca, creaCasaVecchia, creaBancarellaVecchia,
} from '../../../src/giochi/fattoria3d/scena3d/modelli.js'
import { creaZuccherificio, creaTelaio, creaSartoria, creaTintoria } from '../../../src/giochi/fattoria3d/scena3d/modelli-macchine.js'
import { creaContadino, creaCane, posaCane, creaGatto, posaGatto } from '../../../src/giochi/fattoria3d/scena3d/modelli-compagni.js'
import { creaPonte, creaPasserella, creaTavolo } from '../../../src/giochi/fattoria3d/scena3d/modelli-passaggi.js'
import { creaStagno } from '../../../src/giochi/fattoria3d/scena3d/modelli-acqua.js'
import { geometriaCespuglio } from '../../../src/giochi/fattoria3d/scena3d/dal-sotterraneo.js'
import { ANIMALI } from '../../../src/giochi/fattoria3d/dati/animali.js'
import { PECORE } from '../../../src/giochi/fattoria3d/dati/regole.js'
import { PEZZI, EDIFICI } from '../../../src/giochi/fattoria3d/dati/catalogo.js'
import { COLTURE } from '../../../src/giochi/fattoria3d/dati/colture.js'
import { COMPAGNI } from '../../../src/giochi/fattoria3d/dati/compagni.js'
import { FISSI } from '../../../src/giochi/fattoria3d/dati/mondo.js'
import { CACHE_MODELLI } from '../../../src/giochi/fattoria3d/scena3d/cache-modelli.js'
import { FONDI } from '../../../src/giochi/fattoria3d/scena3d/fondi.js'

// `&senzacache=1`: i modelli si costruiscono da capo a ogni voce, come prima della cache; serve a confrontare le schede pixel per pixel
const indirizzo = typeof location === 'undefined' ? new URLSearchParams() : new URLSearchParams(location.search)       // (il test lo importa anche da node)
if (indirizzo.has('senzacache')) CACHE_MODELLI.acceso = false
if (indirizzo.has('senzafondi')) FONDI.acceso = false        // e `&senzafondi=1`: nemmeno le mesh fuse (i modelli sciolti)

const M = 'src/giochi/fattoria3d/scena3d/modelli.js'
const MM = 'src/giochi/fattoria3d/scena3d/modelli-macchine.js'
const MC = 'src/giochi/fattoria3d/scena3d/modelli-compagni.js'
const MCO = 'src/giochi/fattoria3d/scena3d/modelli-colture.js'
const T = 'src/giochi/fattoria3d/scena3d/terreno.js'
const D = 'src/giochi/fattoria3d/scena3d/dal-sotterraneo.js'      // le copie adattate dei modelli del Sotterraneo (docs/fattoria3d/scena.md)
const MP = 'src/giochi/fattoria3d/scena3d/modelli-passaggi.js'
const MA = 'src/giochi/fattoria3d/scena3d/modelli-acqua.js'

const pezzo = t => `pezzo del vassoio, livello ${PEZZI[t].liv}, ${PEZZI[t].w}×${PEZZI[t].d} celle`
const unico = t => `edificio unico, si mette dove si vuole nel terreno proprio (menu Costruisci, scheda Edifici), livello ${EDIFICI[t].liv}`
const celle = d => `${d.w}×${d.d}`
const CRESCITE = [0.75, 1, 0.2, 0.45]    // le tessere: dietro a sinistra, dietro a destra, davanti a sinistra, davanti a destra
const FINE = Date.now() - 1000          // «pronta»: la gallina mostra l'uovo, la mucca il secchio
// i tre stadi di un animale (docs/fattoria3d/animali.md, «I tre stadi»): 'fame', 'lavora' (a metà, p = 0,5) e 'pronta'. Lo stato si ricalcola a ogni fotogramma
// (l'ora passa), e il modello è fermo in un punto (niente passeggiate) e già nello stadio, anche nella scheda che non anima.
const MS = { gallina: ANIMALI.pollaio.ms, mucca: ANIMALI.stalla.ms }
const statoBestia = (specie, stadio) => { const t = Date.now(); return { fine: stadio === 'fame' ? null : stadio === 'pronta' ? t - 1000 : t + MS[specie] * 0.5 } }
const statoPecora = (stadio) => { const t = Date.now(); return { eta: 'adulta', t0: stadio === 'fame' ? null : stadio === 'pronta' ? t - PECORE.laneMs - 1000 : t - PECORE.laneMs * 0.5 } }
function inStadio (specie, stadio) {
  const fai = specie === 'gallina' ? () => creaGallina(0) : specie === 'mucca' ? () => creaMucca(0) : () => creaPecora()
  const passo = (g, dt, t) => specie === 'pecora' ? muoviPecore({ userData: { pecore: [g] } }, dt, t, null, [statoPecora(stadio)], Date.now()) : muoviBestie({ userData: { bestie: [g] } }, dt, t, [statoBestia(specie, stadio)], Date.now())
  return {
    crea: () => { const g = fai(); g.userData.attesa = 1e9; g.userData.zona && (g.userData.zona = { x0: 0, x1: 0, z0: 0, z1: 0 }); passo(g, 0.016, 0.6); return g },
    anima: (g, dt, t) => { g.userData.attesa = 1e9; passo(g, dt, t + 0.6) },
  }
}
const NOMI_STADIO = { fame: 'ha fame', lavora: 'al lavoro (a metà)', pronta: 'pronta' }
const stadi = (specie, nome, file, dove) => ['fame', 'lavora', 'pronta'].map(st => ({
  id: `fattoria:${specie}-${st}`, nome: `${nome} · ${NOMI_STADIO[st]}`, gioco: 'fattoria', categoria: 'animale', dove: `${dove}: lo stadio «${NOMI_STADIO[st]}» (bestie-puro.js)`, file, ...inStadio(specie, st),
}))
const statiStalla = () => [{ fine: FINE }, { fine: null }, { fine: Date.now() + 9e6 }, { fine: null }]   // la stalla piena: pronta, fame, al lavoro, fame

/** Le animazioni che il gioco fa nei pezzi.js, riprese una per una (le firme di `userData.anima` non sono uguali). */
const animaCosa = (g, dt, t) => g.userData.anima && g.userData.anima(t)                     // fontana, spaventapasseri
const animaEdificio = (g, dt, t) => { if (g.userData.gira) g.userData.gira.rotation.y += dt * 0.8; if (g.userData.anima) g.userData.anima(dt, t) }

const mesh = (geo, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = o.receiveShadow = true; return o
}

export const VOCI = [
  // ── le colture: lo stesso campo, dieci aspetti (ASPETTO in modelli-colture.js), cresciuto del tutto ──
  ...Object.keys(ASPETTO).map(k => ({
    id: `fattoria:campo-${k}`, nome: `Campo di ${COLTURE[k].nome.toLowerCase()}`, gioco: 'fattoria', categoria: 'pianta',
    dove: `pezzo «campo» ${celle(PEZZI.campo)} quando ci si semina ${COLTURE[k].nome.toLowerCase()} (dal livello ${COLTURE[k].liv}), qui maturo`,
    file: `${MCO}:creaCampo`, misure: celle(PEZZI.campo),
    crea: () => { const g = creaCampo(3); aggiornaCampo(g, [1, 1, 1, 1], 0, k, false); return g },
    anima: (g, dt, t) => aggiornaCampo(g, [1, 1, 1, 1], t, k, true),
  })),
  // le stesse, a quattro età: davanti appena spuntata (0,2) e a metà (0,45), dietro col frutto (0,75) e matura (1)
  ...Object.keys(ASPETTO).map(k => ({
    id: `fattoria:crescita-${k}`, nome: `Campo di ${COLTURE[k].nome.toLowerCase()} in crescita`, gioco: 'fattoria', categoria: 'pianta',
    dove: `il campo di ${COLTURE[k].nome.toLowerCase()} mentre cresce: tessere a 0,2 e 0,45 davanti, 0,75 e 1 dietro`,
    file: `${MCO}:aggiornaCampo`, misure: celle(PEZZI.campo),
    crea: () => { const g = creaCampo(3); aggiornaCampo(g, CRESCITE, 0, k, false); return g },
    anima: (g, dt, t) => aggiornaCampo(g, CRESCITE, t, k, true),
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
  { id: 'fattoria:stalla', nome: 'Stalla', gioco: 'fattoria', categoria: 'edificio', dove: pezzo('stalla') + ': il fienile e il cortile steccato (col cancelletto) con fino a quattro mucche in fila',
    file: `${M}:creaStalla`, misure: celle(PEZZI.stalla),
    crea: () => creaStalla(statiStalla()),
    anima: (g, dt, t) => muoviBestie(g, dt, t, statiStalla(), Date.now()) },
  { id: 'fattoria:bancarella', nome: 'Banco della guaritrice (la bancarella)', gioco: 'entrambi', categoria: 'prop',
    dove: pezzo('bancarella') + ': il banco della guaritrice del Sotterraneo (tendone a strisce, boccette, erbe, frutta); apre il banco degli ordini come la bacheca',
    file: `${D}:bancoDellaGuaritrice`, misure: celle(PEZZI.bancarella), crea: () => creaBancarella() },
  { id: 'fattoria:bacheca', nome: 'Bacheca delle taglie (gli ordini)', gioco: 'entrambi', categoria: 'prop',
    dove: pezzo('bacheca') + ': la bacheca del Sotterraneo; i foglietti appuntati sono gli ordini aperti (qui tre), toccarla apre il banco',
    file: `${D}:bachecaDelleTaglie`, misure: celle(PEZZI.bacheca), crea: () => creaBacheca() },
  { id: 'fattoria:bancarella-vecchia', nome: 'Bancarella (vecchia)', gioco: 'fattoria', categoria: 'prop', dove: 'non più montata: il disegno di prima del banco della guaritrice, tenuto per il confronto',
    file: `${M}:creaBancarellaVecchia`, misure: celle(PEZZI.bancarella), crea: () => creaBancarellaVecchia() },
  { id: 'fattoria:aiuola', nome: 'Aiuola', gioco: 'fattoria', categoria: 'pianta', dove: pezzo('aiuola'), file: `${M}:creaAiuola`, misure: celle(PEZZI.aiuola), crea: () => creaAiuola() },
  { id: 'fattoria:panchina', nome: 'Panchina', gioco: 'fattoria', categoria: 'prop', dove: pezzo('panchina'), file: `${M}:creaPanchina`, misure: celle(PEZZI.panchina), crea: () => creaPanchina() },
  { id: 'fattoria:fontana', nome: 'Fontana', gioco: 'fattoria', categoria: 'prop', dove: pezzo('fontana') + ', con le gocce che zampillano', file: `${M}:creaFontana`, misure: celle(PEZZI.fontana), crea: () => creaFontana(), anima: animaCosa },
  { id: 'fattoria:pozzo', nome: 'Pozzo', gioco: 'fattoria', categoria: 'prop', dove: pezzo('pozzo'), file: `${M}:creaPozzo`, misure: celle(PEZZI.pozzo), crea: () => creaPozzo() },
  { id: 'fattoria:spaventapasseri', nome: 'Spaventapasseri', gioco: 'fattoria', categoria: 'prop', dove: pezzo('spaventapasseri') + ', dondola piano', file: `${M}:creaSpaventapasseri`, misure: celle(PEZZI.spaventapasseri), crea: () => creaSpaventapasseri(), anima: animaCosa },
  // preso dal Sotterraneo 3D e rifatto con i materiali della fattoria (docs/fattoria3d/scena.md): la voce del sotterraneo è `sot:kit:ponte-arco` / `sot:props:tavolo`
  { id: 'fattoria:ponte', nome: 'Ponte ad arco', gioco: 'entrambi', categoria: 'prop', dove: pezzo('ponte') + ', calpestabile (gobba alta ' + PEZZI.ponte.alzato[1] + '), conta come strada; dal ponte ad arco del mondo di sopra del sotterraneo', file: `${MP}:creaPonte`, misure: celle(PEZZI.ponte), crea: () => creaPonte() },
  { id: 'fattoria:passerella', nome: 'Passerella di assi', gioco: 'entrambi', categoria: 'prop', dove: pezzo('passerella') + ', calpestabile, conta come strada; dalla passerella di corde del mondo di sopra del sotterraneo', file: `${MP}:creaPasserella`, misure: celle(PEZZI.passerella), crea: () => creaPasserella() },
  { id: 'fattoria:stagno-costruito', nome: 'Stagno', gioco: 'fattoria', categoria: 'prop', dove: pezzo('stagno') + ', decori; tutto acqua (non si cammina), solo un ponte o una passerella ci sta sopra; lo stesso materiale dell\'acqua dei lotti laghetto', file: `${MA}:creaStagno`, misure: celle(PEZZI.stagno), crea: () => creaStagno(PEZZI.stagno.w, PEZZI.stagno.d) },
  { id: 'fattoria:laghetto-costruito', nome: 'Laghetto', gioco: 'fattoria', categoria: 'prop', dove: pezzo('laghetto') + ', decori; lo stesso disegno dello stagno, più grande', file: `${MA}:creaStagno`, misure: celle(PEZZI.laghetto), crea: () => creaStagno(PEZZI.laghetto.w, PEZZI.laghetto.d) },
  { id: 'fattoria:tavolo', nome: 'Tavolo con le panche', gioco: 'entrambi', categoria: 'prop', dove: pezzo('tavolo') + '; dal tavolo con le panche delle città del sotterraneo', file: `${MP}:creaTavolo`, misure: celle(PEZZI.tavolo), crea: () => creaTavolo() },
  { id: 'fattoria:segnaposto', nome: 'Segnaposto grigio', gioco: 'fattoria', categoria: 'altro', dove: 'ripiego: lo mostra la scena per un tipo di pezzo senza disegno (pezzi.js, modelloDi)', file: `${M}:creaSegnaposto`, misure: '2×2', crea: () => creaSegnaposto(2, 2) },

  { id: 'fattoria:trattore', nome: 'Trattore', gioco: 'fattoria', categoria: 'altro', dove: 'in lavorazione: il costruttore c\'è in modelli.js, non è ancora montato in scena', file: `${M}:creaTrattore`, crea: () => creaTrattore() },
  { id: 'fattoria:cassa', nome: 'Cassa di legno', gioco: 'fattoria', categoria: 'prop', dove: 'in lavorazione: il costruttore c\'è in modelli.js, non è ancora montato in scena', file: `${M}:creaCassa`, misure: '1×1', crea: () => creaCassa() },

  // ── gli edifici unici, uno per tipo, in lotti fissi ──
  { id: 'fattoria:pasticceria', nome: 'Pastificio (id pasticceria)', gioco: 'fattoria', categoria: 'edificio', dove: unico('pasticceria') + ': forno, torta che gira', file: `${M}:creaPasticceria`, misure: celle(EDIFICI.pasticceria), crea: () => creaPasticceria(), anima: animaEdificio },
  { id: 'fattoria:mongolfiera', nome: 'Mongolfiera', gioco: 'fattoria', categoria: 'edificio', dove: unico('mongolfiera') + ': parte per i viaggi di vendita', file: `${M}:creaMongolfiera`, misure: celle(EDIFICI.mongolfiera),
    crea: () => creaMongolfiera(), anima: (g, dt, t) => { const u = g.userData; u.volo.position.y = Math.sin(t * 1.3) * 0.08; u.volo.rotation.z = Math.sin(t * 0.9) * 0.02; u.fiamma.scale.set(1, 1.2 + Math.sin(t * 14) * 0.4, 1) } },
  { id: 'fattoria:mulino', nome: 'Mulino', gioco: 'fattoria', categoria: 'edificio', dove: unico('mulino') + ': pale a vento, macina il grano', file: `${M}:creaMulino`, misure: celle(EDIFICI.mulino), crea: () => creaMulino(), anima: animaEdificio },
  { id: 'fattoria:panificio', nome: 'Panificio', gioco: 'fattoria', categoria: 'edificio', dove: unico('panificio') + ': forno con la bocca accesa', file: `${M}:creaPanificio`, misure: celle(EDIFICI.panificio), crea: () => creaPanificio(), anima: animaEdificio },
  { id: 'fattoria:conserviera', nome: 'Cucina (id conserviera)', gioco: 'fattoria', categoria: 'edificio', dove: unico('conserviera'), file: `${M}:creaConserviera`, misure: celle(EDIFICI.conserviera), crea: () => creaConserviera(), anima: animaEdificio },
  { id: 'fattoria:gelateria', nome: 'Gelateria', gioco: 'fattoria', categoria: 'edificio', dove: unico('gelateria') + ': il cono che gira sul tetto', file: `${M}:creaGelateria`, misure: celle(EDIFICI.gelateria), crea: () => creaGelateria(), anima: animaEdificio },
  { id: 'fattoria:caseificio', nome: 'Caseificio', gioco: 'fattoria', categoria: 'edificio', dove: unico('caseificio') + ': la ruota del formaggio', file: `${M}:creaCaseificio`, misure: celle(EDIFICI.caseificio), crea: () => creaCaseificio(), anima: animaEdificio },
  { id: 'fattoria:telaio', nome: 'Telaio', gioco: 'fattoria', categoria: 'edificio', dove: unico('telaio') + ': la navetta che scorre sul telaio, balle di lana', file: `${MM}:creaTelaio`, misure: celle(EDIFICI.telaio), crea: () => creaTelaio(), anima: animaEdificio },
  { id: 'fattoria:zuccherificio', nome: 'Zuccherificio', gioco: 'fattoria', categoria: 'edificio', dove: unico('zuccherificio') + ': la ciminiera che fuma, la ruota dentata', file: `${MM}:creaZuccherificio`, misure: celle(EDIFICI.zuccherificio), crea: () => creaZuccherificio(), anima: animaEdificio },
  { id: 'fattoria:sartoria', nome: 'Sartoria', gioco: 'fattoria', categoria: 'edificio', dove: unico('sartoria') + ': il manichino che gira, l\'ago nel rocchetto', file: `${MM}:creaSartoria`, misure: celle(EDIFICI.sartoria), crea: () => creaSartoria(), anima: animaEdificio },
  { id: 'fattoria:tintoria', nome: 'Tintoria', gioco: 'fattoria', categoria: 'edificio', dove: unico('tintoria') + ': le vasche colorate, le stoffe che ondeggiano', file: `${MM}:creaTintoria`, misure: celle(EDIFICI.tintoria), crea: () => creaTintoria(), anima: animaEdificio },

  // ── solo di scena: nascono col terreno ──
  ...FISSI.map(f => ({
    id: `fattoria:${f.tipo}`, nome: f.tipo === 'fienile' ? 'Fienile' : 'Casa di legno', gioco: f.tipo === 'fienile' ? 'fattoria' : 'entrambi', categoria: 'edificio',
    dove: `scenario fisso (non si compra) al posto ${f.i},${f.j}, ${f.w}×${f.d} celle (terreno.js, _fisse)` + (f.tipo === 'fienile' ? '' : ': la casa di legno del Sotterraneo, col fumo dal camino'),
    file: f.tipo === 'fienile' ? `${M}:creaFienile` : `${D}:casaDiLegno`, misure: `${f.w}×${f.d}`, crea: () => f.tipo === 'fienile' ? creaFienile() : creaCasa(),
    anima: animaEdificio,
  })),
  { id: 'fattoria:casa-vecchia', nome: 'Casa del contadino (vecchia)', gioco: 'fattoria', categoria: 'edificio', dove: 'non più montata: la casa di prima, a scatole, tenuta per il confronto',
    file: `${M}:creaCasaVecchia`, misure: '4×3', crea: () => creaCasaVecchia() },

  // ── gli animali ──
  { id: 'fattoria:pecora', nome: 'Pecora', gioco: 'fattoria', categoria: 'animale', dove: 'dentro il recinto (si tosa, fa gli agnelli)', file: `${M}:creaPecora`, crea: () => creaPecora() },
  { id: 'fattoria:gallina-bianca', nome: 'Gallina bianca', gioco: 'fattoria', categoria: 'animale', dove: 'nel pollaio, posti pari (con l\'uovo da raccogliere)', file: `${M}:creaGallina`,
    crea: () => { const g = creaGallina(0); g.userData.uovo.visible = true; return g } },
  { id: 'fattoria:gallina-bruna', nome: 'Gallina bruna', gioco: 'fattoria', categoria: 'animale', dove: 'nel pollaio, posti dispari', file: `${M}:creaGallina`, crea: () => creaGallina(1) },
  { id: 'fattoria:mucca', nome: 'Mucca', gioco: 'fattoria', categoria: 'animale', dove: 'nella stalla (col secchio del latte da raccogliere)', file: `${M}:creaMucca`,
    crea: () => { const g = creaMucca(0); g.userData.dono.visible = true; return g } },
  { id: 'fattoria:mucca-2', nome: 'Mucca (variante)', gioco: 'fattoria', categoria: 'animale', dove: 'nella stalla, altri posti: le chiazze cambiano', file: `${M}:creaMucca`, crea: () => creaMucca(1) },
  ...stadi('gallina', 'Gallina', `${M}:creaGallina`, 'nel pollaio'),
  ...stadi('mucca', 'Mucca', `${M}:creaMucca`, 'nella stalla'),
  ...stadi('pecora', 'Pecora', `${M}:creaPecora`, 'dentro il recinto'),

  // ── chi gira per la fattoria ──
  // il contadino e la contadina, vestibili (dati/abiti.js, docs/fattoria3d/guardaroba.md): l'abito di serie e qualche altro per giudicare i capi
  ...[['contadino', 'Contadino', 'serie', null], ['contadina', 'Contadina', 'serie', null],
    ['contadino', 'Contadino', 'cowboy e gilet da festa', { cappello: 'cowboy', maglia: 'gilet', pantalone: 'verde', stivali: 'dorati', collo: 'papillon', capelli: 'corti-rossi', pelle: 'scura' }],
    ['contadina', 'Contadina', 'abito da festa, fascia e fiore', { cappello: 'fascia', maglia: 'festa', pantalone: 'rosso', stivali: 'rossi', collo: 'scialle', capelli: 'coda-rossa', pelle: 'chiara' }],
    ['contadina', 'Contadina', 'grembiule e caschetto', { cappello: 'tesa', maglia: 'grembiule', pantalone: 'giallo', stivali: 'verdi', collo: 'sciarpa', capelli: 'caschetto-nero', pelle: 'bruna' }],
    ['contadino', 'Contadino', 'berretto e maglione', { cappello: 'berretto', maglia: 'maglione', pantalone: 'marrone', stivali: 'neri', collo: 'niente', capelli: 'corti-biondi', pelle: 'ambra' }],
  ].map(([persona, nome, abito, capi]) => ({
    id: `fattoria:${persona}${capi ? '-' + abito.split(' ')[0].replace(/[^a-z]/g, '') : ''}`, nome: `${nome} (${abito})`, gioco: 'fattoria', categoria: 'personaggio',
    dove: 'il giocatore, sempre in scena (eroe.js); lui o lei secondo il personaggio del profilo; semina, falcia, abbatte', file: `${MC}:creaContadino`,
    crea: () => creaContadino(capi ? { persona, ...capi } : persona) })),
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
  // le pose di «quando ci premi» (docs/fattoria3d/compagni.md): p scorre da 0 a 1 ogni 3 secondi, come in una sequenza
  ...[['dà la zampa', 'zampa', 'festa: si siede e tende la zampa'], ['si rotola', 'rotola', 'festa: pancia in su, zampe all\'aria'], ['salta', 'salta', 'festa: saltelli sul posto'],
    ['riporta il bastoncino', 'riporta', 'festa: il bastoncino in bocca, lo posa ai piedi dell\'eroe'], ['starnutisce', 'starnuta', 'festa: «Ciù!», scuote testa e orecchie'],
    ['gira su sé stesso', 'gira', 'festa: rincorre il moncherino, poi stordito'], ['sbadiglia', 'sbadiglia', 'festa: seduto, bocca spalancata (anche quando si sveglia)'],
    ['annusa la mano', 'mano', 'festa: prima dello sbadiglio'], ['alza la testa', 'alza', 'sente «Watson!» da lontano'], ['naso a naso col gatto', 'incontra', 'incontro col gatto']].map(([nome, stato, dove]) => ({
    id: `fattoria:watson-${stato}`, nome: `${COMPAGNI.watson.nome} ${nome}`, gioco: 'fattoria', categoria: 'animale', dove: `posa «${stato}», ${dove}`, file: `${MC}:posaCane`,
    crea: () => { const g = creaCane(); posaCane(g, { stato, fase: 1.2, t: 0.4, p: 0.5, sub: 'annusa' }); return g },
    anima: (g, dt, t) => posaCane(g, { stato, fase: t * 7, t, p: (t % 3) / 3, sub: 'annusa' }),
  })),
  ...[['si struscia', 'struscia'], ['si rotola', 'rotola'], ['miagola', 'miao'], ['si volta, indifferente', 'volta'], ['fa le fusa', 'fusa'], ['incontra Watson (zampata)', 'incontra', 'zampata'], ['incontra Watson (annusa)', 'incontra', 'annusa']].map(([nome, stato, sub = '']) => ({
    id: `fattoria:irene-${stato}${sub ? '-' + sub : ''}`, nome: `${COMPAGNI.irene.nome} ${nome}`, gioco: 'fattoria', categoria: 'animale', dove: `posa «${stato}» del gatto quando lo tocchi o incontra Watson`, file: `${MC}:posaGatto`,
    crea: () => { const g = creaGatto('calico'); posaGatto(g, { stato, t: 0.4, p: 0.5, sub }); return g },
    anima: (g, dt, t) => posaGatto(g, { stato, t, p: (t % 3) / 3, sub }),
  })),
  ...['sherlock', 'irene', 'pepe'].map(id => ({
    id: `fattoria:${id}`, nome: `${COMPAGNI[id].nome} (gatto ${COMPAGNI[id].variante})`, gioco: 'fattoria', categoria: 'animale',
    dove: `gatto che gira per il terreno, arriva al livello ${COMPAGNI[id].liv} (scena3d/compagni.js)`, file: `${MC}:creaGatto`,
    crea: () => creaGatto(COMPAGNI[id].variante), anima: (g, dt, t) => posaGatto(g, { stato: 'sta', t }),
  })),

  // ── il terreno: a istanze nel gioco, qui un esemplare con le stesse geometrie ──
  { id: 'fattoria:albero', nome: 'Abete', gioco: 'fattoria', categoria: 'pianta', dove: 'alberi del bosco e dei lotti, si abbattono con l\'ascia (terreno.js, _alberi; geometrie FORME di modelli.js)', file: `${T}:_alberi`, misure: '1×1',
    crea: () => { const g = new THREE.Group(), c = mat(new THREE.Color().setHSL(0.29, 0.5, 0.35).getHex()); g.add(mesh(FORME.tronco, mat(0x7a5232)), mesh(FORME.chioma, c), mesh(FORME.chioma2, c)); return g } },
  { id: 'fattoria:cespuglio', nome: 'Cespuglio', gioco: 'entrambi', categoria: 'pianta', dove: 'ostacolo nei lotti, si toglie toccandolo (terreno.js, _ostacoli); la geometria è quella del cespuglio del Sotterraneo, verde della palette del terreno', file: `${D}:geometriaCespuglio`, misure: '1×1',
    crea: () => mesh(geometriaCespuglio(), mat(new THREE.Color().setHSL(0.3, 0.55, 0.32).getHex(), { vertexColors: true }), 0, 0, 0, 1.2, 1.05, 1.2) },
  { id: 'fattoria:cespuglio-vecchio', nome: 'Cespuglio (vecchio)', gioco: 'fattoria', categoria: 'pianta', dove: 'non più montato: la palla verde di prima, tenuta per il confronto', file: `${T}:_ostacoli`, misure: '1×1',
    crea: () => mesh(new THREE.IcosahedronGeometry(0.4, 0), mat(new THREE.Color().setHSL(0.3, 0.55, 0.32).getHex()), 0, 0.28, 0, 1.15, 0.85, 1.15) },
  { id: 'fattoria:sasso', nome: 'Sasso', gioco: 'fattoria', categoria: 'prop', dove: 'ostacolo nei lotti, si toglie toccandolo (terreno.js, _ostacoli)', file: `${T}:_ostacoli`, misure: '1×1',
    crea: () => mesh(new THREE.IcosahedronGeometry(0.32, 0), mat(new THREE.Color().setHSL(0.1, 0.05, 0.57).getHex()), 0, 0.15, 0, 1.1, 0.75, 1) },
  { id: 'fattoria:stagno', nome: 'Lago del lotto (laghetto naturale)', gioco: 'fattoria', categoria: 'prop', dove: 'i lotti laghetto (dati/biomi.js): lastra azzurra per cella d\'acqua su una riva chiara, con ninfee e canne; ponte e passerella lo attraversano (terreno.js, _acqua)', file: `${T}:_acqua`, misure: '2×2',
    crea: () => {
      const g = new THREE.Group(), piano = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
      for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) {
        g.add(mesh(piano, mat(0xdcc796), x, 0.012, z, 1.5, 1, 1.5), mesh(piano, new THREE.MeshStandardMaterial({ color: 0x4ba6d6, transparent: true, opacity: 0.84, roughness: 0.3 }), x, 0.03, z))
      }
      g.add(mesh(new THREE.CircleGeometry(0.24, 9).rotateX(-Math.PI / 2), mat(0x4f9a45), 0.2, 0.04, -0.3), mesh(new THREE.ConeGeometry(0.035, 0.9, 4), mat(0x8aa63a), -1.1, 0.45, 0.8))
      return g
    } },
]
