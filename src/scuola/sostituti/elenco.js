// Originale → sostituto (percorsi dalla radice del repo): lo leggono vite.scuola.config.js e i test. docs/scuola/architettura.md
// I sostituti di un gioco e le sue cartelle ammesse stanno nella sua cartella (docs/scuola/giochi.md)
import asteroidi from '../giochi/asteroidi/sostituti.js'
import survivors from '../giochi/survivors/sostituti.js'
import passoPasso from '../giochi/passo-passo/sostituti.js'
import robot from '../giochi/robot/sostituti.js'
import inglese from '../giochi/inglese/sostituti.js'
import pozioni from '../giochi/pozioni/sostituti.js'
import cucina from '../giochi/cucina/sostituti.js'
import castello from '../giochi/castello/sostituti.js'
import sotterraneo from '../giochi/sotterraneo/sostituti.js'
import insieme from '../giochi/insieme.js'

const GIOCHI = [asteroidi, survivors, passoPasso, robot, inglese, pozioni, cucina, castello, sotterraneo]

const COMUNI = {
  'src/store/giudizi.js': 'src/scuola/sostituti/giudizi.js',
  'src/store/salto.js': 'src/scuola/sostituti/salto.js',
  'src/quiz/memoria.js': 'src/scuola/sostituti/memoria.js',
  'src/components/Giudizio.vue': 'src/scuola/sostituti/Giudizio.vue',
  'src/quiz/nucleo/registro.js': 'src/scuola/sostituti/registro.js',
  // i giochi veri (docs/scuola/architettura.md): l'archivio in memoria, e una barra e una pausa da cui non si esce
  'src/store/storage.js': 'src/scuola/sostituti/storage.js',
  'src/components/Barra.vue': 'src/scuola/sostituti/Barra.vue',
  'src/giochi/VeloPausa.vue': 'src/scuola/sostituti/VeloPausa.vue',
  // e il peso: quello che il profilo e gli Asteroidi tirano dentro per la home, le mappe, gli amici e i traguardi
  'src/store/progressi.js': 'src/scuola/sostituti/progressi.js',
  'src/giochi/indice.js': 'src/scuola/sostituti/indice.js',
  'src/data/portata-giochi.js': 'src/scuola/sostituti/portata-giochi.js',
  'src/guide/novita-bambini.js': 'src/scuola/sostituti/novita-bambini.js',
  'src/amici/servizio.js': 'src/scuola/sostituti/amici-servizio.js',
  'src/amici/usaAmici.js': 'src/scuola/sostituti/usaAmici.js',
}

export const SOSTITUTI = Object.assign({}, COMUNI, insieme, ...GIOCHI.map(g => g.sostituti))
// i pezzi dei giochi di casa che possono entrare nel pacchetto dei bambini (la guardia vieta gli altri)
export const AMMESSI = GIOCHI.flatMap(g => g.ammessi)
