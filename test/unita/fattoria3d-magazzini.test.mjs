/* I magazzini della fattoria 3D come edifici, senza browser: il primo silo del raccolto si mette da solo accanto a casa, gli altri arrivano al
   livello del loro silo nel magazzino dei pezzi (col «!» su Costruisci) e li mette il bambino; crescono a ogni ingrandimento fino a un massimo,
   poi se ne compra un altro (al prezzo del passo dopo), fino a tre; non si mettono via, non si comprano dal menu; una fattoria di prima ritrova
   i suoi ingrandimenti con gli edifici che servono; la fattoria di un vicino non ne ha.
   Docs: docs/fattoria3d/magazzini.md.
   `node test/esegui.mjs fattoria3d-magazzini`
   tempo: 1 */
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { SILOS, TIPI_DI_SILO, PASSI_PER_EDIFICIO, EDIFICI_PER_SILO, prezzoDelPasso, postiPerMerce, tagliaDelEdificio, edificiPerPassi, guastiDeiSilos } from '../../src/giochi/fattoria3d/dati/silos.js'
import { sogliaDi } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { carteDi } from '../../src/giochi/fattoria3d/dati/carte.js'
import { PEZZI } from '../../src/giochi/fattoria3d/dati/catalogo.js'
import { statoIniziale } from '../../src/giochi/fattoria3d/motore/stato.js'
import { motoreDiVisita } from '../../src/giochi/fattoria3d/motore/vicini.js'
import { VICINI } from '../../src/giochi/fattoria3d/dati/vicini.js'
import { MOSSE } from '../../src/giochi/fattoria3d/motore/registro.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

function mondo({ liv = 1, stato = null, monete = 100000 } = {}) {
  const b = { monete }
  const st = stato || statoIniziale()
  st.esperienza = Math.max(st.esperienza || 0, sogliaDi(liv))
  const f = new Fattoria3d({ stato: st, borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => 1_000_000, rnd: () => 0.5 })
  return { f, b }
}
const tipi = f => f.s.cose.map(c => c.tipo)

/* ══════════ 1. i dati ══════════ */
uguale('i dati dei silos non hanno guasti', guastiDeiSilos().join(' · '), '')
stessaLista('gli edifici hanno gli id della 2D', TIPI_DI_SILO.map(t => SILOS[t].edificio), ['silo', 'silo_bianco', 'dispensa'])
stessaLista('arrivano ai livelli della 2D', TIPI_DI_SILO.map(t => SILOS[t].liv), [1, 4, 16])
stessaLista('il primo edificio cresce da 0 al massimo, il secondo nasce col suo primo passo', [tagliaDelEdificio(0, 0), tagliaDelEdificio(PASSI_PER_EDIFICIO, 0), tagliaDelEdificio(PASSI_PER_EDIFICIO + 1, 1), tagliaDelEdificio(PASSI_PER_EDIFICIO + 1, 0)], [0, PASSI_PER_EDIFICIO, 1, PASSI_PER_EDIFICIO])
stessaLista('quanti edifici servono', [0, 6, 7, 12, 13].map(edificiPerPassi), [1, 1, 2, 2, 3])

/* ══════════ 2. arrivano da soli ══════════ */
{
  const { f } = mondo()
  stessaLista('una fattoria nuova ha il campo e il silo del raccolto', tipi(f).sort(), ['campo', 'silo'])
  const silo = f.edificiDelSilo('terra')[0]
  controlla('il silo sta nel terreno, vicino a casa', Math.abs(silo.i) < 12 && silo.j < 0, `${silo.i},${silo.j}`)
  uguale('appena nato è piccolo', f.tagliaDi(silo), 0)
  controlla('arrivare da soli non conta come pezzo messo', !f.prendiEventi().some(e => e.tipo === 'pezzo'))
  f.s.esperienza = sogliaDi(4); f.tick()
  controlla('al livello 4 arriva il silo della stalla, da mettere: non in mappa, nel magazzino dei pezzi', !tipi(f).includes('silo_bianco') && f.nelMagazzino('silo_bianco') === 1)
  controlla('e il tasto Costruisci ha il «!»', f.edificiDaCostruire().includes('silo_bianco'))
  const menuF = () => carteDi('edifici', { livello: f.livello(), prezzoPezzo: t => f.prezzoPezzo(t), nelMagazzino: t => f.nelMagazzino(t), posseduti: f.s.posseduti, stagione: null })
  controlla('nel menu la sua carta dice 📦 ×1 e ha il «!»', menuF().some(c => c.id === 'silo_bianco' && c.etichetta === '📦 ×1' && c.segnala))
  controlla('il bambino lo mette dove vuole', f.mettiPezzo('silo_bianco', ...(p => [p.i, p.j])(f._postoVicino('silo_bianco', 0, 3))).ok && f.edificiDelSilo('stalla').length === 1)
  f.s.esperienza = sogliaDi(16); f.tick()
  controlla('al 16 la dispensa, da mettere anche lei', f.nelMagazzino('dispensa') === 1)
  controlla('uno per silo, non di più', TIPI_DI_SILO.every(t => f.quantiMagazzini(t) === 1))
}

