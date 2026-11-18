// A scuola i giudizi non ci sono: stessi nomi di store/giudizi.js, nessun archivio (docs/scuola/architettura.md).
import { ref } from 'vue'

export const TETTO_INVIO = 30
export const VERDETTI = []
export const verdettoDi = () => null
export const giudiziAccesi = ref(false)
export const avviaGiudizi = async () => false
export const accendiGiudizi = async () => {}
export const aggiungi = lista => lista
export const leggi = async () => []
export const dimentica = async () => {}
export const annota = async () => {}
export const riga = () => ''
export const pacco = () => ({ testo: '', mandati: 0, lasciati: 0 })
