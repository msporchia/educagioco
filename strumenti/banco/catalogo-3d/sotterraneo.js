/* ═══════════════════════════════════════════════════════════════════
   IL CATALOGO 3D — le voci del Sotterraneo

   Tutti i modelli 3D in codice del Sotterraneo 3D, uno per voce, per la
   pagina `strumenti/banco/catalogo-3d.html` (la fa la sessione della
   Fattoria 3D; l'altra metà dei dati è `catalogo-3d/fattoria.js`). Serve a
   vedere cosa c'è, dove si usa, e a dire «questo vale la pena usarlo anche
   di là». Non è un gioco: non decide niente.

   ── il contratto ──
   `VOCI` è un array di oggetti
     id         stabile e unico (`sot:kit:pozzo`, `sot:props:carretto`…)
     nome       come lo si chiama a voce
     gioco      'sotterraneo' (qui sempre: l'utente sceglie i riusi)
     categoria  'edificio' | 'prop' | 'pianta' | 'personaggio' | 'animale' | 'effetto' | 'altro'
     dove       una riga: in che città, regione o discesa si vede, e cos'è
     file       'src/…/file.js:funzione' — il pezzo di codice che lo fa
     crea()     torna un THREE.Object3D nuovo, in piedi sull'origine (il
                suolo a y = 0, il centro a x = z = 0, il davanti verso +z),
                SINCRONO: si può chiamare con o senza `await`. La prima
                chiamata prepara le trame e i materiali del kit (serve un
                canvas: nel browser c'è; in Node si usano trame vuote, la
                forma c'è tutta e il colore pure)
   Il resto (le misure, il numero di mesh) lo calcola la pagina sull'oggetto
   costruito: qui non si scrive a mano un numero che cambia col codice.

   ── l'animazione (facoltativa) ──
   Se un oggetto ha qualcosa che si muove (l'acqua della fontana, la grata
   che si alza, la ruota del mulino, il velo del portale), `userData.anima`
   è una funzione `(t) => …` con il tempo in secondi: la pagina può chiamarla
   a ogni fotogramma. Senza, il modello sta fermo e va bene lo stesso.

   ── la luce e la nebbia ──
   I materiali del kit leggono la nebbia dell'esplorazione (`vesti.js`); qui
   si spegne (`U.uNebbia = 0`): ogni cosa si vede intera. I materiali sono
   quelli del gioco, le luci sono quelle della pagina.

   ── cosa è fuori, e perché ──
   · l'eroe e le armi: sono sprite ancorati (figure dell'atlante su un
     piano), non geometrie: non c'è un modello da mostrare. I mostri 3D (in
     prova, `VOCI_MOSTRI`) invece ci sono: uno per modello del registro; e le
     persone del mondo di sopra (`VOCI_PERSONE`, docs/sotterraneo/persone-3d.md)
   · pareti, pavimenti, colonne e terreno (`pareti.js`, `terreno.js`,
     `mondo/terreno.js`, `mondo/lontano.js`): si scolpiscono su una pianta
     intera, non esistono da soli
   · l'acqua, il cielo, la nebbia, le particelle, le luci, il fumo e le
     fiamme (`vita.js`, `particelle.js`…): sono effetti di scena, non oggetti
   · `scatola`, `cilindro`, `triangolo`, `Cantiere` (`kit.js`): sono gli
     attrezzi con cui si fanno i modelli, non modelli
   ═══════════════════════════════════════════════════════════════════ */
import { creaPersona, CHIAVI as CHIAVI_PERSONE } from '../../../src/giochi/sotterraneo/scena3d/persone3d/persone.js'
import { MODELLO_DI_SPECIE, MODELLO_DEL_GROSSO, MODELLO_DELLA_VARIANTE, voceDi as voceDelMostro, costruisci as costruisciMostro } from '../../../src/giochi/sotterraneo/scena3d/mostri3d/registro.js'
import { Group, Mesh, MeshStandardMaterial, MeshBasicMaterial, CircleGeometry, OctahedronGeometry, DoubleSide, Matrix4, Vector3 } from 'three'
import { U } from '../../../src/giochi/sotterraneo/scena3d/mondo/vesti.js'
import { creaTrame } from '../../../src/giochi/sotterraneo/scena3d/mondo/trame.js'
import { materialiDelKit, Cantiere, casa, bottega, pozzo, mulino, tetto } from '../../../src/giochi/sotterraneo/scena3d/mondo/kit.js'
import { ponte, staccionate, cartello, bacheca, campoMinatore, creaScavo } from '../../../src/giochi/sotterraneo/scena3d/mondo/ponti.js'
import { creaMonumento, creaPietra, creaPortale as creaPortaleDiSopra, creaPortaDelleTerre } from '../../../src/giochi/sotterraneo/scena3d/mondo/monumenti.js'
import { fontana as fontanaDellaPiazza } from '../../../src/giochi/sotterraneo/scena3d/mondo/fontana.js'
import { MODELLI } from '../../../src/giochi/sotterraneo/scena3d/mondo/props-modelli.js'
import { disegnaPropsAperti } from '../../../src/giochi/sotterraneo/scena3d/mondo/props-aperto.js'
import { FORME as FORME_APERTE, TABELLA, SCENARI } from '../../../src/giochi/sotterraneo/scena3d/mondo/props-dove.js'
import { RICETTE, FAMIGLIA_DI } from '../../../src/giochi/sotterraneo/scena3d/mondo/props-tana-dati.js'
import { GEO } from '../../../src/giochi/sotterraneo/scena3d/mondo/natura.js'
import { caso, LIVELLO_ACQUA } from '../../../src/giochi/sotterraneo/scena3d/mondo/suolo.js'
import { creaBotti } from '../../../src/giochi/sotterraneo/scena3d/botti.js'
import { creaArredo3d } from '../../../src/giochi/sotterraneo/scena3d/arredo3d.js'
import { creaRelitti } from '../../../src/giochi/sotterraneo/scena3d/relitti.js'
import { creaPortale } from '../../../src/giochi/sotterraneo/scena3d/portale.js'
import { creaFontana } from '../../../src/giochi/sotterraneo/scena3d/fontana.js'
import { creaMaschera } from '../../../src/giochi/sotterraneo/scena3d/maschera.js'
import { legno as trameDelLegno, muro as trameDelMuro } from '../../../src/giochi/sotterraneo/scena3d/trame.js'
import { ASPETTI_3D } from '../../../src/giochi/sotterraneo/scena3d/aspetti.js'
import { MAX_LUCI } from '../../../src/giochi/sotterraneo/scena3d/costanti.js'
import { ASPETTI as ASPETTI_RELITTI } from '../../../src/giochi/sotterraneo/dati/relitti.js'
import { BOTTI_PER_PAESAGGIO } from '../../../src/giochi/sotterraneo/dati/botti.js'

const MONDO = 'src/giochi/sotterraneo/scena3d/mondo/'
const SCENA = 'src/giochi/sotterraneo/scena3d/'

/* ── il contesto: trame, materiali del kit, maschera tutta aperta. Una volta sola ── */
let contestoPronto = null
function contesto() {
  if (contestoPronto) return contestoPronto
  const conCanvas = typeof document !== 'undefined'
  const vuota = () => ({ map: null, normalMap: null, roughnessMap: null, emissiveMap: null })
  const trame = conCanvas ? creaTrame()
    : { pietra: vuota(), legno: vuota(), intonaco: vuota(), tegole: vuota(), paglia: vuota(), stoffa: vuota() }
  U.uNebbia.value = 0   // niente nebbia dell'esplorazione: ogni cosa si vede tutta e subito
  // una maschera di un texel bianco: «tutto visto adesso». Le cose delle discese la leggono per accendersi
  const maschera = creaMaschera()
  maschera.metti({ dati: new Uint8Array([255, 255, 255, 255]), W: 1, H: 1 })
  contestoPronto = {
    trame, kit: materialiDelKit(trame), maschera,
    legno: conCanvas ? trameDelLegno() : vuota(),
    muroDi: aspetto => (conCanvas ? trameDelMuro(aspetto) : vuota()),
  }
  return contestoPronto
}

