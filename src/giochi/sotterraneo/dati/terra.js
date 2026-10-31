// Le discese sul mondo di sopra, la parte scritta a mano: l'icona di ognuna e come il minatore ne spiega la strada. Dove stanno i
// posti lo decide il generatore del mondo (motore/mondo-percorso.js, docs/sotterraneo/mondo-a-percorso.md).
import { ICONE_MONDO } from './icone-mondo.js'

// l'icona di una discesa (la chiave della tappa, o 'abisso'; anche le città), non un'emoji: il suo monumento fotografato nel mondo
// (dati/icone-mondo.js, generato)
export const iconaDi = chiave => ICONE_MONDO[chiave] || null

// La strada nel mondo a percorso (docs/sotterraneo/mondo-a-percorso.md): per chiave del dungeon, con la zona dove sta (che compare in
// fondo entrando) e il ponte o il valico che ci porta, mai coi punti cardinali né con destra e sinistra (la strada fa la serpentina: la
// sinistra di chi cammina non è quella dello schermo). Tutte partono dal villaggio, dove stanno il minatore e il capitano.
export const LUOGHI_MONDO = {
  altare: 'esci dal cancello e segui la strada maestra nei prati del cimitero: poco dopo c\'è l\'altare fra le colonne, con la scala dietro la pietra',
  cantine: 'nei prati del cimitero, lungo la strada maestra oltre la pietra runica: l\'arco di pietra delle cantine',
  torre: 'oltre il ponte del mulino, nel bosco vecchio: accanto alla strada la torre annerita, con la porta in basso',
  gallerie: 'in fondo al bosco vecchio, oltre la sua pietra runica: la grotta fra le radici',
  cerchio: 'su per la salita della brughiera: i menhir in cerchio accanto alla strada, con la botola in mezzo',
  corvaia: 'in fondo alla brughiera, prima del ponte del guado: il pozzo dei corvi',
  cisterna: 'oltre il ponte del guado, nella palude: dopo la sua pietra runica, la scala che scende nell\'acqua',
  palafitta: 'in fondo alla palude, prima della passerella delle ceneri: la palafitta sull\'acqua',
  labirinto: 'oltre la passerella delle ceneri, nella piana delle ceneri: la botola nel telaio, che fuma',
  fornace: 'in fondo alla piana delle ceneri, prima del valico del passo: la fornace con le fumarole',
  fondo: 'su per il valico del passo, sul monte: dopo la sua pietra runica, la miniera coi binari',
  cava: 'in fondo al monte, prima del ponte sulla gola: la miniera con la brina',
  abisso: 'oltre il ponte sulla gola, nella landa vecchia: il pozzo col tetto d\'ardesia',
  tombe: 'in fondo alla landa vecchia, dove finisce la strada maestra: la tomba nel vento',
}
// la strada di una discesa (la chiave della tappa, o 'abisso')
export const luogoDi = chiave => LUOGHI_MONDO[chiave]
