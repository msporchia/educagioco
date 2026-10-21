// Generato da strumenti/promuovi-3d.mjs da poc/mostri-3d/landa.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// L'elenco dei mostri della landa vecchia («La landa vecchia», livelli 13–15): luoghi foresta e landa, dungeon abisso e tombe.
// Stesso formato di MOSTRI_PRATI / MOSTRI_BOSCO, con in più `ruolo`: comune | forte | boss | superboss.
import { creaMummia, creaTeschioAzzurro, creaCavaliere, creaNegromante, creaReNonMorto } from './landa-morti.js'
import { creaOmbra, creaSpettro, creaOcchioAbisso, creaStrisciante, creaDemone, creaSignoreAbisso } from './landa-ombre.js'
import { creaRapace, creaOrsoNero, creaEnt } from './landa-fiere.js'

export const MOSTRI_LANDA = [
  { chiave: 'mummia', nome: 'Mummia', zona: 'landa', luogo: 'landa, tombe', taglia: 'media', forza: 7, ruolo: 'comune', crea: () => creaMummia('comune') },
  { chiave: 'ombra', nome: 'Ombra', zona: 'landa', luogo: 'landa, tombe', taglia: 'media', forza: 7, ruolo: 'comune', crea: () => creaOmbra('landa') },
  { chiave: 'ombra-bosco', nome: 'Ombra della foresta', zona: 'foresta', luogo: 'foresta', taglia: 'media', forza: 6, ruolo: 'comune', crea: () => creaOmbra('foresta') },
  { chiave: 'teschio-azzurro', nome: 'Teschio azzurro', zona: 'landa', luogo: 'landa, tombe', taglia: 'piccola', forza: 6, ruolo: 'comune', crea: creaTeschioAzzurro },
  { chiave: 'spettro', nome: 'Spettro della lanterna', zona: 'foresta', luogo: 'foresta, landa', taglia: 'media', forza: 7, ruolo: 'comune', crea: creaSpettro },
  { chiave: 'gufo', nome: 'Gufo gigante', zona: 'foresta', luogo: 'foresta', taglia: 'media', forza: 6, ruolo: 'comune', crea: () => creaRapace('gufo') },
  { chiave: 'avvoltoio', nome: 'Avvoltoio', zona: 'landa', luogo: 'landa', taglia: 'media', forza: 7, ruolo: 'comune', crea: () => creaRapace('avvoltoio') },
  { chiave: 'orso-nero', nome: 'Orso nero', zona: 'foresta', luogo: 'foresta', taglia: 'grande', forza: 8, ruolo: 'comune', crea: creaOrsoNero },
  { chiave: 'occhio-abisso', nome: 'Occhio dell\'abisso', zona: 'abisso', luogo: 'abisso', taglia: 'media', forza: 8, ruolo: 'comune', crea: creaOcchioAbisso },
  { chiave: 'strisciante', nome: 'Tentacoli dell\'abisso', zona: 'abisso', luogo: 'abisso', taglia: 'media', forza: 8, ruolo: 'comune', crea: creaStrisciante },
  { chiave: 'mummia-antica', nome: 'Mummia antica', zona: 'tombe', luogo: 'tombe', taglia: 'grande', forza: 9, ruolo: 'forte', crea: () => creaMummia('antica') },
  { chiave: 'cavaliere', nome: 'Cavaliere della tomba', zona: 'tombe', luogo: 'tombe', taglia: 'grande', forza: 9, ruolo: 'forte', crea: creaCavaliere },
  { chiave: 'demone', nome: 'Demone dell\'abisso', zona: 'abisso', luogo: 'abisso', taglia: 'media', forza: 9, ruolo: 'forte', crea: creaDemone },
  { chiave: 'ent', nome: 'Ent', zona: 'foresta', luogo: 'foresta (caporale)', taglia: 'grande', forza: 9, ruolo: 'boss', crea: creaEnt },
  { chiave: 'negromante', nome: 'Negromante', zona: 'landa', luogo: 'landa (caporale), tombe', taglia: 'grande', forza: 10, ruolo: 'boss', crea: creaNegromante },
  { chiave: 're-non-morto', nome: 'Re non morto', zona: 'tombe', luogo: 'tombe (signore)', taglia: 'grande', forza: 11, ruolo: 'boss', crea: creaReNonMorto },
  { chiave: 'signore-abisso', nome: 'Signore dell\'abisso', zona: 'abisso', luogo: 'abisso (signore)', taglia: 'enorme', forza: 13, ruolo: 'superboss', crea: creaSignoreAbisso },
]