const coseVuote = () => ({ camini: [], braci: [], fuochi: [], spruzzi: [], ruote: [], cristalli: [] })
const MAT_CRISTALLO = () => new MeshStandardMaterial({ color: 0xb78cff, emissive: 0x6a3cff, emissiveIntensity: 0.6, roughness: 0.2 })

/* Un pezzo del mondo di sopra: `f({ cant, m, cose, kit, g })` posa le sue forme nel cantiere, le parti che si muovono vanno in `g`.
   `centro` [x, z]: dove sta il centro del pezzo nelle coordinate del mondo che il codice usa (si toglie, così il modello sta
   sull'origine); `rialza`: di quanto alzarlo (i ponti scendono sotto il livello dell'acqua); `acqua`: un disco d'acqua a
   quel livello, per i pezzi che ci stanno dentro */
function pezzo(f, { centro = [0, 0], rialza = 0, acqua = 0, quota = 0, confini = [] } = {}) {
  const { kit } = contesto()
  // un mondo finto di 8×8 celle, tutte scritte (`zona` 0: suolo.js non va a cercare la base del generatore)
  const m = { W: 8, H: 8, quota: new Float32Array(64).fill(quota), zona: new Int8Array(64), ponte: new Int8Array(64).fill(-1), confini }
  const cant = new Cantiere(), cose = coseVuote(), esterno = new Group(), g = new Group(), anima = []
  g.position.set(-centro[0], rialza, -centro[1])
  esterno.add(g)
  f({ cant, m, cose, kit, g, anima })
  for (const me of cant.chiudi(kit.fermi, kit.ombraFermi)) g.add(me)
  for (const r of cose.ruote) g.add(r)
  for (const c of cose.cristalli) { const me = new Mesh(new OctahedronGeometry(0.28), MAT_CRISTALLO()); me.position.copy(c); g.add(me) }
  if (acqua) {
    const d = new Mesh(new CircleGeometry(acqua, 28).rotateX(-Math.PI / 2), new MeshBasicMaterial({ color: 0x3c86b8, transparent: true, opacity: 0.55, depthWrite: false }))
    d.position.set(0, LIVELLO_ACQUA + rialza, 0); esterno.add(d)
  }
  if (anima.length) esterno.userData.anima = t => { for (const a of anima) a(t) }
  return esterno
}

/* ═══════════════════ il kit del mondo di sopra (kit.js, ponti.js) ═══════════════════ */

// le quattro case: l'aspetto viene dal seme (muro d'intonaco, a graticcio, di legno; tetto di tegole o di paglia)
const casaDi = (seme, w = 4, h = 3) => () => pezzo(({ cant, m, cose }) => casa({ seme, verso: 's', w, h, x: -w / 2, y: -h / 2, regione: 'villaggio' }, cant, m, cose))
const bottegaDi = (tipo, w, h, chiave) => () => pezzo(({ cant, m, cose }) => bottega({ x: -w / 2, y: -h / 2, w, h, chiave, bottega: tipo }, cant, m, cose))

// i ponti: una passerella di celle (2 di larghezza); i nomi dei lati e il livello sono quelli del generatore
const cellePonte = (lungoX, L) => Array.from({ length: L * 2 }, (_, i) => (lungoX ? { x: i % L, y: Math.floor(i / L) } : { x: i % 2, y: Math.floor(i / 2) }))
function ponteDi(modello, verso, L, quota, arco) {
  return () => {
    const lungoX = verso === 'est', celle = cellePonte(lungoX, L)
    const q = { i: 0, tipo: 'ponte', modello, verso, celle, quota, arco }
    const centro = lungoX ? [L / 2, 1] : [1, L / 2]
    return pezzo(({ cant, m }) => ponte(q, cant, m), { centro, rialza: 1.15, acqua: 5, confini: [q] })
  }
}

