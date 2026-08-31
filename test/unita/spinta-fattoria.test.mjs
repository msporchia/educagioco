/* ═══════════════════════════════════════════════════════════════════
   LA SPINTA AL BORDO — trascinare una cosa oltre quello che si vede

   Nella fattoria si tiene premuta una panchina e la si trascina; al
   bordo dello schermo il gesto finiva lì, e per portarla di là bisognava
   posarla, scorrere la vista, riprenderla. Adesso il mondo scorre da sé
   verso il lato che il dito sta toccando — e questo file prova
   l'aritmetica di quel «da sé», che è tutto quello che si può sbagliare
   in silenzio: il verso, la rampa, e soprattutto il muro.

   Le cose che devono restare vere:

     1. in mezzo allo schermo non si muove niente — se questo si rompe,
        la vista parte da sola mentre si sceglie dove posare;
     2. i quattro lati spingono nel verso giusto, e più ci si avvicina
        più corre;
     3. **dove il mondo finisce, la spinta è zero**: non un numero che
        qualcun altro rimetterà a posto, se no la vista vibra contro il
        muro e la cosa in mano balla;
     4. la frazione di pixel non si butta, se no metà della fascia è una
        zona morta: il dito è dentro, il conto esce giusto, e a schermo
        non succede niente.

   `node test/esegui.mjs spinta --niente-build`
   ═══════════════════════════════════════════════════════════════════ */
import { spintaAlBordo, spazioAttorno, conIlResto, fasciaPer,
         FASCIA_MIN, FASCIA_MAX, VELOCITA_MIN, VELOCITA_MAX }
  from '../../src/giochi/fattoria/scena/spinta.js'
