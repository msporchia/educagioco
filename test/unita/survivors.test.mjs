/* Verifica di Survivors, senza browser. Le tre cose che la convenzione
   chiede (`src/giochi/CONVENZIONE.md`): i dati stanno in piedi, il
   calcolo è giusto dove è facile sbagliarsi, e **le nove tappe si vincono
   giocandole davvero** — con un finto giocatore che schiva, non a occhio.

   Qui si misura anche la cosa che rende questo gioco quello che è: che la
   carta si paga con una domanda, che sbagliare non è una punizione, e che
   una tappa non la si perde a scuola.

   `node test/esegui.mjs survivors --niente-build`
   tempo: 420 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import manifesto, { CHIAVE } from '../../src/giochi/survivors/gioco.js'
import { guastiDellAlbo } from '../../src/giochi/albo.js'
import { CFG, soglia, stellePerFerite, guastiDellaTaratura }
  from '../../src/giochi/survivors/dati/taratura.js'
import { MOSTRI, ammessi, guastiDeiMostri }
  from '../../src/giochi/survivors/dati/mostri.js'
import { SCENARI, guastiDegliScenari } from '../../src/giochi/survivors/dati/scenari.js'
import { MAZZO, FASCE, PALLINI, prezzoDomanda, maturita, palliniDelPrezzo,
         scalinoDelPrezzo, guastiDelMazzo }
  from '../../src/giochi/survivors/dati/mazzo.js'
import { CAMPAGNA, SCALINI, LIBERO, QUANTE_TAPPE, guastiDellaCampagna }
  from '../../src/giochi/survivors/dati/campagna.js'
import { Regole, Partita } from '../../src/giochi/survivors/motore/partita.js'
import { gioca, misura, caso } from '../../src/giochi/survivors/motore/banco.js'
import { controlla, uguale, stessaLista, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const campo = { larghezza: 390, altezza: 620 }     // un telefono vero

/* Fa girare una partita fino alla fine senza nessuno che la guardi: le
   offerte si sbrigano rinunciando. Una partita lasciata in pausa non
   avanza di un istante — ed è giusto così, ma qui bloccherebbe il test. */
function finisci(p, giri = 12000) {
  let n = 0
  while (!p.finita && n++ < giri) {
    if (p.inPausa) p.rinuncia()
    else p.avanza(1 / 30)
  }
  return p
}

/* ══════════ 1. i dati stanno in piedi ══════════ */
for (const [che, guasti] of [
  ['la taratura', guastiDellaTaratura()],
  ['i mostri', guastiDeiMostri()],
  ['gli scenari', guastiDegliScenari()],
  ['il mazzo', guastiDelMazzo()],
  ['la campagna', guastiDellaCampagna(CAMPAGNA, SCENARI, MOSTRI)],
  /* il proprio manifesto, non l'elenco globale: questo test non deve
     diventare rosso per come è fatto un altro gioco */
  ["l'albo", guastiDellAlbo([manifesto])],
]) controlla(`${che} non ha guasti`, guasti.length === 0, guasti.join(' · '))

uguale('nove tappe', CAMPAGNA.length, 9)
uguale('tre scalini', SCALINI.length, 3)
uguale('il manifesto dice quante sono', manifesto.tappe, QUANTE_TAPPE)
uguale('la chiave è una sola', manifesto.chiave, CHIAVE)
controlla('il gioco libero non finisce mai da solo', !Number.isFinite(LIBERO.durata))
controlla('la prima tappa è la più corta',
          CAMPAGNA[0].durata === Math.min(...CAMPAGNA.map(t => t.durata)))
controlla("l'ultima tappa è la più lunga",
          CAMPAGNA.at(-1).durata === Math.max(...CAMPAGNA.map(t => t.durata)))
/* Il tetto è quanto un bambino regge senza posare il telefono. Da lì in
   poi la partita non si allunga più per decisione della tappa: si allunga
   perché il bambino ha scelto di restare in campo dopo il traguardo. */
controlla('nessuna tappa dura più di quattro minuti',
          CAMPAGNA.every(t => t.durata <= 240), 'oltre i quattro minuti si posa il telefono')

/* il riassunto in home: deve dire qualcosa in tutti e tre gli stati */
controlla('il riassunto parla del profilo vuoto',
          /tappa 1 di 9/.test(manifesto.riassunto()))
controlla('il riassunto parla del gioco libero',
          /primato 90/.test(manifesto.riassunto({ tappa: 9, libera: true, stelle: {}, cfg: { primato: 90 } })))
controlla('il riassunto conta le stelle',
          /⭐ 5/.test(manifesto.riassunto({ tappa: 2, stelle: { 0: 3, 1: 2 }, cfg: {} })))

