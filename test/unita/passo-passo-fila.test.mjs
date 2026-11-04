/* La fila di Passo passo: spostare una carta, che scatola è sotto il cursore,
   che gesto fa il dito e dove cade. Vedi docs/passo-passo/zaino.md. */
import { spostaCarta } from '../../src/giochi/passo-passo/motore/fila.js'
import { gestoDelDito, postoSotto, scatolaDi, TENUTO_MS } from '../../src/giochi/passo-passo/viste/trascina.js'
import { albero, carteDi, programma, ripeti, se } from '../../src/giochi/passo-passo/dati/carte.js'
import { FIGURE, scritta } from '../../src/giochi/passo-passo/viste/figure.js'
import { CHIAVI_VERSI } from '../../src/giochi/passo-passo/dati/mondo.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ spostare ══════════ */
{
  const F = programma('destra', ripeti(3, 'giu'), 'su')      // 0 destra, 1 ripeti, 2 giu, 3 fine, 4 su
  let r = spostaCarta(F, 4, 3)
  stessaLista('una freccia entra nella scatola, in fondo', r.fila, programma('destra', ripeti(3, 'giu', 'su')))
  uguale('e il cursore le sta subito dopo, dentro', r.cursore, 4)
  r = spostaCarta(F, 2, 5)
  stessaLista('e ne esce', r.fila, programma('destra', ripeti(3), 'su', 'giu'))
  r = spostaCarta(F, 0, 2)
  stessaLista('entra anche in cima', r.fila, programma(ripeti(3, 'destra', 'giu'), 'su'))
  r = spostaCarta(F, 1, 5)
  stessaLista('una scatola si porta dietro quello che ha dentro', r.fila, programma('destra', 'su', ripeti(3, 'giu')))
  uguale('il cursore finisce dopo la scatola', r.cursore, 5)
  r = spostaCarta(F, 1, 0)
  stessaLista('anche all\'indietro', r.fila, programma(ripeti(3, 'giu'), 'destra', 'su'))
  r = spostaCarta(F, 1, 3)
  stessaLista('dentro sé stessa non si posa', r.fila, F)
  stessaLista('lasciata dov\'era non cambia niente', spostaCarta(F, 0, 1).fila, F)
  stessaLista('una chiusura non si prende', spostaCarta(F, 3, 0).fila, F)
  controlla('la fila di partenza resta com\'è', F.length === 5)
  uguale('spostare non cambia quante carte ci sono', carteDi(spostaCarta(F, 4, 2).fila), carteDi(F))

  const A = programma(ripeti('casa', se('destra', 'destra'), se('giu', 'giu')))
  r = spostaCarta(A, 1, 7)
  stessaLista('una scatola in un\'altra scatola cambia di posto',
              r.fila, programma(ripeti('casa', se('giu', 'giu'), se('destra', 'destra'))))
}

/* ══════════ la scatola sotto il cursore ══════════ */
{
  const nodi = albero(programma('destra', ripeti(2, 'su', se('rosso', 'giu')), 'su'))
  // 0 destra, 1 ripeti, 2 su, 3 se, 4 giu, 5 fine, 6 fine, 7 su
  uguale('prima della scatola si è fuori', scatolaDi(nodi, 1), null)
  uguale('in cima al corpo si è dentro', scatolaDi(nodi, 2), 1)
  uguale('dentro due scatole conta quella più interna', scatolaDi(nodi, 4), 3)
  uguale('in fondo alla scatola interna è ancora lei', scatolaDi(nodi, 5), 3)
  uguale('in fondo a quella esterna, lei', scatolaDi(nodi, 6), 1)
  uguale('dopo la scatola si è fuori', scatolaDi(nodi, 7), null)
}

/* ══════════ il gesto ══════════ */
{
  uguale('sotto la soglia del dito è un tocco', gestoDelDito({ dx: 10, dy: 10 }), 'fermo')
  uguale('di lato si trascina', gestoDelDito({ dx: 30, dy: 5 }), 'trascina')
  uguale('su e giù si scorre', gestoDelDito({ dx: 5, dy: 30 }), 'scorri')
  uguale('ma se la fila non scorre si trascina', gestoDelDito({ dx: 5, dy: 30, puoScorrere: false }), 'trascina')
  uguale('e anche dopo un attimo fermo', gestoDelDito({ dx: 5, dy: 30, ms: TENUTO_MS }), 'trascina')
  uguale('il mouse trascina subito', gestoDelDito({ dx: 0, dy: 8, mouse: true }), 'trascina')
}

/* ══════════ dove cade ══════════ */
{
  const scatola = { left: 0, right: 300, top: 0, bottom: 100 }
  const punti = [{ p: 0, x: 10, y: 20 }, { p: 1, x: 50, y: 20 }, { p: 2, x: 90, y: 20 }, { p: 3, x: 10, y: 70 }]
  uguale('cade sul posto più vicino', postoSotto(55, 22, scatola, punti, 9, 9), 1)
  uguale('una riga sotto conta più di una carta accanto', postoSotto(52, 60, scatola, punti, 9, 9), 3)
  uguale('dentro la carta presa non cade', postoSotto(45, 20, scatola, punti, 0, 1), 0)
  uguale('fuori dalla fila torna indietro', postoSotto(50, 300, scatola, punti, 9, 9), null)
}

/* ══════════ figure e lettere ══════════ */
{
  for (const [nome, f] of Object.entries(FIGURE)) {
    controlla(`${nome}: le righe sono tutte larghe uguali`, new Set(f.righe.map(r => r.length)).size === 1)
  }
  for (const m of [...CHIAVI_VERSI, ...CHIAVI_VERSI.map(v => 'salto-' + v), 'rosso', 'blu', 'giallo', 'casa']) {
    controlla(`c'è il disegno di ${m}`, !!FIGURE[m])
  }
  for (const t of ['ripeti', 'se', 'fino a', 'Se…', 'Ripeti…', 'Se di là si passa…', 'N', '3/5', 1234567890]) {
    controlla(`«${t}» si scrive`, scritta(t).d.length > 0)
  }
  for (const t of ['volte', 'fino a', 'se']) controlla(`«${t}» si scrive in piccolo`, scritta(t, true).d.length > 0)
  uguale('una freccia ruota sullo stesso disegno', FIGURE.su.righe.length, FIGURE.destra.righe.length)
}

riassunto('passo passo, la fila')