const VOCI_KIT = [
  { id: 'sot:kit:casa-intonaco', nome: 'Casa d\'intonaco con tegole', categoria: 'edificio', file: MONDO + 'kit.js:casa', crea: casaDi(14),
    dove: 'Il villaggio e le altre città (villaggio, forte del guado, rifugio del passo): case d\'intonaco chiaro, imposte colorate, camino. Anche sparse nel mondo (campi, valle del mulino, frutteto)' },
  { id: 'sot:kit:casa-graticcio', nome: 'Casa a graticcio, a due piani', categoria: 'edificio', file: MONDO + 'kit.js:casa', crea: casaDi(16, 5, 4),
    dove: 'Le case grandi delle città (villaggio e forte del guado): travi in vista sul muro, due file di finestre' },
  { id: 'sot:kit:casa-paglia', nome: 'Casa col tetto di paglia', categoria: 'edificio', file: MONDO + 'kit.js:casa', crea: casaDi(18),
    dove: 'Una casa su quattro, nel villaggio, nei campi e nella valle del mulino: stesso muro, tetto di paglia' },
  { id: 'sot:kit:casa-legno', nome: 'Casa di legno', categoria: 'edificio', file: MONDO + 'kit.js:casa', crea: casaDi(7),
    dove: 'Una casa su cinque nelle città e nei dintorni: muri di tronchi, tetto a falde' },
  { id: 'sot:kit:bottega-bancarella', nome: 'Bancarella del mercante', categoria: 'edificio', file: MONDO + 'kit.js:bottega', crea: bottegaDi('bancarella', 3, 2, 'rigattiere'),
    dove: 'Il mercante (il rigattiere) nel villaggio e nel rifugio del passo: banco con la merce, tendone rosso a falda' },
  { id: 'sot:kit:bottega-erbe', nome: 'Banco della guaritrice', categoria: 'edificio', file: MONDO + 'kit.js:bottega', crea: bottegaDi('erbe', 3, 2, 'erborista'),
    dove: 'La guaritrice (l\'erborista) nel villaggio, nel forte del guado e nel rifugio del passo: tendone verde, boccette ed erbe appese' },
  { id: 'sot:kit:bottega-fucina', nome: 'Fucina del fabbro', categoria: 'edificio', file: MONDO + 'kit.js:bottega', crea: bottegaDi('fucina', 4, 3, 'armaiolo'),
    dove: 'Il fabbro (l\'armaiolo) nel villaggio e nel forte del guado: forgia di pietra con la brace e il camino, mantice, spade appese' },
  { id: 'sot:kit:bottega-torretta', nome: 'Torretta dell\'incantatrice', categoria: 'edificio', file: MONDO + 'kit.js:bottega', crea: bottegaDi('torretta', 3, 3, 'incantatrice'),
    dove: 'L\'incantatrice nel villaggio e nel rifugio del passo: torre tonda viola col tetto a cono e il cristallo che fluttua in cima' },
  { id: 'sot:kit:pozzo', nome: 'Pozzo della piazza', categoria: 'edificio', file: MONDO + 'kit.js:pozzo',
    crea: () => pezzo(({ cant, m }) => pozzo({ x: -1, y: -1 }, cant, m)),
    dove: 'Il centro della piazza di ogni città (2×2 celle); dove manca chi cura prende il suo posto la fontana' },
  { id: 'sot:kit:mulino', nome: 'Mulino con la ruota', categoria: 'edificio', file: MONDO + 'kit.js:mulino',
    crea: () => pezzo(({ cant, m, cose, kit, anima }) => {
      const ruota = mulino({ x: -1.5, y: -1.5, w: 3, h: 3, lato: -1, ruota: { x: -2, y: 0 } }, cant, m, cose, kit)
      anima.push(t => { ruota.rotation.x = t * 0.8 })
    }, { acqua: 3 }),
    dove: 'La valle del mulino: casa di pietra e legno sulla riva del fiume, la ruota che gira nell\'acqua' },
  { id: 'sot:kit:tetto', nome: 'Tetto a falde coi timpani', categoria: 'edificio', file: MONDO + 'kit.js:tetto',
    crea: () => pezzo(({ cant }) => {
      cant.base(0, 0, 0, 0)
      tetto(cant, 3.2, 2.4, 0, 1.0, 0.28, 'tegole', [0.8, 0.42, 0.3], [0.96, 0.92, 0.82], 'intonaco', true)
    }),
    dove: 'Sopra ogni casa e il mulino: due lastre di tegole (o di paglia) con lo sbalzo e i due timpani. Qui da solo, senza i muri' },
  { id: 'sot:kit:ponte-arco', nome: 'Ponte ad arco di pietra', categoria: 'edificio', file: MONDO + 'ponti.js:ponte', crea: ponteDi('arco', 'sud', 6, 0.13, 0.45),
    dove: 'Sui fiumi fra due zone: il ponte del mulino (dai prati al bosco vecchio) e il ponte del guado (dalla brughiera alla palude). Parapetto di pietra, arcata sotto' },
  { id: 'sot:kit:ponte-travi', nome: 'Ponte di travi', categoria: 'edificio', file: MONDO + 'ponti.js:ponte', crea: ponteDi('travi', 'est', 5, 0.13, 0.12),
    dove: 'Un modello pronto per i fiumi stretti fra due zone (oggi nessun confine lo usa): assi su due travi e pali nell\'acqua' },
  { id: 'sot:kit:ponte-passerella', nome: 'Passerella di corde', categoria: 'edificio', file: MONDO + 'ponti.js:ponte', crea: ponteDi('passerella', 'sud', 5, 0.13, 0.12),
    dove: 'La passerella delle ceneri (dalla palude alla piana delle ceneri) e il ponte sulla gola (dal monte alla landa vecchia): assi e corde' },
  { id: 'sot:kit:staccionata', nome: 'Staccionata di un campo', categoria: 'prop', file: MONDO + 'ponti.js:staccionate',
    crea: () => pezzo(({ cant, m }) => staccionate([{ x: -3, y: -2, w: 6, h: 4 }], cant, m)),
    dove: 'Attorno a ogni campo coltivato dei prati (grano, cavoli, vigna, zucche, il frutteto): pali e due traverse' },
  { id: 'sot:kit:cartello', nome: 'Cartello all\'incrocio', categoria: 'prop', file: MONDO + 'ponti.js:cartello',
    crea: () => pezzo(({ cant, m }) => cartello({ x: -0.5, y: -0.5 }, [0, 1.9, 3.6], cant, m)),
    dove: 'Al cancello del villaggio: un palo con la freccia della strada maestra, che dice le zone e i dungeon lungo la strada' },
  { id: 'sot:kit:bacheca', nome: 'Bacheca delle taglie', categoria: 'prop', file: MONDO + 'ponti.js:bacheca',
    crea: () => pezzo(({ cant, m }) => bacheca({ x: -1, y: -0.5, w: 2, h: 1 }, cant, m)),
    dove: 'Sul lato est della piazza del villaggio: la tavola col tettuccio e i fogli appesi (le taglie)' },
  { id: 'sot:kit:campo-minatore', nome: 'Campo del minatore', categoria: 'edificio', file: MONDO + 'ponti.js:campoMinatore',
    crea: () => pezzo(({ cant, m, cose }) => campoMinatore({ tenda: { x: 0, y: 0 } }, cant, m, cose), { centro: [2, 1.5] }),
    dove: 'In mezzo alla fila del villaggio, dove sta il vecchio minatore: la tenda, il carretto col minerale e il falò' },
  { id: 'sot:kit:scavo', nome: 'La X della mappa del tesoro', categoria: 'prop', file: MONDO + 'ponti.js:creaScavo',
    crea: () => creaScavo(contesto().kit).g,
    dove: 'Sul prato, solo con una taglia «mappa» in mano: la terra smossa con le due assi rosse a croce e la pala, dove si scava' },
]

/* ═══════════════════ i monumenti (monumenti.js): i dungeon, la pietra, il portale, la porta delle terre ═══════════════════ */

// i quattordici ingressi: misure e nomi come nel generatore (dati/mondo-aperto.js, INGRESSI_DEL_MONDO). Quando un monumento è di un
// altro dungeon (il pozzo, la miniera), la voce ha l'id della chiave
const INGRESSI = [
  ['altare', 'altare', 3, 2, 'La cripta dei re (i prati del cimitero)', 'un altare fra due colonne con la corona; la lastra scivola'],
  ['cantine', 'arco', 3, 2, 'Le cantine dei goblin (i prati del cimitero)', 'un arco di pietra con la grata e due teschi sui pilastri; la grata si alza'],
  ['torre', 'torre', 3, 3, 'La torre bruciata (il bosco vecchio)', 'una torre tonda di blocchi con la cima rotta e annerita; la porta si apre'],
  ['gallerie', 'grotta', 4, 2, 'La tana dei ragni (il bosco vecchio)', 'la bocca di una grotta fra le radici e le ragnatele; le assi si spostano'],
  ['cerchio', 'menhir', 3, 3, 'Il cerchio di pietre (la brughiera)', 'sette menhir col muschio in tondo e in mezzo la lastra con la botola; la botola si apre e la runa brilla'],
  ['corvaia', 'pozzo', 2, 2, 'Il pozzo dei corvi (la brughiera)', 'un pozzo di pietra scura col tetto nero, i corvi appollaiati e le penne per terra', 'corvaia'],
  ['cisterna', 'stagno', 3, 2, 'Le sale allagate (la palude)', 'una scala che scende nell\'acqua fra due pilastri; le rune si accendono'],
  ['palafitta', 'palafitta', 3, 2, 'La palafitta (la palude)', 'la capanna sui pali nello stagno, con la scaletta; nel ballatoio la botola si apre'],
  ['labirinto', 'botola', 2, 2, 'La porta dell\'inferno (la piana delle ceneri)', 'una botola nel telaio di pietra con le corna; si apre sul rosso'],
  ['fornace', 'fumarola', 3, 2, 'La fornace (la piana delle ceneri)', 'un forno di pietra a cupola col camino e la bocca che brilla, le fumarole ai lati; la porta di ferro si alza'],
  ['fondo', 'miniera', 4, 2, 'Le miniere di brace (il monte)', 'l\'imbocco di una miniera coi binari e il carrello; il carrello esce'],
  ['cava', 'miniera', 4, 2, 'La cava gelata (il monte)', 'l\'imbocco della miniera con la brina sulle travi, i ghiaccioli e i cristalli azzurri; il carrello esce', 'cava'],
  ['abisso', 'pozzo', 2, 2, 'Il pozzo senza fondo (la landa vecchia)', 'un pozzo col tetto d\'ardesia, la manovella e il secchio'],
  ['tombe', 'tomba', 3, 2, 'Le tombe del vento (la landa vecchia)', 'il mausoleo di pietra col frontone, due colonne e le bandiere strappate; la lastra della porta scorre'],
]
const VOCI_INGRESSI = INGRESSI.map(([chiave, monumento, w, h, luogo, cosa, id]) => ({
  id: 'sot:monumenti:' + (id || monumento), nome: 'Ingresso: ' + luogo.split(' (')[0].replace(/^L[ae] /, '').replace(/^Il /, ''), categoria: 'edificio', file: MONDO + 'monumenti.js:creaMonumento',
  dove: `${luogo}: ${cosa}`,
  crea: () => pezzo(({ cant, m, kit, g, anima }) => {
    const fatto = creaMonumento({ x: -w / 2, y: -h / 2, w, h, chiave, monumento }, cant, m, kit, g)
    anima.push(t => fatto.anim(0.5 + 0.5 * Math.sin(t * 0.8), t))
  }),
}))