/* ══════════ 2. il calcolo dove è facile sbagliarsi ══════════ */
{
  const r = new Regole(CAMPAGNA[0])
  uguale('a metà tappa la quota è mezza', r.quota(CAMPAGNA[0].durata / 2), 0.5)
  uguale('al traguardo la quota è uno', r.quota(CAMPAGNA[0].durata), 1)
  /* ── oltre il traguardo non c'è nessun tetto ──
     È la regola che rende il gioco un gioco: si resta in campo finché
     non ti prendono, e prima o poi ti prendono. */
  controlla('oltre il traguardo la quota continua a salire', r.quota(999) > 1)
  controlla('e non si ferma mai', r.quota(9999) > r.quota(999))
  const l = new Regole(LIBERO)
  controlla('nel gioco libero la quota sale', l.quota(240) > l.quota(120))
  controlla('e non ha tetto', l.quota(100000) > l.quota(1000))

  /* ── la marea corre sul tempo vero, uguale per tutte le tappe ──
     Due tappe diverse allo stesso secondo devono avere addosso la stessa
     piena: quello che cambia è fin dove ci si arriva. */
  const corta = new Regole(CAMPAGNA[0]), lunga = new Regole(CAMPAGNA[8])
  uguale('a parità di secondi la marea è la stessa', corta.marea(60), lunga.marea(60))
  controlla('e sale col tempo', corta.marea(120) > corta.marea(60))
  controlla('la tappa lunga arriva più in alto',
            lunga.marea(lunga.durata) > corta.marea(corta.durata))
  /* la piena al traguardo è quella che deve crescere di tappa in tappa */
  const piena = t => new Regole(t).nascite(t.durata)
  controlla('ogni tappa finisce più affollata della precedente',
            CAMPAGNA.every((t, i) => i === 0 || piena(t) > piena(CAMPAGNA[i - 1])),
            CAMPAGNA.map(t => piena(t).toFixed(1)).join(' · '))
}
{
  /* un momento senza mostri è una schermata vuota: al primo istante deve
     esserci sempre qualcuno, anche se la squadra è tutta di ritardatari */
  stessaLista('al tempo zero entra chi non aspetta', ammessi(['melma', 'roccia'], 0), ['melma'])
  stessaLista('a fine tappa ci sono tutti', ammessi(['melma', 'roccia'], 1), ['melma', 'roccia'])
  stessaLista('una squadra di soli ritardatari non lascia il vuoto',
              ammessi(['roccia', 'spettro'], 0), ['spettro'])
  for (const t of CAMPAGNA)
    controlla(`«${t.nome}» ha qualcuno dal primo istante`, ammessi(t.squadra, 0).length > 0)
}
{
  uguale('senza ferite tre stelle', stellePerFerite(0), 3)
  uguale('due ferite due stelle', stellePerFerite(2), 2)
  uguale('tre ferite una stella', stellePerFerite(3), 1)
  controlla('la scaletta dell\'esperienza sale sempre',
            [1, 2, 3, 4, 5, 6, 7, 8, 9].every(l => soglia(l + 1) > soglia(l)))
  /* i primi livelli devono arrivare presto: sono quelli che fanno capire
     che le carte esistono */
  dentro('il primo livello costa poco', soglia(1), 2, 6)
}
{
  /* il prezzo di una carta: la scala non si ribalta mai, nemmeno con il
     rincaro dell'ultima tappa */
  for (const t of [...CAMPAGNA, LIBERO]) {
    const p = FASCE.map(f => prezzoDomanda(f.chiave, t.rincaro))
    controlla(`«${t.nome}»: il prezzo delle carte resta una scala`,
              p[0] < p[1] && p[1] < p[2], p.join(' < '))
    controlla(`«${t.nome}»: il prezzo sta fra 0 e 1`, p.every(x => x >= 0 && x <= 1))
  }
  controlla('il rincaro alza davvero il prezzo',
            prezzoDomanda('media', 0.15) > prezzoDomanda('media', 0))
}
{
  /* ── il prezzo cresce col livello già raggiunto ──
     Prendere «+1 freccia» la prima volta e prenderla la quinta non
     possono costare uguale: una capacità bassa chiede una domanda
     facile, la stessa in alto ne chiede una tosta. */
  uguale('una carta mai presa è a maturità zero', maturita(0, 5), 0)
  uguale('l\'ultima copia possibile è a maturità piena', maturita(4, 5), 1)
  uguale('una carta che si prende una volta sola non matura', maturita(0, 1), 0)

  for (const c of MAZZO) {
    const nuova = prezzoDomanda(c.fascia, 0, 0, c.max)
    const matura = prezzoDomanda(c.fascia, 0, c.max - 1, c.max)
    controlla(`«${c.nome}»: la prima copia costa quanto la sua fascia`,
              nuova === FASCE.find(f => f.chiave === c.fascia).prezzo)
    controlla(`«${c.nome}»: l'ultima copia costa di più`, matura > nuova + 0.04,
              `${nuova.toFixed(2)} → ${matura.toFixed(2)}`)
    /* e non si torna mai indietro, con nessun rincaro della campagna */
    for (const t of [...CAMPAGNA, LIBERO]) {
      const scala = []
      for (let lv = 0; lv < c.max; lv++) scala.push(prezzoDomanda(c.fascia, t.rincaro, lv, c.max))
      controlla(`«${c.nome}» in «${t.nome}»: il prezzo sale copia dopo copia`,
                scala.every((p, i) => i === 0 || p >= scala[i - 1]))
      controlla(`«${c.nome}» in «${t.nome}»: il prezzo resta dentro 0..1`,
                scala.every(p => p >= 0 && p <= 1), scala.map(p => p.toFixed(2)).join(' '))
    }
  }
  /* la promessa che si racconta: una carta media all'ultimo livello
     costa quanto una tosta appena vista */
  controlla('una media matura costa quanto una tosta nuova',
            prezzoDomanda('media', 0, 4, 5) >= prezzoDomanda('forte', 0, 0, 5),
            `${prezzoDomanda('media', 0, 4, 5).toFixed(2)} contro ${FASCE[2].prezzo}`)
  /* le due leve si sommano: il rincaro della tappa non spegne la scala
     del livello, e la scala del livello non spegne il rincaro */
  controlla('rincaro e livello si sommano',
            prezzoDomanda('debole', 0.15, 3, 4) > prezzoDomanda('debole', 0.15, 0, 4) &&
            prezzoDomanda('debole', 0.15, 3, 4) > prezzoDomanda('debole', 0, 3, 4))

  /* ── e si vede a schermo ──
     I pallini e la parola sulla carta raccontano il prezzo di adesso,
     non quello della fascia: se dicessero la fascia, la quinta freccia
     sembrerebbe costare quanto la prima e la scelta sarebbe una
     scommessa al buio. */
  uguale('il prezzo più basso accende un pallino solo', palliniDelPrezzo(FASCE[0].prezzo), 1)
  uguale('il prezzo pieno li accende tutti', palliniDelPrezzo(1), PALLINI)
  controlla('più costa più pallini accende',
            [0.15, 0.4, 0.6, 0.8, 1].every((p, i, v) =>
              i === 0 || palliniDelPrezzo(p) >= palliniDelPrezzo(v[i - 1])))
  controlla('i pallini non escono mai dalla fila',
            [0, 0.5, 1, 1.4].every(p => palliniDelPrezzo(p) >= 1 && palliniDelPrezzo(p) <= PALLINI))
  uguale('una carta debole matura si dichiara «media»',
         scalinoDelPrezzo(prezzoDomanda('debole', 0, 8, 9)).nome, 'media')
  uguale('e una debole nuova resta «facile»',
         scalinoDelPrezzo(prezzoDomanda('debole', 0, 0, 9)).nome, 'facile')
}

