// A scuola niente traguardi, livelli né giorni di fila: stessi nomi di store/progressi.js, nessun dato (docs/scuola/architettura.md).
// `riscuotiTraguardi` non dà mai niente, quindi `state.festa` resta vuota e non ferma il gioco (giochi/pausa.js).
export const AREE = []
export const MEDAGLIE = []
export const PREMI = []
export const TRAGUARDI = []
export const MATERIE = []
export const materiaDi = () => null
export const PASSO_XP = 50
export const xpPerLivello = n => PASSO_XP * n * (n + 1) / 2
export const livelloDa = xp => ({ n: 1, xp, da: 0, a: PASSO_XP, quota: 0 })
export const TITOLI = ['Novellino']
export const titoloDi = () => TITOLI[0]
export const XP_AREA = {}
export const GRADI = []
export const abilita = () => null
export const difficolta = () => 1
export const giornoDi = () => ''
export const segnaGiorno = () => false
export const serieViva = () => 0
export const misure = () => ({})
export const tabellineIntereDi = () => []
export const allineaInglese = p => p.eng
export const allineaSpagnolo = p => p.esp
export const allineaMate = p => p.mate
export const progressoArea = () => ({ xp: 0, ...livelloDa(0), titolo: TITOLI[0] })
export const livelloTotale = () => ({ ...livelloDa(0), titolo: TITOLI[0] })
export const statoTraguardo = () => null
export const statoTraguardi = () => []
export const riscuotiTraguardi = () => ({ nuovi: [], monete: 0 })
export const quantiPresi = () => 0
export const quantiTotali = 0