const VOCI_MONUMENTI = [
  ...VOCI_INGRESSI,
  { id: 'sot:monumenti:pietra-del-viaggio', nome: 'Pietra del villaggio', categoria: 'prop', file: MONDO + 'monumenti.js:creaPietra',
    crea: () => pezzo(({ cant, m, g, anima }) => {
      const fatto = creaPietra({ x: -1, y: -1, w: 2, h: 2, chiave: 'villaggio' }, cant, m, g)
      anima.push(t => fatto.aggiorna(true, t, true))
    }),
    dove: 'Nel villaggio, accanto al cancello: sei sassi ritti attorno a una pietra piatta con la runa, che si accende (il viaggio alle pietre delle zone)' },
  { id: 'sot:monumenti:pietra-di-zona', nome: 'Pietra runica di una zona', categoria: 'prop', file: MONDO + 'monumenti.js:creaPietraDiZona',
    crea: () => pezzo(({ cant, m, g, anima }) => {
      const fatto = creaPietra({ x: -1, y: -1, w: 2, h: 2, chiave: 'zona:prati' }, cant, m, g)
      anima.push(t => fatto.aggiorna(true, t, true))
    }),
    dove: 'Al mezzo di ogni zona, accanto alla strada maestra (sette): la lastra alta sullo zoccolo tondo con le rune, che si accendono; da lì si torna al villaggio' },
  { id: 'sot:monumenti:porta-delle-terre', nome: 'La porta delle terre', categoria: 'edificio', file: MONDO + 'monumenti.js:creaPortaDelleTerre',
    crea: () => pezzo(({ cant, m, kit, g, anima }) => {
      const fatto = creaPortaDelleTerre({ x: -1.5, y: -1, w: 3, h: 2, chiave: 'porta-delle-terre' }, cant, m, kit, g)
      anima.push(t => fatto.anim(0.5 + 0.5 * Math.sin(t * 0.6), t))
    }),
    dove: 'In fondo alla landa vecchia, dopo le tombe del vento: un arco di pietra con le rune; aperto, dentro gira un velo chiaro (le terre successive)' },
  { id: 'sot:monumenti:portale-di-sopra', nome: 'Portale gemello (di sopra)', categoria: 'effetto', file: MONDO + 'monumenti.js:creaPortale',
    crea: () => {
      const f = creaPortaleDiSopra(0, 0, 0)
      f.gruppo.userData.anima = t => f.aggiorna(t)
      return f.gruppo
    },
    dove: 'Nel villaggio, a ovest della piazza: l\'anello di pietra ritto col velo che gira, dove si esce dalle discese' },
  { id: 'sot:monumenti:fontana-della-piazza', nome: 'Fontana della piazza', categoria: 'edificio', file: MONDO + 'fontana.js:fontana',
    crea: () => pezzo(({ cant, m, cose, kit, g, anima }) => {
      const f = fontanaDellaPiazza({ x: -1, y: -1 }, cant, m, cose, kit, g)
      anima.push(t => f.anima(t))
    }),
    dove: 'Dove manca chi cura (la guaritrice o l\'incantatrice) prende il posto del pozzo e cura gratis chi è salito dal portale; il villaggio di oggi li ha tutti e due. Vasca, coppa alta, quattro cascate, gocce' },
]

/* ═══════════════════ gli oggetti delle città (props-modelli.js) ═══════════════════ */

const OGGETTI_CITTA = {
  barile: ['Barile', 'prop', 'Ai muri delle case e attorno alle botteghe delle tre città (villaggio, forte del guado, rifugio del passo): un barile in piedi coi cerchi di ferro'],
  botti: ['Botti', 'prop', 'Ai muri di tutte e tre le città: due botti in piedi e una sdraiata sopra'],
  sacchi: ['Sacchi', 'prop', 'Ai muri delle case e davanti alle bancarelle delle tre città: un mucchio di sacchi di farina legati'],
  casse: ['Casse', 'prop', 'Ai muri del forte del guado e del villaggio, davanti alle bancarelle: tre casse impilate coi rinforzi'],
  carretto: ['Carretto col fieno', 'prop', 'Il villaggio (ai muri e nei prati): carretto a due ruote con il fieno, le stanghe verso il lato'],
  balle: ['Balle di paglia', 'prop', 'Il villaggio, nei prati e vicino ai campi: tre balle legate impilate'],
  legna: ['Legna', 'prop', 'Ai muri di tutte e tre le città: una catasta di tronchi con le teste chiare'],
  catasta: ['Catasta grande', 'prop', 'Il rifugio del passo (ai muri, nel piazzale e attorno alle botteghe): cinque file di tronchi con due ceppi'],
  ceppo: ['Ceppo con l\'ascia', 'prop', 'Il rifugio del passo, ai muri e nel piazzale: un ceppo con l\'ascia piantata'],
  panca: ['Panca', 'prop', 'In piazza in tutte e tre le città, e davanti alle torrette: un\'asse su due sostegni'],
  tavolo: ['Tavolo con le panche', 'prop', 'Ai muri delle case e nel piazzale delle tre città: tavolo di legno con due panche e due boccali'],
  bancarella: ['Bancarella della piazza', 'prop', 'In piazza nel villaggio (due) e nel rifugio del passo (una): banco con la merce e la tendina a righe colorata'],
  scaffale: ['Scaffale delle erbe', 'prop', 'Attorno alla bottega della guaritrice: tre ripiani con barattoli ed erbe'],
  rastrelliera: ['Rastrelliera d\'armi', 'prop', 'Il forte del guado (ai muri e nel piazzale) e davanti alla fucina: spade, lance e scudi appoggiati'],
  manichino: ['Manichino da allenamento', 'prop', 'Il forte del guado, ai muri e nel piazzale: palo, traversa, corpo di paglia e scudo'],
  lanterna: ['Lanterna', 'prop', 'I lampioni della piazza del villaggio e davanti alla torretta dell\'incantatrice: palo con la lanterna accesa'],
  torcia: ['Torcia', 'prop', 'I lampioni della piazza del forte del guado e il suo piazzale: palo con la coppa di ferro e la fiamma'],
  braciere: ['Braciere', 'prop', 'I lampioni della piazza del rifugio del passo, i suoi muri e le sue botteghe: treppiede di ferro con la brace'],
  fiori: ['Cassetta di fiori', 'pianta', 'Ai muri delle case del villaggio e davanti alla bottega della guaritrice: cassetta di legno con fiori colorati'],
  vaso: ['Vasi di fiori', 'pianta', 'Ai muri del villaggio e davanti alle botteghe della guaritrice e dell\'incantatrice: due vasi di terracotta con le piantine'],
  orto: ['Orto con lo steccato', 'pianta', 'Il villaggio, attorno alle case e nei prati: aiuola con tre file di verdure e uno steccato basso'],
  bucato: ['Stenditoio col bucato', 'prop', 'Il villaggio, ai muri e nei prati: due pali, la corda e quattro panni colorati'],
  insegna: ['Insegna di bottega', 'prop', 'Davanti a ogni bottega (fucina, bancarella, guaritrice, torretta): palo, braccio e cartello col segno della merce (qui quello del mercante)'],
  ruota: ['Affilatoio', 'prop', 'Davanti alla fucina del fabbro (villaggio, forte del guado): ruota di pietra fra due cavalletti e il secchio'],
  incudine: ['Incudine', 'prop', 'Davanti alla fucina del fabbro: ceppo, incudine di ferro e il martello'],
  carbone: ['Cassetta di carbone', 'prop', 'Davanti alla fucina del fabbro: cassa di legno colma di carbone nero'],
  pellicce: ['Banco di pellicce', 'prop', 'Il rifugio del passo, ai muri e davanti alle botteghe: due montanti, una stanga e tre pelli stese'],
  slitta: ['Slitta carica', 'prop', 'Il rifugio del passo: slitta coi pattini, una cassa, sacchi e una pelliccia'],
  tenda: ['Tenda di tela', 'prop', 'Il forte del guado, nel piazzale (tre): cono di tela a otto spicchi, l\'ingresso scuro, il palo col pennone'],
  bandiera: ['Bandiera', 'prop', 'Il forte del guado, in piazza (due): asta di legno su un basamento di sassi con la bandiera'],
  palizzata: ['Tratto di palizzata', 'prop', 'Il forte del guado, tutto attorno alla città: quattro pali appuntiti e due traverse'],
}
const VOCI_CITTA = Object.entries(OGGETTI_CITTA).map(([tipo, [nome, categoria, dove]]) => ({
  id: 'sot:props:' + tipo.replace(/_/g, '-'), nome, categoria, dove, file: MONDO + 'props-modelli.js:' + (tipo === 'palizzata' ? 'palizzata' : 'MODELLI.' + tipo),
  crea: () => pezzo(({ cant, cose }) => { cant.base(0, 0, 0, 0); MODELLI[tipo](cant, caso(7), { bottega: 'bancarella', fuoco: true }, cose) }),
}))

