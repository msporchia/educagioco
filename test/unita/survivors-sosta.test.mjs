/* La partita di Survivors lasciata a metà: si scrive, si rilegge, e **si
   finisce**. Qui si prova la cosa che conta davvero — non che il
   salvataggio «esista», ma che una partita ripresa sia la stessa partita,
   che chi riprende non si ritrovi la melma sul naso, e che uscire e
   rientrare non sia una mossa che conviene.
   `node test/esegui.mjs survivors-sosta --niente-build` */
import { CAMPAGNA, LIBERO } from '../../src/giochi/survivors/dati/campagna.js'
import { Partita, Regole } from '../../src/giochi/survivors/motore/partita.js'
import { Pilota, gioca, caso } from '../../src/giochi/survivors/motore/banco.js'
import { scrivi, leggi, dice, VERSIONE, SPAZIO, MAX_NEMICI }
  from '../../src/giochi/survivors/motore/sosta.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

/* una partita giocata davvero, fino a un certo secondo, e poi lasciata
   lì com'è: è quello che succede quando suonano alla porta */
function fino(regole, secondi, rnd, bravura = 0.85) {
  const p = new Partita(regole, { rnd })
  const pilota = new Pilota({ rnd, bravura })
  while (p.tempo < secondi && !p.finita) {
    if (p.inPausa) { pilota.rispondi(p); continue }
    pilota.guida(p, 1 / 30)
    p.avanza(1 / 30)
    p.svuotaEventi()
  }
  return p
}

const distanza = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

/* ══════════ 1. quello che si è fatto non si perde ══════════ */
{
  const t = CAMPAGNA[5]
  const p = fino(new Regole(t), t.durata / 2, caso(31))
  controlla('la prova parte da una partita giocata a metà',
            p.tempo > 10 && p.livello > 1, `${p.tempo.toFixed(1)}s, livello ${p.livello}`)

  const dato = scrivi(p, 5)
  const b = leggi(dato, t, { rnd: caso(99) })
  controlla('il salvataggio si rilegge', !!b)

  const firma = x => [Math.round(x.tempo), x.livello, x.xp, x.uccisi, x.ferite,
                      x.eroe.cuori, x.eroe.cuoriMax,
                      Math.round(x.eroe.x), Math.round(x.eroe.y),
                      JSON.stringify(x.potenziamenti),
                      x.nemici.length, x.gemme.length].join('|')
  uguale('e la partita è la stessa', firma(b), firma(p))
  /* i numeri dell'eroe non si salvano: si **rifanno** dalle carte prese,
     ed è il motivo per cui il salvataggio sta in poche righe */
  uguale('le carte prese valgono ancora quello che valevano',
         JSON.stringify(b.f), JSON.stringify(p.f))
  uguale('e la prossima soglia è quella del suo livello', b.prossima, p.prossima)

  nota(`un salvataggio pesa ${JSON.stringify(dato).length} byte`,
       `con ${dato.nemici.length} mostri e ${dato.gemme.length} gemme in campo`)
}

/* ══════════ 2. chi era addosso fa un passo indietro ══════════
   Riaprire il gioco con la melma sul naso è il modo più rapido di far
   pentire qualcuno di aver ripreso. Ma solo un passo: cancellarli
   tutti renderebbe l'uscita **una mossa** — quando sei circondato esci,
   rientri, e la marea ricomincia da capo mentre l'orologio no. */
{
  const t = CAMPAGNA[3]
  const p = new Partita(new Regole(t), { rnd: caso(4) })
  p.nemici = [
    { tipo: 'melma', x: 6, y: 0, vita: 5, vitaMax: 5, passo: 40, massa: 1 },
    { tipo: 'melma', x: 0, y: 0, vita: 5, vitaMax: 5, passo: 40, massa: 1 },
    { tipo: 'melma', x: 400, y: 0, vita: 5, vitaMax: 5, passo: 40, massa: 1 },
  ]
  p.tempo = 20
  const b = leggi(scrivi(p, 3), t, { rnd: caso(4) })
  const d = b.nemici.map(n => Math.round(distanza(n, b.eroe)))
  uguale('chi era addosso si ritrova a distanza di rispetto', d[0], SPAZIO)
  uguale('e anche chi stava esattamente sopra', d[1], SPAZIO)
  uguale('chi era lontano non si muove', d[2], 400)
  uguale('ma non se ne va nessuno', b.nemici.length, 3)
}

/* ══════════ 3. una partita ripresa si finisce ══════════
   È la prova vera: non che il dato torni indietro, ma che la partita
   arrivi in fondo dopo essere stata interrotta. */
{
  const t = CAMPAGNA[4]
  const regole = new Regole(t)
  const p = fino(regole, t.durata * 0.6, caso(77))
  controlla('si interrompe una partita viva', !p.finita && p.eroe.cuori > 0)

  const ripresa = leggi(scrivi(p, 4), t, { rnd: caso(78) })
  const { partita } = gioca(regole, { rnd: caso(78), bravura: 1, da: ripresa })
  controlla('una partita ripresa arriva al traguardo', partita.vinta,
            `finita a ${partita.tempo.toFixed(1)}s con ${partita.eroe.cuori} cuori`)
  controlla('e i mostri uccisi prima contano ancora', partita.uccisi >= p.uccisi,
            `${partita.uccisi} contro i ${p.uccisi} di prima`)
}

