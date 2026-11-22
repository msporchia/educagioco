/* Le regole di Survivors, senza browser e senza giocare partite intere:
   i dati stanno in piedi, il calcolo è giusto dove è facile sbagliarsi,
   l'offerta, la cassa, i muri, le armi, il secondo giro del mazzo, i
   traguardi. Le nove tappe giocate davvero stanno in `misure/survivors`.
   `node test/esegui.mjs unita/survivors --niente-build` */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import manifesto, { CHIAVE } from '../../src/giochi/survivors/gioco.js'
import { guastiDellAlbo } from '../../src/giochi/albo.js'
import { guastiDelleSfide } from '../../src/giochi/primati.js'
import { CFG, soglia, stellePerFerite, guastiDellaTaratura }
  from '../../src/giochi/survivors/dati/taratura.js'
import { MOSTRI, ammessi, guastiDeiMostri }
  from '../../src/giochi/survivors/dati/mostri.js'
import { SCENARI, guastiDegliScenari } from '../../src/giochi/survivors/dati/scenari.js'
import { OGGETTI, pescaOggetto, guastiDegliOggetti }
  from '../../src/giochi/survivors/dati/oggetti.js'
import { MAZZO, FASCE, PALLINI, prezzoDomanda, maturita, palliniDelPrezzo,
         scalinoDelPrezzo, resa, tettoDi, RESA_OLTRE, RESA_TOTALE, guastiDelMazzo,
         OFFERTA, ARMI_DI_PARTENZA }
  from '../../src/giochi/survivors/dati/mazzo.js'
import { CAMPAGNA, SCALINI, LIBERO, QUANTE_TAPPE, guastiDellaCampagna }
  from '../../src/giochi/survivors/dati/campagna.js'