/* ═══════════════════ i props fuori dalle città (props-aperto.js) ═══════════════════ */

// come si chiama l'habitat e dove si trova (i nomi delle regioni del generatore)
export const NOMI_HABITAT = {
  cimitero: 'il cimitero vecchio', rovine: 'il colle delle rovine e le rovine del guado', brughiera: 'la brughiera e il colle dei corvi',
  bosco: 'il bosco vecchio', foresta: 'la foresta nera e il bosco dei lupi', secco: 'il bosco secco', palude: 'la palude', lago: 'il lago',
  ceneri: 'la valle delle ossa e la piana delle ceneri', landa: 'la landa vecchia', monte: 'il passo, il monte e la vetta dei troll',
  roccia: 'la gola dei venti e le colline di roccia', prato: 'i prati (valle del mulino, guado, accampamento)', frutteto: 'il frutteto', campi: 'i campi',
}
export const NOMI_INGRESSO = {
  altare: 'la cripta dei re', arco: 'le cantine dei goblin', torre: 'la torre bruciata', grotta: 'la tana dei ragni', stagno: 'le sale allagate',
  botola: 'la porta dell\'inferno', miniera: 'le miniere di brace', pozzo: 'il pozzo senza fondo',
  menhir: 'il cerchio di pietre', corvaia: 'il pozzo dei corvi', palafitta: 'la palafitta', fumarola: 'la fornace', cava: 'la cava gelata',
  tomba: 'le tombe del vento',
}
// nome, categoria, cos'è; il dove si ricava da TABELLA e SCENARI (si tiene da solo)
const FORME_NOME = {
  tomba: ['Tomba con la lapide', 'prop', 'una lastra di pietra con la lapide e la croce'],
  cripta: ['Piccola cripta', 'edificio', 'un mausoleo basso con la porta scura'],
  cancello: ['Cancello del cimitero', 'prop', 'due pilastri e il cancello di ferro, con le inferriate'],
  croce: ['Croce di legno', 'prop', 'una croce di legno storta, piantata in terra'],
  arcoRotto: ['Arco spezzato', 'edificio', 'un arco di pietra mezzo crollato'],
  colonnaRotta: ['Colonna rotta', 'prop', 'una colonna spezzata con i rocchi per terra'],
  muretto: ['Muretto di sassi', 'prop', 'un tratto di muro a secco, mezzo franato'],
  macerie: ['Macerie', 'prop', 'un mucchio di pietre cadute'],
  menhir: ['Menhir', 'prop', 'una pietra alta e ritta, col muschio'],
  cerchio: ['Cerchio di pietre', 'prop', 'sassi ritti in cerchio attorno a una pietra piatta'],
  tumulo: ['Tumulo', 'prop', 'una collinetta d\'erba con la pietra d\'ingresso'],
  cespoErica: ['Cespo d\'erica', 'pianta', 'un cespuglio fitto di erica fiorita'],
  tronco: ['Tronco caduto', 'prop', 'un albero abbattuto, con i rami e il muschio'],
  ceppoGrande: ['Ceppo grande', 'prop', 'un ceppo largo con gli anelli visibili'],
  funghiGiganti: ['Funghi giganti', 'pianta', 'funghi alti come una persona, rossi a puntini'],
  ragnatela: ['Ragnatela fra i rami', 'prop', 'una grande ragnatela tesa fra due alberi'],
  accampamento: ['Accampamento', 'prop', 'una tenda, un falò spento e un tronco per sedersi'],
  carro: ['Carro abbandonato', 'prop', 'un carro di legno con una ruota rotta'],
  recinto: ['Recinto', 'prop', 'uno steccato di pali e traverse'],
  cassaMele: ['Cassa di mele', 'prop', 'una cassa piena di mele rosse'],
  palafitta: ['Palafitta', 'edificio', 'una capanna su pali dentro l\'acqua, con la scaletta'],
  barca: ['Barca', 'prop', 'una barca di legno con i remi, tirata a riva'],
  canneto: ['Canneto', 'pianta', 'un ciuffo di canne con le spighe marroni'],
  ninfee: ['Ninfee', 'pianta', 'foglie tonde sull\'acqua con qualche fiore'],
  palo: ['Palo nell\'acqua', 'prop', 'pali di legno piantati nell\'acqua, col muschio'],
  fumarola: ['Fumarola', 'effetto', 'un cono di pietra nera che fuma e brilla di giallo e rosso'],
  rocciaSpaccata: ['Roccia spaccata', 'prop', 'un masso nero spaccato in due'],
  ossa: ['Ossa', 'prop', 'un teschio e qualche osso sparso'],
  tridente: ['Tridente piantato', 'prop', 'un tridente di ferro piantato nella cenere'],
  carrello: ['Carrello da miniera', 'prop', 'un carrello di legno su ruote di ferro, pieno di sassi'],
  binari: ['Binari', 'prop', 'un tratto di binario con le traversine'],
  travi: ['Travi di sostegno', 'prop', 'un telaio di travi che puntella un\'apertura'],
  minerale: ['Vena di minerale', 'prop', 'un masso con i cristalli azzurri'],
  argano: ['Argano', 'prop', 'un argano di legno con la corda e il secchio'],
  cairn: ['Cairn', 'prop', 'sassi impilati a torre'],
  cartello: ['Cartello stradale', 'prop', 'un palo con la freccia di legno'],
  totem: ['Totem', 'prop', 'un palo intagliato con le facce'],
  miliare: ['Pietra miliare', 'prop', 'una pietra a punta che segna la strada'],
  teschio: ['Teschio su palo', 'prop', 'un teschio d\'animale sopra un palo'],
  braciere: ['Braciere dei dungeon', 'prop', 'un braciere di ferro con la brace accesa'],
  pozza: ['Pozza', 'prop', 'una pozza d\'acqua scura'],
  bozzolo: ['Bozzolo di ragno', 'prop', 'un bozzolo bianco appeso, avvolto di fili'],
  palizzata: ['Palizzata dei dungeon', 'prop', 'pali appuntiti piantati a recinto'],
  sacchi: ['Sacchi', 'prop', 'un mucchio di sacchi'],
  trave: ['Trave caduta', 'prop', 'una trave di legno annerita, di traverso'],
  crepa: ['Crepa nel terreno', 'effetto', 'una spaccatura nera nel suolo'],
  lanterna: ['Lanterna su palo', 'prop', 'un palo con la lanterna accesa'],
  // il segno delle tane (props-tana-dati.js)
  sassiTana: ['Tratto del cerchio di sassi', 'prop', 'tre sassi in fila, un tratto del cerchio attorno al focolare'],
  cenereTana: ['Focolare spento', 'effetto', 'cenere grigia, tizzoni neri e un filo di fumo finché il signore c\'è'],
  braciTana: ['Fossa di braci', 'effetto', 'terra nera, sassi anneriti e brace accesa, con scintille e fiamme finché il signore c\'è'],
  bozzoliTesi: ['Ragnatela coi bozzoli', 'prop', 'una ragnatela fra due rami secchi, con due bozzoli appesi'],
  canneSpezzate: ['Canne spezzate', 'pianta', 'qualche canna storta e le lame cadute di traverso'],
  nidoFango: ['Nido di fango', 'prop', 'un tumulo di fango col cratere, i rametti attorno, due uova e un osso'],
  carcassa: ['Carcassa', 'prop', 'il costato di una bestia grossa, la spina, il cranio con le corna'],
  mucchio: ['Mucchio di pietre', 'prop', 'otto pietre ammucchiate, larghe sotto e piccole in cima'],
  croceStorta: ['Croce storta', 'prop', 'una croce di legno inclinata, con due sassi ai piedi'],
  ossaTana: ['Ossa della tana', 'prop', 'come le ossa del mondo, messe attorno al cuore della tana'],
  crepaTana: ['Terra bruciata della tana', 'effetto', 'come la crepa nel terreno, al centro o attorno alla tana'],
  rocciaTana: ['Roccia spaccata della tana', 'prop', 'come la roccia spaccata, attorno alla tana'],
  macerieTana: ['Macerie della tana', 'prop', 'come le macerie, attorno alla tana'],
}
// quale pezzo di codice disegna il tipo (qualche nome è diverso dal tipo)
const NOME_FUNZIONE_APERTO = { ragnatela: 'ragnatelaRami', croce: 'croce', ossaTana: 'ossa', crepaTana: 'crepa', rocciaTana: 'rocciaSpaccata', macerieTana: 'macerie' }
const dovePropsAperti = tipo => {
  const habitat = Object.entries(TABELLA).filter(([, l]) => l.some(([t]) => t === tipo)).map(([h]) => NOMI_HABITAT[h])
  const ingressi = Object.entries(SCENARI).filter(([, l]) => l.some(([t]) => t === tipo)).map(([i]) => NOMI_INGRESSO[i])
  const parti = []
  // il segno delle tane: per quali habitat (famiglia), dalle ricette
  const tane = Object.entries(RICETTE).filter(([, l]) => l.some(([t]) => t === tipo)).map(([f]) => Object.entries(FAMIGLIA_DI).filter(([, x]) => x === f).map(([h]) => NOMI_HABITAT[h]).join('; '))
  if (tane.length) parti.push('nella tana di ' + tane.join(' / '))
  if (['cartello', 'totem', 'miliare'].includes(tipo)) parti.push('lungo le strade del mondo, a una decina di celle l\'uno dall\'altro')
  if (habitat.length) parti.push('sparso in ' + habitat.join('; '))
  if (ingressi.length) parti.push('attorno all\'ingresso di ' + ingressi.join(', '))
  return (parti.length ? parti.join(' · ') : 'nel mondo di sopra') + ': ' + FORME_NOME[tipo][2]
}
function propAperto(tipo) {
  return () => {
    const acqua = !!FORME_APERTE[tipo].acqua
    // l'acqua sta 0,35 sopra il fondo: le palafitte e i pali ci si piantano dentro
    return pezzo(({ cant, m, cose }) => {
      disegnaPropsAperti(m, 0, cant, cose, [{ tipo, x: 0, z: 0, giro: 0, seme: 11, pezzo: 0 }])
    }, { quota: acqua ? LIVELLO_ACQUA - 0.35 : 0, rialza: acqua ? 0.35 : 0, acqua: acqua ? 2.2 : 0 })
  }
}
const VOCI_APERTI = Object.keys(FORME_NOME).map(tipo => ({
  id: 'sot:aperto:' + tipo.replace(/([A-Z])/g, c => '-' + c.toLowerCase()), nome: FORME_NOME[tipo][0], categoria: FORME_NOME[tipo][1],
  dove: dovePropsAperti(tipo), file: MONDO + 'props-aperto.js:' + (NOME_FUNZIONE_APERTO[tipo] || tipo), crea: propAperto(tipo),
}))