/* ══════════ 4. le tre carte in attesa restano quelle ══════════
   Chi esce mentre sta scegliendo — o mentre risponde alla domanda che la
   paga — ritrova la stessa offerta. Ripescarne una nuova sarebbe una riga
   in meno e un tiro nuovo a ogni uscita. */
{
  const t = CAMPAGNA[2]
  const p = new Partita(new Regole(t), { rnd: caso(12) })
  p.xp = p.prossima
  p.avanza(1 / 30)
  controlla('la partita si è fermata a chiedere una carta', p.inPausa && !!p.offerta)

  const b = leggi(scrivi(p, 2), t, { rnd: caso(555) })
  uguale('si riprende con le stesse tre carte',
         b.offerta.map(c => c.chiave).join(), p.offerta.map(c => c.chiave).join())
  uguale('e col prezzo che avevano', b.offerta.map(c => c.prezzo).join(),
         p.offerta.map(c => c.prezzo).join())
  controlla('la partita riprende in pausa, come l\'avevi lasciata', b.inPausa)
}

/* ══════════ 5. dopo il traguardo non si salva più ══════════
   Al traguardo stelle e monete sono già state contate. Salvare anche il
   tempo regalato vorrebbe dire portarsi dietro *che i premi sono già
   stati pagati* — e un salvataggio che si scorda quella riga paga la
   tappa due volte. */
{
  const t = CAMPAGNA[0]
  const { partita } = gioca(new Regole(t), { rnd: caso(3), bravura: 1 })
  controlla('la tappa è stata vinta', partita.vinta)
  uguale('una tappa vinta non lascia soste', scrivi(partita, 0), null)
  partita.continua()
  uguale('e nemmeno chi resta in campo dopo il traguardo', scrivi(partita, 0), null)

  const persa = new Partita(new Regole(t), { rnd: caso(3) })
  persa.esito = 'persa'
  uguale('una partita finita non lascia soste', scrivi(persa, 0), null)
}

/* ══════════ 6. quello che non si sa leggere si butta ══════════ */
{
  const t = CAMPAGNA[1]
  const p = fino(new Regole(t), 12, caso(9))
  const dato = scrivi(p, 1)

  uguale('un salvataggio di ieri non si legge', leggi({ ...dato, v: VERSIONE - 1 }, t), null)
  uguale('e nemmeno un dato senza eroe', leggi({ v: VERSIONE, tappa: 1 }, t), null)
  uguale('niente salvataggio, niente ripresa', leggi(null, t), null)
  uguale('e niente tappa nemmeno', leggi(dato, null), null)

  /* un mostro che non esiste più è una bestia senza scheda: non si
     disegna, non si uccide, e sta lì per sempre */
  const storto = { ...dato, nemici: [...dato.nemici, { t: 'chimera', x: 9, y: 9, vita: 3 }] }
  const b = leggi(storto, t)
  uguale('un mostro che non esiste più si butta', b.nemici.length, dato.nemici.length)
}

/* ══════════ 7. il salvataggio non cresce senza limite ══════════
   In campagna non si arriva mai a tanto: è la Sopravvivenza al decimo
   minuto che può avere duecento bestie in campo, e un salvataggio si
   scrive su un telefono ogni cinque secondi. */
{
  const p = new Partita(new Regole(LIBERO), { rnd: caso(2) })
  p.tempo = 300
  p.nemici = Array.from({ length: 400 }, (_, i) => ({
    tipo: 'melma', x: 200 + i * 10, y: 0, vita: 5, vitaMax: 5, passo: 40, massa: 1,
  }))
  const dato = scrivi(p, -1)
  uguale('si tiene un tetto di mostri', dato.nemici.length, MAX_NEMICI)
  controlla('e sono i più vicini, che sono quelli che contano',
            dato.nemici.every(n => n.x < 200 + MAX_NEMICI * 10),
            `il più lontano sta a ${Math.max(...dato.nemici.map(n => n.x))}`)
  controlla('un salvataggio pieno resta piccolo', JSON.stringify(dato).length < 12000,
            `${JSON.stringify(dato).length} byte`)
}

/* ══════════ 8. la carta della mappa dice a che punto eri ══════════ */
{
  const t = CAMPAGNA[6]
  const p = fino(new Regole(t), 30, caso(66))
  const riga = dice(scrivi(p, 6), CAMPAGNA, LIBERO)
  uguale('dice da che tappa si riprende', riga.nome, t.nome)
  uguale('e quanto manca al traguardo', riga.restano, Math.ceil(t.durata - Math.round(p.tempo * 10) / 10))
  uguale('coi cuori che restano', riga.cuori, p.eroe.cuori)
  uguale('e non è la sopravvivenza', riga.libera, false)

  const libera = new Partita(new Regole(LIBERO), { rnd: caso(1) })
  libera.tempo = 128
  const suo = dice(scrivi(libera, -1), CAMPAGNA, LIBERO)
  uguale('nella sopravvivenza si dice quanto hai resistito', suo.tempo, 128)
  uguale('perché non c\'è nessun traguardo da raggiungere', suo.libera, true)
  uguale('senza salvataggio non c\'è nessuna carta', dice(null, CAMPAGNA, LIBERO), null)
}

riassunto('survivors — la partita lasciata a metà')
