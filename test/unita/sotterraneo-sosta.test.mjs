/* La discesa lasciata a metà: si scrive, si rilegge, e **si finisce**.
   Una discesa dura venti minuti e tre piani, e prima chiudere il gioco
   voleva dire buttarla via. Qui si prova la cosa che conta davvero —
   non che il salvataggio «esista», ma che una partita ripresa sia la
   stessa partita e arrivi in fondo.
   `node test/esegui.mjs sosta --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { TASCHE } from '../../src/giochi/sotterraneo/dati/mondo.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { seminato } from '../../src/giochi/sotterraneo/motore/livello.js'
import { gioca } from '../../src/giochi/sotterraneo/motore/banco.js'
import { scrivi, leggi, dice, stringaDi, vistoDa, VERSIONE }
  from '../../src/giochi/sotterraneo/motore/sosta.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. la mappa vista, compressa ══════════
   Duemilaseicento zeri e uno scritti tali e quali sono venti chilobyte
   di JSON per niente: si contano le lunghezze dei tratti. */
{
  const visto = new Uint8Array(50)
  for (let i = 10; i < 22; i++) visto[i] = 1
  visto[40] = 1
  const s = stringaDi(visto)
  uguale('e si rilegge identica', vistoDa(s, 50).join(), visto.join())
  controlla('e sta in poche cifre', s.length < 20, s)

  const tutta = new Uint8Array(2704)
  uguale('una mappa mai vista è un numero solo', stringaDi(tutta), '2704')
}

/* ══════════ 2. quello che si è fatto non si perde ══════════ */
{
  const c = new Corsa(CAMPAGNA[1], { seme: 314, rnd: seminato(314) })
  /* si gioca un pezzo per davvero: si cammina, si apre un forziere, si
     batte qualcuno, si mette qualcosa in mano */
  const f = c.livello.robe.find(r => r.che === 'forziere')
  c.foglio = { che: 'forziere', chi: f }
  c.rispondi(true)
  const m = c.livello.robe.find(r => r.che === 'mostro' && !r.chiave)
  c.foglio = { che: 'scontro', chi: m }
  for (let i = 0; i < 30 && !m.morto; i++) { c.rispondi(true); if (!c.foglio) break }
  c.zaino.push('pozione')
  c.mano = 'spada'
  c.mancina = 'accetta'      // la seconda arma si riprende com'era
  c.gemme = 77
  c.vita = 13
  for (let i = 0; i < 40; i++) c.passo(1 / 30)

  const dato = scrivi(c, 1)
  const b = leggi(dato, CAMPAGNA[1])
  controlla('il salvataggio si rilegge', !!b)

  const firma = x => [x.piano, x.vita, x.vitaMax, x.gemme, x.mano, x.mancina, x.corpo,
                      x.zaino.join(), x.chiaveDelPiano, x.torcia,
                      Math.floor(x.eroe.x), Math.floor(x.eroe.y),
                      x.domande, x.mostriBattuti, x.tesori, x.stanzeViste].join('|')
  uguale('e la discesa è la stessa', firma(b), firma(c))
  uguale('il piano è quello di prima, rifatto dal seme',
         b.livello.celle.join(), c.livello.celle.join())
  uguale('la mappa esplorata è quella', b.visto.join(), c.visto.join())
  uguale('e le cose stanno dove stavano', b.livello.robe.length, c.livello.robe.length)
  controlla('il forziere aperto è ancora aperto',
            b.livello.robe.some(r => r.che === 'forziere' && r.aperto))
  controlla('e chi era caduto è ancora caduto',
            b.livello.robe.filter(r => r.che === 'mostro' && r.morto).length ===
            c.livello.robe.filter(r => r.che === 'mostro' && r.morto).length)

  nota(`un salvataggio pesa ${JSON.stringify(dato).length} byte con ${dato.robe.length} cose in giro`)
}

