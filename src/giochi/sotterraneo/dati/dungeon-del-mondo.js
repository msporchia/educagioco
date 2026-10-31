// I dungeon del mondo a percorso (docs/sotterraneo/dungeon-che-si-rigenerano.md): i quattordici posti del sotterraneo, due per zona,
// legati alla forza della zona e rigenerati dopo ogni ripulitura. Qui i dati: le zone col loro mazzo, il livello di ogni dungeon, i
// sei nuovi come tappe e le leve da tarare (tutte qui, in un posto solo). Le regole stanno in motore/rigenera.js.

// Le sette zone della serpentina (docs/sotterraneo/mondo-a-percorso.md, «Le zone»): i luoghi di sopra (le chiavi delle regioni) e i
// dungeon. Il mazzo di una rigenerazione si pesca da qui: gli abitanti dei suoi dungeon e quelli di sopra dei suoi luoghi
// (ABITANTI_DI_SOPRA; i luoghi delle terre selvagge che non ci sono non danno niente). L'abisso sta nella settima ma non la segue
export const ZONE_DEL_PERCORSO = [
  { zona: 1, nome: 'I prati del cimitero', luoghi: ['campi', 'mulino', 'cimitero', 'frutteto'], dungeon: ['altare', 'cantine'] },
  { zona: 2, nome: 'Il bosco vecchio', luoghi: ['lago', 'bosco', 'lupi'], dungeon: ['torre', 'gallerie'] },
  { zona: 3, nome: 'La brughiera', luoghi: ['colle', 'brughiera', 'corvi', 'rovine'], dungeon: ['cerchio', 'corvaia'] },
  { zona: 4, nome: 'La palude', luoghi: ['guado', 'accampamento', 'palude', 'secco'], dungeon: ['cisterna', 'palafitta'] },
  { zona: 5, nome: 'La piana delle ceneri', luoghi: ['ceneri', 'ossa', 'colline'], dungeon: ['labirinto', 'fornace'] },
  { zona: 6, nome: 'Il monte', luoghi: ['passo', 'gola', 'vetta', 'monte'], dungeon: ['fondo', 'cava'] },
  { zona: 7, nome: 'La landa vecchia', luoghi: ['foresta', 'landa'], dungeon: ['tombe'] },
]

// Il livello di ogni dungeon nella prima terra: quello dei mostri della sua zona dove sta, più uno (un po' più forte di quelli
// attorno). Le terre dopo lo spostano di SALTO_DELLA_TERRA a terra (la zona 1 della seconda comincia sopra la landa)
export const LIVELLO_DEL_DUNGEON = {
  altare: 1, cantine: 2, torre: 4, gallerie: 5, cerchio: 6, corvaia: 7, cisterna: 8,
  palafitta: 9, labirinto: 10, fornace: 11, fondo: 12, cava: 13, tombe: 15,
}
export const SALTO_DELLA_TERRA = 14

// I piani di una discesa ripetuta: i sette come le zone di oggi (PIANI_DELLA_ZONA, sei nella tana), i sei nuovi più corti
export const PIANI_DEI_NUOVI = 3

/* ═══════════ le leve da tarare (dopo, col banco: docs/sotterraneo/dungeon-che-si-rigenerano.md, «Da tarare») ═══════════ */
// La prima volta delle sette porte: spento, i numeri della storia di oggi (CAMPAGNA, livelli attesi 1 2 3 5 7 8 10 12).
// Acceso, il livello del dungeon (1 2 4 5 8 10 12) e la forza della curva dei dungeon a quel livello: costa una taratura della storia
export const STORIA_DALLA_ZONA = false
// Quanto una ripetuta è più forte della curva (la forza moltiplica le ossa, la spinta si aggiunge all'attacco): il «più uno» del
// livello è già il «un po' più forte»; queste restano a 1 e 0 finché il banco non dice altro
export const PIU_FORTE = { forza: 1, spinta: 0 }

