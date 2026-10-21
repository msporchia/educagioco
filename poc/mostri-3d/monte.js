// Il monte («Il monte», livelli 11–13; luoghi passo, gola, vetta, monte; dungeon fondo e cava): l'elenco di tutti i mostri 3D della zona.
import { creaGolem, creaSpiritoElettrico, creaElementaleTempesta } from './monte-pietra.js'
import { creaTroll, creaYeti, creaGigante } from './monte-bruti.js'
import { creaNano, creaMinatoreMorto } from './monte-nani.js'
import { creaCapra, creaLucertola, creaGrifone, creaAquila, creaPipistrelloGrotta } from './monte-fauna.js'

export const MOSTRI_MONTE = [
  { chiave: 'golem-pietra', nome: 'Golem di pietra', zona: 'monte', luogo: 'passo, colline, monte', taglia: 'grande', forza: 9, ruolo: 'forte', crea: () => creaGolem('pietra') },
  { chiave: 'golem-ghiaccio', nome: 'Golem di ghiaccio (caporale)', zona: 'monte', luogo: 'monte (caporale), cava', taglia: 'grande', forza: 11, ruolo: 'boss', crea: () => creaGolem('ghiaccio') },
  { chiave: 'golem-lava', nome: 'Golem di lava (caporale)', zona: 'monte', luogo: 'vetta (caporale), fondo', taglia: 'grande', forza: 11, ruolo: 'boss', crea: () => creaGolem('lava') },
  { chiave: 'spirito-elettrico', nome: 'Spirito elettrico', zona: 'monte', luogo: 'monte, gola', taglia: 'media', forza: 8, ruolo: 'comune', crea: creaSpiritoElettrico },
  { chiave: 'elementale-tempesta', nome: 'Elementale di tempesta', zona: 'monte', luogo: 'gola, vetta', taglia: 'grande', forza: 10, ruolo: 'forte', crea: creaElementaleTempesta },
  { chiave: 'troll-clava', nome: 'Troll con la clava (caporale)', zona: 'monte', luogo: 'passo (caporale), vetta', taglia: 'grande', forza: 10, ruolo: 'boss', crea: creaTroll },
  { chiave: 'yeti', nome: 'Yeti', zona: 'monte', luogo: 'passo, monte, cava', taglia: 'grande', forza: 9, ruolo: 'forte', crea: creaYeti },
  { chiave: 'gigante-monte', nome: 'Gigante di montagna', zona: 'monte', luogo: 'vetta, monte (superboss)', taglia: 'colossale', forza: 13, ruolo: 'superboss', crea: creaGigante },
  { chiave: 'capra', nome: 'Capra di montagna', zona: 'monte', luogo: 'passo, colline', taglia: 'media', forza: 6, ruolo: 'comune', crea: () => creaCapra('capra') },
  { chiave: 'stambecco', nome: 'Stambecco', zona: 'monte', luogo: 'passo, monte', taglia: 'media', forza: 8, ruolo: 'comune', crea: () => creaCapra('stambecco') },
  { chiave: 'lucertola-roccia', nome: 'Lucertola di roccia', zona: 'monte', luogo: 'passo, vetta, fondo', taglia: 'piccola', forza: 7, ruolo: 'comune', crea: () => creaLucertola('roccia') },
  { chiave: 'lucertola-gelo', nome: 'Lucertola dei ghiacci', zona: 'cava', luogo: 'monte, cava', taglia: 'piccola', forza: 9, ruolo: 'comune', crea: () => creaLucertola('ghiaccio') },
  { chiave: 'grifone', nome: 'Grifone', zona: 'monte', luogo: 'gola, monte', taglia: 'grande', forza: 10, ruolo: 'forte', crea: creaGrifone },
  { chiave: 'aquila', nome: 'Aquila gigante', zona: 'monte', luogo: 'gola, passo', taglia: 'media', forza: 8, ruolo: 'comune', crea: () => creaAquila('reale') },
  { chiave: 'aquila-candida', nome: 'Aquila candida', zona: 'monte', luogo: 'gola, monte', taglia: 'media', forza: 9, ruolo: 'comune', crea: () => creaAquila('candida') },
  { chiave: 'pipistrello-grotta', nome: 'Pipistrello gigante delle grotte', zona: 'cava', luogo: 'passo, gola, fondo, cava', taglia: 'media', forza: 8, ruolo: 'comune', crea: creaPipistrelloGrotta },
  { chiave: 'nano-corrotto', nome: 'Nano corrotto', zona: 'fondo', luogo: 'fondo (miniere di brace), cava, vetta', taglia: 'piccola', forza: 8, ruolo: 'comune', crea: () => creaNano('corrotto') },
  { chiave: 'minatore-morto', nome: 'Minatore non morto', zona: 'fondo', luogo: 'fondo (miniere di brace), cava', taglia: 'media', forza: 9, ruolo: 'comune', crea: creaMinatoreMorto },
  { chiave: 'nano-re', nome: 'Re dei nani corrotti', zona: 'cava', luogo: 'cava (signore del dungeon), fondo', taglia: 'grande', forza: 12, ruolo: 'boss', crea: () => creaNano('re') },
]