/* ══════════ 3. l'offerta: tre carte, tre prezzi ══════════ */
{
  const p = new Partita(new Regole(CAMPAGNA[4]), { rnd: caso(3), campo })
  /* si sale di livello a mano, senza dover giocare mezza partita */
  p.xp = p.prossima
  p.avanza(1 / 30)
  const o = p.offerta
  controlla('salendo di livello la partita si ferma', p.inPausa)
  uguale('e propone tre carte', o.length, 3)
  stessaLista('una per fascia, dalla più a buon mercato',
              o.map(c => c.fascia), ['debole', 'media', 'forte'])
  controlla('i prezzi salgono', o[0].prezzo < o[1].prezzo && o[1].prezzo < o[2].prezzo)
  uguale('la più a buon mercato è la prima', o[0].prezzo, Math.min(...o.map(c => c.prezzo)))
  controlla('ogni carta dice a che livello porta', o.every(c => c.livello === 1))
  controlla('e che è nuova', o.every(c => c.nuova))

  /* in pausa il tempo non passa: la scelta si guarda con calma */
  const prima = p.tempo
  p.avanza(1)
  uguale('a offerta aperta il tempo non passa', p.tempo, prima)

  /* una chiave che non esiste non è una schermata bianca: vale la prima */
  const presa = p.prendi('non-esiste')
  uguale('una carta che non c\'è vale la prima dell\'offerta', presa.chiave, o[0].chiave)
  uguale('e il potenziamento è arrivato', p.livelloDi(o[0].chiave), 1)
  controlla('la partita riparte', !p.inPausa)
}
{
  /* ══ chi sbaglia non prende niente ══
     È la regola che rende la domanda un prezzo invece di un pedaggio:
     tirando a caso non ci si potenzia. */
  const p = new Partita(new Regole(CAMPAGNA[4]), { rnd: caso(34), campo })
  p.xp = p.prossima
  p.avanza(1 / 30)
  const o = p.offerta
  controlla('c\'è un\'offerta aperta', o?.length === 3)
  const primaDi = o.map(c => p.livelloDi(c.chiave))
  uguale('rinunciare non consegna niente', p.rinuncia(), null)
  controlla('la partita riparte lo stesso', !p.inPausa)
  stessaLista('e nessuna delle tre carte è arrivata',
              o.map(c => p.livelloDi(c.chiave)), primaDi)
  uguale('nemmeno la più debole', p.livelloDi(o[0].chiave), 0)
}
{
  /* la stessa carta, presa e ripresa, costa sempre di più — ed è la
     carta stessa a dirlo, coi pallini che il bambino conta prima di
     scegliere */
  const c = MAZZO.find(x => x.chiave === 'frecce')
  const p = new Partita(new Regole(CAMPAGNA[0]), { rnd: caso(31), campo })
  const prima = p.vestiCarta(c)
  p.potenziamenti.frecce = c.max - 1
  p.ricalcola()
  const ultima = p.vestiCarta(c)
  controlla('la stessa carta a livello alto costa di più', ultima.prezzo > prima.prezzo,
            `${prima.prezzo.toFixed(2)} → ${ultima.prezzo.toFixed(2)}`)
  controlla('e la carta lo mostra con più pallini', ultima.pallini > prima.pallini,
            `${prima.pallini} → ${ultima.pallini}`)
  controlla('i pallini stanno nella fila che la carta dichiara',
            prima.pallinoTot === PALLINI && ultima.pallini <= ultima.pallinoTot)
  uguale('la prima copia si annuncia nuova', prima.nuova, true)
  uguale("l'ultima dice a che livello porta", ultima.livello, c.max)

  /* una media cresciuta può costare quanto una tosta: allora la carta
     dice «tosta», non «media», perché quello che si legge è il prezzo */
  const media = MAZZO.find(x => x.chiave === 'stivali')
  const q = new Partita(new Regole(CAMPAGNA[0]), { rnd: caso(32), campo })
  q.potenziamenti[media.chiave] = media.max - 1
  const cara = q.vestiCarta(media)
  const tosta = q.vestiCarta(MAZZO.find(x => x.chiave === 'fuoco'))
  /* anche il colore della carta è quello del prezzo: è la prima cosa che
     un bambino guarda, e se dicesse la fascia direbbe il contrario dei
     pallini */
  const mela = MAZZO.find(x => x.chiave === 'mela')
  q.potenziamenti[mela.chiave] = mela.max - 1
  const dolce = q.vestiCarta(mela)
  uguale('una debole cresciuta si tinge come il suo prezzo', dolce.tinta, 'media')
  uguale('e una debole nuova resta verde',
         new Partita(new Regole(CAMPAGNA[0]), { rnd: caso(33), campo }).vestiCarta(mela).tinta,
         'debole')

  uguale('la media matura è una fascia media', cara.fascia, 'media')
  controlla('ma il suo prezzo si dichiara tosto', cara.etichetta === 'tosta',
            `dice «${cara.etichetta}» a ${cara.prezzo.toFixed(2)}`)
  controlla('e costa quanto una tosta nuova', cara.prezzo >= tosta.prezzo)
}
{
  /* le due carte che toccano i cuori sono quelle in cui è facile
     sbagliarsi: una alza il tetto, l'altra riempie e basta */
  const p = new Partita(new Regole(CAMPAGNA[0]), { rnd: caso(5), campo })
  p.eroe.cuori = 1
  p.offerta = [p.vestiCarta(MAZZO.find(c => c.chiave === 'mela'))]
  p.prendi('mela')
  uguale('la mela cura un cuore', p.eroe.cuori, 2)
  uguale('ma non alza il tetto', p.eroe.cuoriMax, 3)
  p.offerta = [p.vestiCarta(MAZZO.find(c => c.chiave === 'cuore'))]
  p.prendi('cuore')
  uguale('il cuore grande alza il tetto', p.eroe.cuoriMax, 4)
  uguale('e riempie tutto', p.eroe.cuori, 4)
  p.offerta = [p.vestiCarta(MAZZO.find(c => c.chiave === 'mela'))]
  p.prendi('mela')
  uguale('la mela non fa traboccare', p.eroe.cuori, 4)
}
{
  /* una carta al massimo sparisce dalle offerte: è lì che il massimo si
     fa rispettare, e senza questo la stessa carta uscirebbe per sempre */
  const c = MAZZO.find(x => x.chiave === 'dardo')
  const p = new Partita(new Regole(CAMPAGNA[0]), { rnd: caso(6), campo })
  p.offerta = [p.vestiCarta(c)]
  uguale('prendere una carta la porta al livello uno', p.prendi('dardo').livello, 1)
  uguale('e il potenziamento vale uno', p.livelloDi('dardo'), 1)

  const pieno = new Partita(new Regole(CAMPAGNA[0]), { rnd: caso(66), campo })
  pieno.potenziamenti.dardo = c.max
  pieno.ricalcola()
  let vista = false
  for (let i = 0; i < 40; i++)
    if ((pieno.offri() || []).some(x => x.chiave === 'dardo')) vista = true
  controlla('una carta al massimo non viene più offerta', !vista)
  /* e finché non lo è, prima o poi esce */
  const scarso = new Partita(new Regole(CAMPAGNA[0]), { rnd: caso(67), campo })
  let uscita = false
  for (let i = 0; i < 60; i++)
    if ((scarso.offri() || []).some(x => x.chiave === 'dardo')) uscita = true
  controlla('una carta libera prima o poi esce', uscita)
}
{
  /* le carte devono servire a qualcosa: prendere «mani veloci» deve far
     tirare più spesso, o il prezzo in domande è una tassa e basta */
  const p = new Partita(new Regole(CAMPAGNA[0]), { rnd: caso(9), campo })
  const cadenza = p.f.cadenza, velocita = p.f.velocita, frecce = p.f.frecce
  p.offerta = [p.vestiCarta(MAZZO.find(c => c.chiave === 'mani'))]; p.prendi('mani')
  p.offerta = [p.vestiCarta(MAZZO.find(c => c.chiave === 'stivali'))]; p.prendi('stivali')
  p.offerta = [p.vestiCarta(MAZZO.find(c => c.chiave === 'frecce'))]; p.prendi('frecce')
  controlla('«mani veloci» accorcia il tempo fra un tiro e l\'altro', p.f.cadenza < cadenza)
  controlla('«stivali leggeri» fa correre di più', p.f.velocita > velocita)
  uguale('«frecce gemelle» aggiunge una freccia', p.f.frecce, frecce + 1)
}