/* ══════════ 3. i mostri tornano al loro posto ══════════
   Riaprire il gioco con l'orco addosso e un colpo già partito è il modo
   più rapido di far pentire qualcuno di aver ripreso. */
{
  const c = new Corsa(CAMPAGNA[2], { seme: 8, rnd: seminato(8) })
  const m = c.livello.robe.find(r => r.che === 'mostro')
  m.fx = m.x + 6.5; m.fy = m.y + 0.5
  m.casa = { x: m.x, y: m.y }
  m.sveglio = true
  m.calmo = 0
  const casa = { x: m.x, y: m.y }

  const b = leggi(scrivi(c, 2), CAMPAGNA[2])
  const stesso = b.livello.robe.find(r => r.che === 'mostro')
  uguale('chi inseguiva si ritrova a casa sua', `${stesso.x},${stesso.y}`, `${casa.x},${casa.y}`)
  uguale('e non è più sveglio', !!stesso.sveglio, false)
}

/* ══════════ 4. una discesa ripresa si finisce ══════════
   È la prova vera: non che il dato torni indietro, ma che la partita
   arrivi in fondo dopo essere stata interrotta. */
{
  const t = CAMPAGNA[2]
  const c = new Corsa(t, { seme: 101, rnd: seminato(101) })
  /* mezza discesa vera, poi si chiude l'applicazione di colpo */
  const mezzo = gioca(t, { seme: 101, bravura: 1, come: 'minimo', da: c })
  controlla('la prova parte da una discesa giocata', mezzo.esito.domande > 0)

  const dopo = new Corsa(t, { seme: 202, rnd: seminato(202) })
  const salvato = scrivi(dopo, 2)
  for (let i = 0; i < 60; i++) dopo.passo(1 / 30)
  const ripresa = leggi(salvato, t)
  const finita = gioca(t, { seme: 202, bravura: 1, come: 'minimo', da: ripresa })
  controlla('una discesa ripresa arriva in fondo', finita.esito.vinta,
            finita.guasto || `${finita.esito.piani}/${finita.esito.quantiPiani} piani`)
}

/* ══════════ 5. quello che non si sa leggere si butta ══════════
   Una partita persa è un dispiacere; una partita ripresa a metà con dei
   campi che non tornano è un gioco rotto in un modo che nessuno sa
   spiegare. */
{
  const c = new Corsa(CAMPAGNA[0], { seme: 5, rnd: seminato(5) })
  const dato = scrivi(c, 0)
  uguale('un salvataggio di ieri non si legge', !!leggi({ ...dato, v: 1 }, CAMPAGNA[0]), false)
  uguale('e nemmeno un dato storto', leggi({ v: VERSIONE, robe: null }, CAMPAGNA[0]), null)
  uguale('niente salvataggio, niente ripresa', leggi(null, CAMPAGNA[0]), null)

  /* una discesa finita non si salva: non c'è più niente da riprendere */
  c.finita = true
  uguale('una discesa finita non lascia soste', scrivi(c, 0), null)

  const riga = dice(dato, CAMPAGNA)
  uguale('la carta dice da che tappa si riprende', riga.nome, CAMPAGNA[0].nome)
  uguale('e a che piano si era', riga.piano, 1)
}

