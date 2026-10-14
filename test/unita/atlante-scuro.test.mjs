/* `scuro` di un pezzo (src/grafica/atlante.js, docs/core/grafica.md «Un oggetto non è trasparente»): la luce che manca
   non rende il pezzo trasparente (si vedrebbe il pavimento attraverso) ma lo scurisce, con la sua sagoma nera sopra a
   trasparenza 1 − alfa; la sagoma si fa una volta sola per nome. Una tela finta registra le chiamate: niente browser. */
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

let sagomeFatte = 0
const tela = () => {
  const g = { fillStyle: '', globalCompositeOperation: 'source-over', drawImage() {}, fillRect() {}, getContext: null }
  return { width: 0, height: 0, getContext: () => g }
}
globalThis.document = { createElement: () => { sagomeFatte++; return tela() } }
globalThis.Image = class { set src(_) { setTimeout(() => this.onload && this.onload(), 0) } }

const { creaFoglio, neraDi } = await import('../../src/grafica/atlante.js')

const finto = () => {
  const chiamate = []
  const ctx = {
    globalAlpha: 1, imageSmoothingEnabled: false,
    drawImage(sorgente, ...resto) { chiamate.push({ sorgente, alfa: this.globalAlpha, resto }) },
    save() {}, restore() {}, translate() {}, scale() {},
  }
  return { ctx, chiamate }
}

const foglio = creaFoglio({ pezzi: { leggio: [0, 0, 16, 24], clessidra: [16, 0, 16, 16] }, immagine: 'x', tessera: 16 })
await foglio.carica()

nota('un pezzo scuro resta opaco')
{
  const { ctx, chiamate } = finto()
  foglio.pezzo(ctx, 'leggio', 0, 0, { alfa: 0.4, scuro: true })
  uguale('il pezzo e la sua sagoma: due disegni', chiamate.length, 2)
  uguale('il pezzo pieno è disegnato opaco', chiamate[0].alfa, 1)
  controlla('la sagoma nera è il resto della luce', Math.abs(chiamate[1].alfa - 0.6) < 1e-9, `alfa ${chiamate[1].alfa}`)
  controlla('la sagoma non è l\'atlante', chiamate[1].sorgente !== chiamate[0].sorgente)
  uguale('dopo, la trasparenza torna com\'era', ctx.globalAlpha, 1)
}

nota('senza `scuro` alfa è la trasparenza di sempre (il pavimento, i muri)')
{
  const { ctx, chiamate } = finto()
  foglio.pezzo(ctx, 'leggio', 0, 0, { alfa: 0.4 })
  uguale('un disegno solo', chiamate.length, 1)
  uguale('con la sua trasparenza', chiamate[0].alfa, 0.4)
}

nota('a luce piena niente sagoma')
{
  const { ctx, chiamate } = finto()
  foglio.pezzo(ctx, 'leggio', 0, 0, { alfa: 1, scuro: true })
  uguale('un disegno solo', chiamate.length, 1)
}

nota('la sagoma si fa una volta per nome')
{
  const { ctx } = finto()
  foglio.pezzo(ctx, 'clessidra', 0, 0, { alfa: 0.5, scuro: true })
  const prima = sagomeFatte
  for (let i = 0; i < 50; i++) foglio.pezzo(ctx, 'clessidra', 0, 0, { alfa: 0.5, scuro: true })
  uguale('cinquanta fotogrammi, nessuna sagoma nuova', sagomeFatte, prima)
  const specchiato = finto()
  foglio.pezzo(specchiato.ctx, 'clessidra', 0, 0, { alfa: 0.5, scuro: true, specchia: true })
  uguale('specchiato usa la stessa sagoma', sagomeFatte, prima)
}

nota('un ritaglio scuro, e la sagoma di una tela')
{
  const { ctx, chiamate } = finto()
  foglio.ritaglio(ctx, 'leggio', 0, 8, 16, 16, 0, 0, { alfa: 0.3, scuro: true })
  uguale('il ritaglio e la sua sagoma', chiamate.length, 2)
  uguale('il ritaglio è opaco', chiamate[0].alfa, 1)
  const c = tela()
  controlla('la sagoma di una tela è sempre la stessa', neraDi(c) === neraDi(c))
}

riassunto('un pezzo scuro resta opaco')