/* ══════════ 4. una partita si comporta ══════════ */
{
  const p = new Partita(new Regole(CAMPAGNA[0]), { rnd: caso(11), campo })
  uguale('si comincia con tre cuori', p.eroe.cuori, 3)
  controlla('e non è finita', !p.finita)
  p.muovi(3, 4)
  uguale('il dito diventa una direzione lunga uno',
         Number(Math.hypot(p.dir.x, p.dir.y).toFixed(6)), 1)
  p.muovi(0, 0)
  uguale('e un dito fermo è fermo', p.dir.x + p.dir.y, 0)

  /* il tempo che scade è una vittoria, non un'interruzione. Le offerte si
     sbrigano prendendo il ripiego: qui si guarda l'orologio, non le carte
     — e una partita che resta in pausa non finisce mai. */
  finisci(p)
  controlla('la tappa finisce da sola', p.finita)
  controlla('chi resiste fino allo scadere ha vinto', p.vinta || p.eroe.cuori <= 0)
}
{
  /* si perde solo con i cuori a zero, e allora niente stelle né monete */
  const p = new Partita(new Regole(CAMPAGNA[0]), { rnd: caso(12), campo })
  p.eroe.cuori = 1
  finisci(p)                                  // fermo: prima o poi lo prendono
  uguale('fermo con un cuore si perde', p.esito, 'persa')
  uguale('perdere non dà stelle', p.stelle, 0)
  uguale('perdere non dà monete', p.monete, 0)
  controlla('ma la partita è durata', p.tempo > 0)
}
{
  /* vincere senza farsi toccare vale tre stelle e il premio pieno */
  const t = CAMPAGNA[0]
  const p = new Partita(new Regole(t), { rnd: caso(13), campo })
  p.tempo = t.durata - 0.01
  p.avanza(1 / 30)
  uguale('allo scadere si vince', p.esito, 'vinta')
  uguale('senza ferite tre stelle', p.stelle, 3)
  uguale('e le monete sono il premio per le stelle', p.monete, t.premio * 3)
}
{
  /* il caso arriva da fuori: due partite con lo stesso seme devono
     raccontare la stessa storia, o un test rosso non si sa se è un guasto
     o sfortuna */
  const uno = gioca(new Regole(CAMPAGNA[3]), { rnd: caso(77), campo, bravura: 0.8 })
  const due = gioca(new Regole(CAMPAGNA[3]), { rnd: caso(77), campo, bravura: 0.8 })
  uguale('stesso seme, stesso tempo', uno.partita.tempo, due.partita.tempo)
  uguale('stesso seme, stessi mostri abbattuti', uno.partita.uccisi, due.partita.uccisi)
  uguale('stesso seme, stesso livello', uno.partita.livello, due.partita.livello)
  const altro = gioca(new Regole(CAMPAGNA[3]), { rnd: caso(78), campo, bravura: 0.8 })
  controlla('semi diversi, partite diverse',
            altro.partita.uccisi !== uno.partita.uccisi || altro.partita.tempo !== uno.partita.tempo)
}

