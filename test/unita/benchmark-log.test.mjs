/* Il log della misura del telefono: il testo si compone, la lettura nomina il colpevole e la riga DATI si rilegge. */
import { componi, lettura } from '../../src/grafica/benchmark/log.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const r = (id, famiglia, ms, extra = {}) => ({ id, famiglia, nome: id, ms, p95: ms * 1.3, fps: Math.round(Math.min(60, 1000 / ms)), mpx: 1, n: 50, ...extra })
const lento = { info: { gpu: 'Adreno (TM) 512', maxTex: 4096, mezzaPrecisione: true, versione: 'WebGL 2' }, js: 640, schermo: '393x851', dpr: 2.75, risultati: [
  r('vuoto', 'base', 2), r('pieno-1', 'riempimento', 5), r('pieno-nativo', 'riempimento', 31, { mpx: 2.5 }),
  r('scoppi-150', 'esplosioni', 9), r('scoppi-500', 'esplosioni', 30), r('post-diretto', 'passaggio-finale', 7), r('post-con-passaggio', 'passaggio-finale', 22),
  { id: 'ombre-1024', famiglia: 'ombre', nome: 'ombre', errore: 'non supportato' }] }
const testo = componi(lento, { versione: 'x', ua: 'Mozilla/5.0 (Linux; Android 10; Redmi Note 7) AppleWebKit', cpu: 8, quando: new Date(2026, 9, 19, 11, 40) })
const righe = lettura(lento).join('\n')

controlla('la testa dice modello e GPU', /Redmi Note 7/.test(testo) && /Adreno/.test(testo))
controlla('i colpevoli sono segnati XX', /XX pieno-nativo/.test(testo) && /XX ombre/.test(testo))
controlla('i leggeri sono ok', /ok +vuoto/.test(testo))
controlla('la lettura dice che la CPU è lenta', /CPU: 640.*lenta/.test(righe))
controlla('la lettura nomina i pixel e le esplosioni', /TROPPO/.test(righe) && /Esplosioni: regge fino a scoppi-150/.test(righe))
controlla('il passaggio finale pesa 15 ms', /15\.0 ms in più = pesa/.test(righe))
const dati = JSON.parse(testo.split('DATI ')[1])
uguale('la riga DATI si rilegge', dati.r.length, lento.risultati.length)
controlla('sta nell\'indirizzo di un modulo (sotto i 4000 caratteri)', testo.length < 4000)
riassunto('il log della misura')