/* ══════════ 6. chi scendeva è chi risale ══════════
   `eroe` voleva dire due cose nello stesso oggetto — chi scende e dove
   sta — e la seconda cancellava la prima: si riprendeva col cavaliere
   qualunque eroe si fosse scelto, mentre la mappa delle discese
   continuava a mostrare il ritratto giusto. Da fuori si vedeva così:
   «ogni tanto mi ritrovo con l'eroe sbagliato». */
{
  for (const chi of ['mago', 'nano', 'elfa', 'cavaliere']) {
    const c = new Corsa(CAMPAGNA[1], { seme: 42, rnd: seminato(42), eroe: chi })
    for (let i = 0; i < 30; i++) c.passo(1 / 30)
    const dato = scrivi(c, 1)
    const b = leggi(dato, CAMPAGNA[1])
    uguale(`si riprende da ${chi}`, b.chiEro, chi)
    uguale('con la sua vita', b.vitaMax, c.vitaMax)
    uguale('e dove si era', `${Math.floor(b.eroe.x)},${Math.floor(b.eroe.y)}`,
           `${Math.floor(c.eroe.x)},${Math.floor(c.eroe.y)}`)
    uguale('e la carta lo dice', dice(dato, CAMPAGNA).eroe, chi)
  }

  /* un salvataggio della 2 — dove `eroe` portava la cella — si legge
     ancora: si riprende col cavaliere, che è quello che il gioco dava
     comunque, invece di buttare venti minuti di discesa */
  const c = new Corsa(CAMPAGNA[1], { seme: 42, rnd: seminato(42), eroe: 'mago' })
  const vecchio = { ...scrivi(c, 1), v: 2 }
  delete vecchio.dove
  vecchio.eroe = { x: c.eroe.x, y: c.eroe.y }
  const b = leggi(vecchio, CAMPAGNA[1])
  controlla('un salvataggio della 2 si riprende lo stesso', !!b)
  uguale('e senza un nome scritto tocca al cavaliere', b && b.chiEro, 'cavaliere')

  /* ...a meno che chi chiama non sappia chi gioca in questa casa. È il
     caso vero: la discesa l'aveva cominciata l'elfa, il salvataggio
     vecchio non se n'è accorto, e il campo mostrava un cavaliere mentre
     l'inventario mostrava l'elfa — due fonti per la stessa cosa. */
  const conRipiego = leggi(vecchio, CAMPAGNA[1], 'elfa')
  uguale('col ripiego di casa si riprende da chi gioca', conRipiego.chiEro, 'elfa')
  uguale('e la carta non inventa un nome che non ha',
         dice(vecchio, CAMPAGNA).eroe, null)
  uguale('e dalla cella giusta', b && `${Math.floor(b.eroe.x)},${Math.floor(b.eroe.y)}`,
         `${Math.floor(c.eroe.x)},${Math.floor(c.eroe.y)}`)
}

/* le cose per terra sopravvivono alla chiusura: sono l'unica cosa che
   non si rigenera dal seme, e quindi l'unica che si può perdere */
{
  const c = new Corsa(CAMPAGNA[0], { seme: 61, rnd: seminato(61) })
  c.zaino = ['ascia']   // gradino 2 della famiglia delle asce
  c.butta(0)
  const b = leggi(scrivi(c, 0), CAMPAGNA[0])
  controlla('l\'ascia lasciata per terra è ancora lì',
            b.livello.robe.some(r => r.che === 'cosa' && r.cosa === 'ascia' && !r.presa))
  uguale('e si sa ancora com\'è fatta', COSE.ascia.att, 3)
}

/* ── e quello che allora si portava e adesso no ──
   Il caso non è un id sparito, che `leggi` toglieva già: è una discesa
   cominciata **prima** che le classi avessero un limite, e ripresa da
   una classe che quella roba non la porta. Non si butta e non resta
   addosso di nascosto: va in tasca, o per terra se le tasche sono
   piene, che è la stessa regola dello sfratto delle due mani. */
{
  const c = new Corsa(CAMPAGNA[0], { seme: 77, rnd: seminato(77), eroe: 'mago' })
  const dato = scrivi(c, 0)
  dato.mano = 'ascia'          // un mago non impugna le asce
  dato.corpo = 'corazza'       // e non veste il ferro
  dato.zaino = []
  const b = leggi(dato, CAMPAGNA[0])
  uguale('l\'ascia di ieri esce dal pugno', b.mano, null)
  uguale('e la corazza da addosso', b.corpo, null)
  controlla('ma finiscono in tasca, non nel niente',
            b.zaino.includes('ascia') && b.zaino.includes('corazza'), b.zaino.join())
  controlla('e la riga dice perché', b.avvisi.some(a => String(a).includes('non impugna')),
            JSON.stringify(b.avvisi))

  /* con le tasche piene non c'è posto: allora per terra, dove ci si può
     tornare — mai buttata via */
  const pieno = scrivi(c, 0)
  pieno.mano = 'ascia'
  pieno.zaino = new Array(TASCHE).fill('pozione')
  const d = leggi(pieno, CAMPAGNA[0])
  uguale('con lo zaino pieno il pugno si svuota lo stesso', d.mano, null)
  controlla('e l\'ascia è per terra, non persa',
            d.livello.robe.some(r => r.che === 'cosa' && r.cosa === 'ascia' && !r.presa))
}

riassunto('la discesa lasciata a metà')