/* ══════════ 5. le nove tappe si vincono davvero ══════════ */
const VOLTE = 24
const bravi = [], bimbi = []
nota('tappa                     sa   sbaglia  schiva   fermo   livello  domande')
nota('                        rispondere  1su3  a sprazzi')
for (const [i, t] of CAMPAGNA.entries()) {
  const r = new Regole(t)
  /* Il giocatore di riferimento non è più «uno che schiva bene»: è **uno
     che risponde**. Da quando la carta si perde sbagliando e i mostri
     hanno vita da vendere, saper schivare non basta a passare le ultime
     tappe — bisogna aver preso le carte che picchiano, e quelle si pagano
     con le domande toste. `esattezza` è la manopola che dice quante ne
     indovina, sempre, e serve a misurare proprio questo. */
  const sa = misura(r, { volte: VOLTE, bravura: 1, esattezza: 0.95, campo, rnd: caso(100 + i) })
  const sbaglia = misura(r, { volte: VOLTE, bravura: 1, esattezza: 0.66, campo, rnd: caso(150 + i) })
  const bimbo = misura(r, { volte: VOLTE, bravura: 0.55, esattezza: 0.7, campo, rnd: caso(200 + i) })
  const fermo = misura(r, { volte: 12, fermo: true, campo, rnd: caso(300 + i) })
  bravi.push(sa.quota); bimbi.push(bimbo.quota)
  nota(`${(i + 1 + '. ' + t.nome).padEnd(24)}` +
       `${(sa.quota * 100).toFixed(0).padStart(4)}%` +
       `${(sbaglia.quota * 100).toFixed(0).padStart(8)}%` +
       `${(bimbo.quota * 100).toFixed(0).padStart(9)}%` +
       `${(fermo.quota * 100).toFixed(0).padStart(8)}%` +
       `${sa.livelloMedio.toFixed(1).padStart(10)}` +
       `${sa.domandeMedie.toFixed(1).padStart(9)}`)

  /* ── quanto deve essere dura ──
     Le soglie sono per scalino: il primo insegna e si vince quasi sempre,
     l'ultimo è una salita che chiede di aver risposto bene. Chi perde non
     perde niente e riprova, e intanto ha fatto i suoi conti: è quello il
     costo di una sconfitta, e non è un costo. */
  const soglieSa = [0.9, 0.9, 0.75, 0.7, 0.7, 0.6, 0.6, 0.55, 0.5]
  const soglieBimbo = [0.8, 0.7, 0.35, 0.25, 0.05, 0.02, 0.02, 0, 0]
  controlla(`tappa ${i + 1} (${t.nome}): chi risponde bene la porta a casa`,
            sa.quota >= soglieSa[i], `ce la fa il ${(sa.quota * 100).toFixed(0)}%`)
  controlla(`tappa ${i + 1} (${t.nome}): chi schiva a sprazzi non resta fuori`,
            bimbo.quota >= soglieBimbo[i], `ce la fa il ${(bimbo.quota * 100).toFixed(0)}%`)
  /* il gioco non si deve giocare da solo: chi non muove il dito perde */
  controlla(`tappa ${i + 1} (${t.nome}): chi sta fermo non la vince`,
            fermo.quota <= (i === 0 ? 0.4 : 0.45),
            `da fermo ce la fa il ${(fermo.quota * 100).toFixed(0)}%`)
  /* le domande sono il prezzo delle carte, e sono anche il motivo per cui
     questo gioco esiste: una tappa lunga ne deve chiedere di più */
  dentro(`tappa ${i + 1} (${t.nome}): quante domande in una partita`,
         Number(sa.domandeMedie.toFixed(1)), 3, 16)
}
{
  const primi = bimbi.slice(0, 3).reduce((a, b) => a + b, 0) / 3
  const ultimi = bimbi.slice(-3).reduce((a, b) => a + b, 0) / 3
  controlla('la campagna diventa più dura andando avanti', ultimi < primi,
            `primo scalino ${(primi * 100).toFixed(0)}%, ultimo ${(ultimi * 100).toFixed(0)}%`)
}