import { Regole, Partita } from '../../src/giochi/survivors/motore/partita.js'
import { gioca, misura, caso as casoFisso, Pilota } from '../../src/giochi/survivors/motore/banco.js'
import { spostaSemi } from '../aiuto/semi.mjs'
const caso = spostaSemi(casoFisso)
import { controlla, uguale, stessaLista, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const campo = { larghezza: 390, altezza: 620 }     // un telefono vero
/* un terreno senza ostacoli, per guardare una cosa senza che un bosco
   ci passi in mezzo */
const PIATTO = { libero: () => true, spingiFuori: () => false, aggira: (x, y, r, ux, uy) => [ux, uy] }

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
  /* e la sfida senza fine: una misura sbagliata non si vede a schermo,
     si vede come un numero senza unità */
  ['la sfida senza fine', guastiDelleSfide([manifesto])],
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
/* il record del gioco libero sta in `campagne[survivors].primato`
   (`giochi/primati.js`) e si scrive in minuti e secondi. Il posto
   vecchio — `cfg.primato`, un numero di secondi — si legge ancora: chi
   aveva resistito un minuto e mezzo non deve ritrovarsi il primato
   sparito il giorno dell'aggiornamento. */
controlla('il riassunto parla del gioco libero',
          /primato 2:05/.test(manifesto.riassunto(
            { tappa: 9, libera: true, stelle: {}, primato: { best: 125 } })))
controlla('e il record scritto nel posto vecchio si legge ancora',
          /primato 1:30/.test(manifesto.riassunto(
            { tappa: 9, libera: true, stelle: {}, cfg: { primato: 90 } })))
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

  for (const c of MAZZO.filter(c => !c.cura)) {
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

/* ══════════ 3. l'offerta: quattro carte, tre prezzi ══════════ */
{
  const p = new Partita(new Regole(CAMPAGNA[4]), { rnd: caso(3), campo })
  /* si sale di livello a mano, senza dover giocare mezza partita */
  p.xp = p.prossima
  p.avanza(1 / 30)
  /* salire non ferma più il campo: il potenziamento si mette da parte, e
     lo apre chi gioca quando vuole (il pulsante «potenzia») */
  controlla('salendo di livello la partita non si ferma', !p.inPausa)
  uguale('e mette da parte un potenziamento', p.daSpendere, 1)
  p.apriOfferta()
  uguale('aprirlo lo spende', p.daSpendere, 0)
  const o = p.offerta
  controlla('aperto, la partita si ferma', p.inPausa)
  uguale('e propone quattro carte', o.length, OFFERTA.carte)
  stessaLista('almeno una per fascia', [...new Set(o.map(c => c.fascia))].sort(),
              ['debole', 'forte', 'media'])
  controlla('dalla più a buon mercato', o.every((c, i) => !i || o[i - 1].prezzo <= c.prezzo),
            o.map(c => c.prezzo.toFixed(2)).join(' ≤ '))
  controlla('e c\'è un\'arma che raddoppia l\'attacco',
            o.some(c => ARMI_DI_PARTENZA.includes(c.chiave)), o.map(c => c.chiave).join(' '))
  controlla('ogni carta dice a che livello porta', o.every(c => c.cura || c.livello === 1))
  controlla('e che è nuova', o.every(c => c.cura || c.nuova))

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
  p.apriOfferta()
  const o = p.offerta
  controlla('c\'è un\'offerta aperta', o?.length === OFFERTA.carte)
  const primaDi = o.map(c => p.livelloDi(c.chiave))
  uguale('rinunciare non consegna niente', p.rinuncia(), null)
  controlla('la partita riparte lo stesso', !p.inPausa)
  stessaLista('e nessuna delle carte è arrivata',
              o.map(c => p.livelloDi(c.chiave)), primaDi)
  uguale('nemmeno la più debole', p.livelloDi(o[0].chiave), 0)
}
{
  /* ══ le carte prese tornano, e all'inizio c'è sempre un'arma ══
     Come in Vampire Survivors: due delle carte già prese tornano a ogni
     offerta, così si portano in cima. E nelle prime quattro prese c'è
     sempre Frecce gemelle o Frecce grosse: senza, una tappa alta partiva
     persa per la sfortuna della pesca (docs/survivors/regole.md). */
  let senzArma = 0, senzaRiprese = 0
  for (let s = 0; s < 40; s++) {
    const p = new Partita(new Regole(CAMPAGNA[8]), { rnd: caso(900 + s), campo })
    for (let giro = 0; giro < 8; giro++) {
      const o = p.offri()
      const prese = MAZZO.filter(c => !c.cura && p.livelloDi(c.chiave) > 0 && p.livelloDi(c.chiave) < c.max)
      if (giro < OFFERTA.curate && !o.some(c => ARMI_DI_PARTENZA.includes(c.chiave))) senzArma++
      if (o.filter(c => prese.some(x => x.chiave === c.chiave)).length < Math.min(OFFERTA.riprese, prese.length))
        senzaRiprese++
      /* si prende sempre la prima che non è un'arma: l'arma deve tornare lo stesso */
      p.offerta = o
      p.prendi((o.find(c => !ARMI_DI_PARTENZA.includes(c.chiave) && !c.cura) || o[0]).chiave)
    }
  }
  uguale('nelle prime quattro prese un\'arma c\'è sempre', senzArma, 0)
  uguale('e due delle carte prese tornano a ogni offerta', senzaRiprese, 0)

  /* la mela non conta fra le prese: prenderne tante non spegne le armi */
  const p = new Partita(new Regole(CAMPAGNA[8]), { rnd: caso(950), campo })
  p.potenziamenti.mela = 6
  controlla('dopo sei mele l\'arma c\'è ancora', p.offri().some(c => ARMI_DI_PARTENZA.includes(c.chiave)))
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
  const calamita = MAZZO.find(x => x.chiave === 'magnete')
  q.potenziamenti[calamita.chiave] = calamita.max - 1
  const dolce = q.vestiCarta(calamita)
  uguale('una debole cresciuta si tinge come il suo prezzo', dolce.tinta, 'media')
  uguale('e una debole nuova resta verde',
         new Partita(new Regole(CAMPAGNA[0]), { rnd: caso(33), campo }).vestiCarta(calamita).tinta,
         'debole')
  /* la mela no: è una cura, non cresce, e la decima costa come la prima */
  const mela = MAZZO.find(x => x.chiave === 'mela')
  q.potenziamenti[mela.chiave] = 9
  const decima = q.vestiCarta(mela)
  uguale('la decima mela resta facile', decima.tinta, 'debole')
  controlla('e non dice un livello né «nuova»', decima.cura && !decima.nuova && !decima.oltreIlTetto)

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
  controlla('ma la partita è durata', p.tempo > 0)
}
{
  /* vincere senza farsi toccare vale tre stelle (le monete no: le paga ogni risposta giusta) */
  const t = CAMPAGNA[0]
  const p = new Partita(new Regole(t), { rnd: caso(13), campo })
  p.tempo = t.durata - 0.01
  p.avanza(1 / 30)
  uguale('allo scadere si vince', p.esito, 'vinta')
  uguale('senza ferite tre stelle', p.stelle, 3)
  uguale('e il motore non sa niente di monete', 'monete' in p, false)
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

/* ══════════ 4-bis. LE COSE SI TROVANO IN GIRO ══════════
   Il gioco era «sto fermo e guardo»: le gemme camminavano da sole verso
   l'eroe fino a correre più di lui, e l'esperienza arrivava addosso a
   chi non muoveva il dito. Adesso una gemma resta dove cade, e sul campo
   compaiono oggetti che stanno lì qualche secondo e poi svaniscono. È
   la metà di quello che rende il muoversi necessario (l'altra metà sono
   i muri, più sotto). */
{
  /* ── senza la carta, una gemma si prende a contatto e basta ──
     Niente calamita di base: quella a un passo resta lì, quella sotto i
     piedi si prende. */
  const p = new Partita(new Regole(CAMPAGNA[0]), { rnd: caso(41), campo })
  p.aNascere = -1e9; p.tOggetto = 1e9; p.tMuro = 1e9
  p.gemme.push({ x: 300, y: 0, vx: 0, vy: 0, val: 1, fase: 0 })
  p.gemme.push({ x: 60, y: 0, vx: 0, vy: 0, val: 1, fase: 0 })
  p.gemme.push({ x: 20, y: 0, vx: 0, vy: 0, val: 1, fase: 0 })
  for (let i = 0; i < 30; i++) p.avanza(1 / 30)
  uguale('senza la carta la calamita è zero', p.f.calamita, 0)
  const lontana = p.gemme.find(g => g.x > 200)
  controlla('una gemma lontana resta dove cade', lontana && lontana.x === 300 && lontana.y === 0,
            lontana ? `si è spostata a ${lontana.x.toFixed(1)}` : 'è sparita')
  const aUnPasso = p.gemme.find(g => g.x > 30 && g.x < 200)
  controlla('e anche quella a un passo: nessuna calamita la tira',
            aUnPasso && aUnPasso.x === 60, aUnPasso ? `si è spostata a ${aUnPasso.x.toFixed(1)}` : 'è sparita')
  controlla('quella sotto i piedi è stata presa', p.xp === 1 && p.gemme.length === 2, `xp ${p.xp}`)
  /* e non c'è più nessuna deriva nella taratura: se torna, torna qui */
  controlla('la taratura non ha più una deriva delle gemme',
            !('derivaGemma' in CFG) && !('derivaMax' in CFG))
  controlla('né un raggio di calamita per tutti', typeof CFG.calamita === 'object' && !(CFG.calamita > 0))

  /* ── la carta Calamita: la prima copia tira da poco, ogni copia da più lontano ── */
  const q = new Partita(new Regole(CAMPAGNA[0]), { rnd: caso(41), campo })
  q.aNascere = -1e9; q.tOggetto = 1e9; q.tMuro = 1e9
  q.potenziamenti.magnete = 1; q.ricalcola()
  uguale('con una copia la calamita è quella dichiarata', q.f.calamita, CFG.calamita.prima)
  q.gemme.push({ x: CFG.calamita.prima - 8, y: 0, vx: 0, vy: 0, val: 1, fase: 0 })
  q.gemme.push({ x: CFG.calamita.prima + 20, y: 0, vx: 0, vy: 0, val: 1, fase: 0 })
  for (let i = 0; i < 45; i++) q.avanza(1 / 30)
  controlla('la gemma dentro il raggio vola da sé ed è presa', q.xp === 1 && q.gemme.length === 1,
            `xp ${q.xp}, ${q.gemme.length} gemme a terra`)
  controlla('quella appena fuori resta lì', q.gemme[0] && q.gemme[0].x === CFG.calamita.prima + 20)
  const cinque = new Partita(new Regole(CAMPAGNA[0]), { rnd: caso(41), campo })
  cinque.potenziamenti.magnete = 5; cinque.ricalcola()
  /* le copie si alternano: la 1ª, la 3ª e la 5ª allargano, la 2ª e la
     4ª tirano più forte */
  uguale('a cinque copie il raggio è cresciuto di due passi',
         cinque.f.calamita, CFG.calamita.prima + 2 * CFG.calamita.inPiu)
  uguale('e tira più forte di due passi', cinque.f.forzaCalamita, 1 + 2 * CFG.calamita.forza)
  const mag = MAZZO.find(c => c.chiave === 'magnete')
  uguale('e cinque è il tetto della carta', mag.max, 5)
  controlla('al tetto la calamita sta dentro mezzo schermo',
            cinque.f.calamita <= campo.larghezza / 2 + 5, `${cinque.f.calamita} pixel`)
  controlla('la prima copia si sente: tira oltre il contatto',
            CFG.calamita.prima > CFG.raggioEroe + 12)
}
{
  /* ── gli oggetti compaiono a tempo, dentro lo schermo, e svaniscono ── */
  const p = new Partita(new Regole(CAMPAGNA[0]), { rnd: caso(42), campo })
  p.eroe.invuln = 1e9                  // fermo sul posto, e i mostri non contano
  const passi = Math.ceil((CFG.oggetti.primo + 0.5) * 30)
  for (let i = 0; i < passi; i++) { if (p.inPausa) p.rinuncia(); p.avanza(1 / 30) }
  uguale('dopo qualche secondo a terra c\'è un oggetto', p.oggetti.length, 1)
  const o = p.oggetti[0]
  controlla('di un tipo che esiste', !!OGGETTI[o.tipo], o.tipo)
  const d = Math.hypot(o.x - p.eroe.x, o.y - p.eroe.y)
  controlla('non sotto i piedi', d >= 100, `a ${d.toFixed(0)} pixel`)
  controlla('e dentro lo schermo',
            Math.abs(o.x - p.eroe.x) <= campo.larghezza / 2 && Math.abs(o.y - p.eroe.y) <= campo.altezza / 2,
            `a ${(o.x - p.eroe.x).toFixed(0)}, ${(o.y - p.eroe.y).toFixed(0)}`)
  controlla('con un tempo che scende', o.resta > 0 && o.resta < CFG.oggetti.durata)
  /* fermo lì, senza andarci: dopo la sua durata non c'è più */
  const fino = Math.ceil(CFG.oggetti.durata * 30) + 5
  const prima = p.oggetti.length
  for (let i = 0; i < fino; i++) { if (p.inPausa) p.rinuncia(); p.avanza(1 / 30) }
  controlla('chi non ci va lo vede svanire', !p.oggetti.includes(o) && prima === 1)
  /* la scena li porta a chi disegna, con la calamita che tira */
  const s = p.scena()
  controlla('la scena porta gli oggetti', Array.isArray(s.oggetti))
  uguale('e dice se la calamita trovata sta tirando', s.risucchio, false)
}
{
  /* ── il cuore ── */
  const p = new Partita(new Regole(CAMPAGNA[0]), { rnd: caso(43), campo })
  p.eroe.cuori = 1
  p.oggetti.push({ tipo: 'cuore', x: p.eroe.x, y: p.eroe.y, resta: 5, fase: 0 })
  p.avanza(1 / 30)
  uguale('il cuore trovato ridà un cuore', p.eroe.cuori, 2)
  uguale('ma non alza il tetto', p.eroe.cuoriMax, 3)
  uguale('e sparisce da terra', p.oggetti.length, 0)
  controlla('e lo si sente', p.svuotaEventi().includes('cuore'))
  /* a cuori pieni non esce: sarebbe una corsa per niente */
  let cuori = 0
  const r = caso(44)
  for (let i = 0; i < 60; i++) if (pescaOggetto(r, { feribile: false }) === 'cuore') cuori++
  uguale('a cuori pieni il cuore non esce mai', cuori, 0)
  let feriti = 0
  for (let i = 0; i < 60; i++) if (pescaOggetto(r, { feribile: true }) === 'cuore') feriti++
  controlla('a chi ne ha perso uno sì', feriti > 5, `${feriti} su 60`)
}
{
  /* ── la calamita trovata tira quello che c'è sullo schermo, non tutta
     la mappa: le gemme lasciate lontano restano dove sono ── */
  const p = new Partita(new Regole(CAMPAGNA[0]), { rnd: caso(45), campo })
  p.aNascere = -1e9          // niente mostri: uno abbattuto lascerebbe una gemma in più
  const R = OGGETTI.calamita.raggio
  p.gemme.push({ x: R - 60, y: 0, vx: 0, vy: 0, val: 1, fase: 0 })
  p.gemme.push({ x: 0, y: -(R - 80), vx: 0, vy: 0, val: 1, fase: 0 })
  const lontana = { x: -R * 2, y: 0, vx: 0, vy: 0, val: 1, fase: 0 }
  p.gemme.push(lontana)
  p.oggetti.push({ tipo: 'calamita', x: p.eroe.x, y: p.eroe.y, resta: 5, fase: 0 })
  p.avanza(1 / 30)
  controlla('la calamita trovata accende il risucchio', p.risucchio > 0 && p.scena().risucchio)
  for (let i = 0; i < 60; i++) { if (p.inPausa) p.rinuncia(); p.avanza(1 / 30) }
  uguale('in due secondi quelle dentro il raggio sono arrivate', p.gemme.length, 1)
  controlla('quella lasciata lontano è ancora là', p.gemme[0] === lontana && lontana.x === -R * 2)
  controlla('con la loro esperienza', p.xp >= 2 || p.livello > 1, `xp ${p.xp}, livello ${p.livello}`)
  for (let i = 0; i < OGGETTI.calamita.secondi * 30 + 5; i++) { if (p.inPausa) p.rinuncia(); p.avanza(1 / 30) }
  uguale('poi il risucchio si spegne', p.risucchio, 0)
}
{
  /* ── la cassa apre un'offerta, pagata come sempre ── */
  const p = new Partita(new Regole(CAMPAGNA[4]), { rnd: caso(46), campo })
  p.tempo = 30
  const livello = p.livello, xp = p.xp
  p.oggetti.push({ tipo: 'cassa', x: p.eroe.x, y: p.eroe.y, resta: 5, fase: 0 })
  p.avanza(1 / 30)
  controlla('la cassa ferma la partita con quattro carte', p.inPausa && p.offerta?.length === OFFERTA.carte)
  uguale('e dice che viene da una cassa', p.motivoOfferta, 'cassa')
  uguale('anche nel cruscotto', p.cruscotto.cassa, true)
  uguale('senza salire di livello', p.livello, livello)
  uguale('né toccare l\'esperienza', p.xp, xp)
  const primaDi = p.offerta.map(c => p.livelloDi(c.chiave))
  p.rinuncia()
  stessaLista('chi sbaglia la domanda della cassa non prende niente',
              p.offerta ? [] : primaDi.map((_, i) => 0), primaDi)
  uguale('e la partita riparte', p.motivoOfferta, null)
  /* la salita di livello dice «livello», non «cassa» */
  p.xp = p.prossima
  p.avanza(1 / 30)
  p.apriOfferta()
  uguale('una salita di livello si dichiara livello', p.motivoOfferta, 'livello')
  uguale('e il cruscotto non dice cassa', p.cruscotto.cassa, false)
  p.prendi(p.offerta[0].chiave)
  /* col mazzo finito, in campagna, la cassa ha solo la mela: le cure non finiscono */
  const pieno = new Partita(new Regole(CAMPAGNA[4]), { rnd: caso(47), campo })
  for (const x of MAZZO) pieno.potenziamenti[x.chiave] = x.max
  pieno.ricalcola()
  pieno.oggetti.push({ tipo: 'cassa', x: 0, y: 0, resta: 5, fase: 0 })
  pieno.avanza(1 / 30)
  stessaLista('col mazzo finito la cassa offre solo la mela',
              (pieno.offerta || []).map(c => c.chiave), ['mela'])
}
{
  /* ── la cassa è rara, e il tetto è un conto ──
     Una cassa è un'offerta intera che non si è sudata: non deve
     arrivare subito, non ce ne possono essere due in campo, e in tutto
     non più di una ogni `ogni` secondi (`CFG.oggetti.cassa`). Vale
     anche per quella lasciata da un mostro grosso. */
  const { primaDi, ogni } = CFG.oggetti.cassa
  const p = new Partita(new Regole(CAMPAGNA[8]), { rnd: caso(60), campo })
  controlla('nei primi secondi una cassa non esce', !p.cassaAmmessa(), `a ${p.tempo}s`)
  let uscite = 0
  for (let i = 0; i < 40; i++) { const o = p.lasciaOggetto(); if (o?.tipo === 'cassa') uscite++; p.oggetti = [] }
  uguale('nemmeno pescando quaranta volte', uscite, 0)
  p.tempo = primaDi + 0.1
  let quante = 0
  for (let i = 0; i < 40; i++) { const o = p.lasciaOggetto(); if (o?.tipo === 'cassa') quante++; p.oggetti = [] }
  uguale('passati i primi secondi ne esce una, e una sola', quante, 1)
  p.oggetti = [{ tipo: 'cassa', x: 300, y: 0, resta: 5, fase: 0 }]
  p.tempo = primaDi + ogni * 5
  controlla('con una cassa già in campo non ne esce un\'altra', !p.cassaAmmessa())
  p.oggetti = []
  controlla('tolta quella, il tetto è salito col tempo', p.cassaAmmessa())
  /* il conto cresce col tempo e non con la tappa: a un quarto d'ora di
     Sopravvivenza sono venti, non venti volte tanto */
  const q = new Partita(new Regole(LIBERO), { rnd: caso(61), campo })
  q.tempo = 900
  let tot = 0
  for (let i = 0; i < 400; i++) { const o = q.lasciaOggetto(); if (o?.tipo === 'cassa') tot++; q.oggetti = [] }
  uguale('in un quarto d\'ora di Sopravvivenza il tetto è uno ogni tre quarti di minuto',
         tot, Math.floor((900 - primaDi) / ogni) + 1)
  /* e un colosso morto non scavalca il tetto */
  const g = new Partita(new Regole(CAMPAGNA[8]), { rnd: () => 0.001, campo })
  g.nemici.push({ tipo: 'colosso', x: 200, y: 50, r: 27, vita: 0, vitaMax: 10, passo: 30,
                  massa: 1, spx: 0, spy: 0, lampo: 0, gelato: 0, freno: 1, attesa: 0, fase: 0 })
  g.raccogliMorti()
  controlla('un colosso morto nei primi secondi non lascia una cassa',
            g.oggetti[0] && g.oggetti[0].tipo !== 'cassa', g.oggetti[0]?.tipo)
}
{
  /* ── quanti ce ne possono essere, e chi li lascia ── */
  const p = new Partita(new Regole(CAMPAGNA[8]), { rnd: caso(48), campo })
  for (let i = 0; i < 12; i++) p.lasciaOggetto()
  uguale('a terra non ce ne stanno più di quanti dice la taratura',
         p.oggetti.length, CFG.oggetti.massimo)
  /* un mostro grosso lascia qualcosa: col caso a zero, sempre */
  const q = new Partita(new Regole(CAMPAGNA[8]), { rnd: () => 0.001, campo })
  q.nemici.push({ tipo: 'colosso', x: 200, y: 50, r: 27, vita: 0, vitaMax: 10, passo: 30,
                  massa: 1, spx: 0, spy: 0, lampo: 0, gelato: 0, freno: 1, attesa: 0, fase: 0 })
  q.raccogliMorti()
  uguale('un colosso morto lascia un oggetto dove è caduto', q.oggetti.length, 1)
  controlla('proprio lì', q.oggetti[0].x === 200 && q.oggetti[0].y === 50)
  const m = new Partita(new Regole(CAMPAGNA[8]), { rnd: () => 0.001, campo })
  m.nemici.push({ tipo: 'melma', x: 200, y: 50, r: 15, vita: 0, vitaMax: 1, passo: 60,
                  massa: 1, spx: 0, spy: 0, lampo: 0, gelato: 0, freno: 1, attesa: 0, fase: 0 })
  m.raccogliMorti()
  uguale('una melma no', m.oggetti.length, 0)
  /* e il conto della campagna: quanti oggetti vede una partita */
  const { partita } = gioca(new Regole(CAMPAGNA[5]), { rnd: caso(49), campo, bravura: 1, esattezza: 0.9 })
  nota(`in una partita alle dune il pilota ha trovato oggetti e preso ${partita.xp + partita.livello} tra xp e livelli`)
}
/* ══════════ 4-ter. I MURI ══════════
   L'altra metà del muoversi: ogni tanto una fila di mostri deboli
   attraversa lo schermo da un lato scelto a caso, dritta, senza inseguire
   nessuno. Chi sta fermo ci finisce dentro; chi si sposta passa dal varco
   o corre via. Deterministico col seme, come tutto il motore. */
{
  /* ── la fila nasce a tempo, in linea, con un varco ──
     su un prato senza ostacoli: come la fila gira intorno a un bosco lo
     prova il terreno, qui si guarda la forma */
  const p = new Partita(new Regole(CAMPAGNA[0]), { rnd: caso(51), campo })
  p.terreno = PIATTO
  p.aNascere = -1e9; p.tOggetto = 1e9          // solo il muro, per guardarlo
  p.eroe.invuln = 1e9                          // e un eroe fermo che non muore
  for (let i = 0; i < Math.ceil((CFG.muro.primo + 0.2) * 30); i++) p.avanza(1 / 30)
  const fila = p.nemici.filter(n => n.rotta)
  controlla('dopo qualche secondo c\'è una fila in campo', fila.length >= 8, `${fila.length} in fila`)
  controlla('e lo si sente', p.svuotaEventi().includes('muro'))
  const rotta = fila[0].rotta
  controlla('tutti con la stessa rotta', fila.every(n => n.rotta.x === rotta.x && n.rotta.y === rotta.y))
  controlla('una rotta lungo un asse, lunga uno',
            Math.abs(rotta.x) + Math.abs(rotta.y) === 1)
  const orizzontale = rotta.y === 0
  const lungo = n => orizzontale ? n.x : n.y          // la coordinata di avanzamento
  const trasv = n => orizzontale ? n.y : n.x          // quella lungo la fila
  controlla('in linea', fila.every(n => Math.abs(lungo(n) - lungo(fila[0])) < 1))
  controlla('fuori dallo schermo, dal lato da cui entra',
            Math.abs(lungo(fila[0]) - (orizzontale ? p.eroe.x : p.eroe.y)) > (orizzontale ? campo.larghezza : campo.altezza) / 2)
  /* il varco: fra due vicini in fila c'è un buco più largo del passo */
  /* il varco può cadere in fondo alla fila: ai due capi si mette il posto
     della griglia appena fuori, così anche quel buco si misura */
  const lunga = (orizzontale ? campo.altezza : campo.larghezza) / 2 + 30
  const ultimo = -lunga + Math.floor(2 * lunga / CFG.muro.passo) * CFG.muro.passo
  const dentroFila = fila.map(n => trasv(n) - trasv(p.eroe)).sort((a, b) => a - b)
  const posti = [-lunga - CFG.muro.passo, ...dentroFila, ultimo + CFG.muro.passo]
  const buchi = posti.slice(1).map((v, i) => v - posti[i])
  /* la fila sta su una griglia a `passo`, quindi il varco è largo
     quello dichiarato più al massimo due passi */
  controlla('con un varco largo quanto dichiarato',
            Math.max(...buchi) >= CFG.muro.varco - 1 && Math.max(...buchi) < CFG.muro.varco + 2 * CFG.muro.passo,
            `il buco più largo è ${Math.max(...buchi).toFixed(0)}`)
  controlla('e il resto della fila a passo stretto',
            buchi.filter(b => b < CFG.muro.varco - 1).every(b => Math.abs(b - CFG.muro.passo) < 1))
  /* e non lo annuncia nessuno: c'era un bordo rosso che si accendeva un
     secondo prima, ed è stato tolto — la fila si vede arrivare, e da che
     parte scansarsi lo si capisce guardando. Resta il brontolio */
  controlla('nessun avviso a schermo prima che la fila entri',
            !p.scena().effetti.some(e => e.che === 'muro'))

  /* ── tira dritta, non insegue ── */
  const prima = fila.map(n => ({ x: n.x, y: n.y }))
  for (let i = 0; i < 30; i++) p.avanza(1 / 30)
  const vivi = p.nemici.filter(n => n.rotta)
  controlla('dopo un secondo la fila è avanzata lungo la sua rotta',
            vivi.every(n => (orizzontale ? n.x - prima[0].x : n.y - prima[0].y) * (orizzontale ? rotta.x : rotta.y) > 40))
  controlla('senza stringersi verso l\'eroe',
            vivi.length > 3 && Math.abs(trasv(vivi[0]) - trasv(vivi[vivi.length - 1])) > 300,
            'la fila si è stretta')
  /* ── e sparisce dopo aver attraversato ──
     L'eroe si sposta fuori dalla strada della fila: da fermo e
     intoccabile la rimbalzerebbe addosso per sempre */
  p.eroe.x += orizzontale ? 0 : 2000
  p.eroe.y += orizzontale ? 2000 : 0
  for (let i = 0; i < 30 * 30; i++) p.avanza(1 / 30)
  uguale('trenta secondi dopo la fila non c\'è più', p.nemici.filter(n => n.rotta).length, 0)
  controlla('e nemmeno si è persa in giro', p.nemici.length <= 14)
}
{
  /* ── i muri: più spesso con la marea, deboli, sotto il tetto (chi sta fermo ci finisce dentro: misure/survivors) ── */
  controlla('con la marea i muri arrivano più spesso', CFG.muro.ogni(2) < CFG.muro.ogni(0))
  /* la fila è fatta dei più deboli fra chi è in scena */
  const t = new Partita(new Regole(CAMPAGNA[8]), { rnd: caso(52), campo })
  t.tempo = 150
  controlla('la fila è fatta di mostri deboli', MOSTRI[t.tipoDelMuro()].vita === 1, t.tipoDelMuro())
  /* e rispetta il tetto della folla */
  const pieno = new Partita(new Regole(CAMPAGNA[0]), { rnd: caso(53), campo })
  const tetto = pieno.regole.tetto(0)
  for (let i = 0; i < tetto; i++) pieno.nemici.push(pieno.mostroNuovo('melma', 900, 900))
  pieno.nasceMuro()
  uguale('un muro non sfonda il tetto della folla', pieno.nemici.length, tetto)
}

/* ══════════ 4-quater. LE ARMI CHE GUARDANO DOVE CORRI ══════════
   L'arco tira da solo al più vicino. La lancia e il fendente tirano
   **davanti**, nella direzione di marcia: per usarle bisogna correre
   verso i mostri, e mirare costa — quindi picchiano più dell'arco. Chi
   sta fermo le tiene puntate dov'era andato l'ultima volta. */
{
  const bestia = (tipo, x, y, vita = 50) => ({
    tipo, x, y, r: 15, vita, vitaMax: vita, passo: 0, massa: 1,
    spx: 0, spy: 0, lampo: 0, gelato: 0, freno: 1, attesa: 0, fase: 0 })
  const solo = (seme, carta) => {
    const p = new Partita(new Regole(CAMPAGNA[4]), { rnd: caso(seme), campo })
    p.aNascere = -1e9; p.tOggetto = 1e9; p.tMuro = 1e9   // niente altro in campo
    p.eroe.invuln = 1e9
    p.potenziamenti[carta] = 1; p.ricalcola()
    return p
  }
  /* le due carte esistono, e stanno nelle fasce dichiarate */
  const lancia = MAZZO.find(c => c.chiave === 'lancia'), fendente = MAZZO.find(c => c.chiave === 'fendente')
  controlla('la lancia è una carta forte', lancia?.fascia === 'forte')
  controlla('il fendente è una carta media', fendente?.fascia === 'media')

  /* ── la lancia parte dove si corre, e resta puntata lì da fermi ── */
  const p = solo(61, 'lancia')
  p.muovi(0, 1); p.avanza(1 / 30)
  const l = p.colpi.filter(c => c.lancia)
  uguale('correndo in giù parte una lancia', l.length, 1)
  controlla('e va in giù', l[0].vy > 400 && Math.abs(l[0].vx) < 1)
  controlla('trapassa senza fermarsi', l[0].restano > 50)
  controlla('e fa più male di una freccia', l[0].danno > p.f.danno * 2, `${l[0].danno} contro ${p.f.danno}`)
  controlla('e lo si sente', p.svuotaEventi().includes('lancia'))
  p.muovi(0, 0)
  for (let i = 0; i < 60; i++) p.avanza(1 / 30)
  const dopo = p.colpi.filter(c => c.lancia)
  controlla('da fermo la lancia va ancora dove si correva', dopo.length >= 1 && dopo.every(c => c.vy > 0))
  uguale('la scena dice dove si mira', p.scena().eroe.rotta, Math.PI / 2)
  /* trapassa davvero: tre rocce in fila, tutte colpite */
  const q = solo(62, 'lancia')
  q.nemici.push(bestia('roccia', 80, 0), bestia('roccia', 140, 0), bestia('roccia', 200, 0))
  q.muovi(1, 0); q.avanza(1 / 30); q.muovi(0, 0)
  for (let i = 0; i < 30; i++) q.avanza(1 / 30)
  controlla('una lancia colpisce tutti quelli sulla sua strada', q.nemici.every(n => n.vita < 50),
            q.nemici.map(n => n.vita).join(' '))

  /* ── il fendente colpisce solo davanti, e non parte nel vuoto ── */
  const f = solo(63, 'fendente')
  f.nemici.push(bestia('roccia', 60, 0), bestia('roccia', -60, 0), bestia('roccia', 0, 60))
  f.muovi(1, 0); f.avanza(1 / 30); f.muovi(0, 0)
  /* l'effetto dura un quinto di secondo: si guarda al primo battito */
  controlla('con un effetto che si vede', f.scena().effetti.some(e => e.che === 'fendente'))
  for (let i = 0; i < 10; i++) f.avanza(1 / 30)
  const [davanti, dietro, lato] = f.nemici.map(n => n.vita)
  controlla('il fendente colpisce chi sta davanti', davanti < 50, `vita ${davanti}`)
  uguale('non chi sta dietro', dietro, 50)
  controlla('e non chi sta di lato, fuori dall\'arco', lato > davanti, `lato ${lato}, davanti ${davanti}`)
  controlla('e picchia più di una freccia', 50 - davanti > f.f.danno * 2)
  const g = solo(64, 'fendente')
  g.nemici.push(bestia('roccia', -60, 0))
  g.muovi(1, 0); g.avanza(1 / 30); g.muovi(0, 0)
  for (let i = 0; i < 40; i++) g.avanza(1 / 30)
  uguale('senza nessuno davanti non parte', g.svuotaEventi().filter(e => e === 'fendente').length, 0)
  /* senza armi direzionali la scena non mette la freccina ai piedi */
  uguale('senza armi che mirano la scena non mostra la mira',
         new Partita(new Regole(CAMPAGNA[0]), { rnd: caso(65), campo }).scena().eroe.rotta, null)
}

/* ══════════ 7-bis. E NEL GIOCO LIBERO IL MAZZO NON FINISCE ══════════
   Il guasto che questa parte esiste per non far tornare: nella
   Sopravvivenza **le carte finivano prima della marea**. Le settantacinque
   copie del mazzo sono tante, ma una partita libera si interrompe e si
   riprende (`motore/sosta.js`), quindi dura un pomeriggio; e quando
   l'ultima era presa, `offri()` tornava vuoto — il livello saliva in
   silenzio, senza pausa, senza domanda e senza carta, e le gemme non
   servivano più a niente. Misurato col banco su un eroe che ha già tutto:
   ventidue salite di livello buttate, e nemmeno una domanda.

   Il rimedio è in `dati/mazzo.js` (`resa`, `tettoDi`): nel gioco libero
   una carta non ha tetto, e le copie in più rendono ogni volta meno. Qui
   si controlla che duri un po' di più, che continui a chiedere, e che la
   marea vinca comunque. */
{
  /* ── i conti della resa ── */
  for (const c of MAZZO.filter(c => c.cura))
    controlla(`«${c.nome}»: una cura non ha tetto`, tettoDi(c, false) === Infinity && tettoDi(c, true) === Infinity)
  for (const c of MAZZO.filter(c => !c.cura)) {
    uguale(`«${c.nome}»: in campagna il tetto è il suo max`, tettoDi(c, false), c.max)
    uguale(`«${c.nome}»: nel gioco libero il tetto ${c.intera ? 'resta' : 'sparisce'}`,
           tettoDi(c, true), c.intera ? c.max : Infinity)
    for (let lv = 0; lv <= c.max; lv++)
      uguale(`«${c.nome}»: dentro il tetto la resa è il numero di copie (${lv})`,
             resa(lv, c.max), lv)
  }
  const c = MAZZO.find(x => x.chiave === 'mani')
  controlla('la prima copia in più rende meno di un grado vero',
            resa(c.max + 1, c.max) - c.max < 1)
  controlla('e la seconda rende meno della prima',
            resa(c.max + 2, c.max) - resa(c.max + 1, c.max) <
            resa(c.max + 1, c.max) - resa(c.max, c.max))
  uguale('la prima copia in più vale quello che dichiara',
         Number((resa(c.max + 1, c.max) - c.max).toFixed(6)), RESA_OLTRE)
  /* ── ed è questo che non rende immortali ──
     La serie si chiude: prendendo la stessa carta per sempre non si
     arriva a due gradi in più. Senza questo limite «mani veloci» — che
     moltiplica, non somma — basterebbe da sola. */
  controlla('prendendola per sempre non si superano i gradi dichiarati',
            resa(c.max + 10000, c.max) - c.max < RESA_TOTALE + 1e-9,
            `arriva a ${(resa(c.max + 10000, c.max) - c.max).toFixed(3)} su ${RESA_TOTALE}`)
  dentro('e il limite non è né un nulla né un raddoppio', RESA_TOTALE, 1, 2.5)

  /* ── in campagna non cambia niente ──
     Le nove tappe sono tarate sui tetti veri: qui si controlla che il
     motore non conosca nemmeno la strada per uscirne. */
  const t = new Partita(new Regole(CAMPAGNA[4]), { rnd: caso(71), campo })
  for (const x of MAZZO) t.potenziamenti[x.chiave] = x.max
  t.ricalcola()
  stessaLista('in campagna il mazzo pieno offre solo la mela',
              (t.offri() || []).map(c => c.chiave), ['mela'])
  for (const x of MAZZO.filter(c => !c.cura))
    uguale(`in campagna la resa di «${x.chiave}» è il numero di copie`,
           t.resaDi(x.chiave), x.max)
}
{
  /* ── un eroe che ha già tutto, nel gioco libero ── */
  const p = new Partita(new Regole(LIBERO), { rnd: caso(72), campo })
  for (const x of MAZZO) p.potenziamenti[x.chiave] = x.max
  p.ricalcola()
  const o = p.offri()
  controlla('col mazzo finito la Sopravvivenza offre ancora quattro carte', o?.length === OFFERTA.carte,
            `ne offre ${o?.length}`)
  stessaLista('e c\'è ancora ogni fascia', [...new Set(o.map(x => x.fascia))].sort(),
              ['debole', 'forte', 'media'])
  controlla('tutte dicono di essere oltre il loro ultimo livello (la mela è una cura)',
            o.every(x => x.cura || x.oltreIlTetto) && o.every(x => !x.nuova))
  controlla('e nessuna è una carta che dà una cosa intera',
            o.every(x => !MAZZO.find(c => c.chiave === x.chiave).intera),
            o.map(x => x.chiave).join(' '))
  /* la scelta «quanto voglio lavorare» non si spegne nel secondo giro:
     i tre prezzi restano una scala, alta ma una scala */
  controlla('i prezzi del secondo giro sono ancora una scala',
            o.every((x, i) => !i || o[i - 1].prezzo <= x.prezzo) && o[0].prezzo < o.at(-1).prezzo,
            o.map(x => x.prezzo.toFixed(2)).join(' ≤ '))
  /* oltre il tetto il prezzo è quello dell'ultima copia e non sale più:
     la difficoltà di una domanda è una manopola da 0 a 1, e sopra «la più
     tosta» non c'è niente */
  const carta = MAZZO.find(x => x.chiave === 'fuoco')
  p.potenziamenti.fuoco = carta.max + 6
  uguale('oltre il tetto il prezzo resta quello dell\'ultima copia',
         p.vestiCarta(carta).prezzo,
         prezzoDomanda(carta.fascia, LIBERO.rincaro, carta.max - 1, carta.max))

  /* ── e le copie in più si sentono, ma poco ── */
  const q = new Partita(new Regole(LIBERO), { rnd: caso(73), campo })
  for (const x of MAZZO) q.potenziamenti[x.chiave] = x.max
  q.ricalcola()
  const alMassimo = { ...q.f }
  q.potenziamenti.mani = MAZZO.find(x => x.chiave === 'mani').max + 1
  q.potenziamenti.grandi = MAZZO.find(x => x.chiave === 'grandi').max + 1
  q.ricalcola()
  controlla('una copia in più di «mani veloci» accorcia ancora la cadenza',
            q.f.cadenza < alMassimo.cadenza)
  controlla('ma meno di quanto avrebbe fatto un grado vero',
            q.f.cadenza > alMassimo.cadenza * Math.pow(0.75, 1),
            `${alMassimo.cadenza.toFixed(4)} → ${q.f.cadenza.toFixed(4)}`)
  controlla('e una copia in più di «frecce grosse» fa un po\' più male',
            q.f.danno > alMassimo.danno && q.f.danno < alMassimo.danno + 2.1)
  /* ── quello che si conta a pezzi interi resta intero ──
     Una freccia e mezza non esiste, e `palle.length` con la virgola è un
     errore di JavaScript, non un difetto di bilanciamento. */
  q.potenziamenti.frecce = 99
  q.potenziamenti.palla = 99
  q.potenziamenti.occhi = 99
  q.ricalcola()
  for (const k of ['frecce', 'palle', 'perfora'])
    controlla(`«${k}» resta un numero intero`, Number.isInteger(q.f[k]), `vale ${q.f[k]}`)
  /* e quelle carte non si offrono comunque, perché il tetto ce l'hanno */
  const r = new Partita(new Regole(LIBERO), { rnd: caso(74), campo })
  for (const x of MAZZO) r.potenziamenti[x.chiave] = x.max
  r.ricalcola()
  const intere = new Set(MAZZO.filter(x => x.intera).map(x => x.chiave))
  let vista = null
  for (let i = 0; i < 300; i++)
    for (const x of r.offri()) if (intere.has(x.chiave)) vista = x.chiave
  uguale('una carta che dà una cosa intera non si riprende mai', vista, null)
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

  const files = ['motore/partita.js', 'motore/banco.js', 'motore/sosta.js', 'dati/campagna.js',
                 'dati/mazzo.js', 'dati/mostri.js', 'dati/taratura.js', 'dati/scenari.js',
                 'dati/oggetti.js']
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
riassunto('survivors — le regole')
