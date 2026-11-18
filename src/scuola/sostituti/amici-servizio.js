// A scuola niente amici: stessi nomi di amici/servizio.js, nessun collegamento (docs/scuola/architettura.md).
import { reactive } from 'vue'

export const DURATA_INVITO = 30000
export const stato = reactive({ acceso: false, amici: [], invito: null, risposta: null })
export function avvia() {}
export function ferma() {}
export function aggiungiPonte() {}
export function togliPonte() {}
export function diciGioco() {}
export function invita() {}
export function rispondi() {}
export const quandoBacheca = () => {}
export function avvisaPresenti() {}
export function schermoAcceso() {}