/* ═══════════════════ la natura (natura.js, GEO) ═══════════════════ */

// quale materiale (come in creaNatura): la pietra e il legno e la paglia hanno quelli del kit, il resto il colore nei vertici
const NATURA = {
  tondo: ['Albero a chioma tonda', 'pianta', 'liscio', 'Il villaggio, i campi, le rovine, il frutteto, i prati, il bosco vecchio e il lago'],
  frutto: ['Albero da frutto', 'pianta', 'liscio', 'Il frutteto, in file: chioma tonda con le mele rosse'],
  pino: ['Pino', 'pianta', 'liscio', 'La brughiera, il bosco vecchio, i prati, le colline di roccia, il monte e la foresta nera'],
  abete: ['Abete', 'pianta', 'liscio', 'Il bosco vecchio, il monte e la foresta nera: tre coni sovrapposti, verde azzurro'],
  salice: ['Salice', 'pianta', 'liscio', 'Il lago e la palude: chioma bassa con i rami che cadono'],
  secco: ['Albero secco', 'pianta', 'liscio', 'Il cimitero, le rovine, la brughiera, la piana delle ceneri, la landa e il bosco secco: tronco nudo e rami storti'],
  cespuglio: ['Cespuglio', 'pianta', 'liscio', 'Quasi ovunque: villaggio, cimitero, campi, rovine, frutteto, prati, boschi, lago, monte'],
  erica: ['Erica', 'pianta', 'liscio', 'La brughiera e il colle dei corvi: macchie basse viola'],
  canne: ['Canne', 'pianta', 'liscio', 'Il lago e la palude, a ciuffi: canne con le spighe'],
  funghi: ['Funghi', 'pianta', 'liscio', 'Il bosco vecchio, la foresta nera e la palude: tre funghi rossi a puntini'],
  sasso: ['Sasso', 'altro', 'roccia', 'Le rovine, la brughiera, le colline di roccia, il monte, la piana delle ceneri e i prati: un sasso piccolo'],
  masso: ['Masso', 'altro', 'roccia', 'Le colline di roccia, il monte, la brughiera, la foresta e la piana delle ceneri: un sasso grande'],
  rupe: ['Rupe', 'altro', 'roccia', 'Il bordo di ogni regione (in tutto il mondo) e le montagne: una roccia alta quanto una casa'],
  brace: ['Brace', 'effetto', 'roccia', 'La piana delle ceneri: un sasso nero con il cuore arancione'],
  ceppo: ['Ceppo', 'prop', 'legno', 'La foresta nera e il bosco secco: un ceppo basso con gli anelli'],
  covone: ['Covone', 'prop', 'paglia', 'I campi di grano: un covone di paglia a cono'],
  botte: ['Botte', 'prop', 'legno', 'Il frutteto: una botte col cerchio di ferro'],
  cassa: ['Cassa', 'prop', 'legno', 'Nei dintorni delle città e dei campi: una cassa di legno'],
  spaventapasseri: ['Spaventapasseri', 'prop', 'liscio', 'Nei campi: palo, traversa, camicia rossa e cappello'],
  rudere: ['Rudere', 'prop', 'pietra', 'Le rovine (colle e guado): un muro basso, mezzo crollato'],
  colonna: ['Colonna', 'prop', 'pietra', 'Le rovine e il cimitero: una colonna ritta e un rocchio caduto'],
  lapide: ['Lapide', 'prop', 'pietra', 'Il cimitero vecchio: una lapide ad arco su un po\' d\'erba'],
  ossa: ['Ossa', 'prop', 'liscio', 'La piana delle ceneri, la landa e il bosco secco: un teschio e due ossa'],
  zucca: ['Zucca', 'pianta', 'liscio', 'I campi di zucche (campi, valle del mulino): una zucca arancione'],
  vite: ['Vite', 'pianta', 'liscio', 'La vigna dei campi: un palo con la vite'],
  fiore: ['Fiore', 'pianta', 'liscio', 'I prati e le zone fiorite (campi, villaggio, lago, frutteto): un fiorellino bianco'],
  grano: ['Grano', 'pianta', 'grano', 'I campi di grano (campi, valle del mulino, villaggio): un ciuffo di spighe dorate'],
  cavolo: ['Cavolo', 'pianta', 'liscio', 'I campi di cavoli e di zucche: un cavolo verde'],
  erba: ['Ciuffo d\'erba', 'pianta', 'erba', 'Su tutte le celle d\'erba del mondo, più fitta nei prati: fili che si piegano col vento'],
}
const VOCI_NATURA = Object.entries(NATURA).map(([tipo, [nome, categoria, mat, dove]]) => ({
  id: 'sot:natura:' + tipo, nome, categoria, dove, file: MONDO + 'natura.js:GEO.' + tipo,
  crea: () => {
    const { kit } = contesto()
    const materiale = tipo === 'rudere' || tipo === 'colonna' || tipo === 'lapide' ? kit.mobili.pietra
      : tipo === 'botte' || tipo === 'cassa' || tipo === 'ceppo' ? kit.mobili.legno
      : tipo === 'covone' ? kit.mobili.paglia
      : new MeshStandardMaterial({ vertexColors: true, roughness: mat === 'roccia' ? 0.95 : 0.85, flatShading: mat === 'roccia', side: mat === 'erba' || mat === 'grano' ? DoubleSide : 0 })
    const me = new Mesh(GEO[tipo](), materiale)
    me.castShadow = me.receiveShadow = true
    const g = new Group(); g.add(me)
    return g
  },
}))