/* ══════════ 5-ter. SBAGLIARE LE DOMANDE SI PAGA ══════════
   È la promessa del gioco, e senza una misura resta una promessa: chi
   risponde bene deve arrivare in fondo, chi tira a indovinare no. Non è
   una punizione che arriva dal gioco — nessun cuore tolto, nessuna ondata
   di castigo — è che il potenziamento mancato non torna e i mostri hanno
   troppa vita per l'arco di partenza.

   Si misura sull'ultima tappa, che è quella dove il margine è zero: nelle
   prime si vince lo stesso, ed è giusto così. */
{
  const r = new Regole(CAMPAGNA.at(-1))
  const TASSI = [1, 0.85, 0.66, 0.5]
  const quote = TASSI.map((e, k) =>
    misura(r, { volte: 30, bravura: 1, esattezza: e, campo, rnd: caso(600 + k) }).quota)
  nota('ultima tappa, per quante domande indovina:  ' +
       TASSI.map((e, k) => `${(e * 100).toFixed(0)}% → ${(quote[k] * 100).toFixed(0)}%`).join('   '))
  controlla('chi risponde a tutto la porta a casa', quote[0] >= 0.6,
            `ce la fa il ${(quote[0] * 100).toFixed(0)}%`)
  controlla('chi ne sbaglia una su tre non ce la fa quasi mai',
            quote[2] <= 0.45, `ce la fa il ${(quote[2] * 100).toFixed(0)}%`)
  controlla('e chi tira a indovinare non la vede nemmeno',
            quote[3] <= 0.25, `ce la fa il ${(quote[3] * 100).toFixed(0)}%`)
  controlla('più si sbaglia meno si vince', quote[0] > quote[2] && quote[2] >= quote[3],
            quote.map(q => (q * 100).toFixed(0) + '%').join(' → '))

  /* e la prima tappa **no**: là si vince anche sbagliando tutto, o un
     bambino che non sa ancora le tabelline non entrerebbe nel gioco */
  const primaSbagliando = misura(new Regole(CAMPAGNA[0]),
    { volte: 20, bravura: 1, esattezza: 0, campo, rnd: caso(650) })
  controlla('la prima tappa si vince anche sbagliando tutte le domande',
            primaSbagliando.quota >= 0.6,
            `ce la fa il ${(primaSbagliando.quota * 100).toFixed(0)}%`)
}