import { controlla, uguale, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* Un telefono in verticale, e un mondo abbondantemente più grande dello
   schermo in tutte e due le direzioni: la fattoria alla scala 2 fa 576
   px di lato con le nove piazzole di partenza, e cresce comprando. */
const L = 360, A = 620
const MONDO = { x: -600, y: -600, w: 1800, h: 1800 }
const meta = { x: -600 + (1800 - L) / 2, y: -600 + (1800 - A) / 2 }
const dt = 1 / 60
const F = fasciaPer(L, A)

const spingi = (x, y, vista = meta) =>
  spintaAlBordo({ punto: { x, y }, L, A, vista, mondo: MONDO, dt })

/* ══════════ 1. la fascia, e il centro che non si muove ══════════ */
{
  dentro('la fascia sta fra il bersaglio minimo e il tetto', F, FASCIA_MIN, FASCIA_MAX)
  uguale('su un telefono stretto è un sesto del lato corto', F, Math.min(L, A) / 6)
  uguale('su uno schermo minuscolo non scende sotto il polpastrello',
         fasciaPer(120, 200), FASCIA_MIN)
  uguale('su un tablet non si mangia mezzo schermo', fasciaPer(1400, 1000), FASCIA_MAX)
  /* Due fasce non si toccano mai: se si toccassero, il centro dello
     schermo sarebbe dentro tutte e due. */
  controlla('le due fasce lasciano libero il mezzo', 2 * F < Math.min(L, A))

  const fermo = spingi(L / 2, A / 2)
  uguale('in mezzo allo schermo non si scorre in orizzontale', fermo.dx, 0)
  uguale('e nemmeno in verticale', fermo.dy, 0)

  const dentroDiUnPelo = spingi(F + 1, A / 2)
  uguale('appena fuori dalla fascia non succede ancora niente', dentroDiUnPelo.dx, 0)
}

/* ══════════ 2. i quattro lati, e il verso giusto ══════════
   `vista` è l'angolo in alto a sinistra del mondo: farla crescere vuol
   dire guardare più a destra, cioè far scorrere il mondo verso sinistra
   sotto il dito. Un segno girato qui è un gioco che scappa nel verso
   opposto a dove si sta andando. */
{
  const sinistra = spingi(4, A / 2)
  const destra = spingi(L - 4, A / 2)
  const su = spingi(L / 2, 4)
  const giu = spingi(L / 2, A - 4)

  controlla('il dito a sinistra riporta la vista indietro', sinistra.dx < 0)
  controlla('il dito a destra la porta avanti', destra.dx > 0)
  controlla('in alto si sale', su.dy < 0)
  controlla('in basso si scende', giu.dy > 0)
  uguale('e chi spinge in orizzontale non muove la verticale', sinistra.dy, 0)
  uguale('né viceversa', su.dx, 0)

  /* Tutti e quattro i lati corrono uguale: uno schermo dove il bordo
     destro scorre il doppio del sinistro si sente subito. */
  uguale('destra e sinistra corrono uguale', Math.abs(destra.dx), Math.abs(sinistra.dx))
  uguale('sopra e sotto pure', Math.abs(su.dy), Math.abs(giu.dy))

  const angolo = spingi(3, 3)
  controlla('in un angolo si va in diagonale', angolo.dx < 0 && angolo.dy < 0)
}

/* ══════════ 3. la rampa: più ci si avvicina, più corre ══════════ */
{
  let prima = 0
  let cresce = true
  for (let x = F; x >= 0; x -= 2) {
    const v = Math.abs(spingi(x, A / 2).dx)
    if (v < prima) cresce = false
    prima = v
  }
  controlla('la velocità non cala mai avvicinandosi al bordo', cresce)

  const filo = Math.abs(spingi(F - 0.001, A / 2).dx) / dt
  dentro('appena dentro la fascia si muove già', filo, VELOCITA_MIN * 0.9, VELOCITA_MIN * 1.1)
  const bordo = Math.abs(spingi(0, A / 2).dx) / dt
  uguale('e sul bordo va al massimo', Math.round(bordo), VELOCITA_MAX)

  /* Un dito che esce dalla finestra non fa partire un razzo: oltre il
     bordo la corsa resta quella del bordo. */
  const fuori = Math.abs(spingi(-80, A / 2).dx) / dt
  uguale('fuori dallo schermo non si accelera oltre', Math.round(fuori), VELOCITA_MAX)

  /* Metà fascia deve essere docile: si sfiora il bordo per aggiustare
     di mezza cella, non per attraversare la mappa. */
  const meta_ = Math.abs(spingi(F / 2, A / 2).dx) / dt
  controlla('a metà fascia si va piano', meta_ < VELOCITA_MAX / 2)
}

/* ══════════ 4. il muro: dove il mondo finisce ══════════ */
{
  const attaccato = { x: MONDO.x, y: meta.y }        // già tutto a sinistra
  const s = spazioAttorno(attaccato, MONDO, L, A)
  uguale('a sinistra non resta niente', s.sinistra, 0)
  uguale('a destra resta tutto il resto', s.destra, MONDO.w - L)

  const contro = spingi(2, A / 2, attaccato)
  uguale('col dito sul bordo sinistro e il mondo finito, non si scorre', contro.dx, 0)
  const indietro = spingi(L - 2, A / 2, attaccato)
  controlla('ma dall\'altra parte si scorre ancora', indietro.dx > 0)

  /* L'ultimo pezzetto si prende tutto e non uno in più: senza questo
     taglio la vista sbatte oltre e poi `limita()` la rimette indietro —
     cioè un fotogramma di tremolio a ogni fine corsa. */
  const quasi = { x: MONDO.x + MONDO.w - L - 1.5, y: meta.y }
  const ultimo = spingi(L - 2, A / 2, quasi)
  uguale('l\'ultimo pezzo di mondo si prende esatto', ultimo.dx, 1.5)

  /* Un mondo che ci sta tutto nello schermo non scorre: la Tela in quel
     caso lo centra, e una spinta qui vorrebbe dire litigare con lei. */
  const piccolo = { x: 0, y: 0, w: 200, h: 300 }
  const s2 = spazioAttorno({ x: -80, y: -160 }, piccolo, L, A)
  uguale('un mondo che ci sta non ha spazio a sinistra', s2.sinistra, 0)
  uguale('né a destra', s2.destra, 0)
  const fermo = spintaAlBordo({ punto: { x: 2, y: 2 }, L, A,
                               vista: { x: -80, y: -160 }, mondo: piccolo, dt })
  uguale('e infatti non si muove', fermo.dx, 0)
  uguale('in nessuna delle due direzioni', fermo.dy, 0)
}

/* ══════════ 5. la frazione di pixel che non si butta ══════════
   La vista della fattoria è in pixel interi (la pixel art su mezzo
   pixel si sfrangia). Troncando a ogni fotogramma, una spinta da 0,3 px
   non muoverebbe mai niente. */
{
  let resto = { x: 0, y: 0 }, andati = 0
  for (let i = 0; i < 60; i++) {
    const p = conIlResto(resto, 0.3, 0)
    resto = p.resto
    andati += p.dx
  }
  /* Non esattamente 18: 0,3 in binario non esiste, e sessanta somme
     lasciano indietro un millesimo. Il punto è che non se ne perda
     **quasi** nessuno, non che il conto sia esatto al pixel. */
  dentro('sessanta spinte da 0,3 px fanno una diciottina di pixel', andati, 17, 18)
  controlla('e il resto resta sotto il pixel', Math.abs(resto.x) < 1)

  const negativo = conIlResto({ x: -0.9, y: 0 }, -0.9, 0)
  uguale('anche all\'indietro il passo è intero', negativo.dx, -1)
  dentro('e il resto è quello che avanza', negativo.resto.x, -0.81, -0.79)

  /* Il giro vero: un secondo col dito appoggiato al filo interno della
     fascia — la spinta più docile che esista — deve muovere la vista di
     qualcosa che si vede. */
  let vista = { ...meta }, r = { x: 0, y: 0 }
  for (let i = 0; i < 60; i++) {
    const s = spingi(F - 0.5, A / 2, vista)
    const p = conIlResto(r, s.dx, s.dy)
    r = p.resto
    vista = { x: vista.x + p.dx, y: vista.y + p.dy }
  }
  const fatti = meta.x - vista.x
  dentro('un secondo alla velocità più docile muove quasi 90 px',
         fatti, VELOCITA_MIN * 0.9, VELOCITA_MIN)
  nota(`fascia ${Math.round(F)} px su ${L}×${A}, ` +
       `da ${VELOCITA_MIN} a ${VELOCITA_MAX} px/s`)
}

/* ══════════ 6. il muro non si passa nemmeno a lungo andare ══════════
   Sessanta fotogrammi col dito incollato al bordo destro: la vista deve
   fermarsi esattamente dove il mondo finisce e restarci, senza
   oltrepassare di un pixel e senza tornare indietro. */
{
  let vista = { ...meta }, r = { x: 0, y: 0 }
  const limite = MONDO.x + MONDO.w - L
  let sforato = false
  for (let i = 0; i < 300; i++) {
    const s = spingi(L - 1, A / 2, vista)
    const p = conIlResto(r, s.dx, s.dy)
    r = p.resto
    vista = { x: vista.x + p.dx, y: vista.y + p.dy }
    if (vista.x > limite) sforato = true
  }
  controlla('la vista non passa mai il bordo del mondo', !sforato)
  uguale('e alla fine ci si posa sopra', vista.x, limite)
  uguale('restandoci ferma', spingi(L - 1, A / 2, vista).dx, 0)
}

riassunto('la spinta al bordo della fattoria')