/* ═══════════════════ le discese (scena3d/): botti, arredo, relitti, portale, fonte ═══════════════════ */

const nomiAspetti = chi => chi.map(k => ASPETTI_3D[k].nome).join(', ')

// una discesa vista da un oggetto solo: quello che i creatori vogliono è «dentro il gruppo»
const nelGruppo = f => { const g = new Group(); f(g); return g }

function botteDi(rotta) {
  return () => nelGruppo(g => {
    const { legno, maschera } = contesto()
    creaBotti(g, { posti: [{ fx: 0, fy: 0, giro: 0.3, scala: 1, x: 0, y: 0, stanza: 0, rotta }], legno, conMaschera: mat => mat, maschera, regola: BOTTI_PER_PAESAGGIO.cantine })
  })
}
const dovePaesaggiBotti = nomiAspetti(Object.keys(BOTTI_PER_PAESAGGIO))

// l'arredo: una pianta finta, una sala 8×5 col muro intorno, dove ogni tipo trova il suo posto; poi si tiene un'istanza sola
function piantaFinta() {
  const W = 10, H = 7, dentro = (x, y) => x >= 1 && y >= 1 && x <= 8 && y <= 5
  const pavimento = [], muri = []
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) (dentro(x, y) ? pavimento : muri).push({ x, y, basso: false })
  return { W, H, id: (x, y) => y * W + x, calpestabile: dentro, roccia: (x, y) => !dentro(x, y), colonna: new Uint8Array(W * H), muri, pavimento, acqua: [{ x: 4, y: 3 }] }
}
function arredoDi(tipo, paesaggio) {
  return () => nelGruppo(g => {
    const { legno, muroDi } = contesto(), pianta = piantaFinta()
    const aspetto = { ...ASPETTI_3D[paesaggio], arredo: [[tipo, 1]] }
    const liv = { stanze: tipo === 'carrelli' ? [{ suolo: pianta.pavimento }] : [] }
    creaArredo3d(g, { pianta, liv, aspetto, seme: 3, trame: { muro: muroDi(aspetto) }, legno, conMaschera: mat => mat, maschera: null })
    // l'arredo è istanziato: ne resta uno solo, sull'origine
    for (const im of g.children) if (im.isInstancedMesh) {
      im.count = 1; im.setMatrixAt(0, new Matrix4()); im.instanceMatrix.needsUpdate = true; im.frustumCulled = false
    }
  })
}
// nome, categoria, cos'è (il dove si ricava da ASPETTI_3D)
const ARREDO = {
  contrafforti: ['Contrafforte', 'prop', 'un pilastro addossato al muro, con la base e il capitello'],
  sacchi: ['Sacchi', 'prop', 'tre sacchi di farina legati'],
  mensole: ['Mensole coi vasi', 'prop', 'due ripiani di legno a muro con boccette di terracotta'],
  pilastri: ['Pilastro a muro', 'prop', 'una lesena di pietra, alta fino al soffitto'],
  nicchie: ['Nicchia col sarcofago', 'prop', 'una nicchia nel muro con il sarcofago e il suo coperchio'],
  ossa: ['Ossa e teschio', 'prop', 'ossa sparse e un teschio'],
  candele: ['Candele', 'prop', 'tre candele di cera con la fiamma, fanno luce'],
  tubi: ['Tubi di rame', 'prop', 'tubi di rame che corrono lungo il muro, con la valvola'],
  bocche: ['Bocca della fornace', 'prop', 'una bocca di ferro nel muro con il fuoco dietro la griglia, fa luce'],
  incudini: ['Incudine', 'prop', 'un ceppo con incudine e martello'],
  spuntoni: ['Spuntoni neri', 'prop', 'cinque spine di roccia nera con la brace dentro'],
  stalagmiti: ['Stalagmiti', 'altro', 'tre punte di roccia che salgono dal pavimento'],
  funghi: ['Funghi luminosi', 'pianta', 'tre funghi che brillano, fanno luce'],
  sassi: ['Sassolini', 'altro', 'quattro sassi piccoli sul pavimento'],
  abeti: ['Abete con la neve', 'pianta', 'un abetino a tre strati con la neve sui rami'],
  cumuli: ['Cumulo di neve', 'altro', 'un mucchio di neve a cupola'],
  ghiaccioli: ['Ghiaccioli', 'altro', 'sei ghiaccioli appesi al soffitto contro il muro'],
  cristalli: ['Cristalli di ghiaccio', 'altro', 'un gruppo di cristalli azzurri che brillano'],
  canne: ['Canne di palude', 'pianta', 'un ciuffo di canne con le spighe'],
  radici: ['Radici che pendono', 'pianta', 'radici che scendono dal soffitto lungo il muro'],
  ninfee: ['Ninfee', 'pianta', 'tre foglie tonde sull\'acqua e un bocciolo'],
  archi: ['Arco sommerso', 'prop', 'un arco di pietra con il fondo scuro e l\'acqua dentro'],
  alghe: ['Alghe', 'pianta', 'nastri d\'alga verde che ondeggiano'],
  rocchi: ['Rocchi di colonna', 'prop', 'due rocchi di colonna caduti'],
  travi: ['Telaio di travi', 'prop', 'due montanti e una trave, con la lanterna appesa'],
  binari: ['Binario', 'prop', 'un tratto di rotaia con le traversine, nei corridoi'],
  carrelli: ['Carrello da miniera', 'prop', 'un carrello con le ruote di ferro e due sassi dentro'],
}
// il paesaggio con cui si mostra: il primo che lo usa
const PAESAGGIO_ARREDO = tipo => Object.keys(ASPETTI_3D).find(k => (ASPETTI_3D[k].arredo || []).some(([t]) => t === tipo))
const VOCI_ARREDO = Object.entries(ARREDO).map(([tipo, [nome, categoria, cosa]]) => ({
  id: 'sot:arredo:' + tipo, nome, categoria, file: SCENA + 'arredo3d.js:creaArredo3d', crea: arredoDi(tipo, PAESAGGIO_ARREDO(tipo)),
  dove: 'Nelle discese (' + nomiAspetti(Object.keys(ASPETTI_3D).filter(k => (ASPETTI_3D[k].arredo || []).some(([t]) => t === tipo))) + '): ' + cosa,
}))