// I sei dungeon nuovi, come tappe (i campi di CAMPAGNA in dati/campagna.js): il paesaggio del 3D e lo scenario, la pianta e l'acqua
// della sua `base` (dati/paesaggi.js), gli abitanti della prima forma (una creatura della sua zona: le specie di sopra della zona e
// le cinque libere), il caporale, la forma dei piani. Livello, forza, spinta, domande e piani li mette motore/rigenera.js (dal
// livello). Il mostro grosso sta in GROSSO_DELLA_DISCESA (dati/grossi.js). Le chiavi sono di salvataggio: non si rinominano
export const DUNGEON_NUOVI = {
  cerchio: {
    chiave: 'cerchio', nome: 'Il cerchio di pietre', icona: '🗿', dove: 'sotto il cerchio di pietre', zona: 3,
    paesaggio: 'cripta', scenario: 'cripta', pianta: 'costruita',
    dritta: 'sotto i menhir, stanze che nessuno apriva da mille anni',
    misura: 40, giri: 3, caporali: 6.5, grosso: 4, tettoBranco: 4, capo: 'troll',
    mostri: ['serpente', 'vespa', 'occhio'], caporale: 'lupo',
  },
  corvaia: {
    chiave: 'corvaia', nome: 'Il pozzo dei corvi', icona: '🪶', dove: 'giù nel pozzo dei corvi', zona: 3,
    paesaggio: 'grotta', scenario: 'cantine', pianta: 'caverna',
    dritta: 'un pozzo stretto, e laggiù qualcosa sbatte le ali',
    misura: 30, giri: 2, caporali: 7, grosso: 4, tettoBranco: 4, capo: 'troll',
    mostri: ['pipistrello', 'pipistrello-occhio', 'goblin'], caporale: 'drago',
  },
  palafitta: {
    chiave: 'palafitta', nome: 'La palafitta', icona: '🛖', dove: 'sotto la palafitta', zona: 4,
    paesaggio: 'palude', scenario: 'cantine', pianta: 'caverna', acqua: true,
    dritta: 'fango e canne sotto le assi, e l\'acqua che sale',
    misura: 40, giri: 3, caporali: 6.5, grosso: 4, tettoBranco: 4, capo: 'gigante',
    mostri: ['melma', 'fungo', 'piranha'], caporale: 'mostro-verde',
  },
  fornace: {
    chiave: 'fornace', nome: 'La fornace', icona: '🌋', dove: 'dentro la fornace', zona: 5,
    paesaggio: 'fornace', scenario: 'fornace', pianta: 'costruita',
    dritta: 'griglie sopra il fuoco, e il caldo che non lascia respirare',
    misura: 44, giri: 3, caporali: 6.5, grosso: 3.5, tettoBranco: 5, capo: 'gigante',
    mostri: ['diavoletto', 'spirito-fuoco', 'bestia-cornuta'], caporale: 'drago-lava',
  },
  cava: {
    chiave: 'cava', nome: 'La cava gelata', icona: '❄️', dove: 'giù nella cava gelata', zona: 6,
    paesaggio: 'ghiaccio', scenario: 'cripta', pianta: 'caverna',
    dritta: 'gallerie di ghiaccio, e ogni passo scricchiola',
    misura: 40, giri: 3, caporali: 6.5, grosso: 3.5, tettoBranco: 6, capo: 'gigante',
    mostri: ['golem-pietra', 'pipistrello', 'lupo'], caporale: 'troll-clava',
  },
  tombe: {
    chiave: 'tombe', nome: 'Le tombe del vento', icona: '⚰️', dove: 'nelle tombe del vento', zona: 7,
    paesaggio: 'tempio', scenario: 'cripta', pianta: 'costruita', acqua: true,
    dritta: 'il vento fischia fra le tombe, e qualcuno risponde',
    misura: 46, giri: 4, caporali: 6.5, grosso: 3.5, tettoBranco: 6, capo: 'gigante',
    mostri: ['mummia', 'ombra', 'teschio-azzurro'], caporale: 'negromante',
  },
}

// la zona di un dungeon (1–7), o null
export const zonaDelDungeon = chiave => {
  const z = ZONE_DEL_PERCORSO.find(x => x.dungeon.includes(chiave))
  return z ? z.zona : null
}
// il livello del dungeon nella terra `terra` (1 la prima)
export const livelloDelDungeon = (chiave, terra = 1) =>
  (LIVELLO_DEL_DUNGEON[chiave] || 1) + SALTO_DELLA_TERRA * (Math.max(1, Math.floor(terra) || 1) - 1)
