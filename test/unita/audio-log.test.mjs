/* Il registro dell'audio: la parte che si prova senza browser è come si
   scrivono i fatti recenti e la copia per i grandi. */
import { nota, fattiRecenti, righeRecenti } from '../../src/audio-log.js'
import { uguale, riassunto } from '../aiuto/verifica.mjs'

for (let i = 0; i < 40; i++) nota('pronuncia', 'en:parola' + i)
uguale('in memoria restano solo gli ultimi', fattiRecenti().length, 24)
uguale('e sono i più recenti', fattiRecenti().at(-1).testo, 'en:parola39')

const righe = righeRecenti(10_000, [{ t: 4_000, cosa: 'guasto', testo: 'contesto non attivo (suspended)' }])
uguale('un fatto si legge con i secondi passati', righe[0], '6 s fa · guasto · contesto non attivo (suspended)')

riassunto('il registro dell\'audio')