// i relitti in codice: la forma, il paesaggio in cui compare, e quanto è lungo (in celle)
const RELITTI = {
  macerie: ['Macerie', 1, 'cantine', 'un mucchio di sassi caduti'],
  crollo: ['Crollo', 2, 'cantine', 'un grande crollo di pietre, lungo due celle'],
  roccia: ['Roccia', 1, 'cantine', 'un masso grosso, rimasto lì da sempre'],
  trave: ['Trave marcia', 2, 'cantine', 'una trave di legno crollata di traverso'],
  stalagmite: ['Stalagmite', 1, 'cripta', 'una stalagmite con la sua piccola'],
  carro: ['Carro rotto', 2, 'fornace', 'un carro di legno con le ruote di ferro'],
  binari: ['Binari', 2, 'fornace', 'un tratto di rotaia con le traversine'],
}
const VOCI_RELITTI = Object.entries(RELITTI).map(([disegno, [nome, lungo, scenario, cosa]]) => {
  const dove = Object.entries(ASPETTI_RELITTI).filter(([, fam]) => Object.values(fam).some(cl => Object.values(cl).some(l => l.some(a => a.disegno === disegno)))).map(([s]) => s)
  return {
    id: 'sot:relitti:' + disegno, nome, categoria: 'prop', file: SCENA + 'relitti.js:creaRelitti',
    dove: 'Nelle discese, in mezzo alle stanze (' + dove.join(', ') + '): ' + cosa,
    crea: () => nelGruppo(g => { creaRelitti(g, [{ disegno, x: -lungo / 2, y: -0.5, w: lungo, h: 1 }], scenario, contesto().maschera) }),
  }
})

const VOCI_DISCESE = [
  { id: 'sot:discese:botte', nome: 'Botte da rompere', categoria: 'prop', file: SCENA + 'botti.js:creaBotti', crea: botteDi(false),
    dove: 'Nelle stanze delle discese (' + dovePaesaggiBotti + '): una botte di doghe coi cerchi di ferro, si rompe a colpi e lascia un premio' },
  { id: 'sot:discese:botte-rotta', nome: 'Botte rotta', categoria: 'prop', file: SCENA + 'botti.js:creaBotti', crea: botteDi(true),
    dove: 'Le stesse stanze, dopo il colpo: le doghe e i cerchi sparsi per terra, fermi' },
  ...VOCI_ARREDO,
  ...VOCI_RELITTI,
  { id: 'sot:discese:portale', nome: 'Portale delle discese', categoria: 'edificio', file: SCENA + 'portale.js:creaPortale',
    crea: () => nelGruppo(g => {
      const { muroDi } = contesto()
      const p = creaPortale(g, { cella: { x: -0.5, y: -0.5 }, trama: muroDi(ASPETTI_3D.cantine) })
      g.userData.anima = t => p.aggiorna(0.016, t, 400, 1)
    }),
    dove: 'In ogni discesa, quando si è finito il piano e si può uscire: due pilastri con le rune, l\'architrave, il velo viola che gira e il cerchio di rune per terra' },
  { id: 'sot:discese:fonte', nome: 'Fonte che cura', categoria: 'edificio', file: SCENA + 'fontana.js:creaFontana',
    crea: () => nelGruppo(g => {
      const { muroDi } = contesto(), aspetto = ASPETTI_3D.cantine
      // la riserva delle luci che l'acqua somma a mano (luci.js): vuota, la fonte non ne ha bisogno per vedersi
      const condivise = {
        uLp: { value: Array.from({ length: MAX_LUCI }, () => new Vector3()) }, uLc: { value: Array.from({ length: MAX_LUCI }, () => new Vector3()) },
        uLn: { value: 0 }, uConoP: { value: new Vector3() }, uConoD: { value: new Vector3(0, 0, -1) }, uConoC: { value: new Vector3() },
      }
      const f = creaFontana(g, { cella: { x: -0.5, y: -0.5 }, condivise, trama: muroDi(aspetto), conMaschera: mat => mat, maschera: contesto().maschera, aspetto })
      g.userData.anima = t => f.aggiorna(0.016, t, 400, 1)
    }),
    dove: 'In alcuni piani delle discese: vasca di pietra con la coppa, il velo d\'acqua che cade e le gocce; bevuta, cura e si svuota (nell\'inferno è una coppa di lava)' },
]

/* ═══════════════════ i mostri 3D (in prova) ═══════════════════ */
// uno per modello del registro (docs/sotterraneo/mostri-3d.md): chi lo usa si legge dal registro, non si scrive a mano
const USI_DEI_MOSTRI = new Map()
const usa = (id, chi) => { if (id && voceDelMostro(id)) { if (!USI_DEI_MOSTRI.has(id)) USI_DEI_MOSTRI.set(id, []); USI_DEI_MOSTRI.get(id).push(chi) } }
for (const [tipo, v] of Object.entries(MODELLO_DI_SPECIE)) for (const id of [v].flat()) usa(id, tipo)
for (const [grosso, id] of Object.entries(MODELLO_DEL_GROSSO)) usa(id, `il grosso ${grosso}`)
for (const [tipo, vv] of Object.entries(MODELLO_DELLA_VARIANTE)) for (const [variante, id] of Object.entries(vv)) usa(id, `${tipo} ${variante}`)
export const ID_DEI_MOSTRI = id => 'sot:mostri:' + id.replace('/', '-')
const VOCI_MOSTRI = [...USI_DEI_MOSTRI].map(([id, chi]) => ({
  id: ID_DEI_MOSTRI(id), nome: `Mostro 3D ${id.split('/')[1]}`, categoria: 'personaggio', file: SCENA + 'mostri3d/registro.js:costruisci',
  crea: () => costruisciMostro(id),
  dove: `Nel Sotterraneo 3D, al posto dello sprite (dalla zona ${id.split('/')[0]} dei prototipi): ${[...new Set(chi)].join(', ')}`,
}))

/* ═══════════════════ l'elenco ═══════════════════ */

const comune = v => ({ gioco: 'sotterraneo', ...v })
// le persone del mondo di sopra (in prova): una voce per modello, col suo idle
const VOCI_PERSONE = CHIAVI_PERSONE.map(k => ({
  id: `sot:persona:${k}`, nome: `Persona: ${k}`, gioco: 'sotterraneo', categoria: 'personaggio',
  dove: k === 'guardia' ? 'il mondo di sopra: la guardia della torre e le sentinelle delle discese rosse' : 'il mondo di sopra (villaggio, botteghe, missioni)',
  file: 'src/giochi/sotterraneo/scena3d/persone3d/persone.js:creaPersona', crea: () => creaPersona(k),
}))

export const VOCI = [...VOCI_KIT, ...VOCI_MONUMENTI, ...VOCI_CITTA, ...VOCI_APERTI, ...VOCI_NATURA, ...VOCI_DISCESE, ...VOCI_MOSTRI, ...VOCI_PERSONE].map(comune)

// quello che serve al test: le tabelle da confrontare con quelle del gioco
export const TABELLE = { OGGETTI_CITTA, FORME_NOME, NATURA, ARREDO, RELITTI, INGRESSI, NOMI_HABITAT, NOMI_INGRESSO }
