/* ═════ LE FOGNE ═════
   Mattoni bagnati, verde di alghe, acqua ferma. La luce è verde
   perché il fuoco di una fogna, in un gioco, è verde: è una
   convenzione che i bambini conoscono già, e serve a non fare una
   seconda cripta.

   Il mattone ha una macchia dove le alghe l'hanno tinto e una dove
   l'acqua l'ha marcito — due cause diverse, due campi diversi — e
   sotto l'umido, la roccia grezza della fogna vera. Il pavimento
   bagnato torna tre volte, più melmoso al centro, e dove l'acqua ha
   portato via tutto restano le mattonelle nude. */
import { mattoni, roccia, bagnato, mattonelle } from '../materiali/pattern.js'

export const FOGNE = {
  nome: 'Le fogne',

  mura: [
    mattoni('#6a6a52', '#3f4234'),
    mattoni('#63634c', '#3a3d30', { seme: 3, quanto: 0.24 }),
    mattoni('#71715a', '#454838', { seme: 8, quanto: 0.16, dove: 'alghe' }),
    mattoni('#5c5c46', '#33362a', { modo: 'vecchio', dove: 'umido', quanto: 0.15, seme: 5 }),
    roccia('#525243', '#2e3126', { dove: 'umido', quanto: 0.08, sporco: 0.2, seme: 2 }),
  ],

  suolo: [
    bagnato('#4a5a58', '#3a4644'),
    bagnato('#445450', '#34403c', { seme: 4, quanto: 0.26 }),
    bagnato('#4e5e5c', '#3d4a46', { seme: 9, quanto: 0.15, dove: 'melma' }),
    mattonelle('#3e4c48', '#2c3632', { dove: 'melma', quanto: 0.08, seme: 3 }),
  ],

  campi: { alghe: 6, umido: 5, melma: 4 },

  fondo: ['#1b2226', '#12181b'],
  chiazze: ['#48645f', '#0f1416'],
  terra: '#3a4440', sasso: '#6a7570', muschio: '#4a7a5a',
  erbaC: '#5f8a4a', erbaS: '#3f6b3a',
  giunto: '#161c18',
  luce: '#8fe8d0', fiamma: '#3fc7a0', buio: 0.44, torce: true,

  varianti: ['liscio', 'liscio', 'umidiccio', 'licheni', 'usura'],

  /* i ciottoli restano nella melma, ma anche loro si ammucchiano contro
     il muro: la corrente li spinge lì, non al centro del canale */
  dettagli: [['pozze', 1.9, 'melma'], ['muschio', 2.9, 'umido'],
             ['crepe', 4.3, 'rotto'], ['ciottoli', 5, ['melma', 'controMuro']]],
}