/* ══════════ 3. crescono, poi se ne costruisce un altro ══════════ */
{
  const { f, b } = mondo()
  const silo = f.edificiDelSilo('terra')[0]
  for (let n = 0; n < PASSI_PER_EDIFICIO; n++) {
    const prima = b.monete, prezzo = f.prezzoIngrandimento('terra'), r = f.ingrandisciSilo('terra')
    controlla(`l'ingrandimento ${n + 1} si paga col prezzo della 2D`, r.ok && b.monete === prima - prezzo && prezzo === prezzoDelPasso(n))
  }
  uguale('dopo sei passi il silo è grande al massimo', f.tagliaDi(silo), PASSI_PER_EDIFICIO)
  uguale('e ogni scomparto tiene 20', f.capienzaDi('grano'), postiPerMerce(PASSI_PER_EDIFICIO))
  uguale('il foglio propone un altro silo', f.passoDelSilo('terra'), 'nuovo')
  uguale('ingrandire ancora non si può', f.ingrandisciSilo('terra').motivo, 'silo-al-massimo')
  const prima = b.monete, prezzo = f.prezzoIngrandimento('terra'), r = f.costruisciMagazzino('terra')
  controlla('il secondo si compra al prezzo del passo dopo', r.ok && b.monete === prima - prezzo && prezzo === prezzoDelPasso(PASSI_PER_EDIFICIO))
  controlla('e va nel magazzino dei pezzi, da mettere', r.tipo === 'silo' && f.nelMagazzino('silo') === 1 && f.edificiDelSilo('terra').length === 1)
  const p2 = f._postoVicino('silo', silo.i, silo.j)
  f.mettiPezzo('silo', p2.i, p2.j)
  const secondo = f.edificiDelSilo('terra')[1]
  stessaLista('il secondo nasce col suo primo passo, il primo resta al massimo', [f.tagliaDi(secondo), f.tagliaDi(silo)], [1, PASSI_PER_EDIFICIO])
  uguale('ogni scomparto tiene 2 in più', f.capienzaDi('grano'), postiPerMerce(PASSI_PER_EDIFICIO + 1))
  uguale('e adesso si ingrandisce di nuovo', f.passoDelSilo('terra'), 'ingrandisci')
  uguale('un secondo quando non serve no', f.costruisciMagazzino('terra').motivo, 'non-serve')
  while (f.passoDelSilo('terra') !== 'basta') {
    if (f.passoDelSilo('terra') === 'nuovo') { if (!f.costruisciMagazzino('terra').ok) break; const q = f._postoVicino('silo', silo.i, silo.j); f.mettiPezzo('silo', q.i, q.j) }
    else if (!f.ingrandisciSilo('terra').ok) break
  }
  stessaLista('fino a tre edifici e diciotto passi', [f.edificiDelSilo('terra').length, f.livelloDelSilo('terra')], [EDIFICI_PER_SILO, EDIFICI_PER_SILO * PASSI_PER_EDIFICIO])
  uguale('poi basta', f.ingrandisciSilo('terra').motivo, 'silo-al-massimo')
  uguale('un magazzino non si mette via', f.mettiVia(silo.id).motivo, 'magazzino')
  const sp = f.spostaPezzo(silo.id, silo.i, silo.j + 0)
  controlla('ma si sposta come ogni pezzo', sp.ok)
}

/* ══════════ 4. una fattoria di prima ══════════ */
{
  const st = statoIniziale(); st.silo = { terra: 8, stalla: 0, bottega: 0 }
  const { f } = mondo({ stato: st })
  stessaLista('otto ingrandimenti di prima: un silo in mappa e uno da mettere', [f.edificiDelSilo('terra').length, f.nelMagazzino('silo')], [1, 1])
  const q = f._postoVicino('silo', 0, 3); f.mettiPezzo('silo', q.i, q.j)
  stessaLista('messo, i due sono grandi 6 e 2', f.edificiDelSilo('terra').map(c => f.tagliaDi(c)), [6, 2])
  uguale('la capienza non cambia', f.capienzaDi('grano'), postiPerMerce(8))
}

/* ══════════ 5. il menu, le visite, la fattoria in comune ══════════ */
{
  const menu = (magazzino = {}) => carteDi('edifici', { livello: 99, prezzoPezzo: t => PEZZI[t].prezzo, nelMagazzino: t => magazzino[t] || 0, posseduti: {}, stagione: null })
  controlla('un magazzino non si compra dal menu', !menu().some(c => ['silo', 'silo_bianco', 'dispensa'].includes(c.id)))
  controlla('ma se ne resta uno da mettere la carta c\'è', menu({ silo: 1 }).some(c => c.id === 'silo'))
  controlla('la fattoria di un vicino non si mette silos da sola', VICINI.every(v => !motoreDiVisita(v).s.cose.some(c => ['silo', 'silo_bianco', 'dispensa'].includes(c.tipo))))
  controlla('costruire un magazzino è una mossa della fattoria in comune', MOSSE.includes('costruisciMagazzino') && MOSSE.includes('ingrandisciSilo'))
}

riassunto('Fattoria 3D — i magazzini')
