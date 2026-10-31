// I giochi che sanno ricevere un invito (docs/core/amici.md): come si controlla quello che arriva e cosa fare quando si accetta.
// Un gioco nuovo si aggiunge qui: nome, `valida(dati)` e `descrivi(dati)`; poi chiede `prendiIngresso(chiave)` quando si apre.
import { TERRENI } from '../giochi/arena/dati/regole.js'

export const GIOCHI = {
  // Castle Battle: chi invita ha già creato la stanza e manda il codice con l'invito; chi accetta ci entra
  arena: {
    nome: 'Castle Battle',
    valida: d => TERRENI.includes(d?.terreno) && Number.isInteger(d.secondi) && d.secondi >= 3 && d.secondi <= 30 && /^[A-Z]{5}$/.test(d.codice || ''),
    descrivi: () => 'una battaglia a due',
  },
  // il sotterraneo in due (docs/sotterraneo/in-due.md): il posto e la difficoltà li ha scelti chi invita; i nomi si controllano
  // a forma, senza caricare i dati del sotterraneo con l'app
  sotterraneo: {
    nome: 'Il sotterraneo',
    valida: d => /^[a-z0-9-]{2,30}$/.test(d?.posto || '') && ['facile', 'normale', 'difficile', 'impossibile'].includes(d.difficolta) &&
      /^[A-Z]{5}$/.test(d.codice || ''),
    descrivi: () => 'una discesa in due',
  },
}

export const sappiamo = gioco => Object.prototype.hasOwnProperty.call(GIOCHI, gioco)