/* ══════════ 5-bis. si può restare in campo, e prima o poi ti prendono ══════════
   È la promessa del gioco: dopo il traguardo la marea non si ferma più.
   Se qui il pilota sopravvivesse per sempre vorrebbe dire che a un certo
   punto la partita si è appiattita, e il punteggio sarebbe soltanto
   quanta pazienza si ha. */
{
  const r = new Regole(CAMPAGNA[0])
  /* si vince, si resta, e la stella non si tocca più */
  const { partita } = gioca(r, { rnd: caso(800), campo, bravura: 1, sapienza: 0.9, oltre: 20 })
  controlla('la tappa resta vinta anche restando in campo', partita.vinta)
  controlla('e il tempo va oltre il traguardo', partita.tempo > r.durata)
  controlla('i secondi regalati si contano', partita.extra > 0)

  /* la marea sale davvero: più tardi si sta, più ne nascono e più sono duri */
  controlla('oltre il traguardo ne nascono di più',
            r.nascite(r.durata + 300) > r.nascite(r.durata))
  controlla('e sono più duri', r.vitaNemico(r.durata + 300) > r.vitaNemico(r.durata))
  controlla('e non smette mai di crescere',
            r.vitaNemico(r.durata + 900) > r.vitaNemico(r.durata + 300))
  /* e la tappa che aveva una bestia sola non resta una tappa con una
     bestia sola: dopo il traguardo entrano tutte */
  controlla('dopo il traguardo arriva anche chi la tappa non aveva',
            r.squadraOra(r.durata + 240).length > r.squadraOra(r.durata).length,
            r.squadraOra(r.durata + 240).join(' '))

  /* nessuno resiste per sempre: dieci minuti di regalo, e ti prendono */
  const fini = []
  for (let i = 0; i < 5; i++)
    fini.push(gioca(r, { rnd: caso(810 + i), campo, bravura: 1, sapienza: 0.9, oltre: 600 }).partita)
  const morti = fini.filter(p => p.esito === 'persa').length
  nota(`restando in campo dopo il traguardo si resiste in media ` +
       `${(fini.reduce((a, p) => a + p.extra, 0) / fini.length).toFixed(0)}s`)
  controlla('restando in campo prima o poi ti prendono', morti >= 4,
            `su 5 partite ne finiscono ${morti}`)

  /* ── e vale anche per chi non sbaglia una domanda ──
     Il controllo qui sopra usa un giocatore che ne sbaglia qualcuna, e
     per anni è bastato: è passato mentre il gioco, per chi rispondeva a
     **tutto**, era diventato impossibile da perdere. Misurato: un quarto
     d'ora in campo, cinque cuori intatti, trecentottanta mostri intorno e
     nemmeno uno che arrivasse a un braccio di distanza — la potenza
     dell'eroe si moltiplica (una freccia in più, poi più svelte, poi più
     grosse: da 2 a 1300 danni al secondo) e nessuna curva che sale in
     linea retta le sta dietro.

     Quindi il giocatore di riferimento di questa prova è il più forte che
     esista: schiva sempre, indovina sempre, e resta in campo venti
     minuti. Deve morire anche lui, e non al primo inciampo — il quarto
     d'ora è il punto in cui un bambino ha già messo giù il telefono. */
  const forti = []
  for (let i = 0; i < 4; i++)
    forti.push(gioca(r, { rnd: caso(880 + i), campo, bravura: 1, esattezza: 1, oltre: 1200 }).partita)
  const extraMedio = forti.reduce((a, p) => a + p.extra, 0) / forti.length
  nota(`chi risponde a tutto e non sbaglia una schivata resiste ${extraMedio.toFixed(0)}s oltre il traguardo`)
  controlla('nemmeno chi risponde a tutto resiste per sempre',
            forti.every(p => p.esito === 'persa'),
            `${forti.filter(p => p.esito === 'persa').length} su 4`)
  dentro('e non lo prendono nemmeno subito', Math.round(extraMedio), 180, 1100)
}

/* ══════════ 7. il gioco libero non finisce da solo ══════════ */
{
  const r = new Regole(LIBERO)
  const { partita } = gioca(r, { rnd: caso(600), campo, bravura: 1, sapienza: 0.8, fino: 45 })
  controlla('a 45 secondi la sopravvivenza è ancora in piedi (o si è persa)',
            partita.esito !== 'vinta')
  const tempi = []
  for (let i = 0; i < 8; i++)
    tempi.push(gioca(r, { rnd: caso(700 + i), campo, bravura: 0.7, sapienza: 0.6, fino: 300 }).partita.tempo)
  const medio = tempi.reduce((a, b) => a + b, 0) / tempi.length
  nota(`sopravvivenza: si resiste in media ${medio.toFixed(0)} secondi`)
  dentro('la sopravvivenza dura quanto una partita vera', medio, 30, 240)
}

/* ══════════ 8. i traguardi scattano ══════════
   Un traguardo che nessuno può prendere non si vede a schermo: si vede
   come un'area sempre a zero. Si controlla con due profili finti — uno
   pieno, uno appena nato — e con i contatori scritti col loro nome vero,
   così rinominarne uno diventa rosso qui. */
{
  const misure = profilo => ({
    tot: k => (profilo.totals || {})[k] || 0,
    best: k => (profilo.best || {})[k] || 0,
    campagna: ch => (profilo.campagne || {})[ch] || {},
    tappeDi: ch => ((profilo.campagne || {})[ch] || {}).tappa || 0,
    stelleDi: ch => Object.values(((profilo.campagne || {})[ch] || {}).stelle || {})
      .reduce((s, n) => s + n, 0),
    finita: ch => (((profilo.campagne || {})[ch] || {}).libera ? 1 : 0),
  })
  const stelleTutte = Object.fromEntries(CAMPAGNA.map((_, i) => [i, 3]))
  const finito = misure({
    totals: { survivorsPartite: 200, survivorsTappe: 9, survivorsMostri: 9000,
              survivorsCarte: 900, survivorsToste: 300 },
    best: { survivorsLivello: 14, survivorsTempo: 400 },
    campagne: { [CHIAVE]: { tappa: 9, libera: true, stelle: stelleTutte, cfg: { primato: 400 } } },
  })
  const vuoto = misure({ totals: {}, best: {}, campagne: {} })

  for (const t of manifesto.albo.traguardi) {
    const massima = t.soglie.at(-1)
    controlla(`«${t.nome}»: con un profilo finito è preso`,
              t.valore(finito) >= massima, `vale ${t.valore(finito)}, serve ${massima}`)
    controlla(`«${t.nome}»: con un profilo nuovo non è preso`,
              t.valore(vuoto) < t.soglie[0], `vale ${t.valore(vuoto)}`)
    controlla(`«${t.nome}»: la descrizione parla`, typeof t.come(t.soglie[0]) === 'string' &&
              t.come(t.soglie[0]).length > 5)
  }
  controlla('l\'esperienza sale con quello che si fa',
            manifesto.albo.xp(finito) > manifesto.albo.xp(vuoto))
  uguale('un profilo nuovo non ha esperienza', manifesto.albo.xp(vuoto), 0)
  controlla('un profilo nuovo non ha ancora provato il gioco', !manifesto.albo.provato(vuoto))
  controlla('uno che ci ha giocato sì', manifesto.albo.provato(finito))

  /* i contatori che i traguardi leggono devono essere quelli che il
     coordinatore scrive davvero: un traguardo appeso a un nome che
     nessuno muove non scatta mai, e non se ne accorge nessuno */
  const sorgente = readFileSync(resolve(QUI, '../../src/giochi/survivors/Gioco.vue'), 'utf8')
  const chiavi = new Set()
  for (const t of manifesto.albo.traguardi)
    for (const m of t.valore.toString().matchAll(/m\.(?:tot|best)\('([^']+)'\)/g))
      chiavi.add(m[1])
  for (const m of manifesto.albo.xp.toString().matchAll(/m\.(?:tot|best)\('([^']+)'\)/g))
    chiavi.add(m[1])
  for (const k of chiavi)
    controlla(`il contatore "${k}" lo muove qualcuno`, sorgente.includes(`'${k}'`),
              'nessuno lo scrive in Gioco.vue')
  controlla('e qualche contatore c\'è', chiavi.size >= 3)
}

/* ══════════ 9. il canvas non entra nel motore ══════════
   La prova più semplice che le regole girano senza schermo: qui non c'è
   un browser, e tutto quello che sta sopra ha giocato lo stesso. Resta
   da dire che non ci si è infilato di nascosto. */
{
  /* i commenti raccontano quello che il codice non fa: si guarda il
     codice, non quello che c'è scritto intorno */
  const senzaCommenti = f => readFileSync(resolve(QUI, '../../src/giochi/survivors/', f), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

  const files = ['motore/partita.js', 'motore/banco.js', 'dati/campagna.js',
                 'dati/mazzo.js', 'dati/mostri.js', 'dati/taratura.js', 'dati/scenari.js']
  for (const f of files)
    controlla(`${f} non sa cosa sia un canvas`,
              !/getContext|document\.|window\.|from 'vue'/.test(senzaCommenti(f)))

  const scena = senzaCommenti('scena/campo.js')
  controlla('e chi disegna non sa cosa sia un potenziamento',
            !/potenziament|prezzo|moneta|cuori|livello/.test(scena))
  controlla('né chi tiene il battito',
            !/potenziament|nemic|carta/.test(senzaCommenti('scena/giostra.js')))
}

nota(`taratura: ${CFG.cadenza}s fra un tiro e l'altro, ` +
     `${CFG.natePerSecondo(0).toFixed(1)}→${CFG.natePerSecondo(1).toFixed(1)} mostri al secondo`)
riassunto('survivors')
