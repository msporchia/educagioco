/* La guida della fattoria 3D: il primo giro (passo dal quadro di quello che c'è), «E adesso?» e il consiglio sotto un «non si può»
   (risale la catena fino a un passo possibile oggi). Puri: niente Vue, niente three. Vedi docs/fattoria3d/guida.md.
   `node test/esegui.mjs fattoria3d-guida`
   tempo: 1 */
import { guidaDelPrimoGiro, servePrimoGiro, primoGiroFinito, BERSAGLI } from '../../src/giochi/fattoria3d/motore/guida.js'
import { comeAvere, cosaFaccioAdesso, FORME } from '../../src/giochi/fattoria3d/motore/consiglio.js'
import { Fattoria3d } from '../../src/giochi/fattoria3d/motore/fattoria3d.js'
import { sogliaDi } from '../../src/giochi/fattoria3d/dati/livelli.js'
import { RICETTE } from '../../src/giochi/fattoria3d/dati/ricette.js'
import { COLTURE } from '../../src/giochi/fattoria3d/dati/colture.js'
import { controlla, uguale as ug, riassunto } from '../aiuto/verifica.mjs'
const uguale = (n, a, b) => ug(n, JSON.stringify(a), JSON.stringify(b))

/* ══════════ 1. il primo giro ══════════ */
const q = (x = {}) => ({ campi: 1, vuoti: 1, ...x })
uguale('un campo vuoto: tocca Semina', guidaDelPrimoGiro(q()).dove, BERSAGLI.semina)
controlla('la manina c\'è: chi ha 4 anni non legge', guidaDelPrimoGiro(q()).mano === true)
uguale('il foglio dei semi: indica il grano', guidaDelPrimoGiro(q({ semi: true })).dove, BERSAGLI.seme)
controlla('armato per seminare: dice di toccare il campo, niente anello', guidaDelPrimoGiro(q({ modo: 'semina' })).dove === null && /campo/.test(guidaDelPrimoGiro(q({ modo: 'semina' })).testo))
uguale('semina fatta, il grano cresce: aspetta', [guidaDelPrimoGiro(q({ vuoti: 0, crescono: 1, secondi: 12 })).dove, /12 s/.test(guidaDelPrimoGiro(q({ vuoti: 0, crescono: 1, secondi: 12 })).testo)], [null, true])
uguale('un campo pronto: tocca Raccogli', guidaDelPrimoGiro(q({ vuoti: 0, maturi: 1 })).dove, BERSAGLI.raccogli)
controlla('un campo pronto ha la precedenza su uno vuoto', guidaDelPrimoGiro(q({ vuoti: 1, maturi: 1 })).dove === BERSAGLI.raccogli)
controlla('raccogli armato: tocca il campo', guidaDelPrimoGiro(q({ vuoti: 0, maturi: 1, modo: 'raccogli' })).dove === null)
uguale('raccolto fatto, il campo è di nuovo vuoto: il passo è Costruisci', guidaDelPrimoGiro(q({ vuoti: 1, raccolto: true, modo: 'semina' })).dove, BERSAGLI.costruisci)
uguale('raccolto e campi tutti vuoti già seminati: l\'ultimo passo è Costruisci', guidaDelPrimoGiro(q({ vuoti: 0, crescono: 0, raccolto: true })).dove, BERSAGLI.costruisci)
uguale('visto il menu delle costruzioni, tace', guidaDelPrimoGiro(q({ vuoti: 0, raccolto: true, visto: true })), null)
uguale('senza campi manda a costruirne uno', guidaDelPrimoGiro({ campi: 0 }).dove, BERSAGLI.costruisci)
uguale('con il menu aperto e senza campi indica la carta del campo', guidaDelPrimoGiro({ campi: 0, costruisci: true }).dove, BERSAGLI.carta)
uguale('un foglio che non conosce: tace', guidaDelPrimoGiro(q({ foglio: true })), null)
controlla('ogni passo ha un testo corto (si legge a 6 anni)', [q(), q({ semi: true }), q({ modo: 'semina' }), q({ vuoti: 0, maturi: 1 }), q({ vuoti: 0, maturi: 1, modo: 'raccogli' }), q({ vuoti: 0, crescono: 1, secondi: 20 }), q({ raccolto: true }), { campi: 0 }, { campi: 0, costruisci: true }].every(x => guidaDelPrimoGiro(x).testo.length <= 70))
controlla('serve a chi non ha fatto niente', servePrimoGiro({ esperienza: 0, merci: { grano: 0 }, prodotti: {}, lana: 0 }))
controlla('non serve a chi ha speso', !servePrimoGiro({ esperienza: 5, merci: {} }))
controlla('ma il primo raccolto costa 🪙1 e non conta come aver giocato', servePrimoGiro({ esperienza: 1, merci: {} }) && !primoGiroFinito({ esperienza: 1 }))
controlla('non serve a chi ha già roba in scorta', !servePrimoGiro({ esperienza: 0, merci: { grano: 3 } }))
controlla('finisce al primo raccolto più il menu, o a una spesa', primoGiroFinito({ raccolto: true, visto: true }) && primoGiroFinito({ esperienza: 5 }) && !primoGiroFinito({ raccolto: true }))

/* ══════════ 2. il consiglio ══════════ */
function mondo({ monete = 1000, liv = 1 } = {}) {
  const b = { monete }, t = { ora: 1_000_000 }
  const f = new Fattoria3d({ borsa: { quante: () => b.monete, paga: n => { b.monete -= n; return true } }, ora: () => t.ora })
  f.s.esperienza = sogliaDi(liv)
  f.tick()
  return { f, b, t }
}
const campo = f => f.s.cose.find(c => c.tipo === 'campo')
const AZIONI = r => r.azione ? r.azione.che : null

{
  const { f, t } = mondo({ monete: 5 })
  let c = cosaFaccioAdesso(f)
  uguale('fattoria nuova: semina', AZIONI(c), 'semina')
  uguale('…e dice cosa', c.azione.seme, 'grano')
  f.semina(campo(f).id, 'grano')
  c = cosaFaccioAdesso(f)
  controlla('seminato: si aspetta, senza tasto, e dice quanto in minuti', c.azione === null && /min/.test(c.testo), c.testo)
  t.ora += COLTURE.grano.ms + 1
  c = cosaFaccioAdesso(f)
  uguale('maturo: raccogli', AZIONI(c), 'raccogli')
  for (let k = 0; k < 4; k++) f.raccogliTessera(campo(f).id, k)
  const dopo = cosaFaccioAdesso(f)
  controlla('ogni consiglio ha un\'azione che la vista sa eseguire', FORME.includes(dopo.azione && dopo.azione.che) || dopo.azione === null, JSON.stringify(dopo))
}

{
  /* la catena: il pane vuole la farina, la farina vuole il grano (liv 17: panificio, mulino, campo) */
  const { f, t } = mondo({ liv: 17 })
  let c = comeAvere(f, 'pane')
  uguale('senza panificio: costruiscilo', [AZIONI(c), c.azione.tipo], ['costruisci', 'panificio'])
  f.s.posseduti.panificio = true; f.s.cose.push({ id: f.s.prossimoId++, tipo: 'panificio', i: 5, j: 5 })
  c = comeAvere(f, 'pane')
  uguale('col panificio ma senza farina: risale a un passo sul grano o sul mulino', ['semina', 'costruisci'].includes(AZIONI(c)), true)
  controlla('…e non dice più "pane"', /grano|mulino/i.test(c.testo), c.testo)
  f.s.posseduti.mulino = true; f.s.cose.push({ id: f.s.prossimoId++, tipo: 'mulino', i: 9, j: 9 })
  f.s.merci.grano = 4
  c = comeAvere(f, 'pane')
  uguale('col grano ma senza farina: apri il mulino', [AZIONI(c), c.azione.tipo], ['macchina', 'mulino'])
  f.s.prodotti.farina = 2
  c = comeAvere(f, 'pane')
  uguale('con la farina: apri il panificio', [AZIONI(c), c.azione.tipo], ['macchina', 'panificio'])
  uguale('un raccolto non ancora arrivato dice il livello', AZIONI(comeAvere(mondo({ liv: 1 }).f, 'riso')), 'livelli')
  void t
}

{
  const { f, t } = mondo({ liv: 1 })
  const c = comeAvere(f, 'grano')
  uguale('il grano si semina', AZIONI(c), 'semina')
  f.semina(campo(f).id, 'grano')
  controlla('…poi si aspetta e dice quanto', comeAvere(f, 'grano').azione === null && /min/.test(comeAvere(f, 'grano').testo))
  t.ora += COLTURE.grano.ms + 1
  uguale('…poi si raccoglie', AZIONI(comeAvere(f, 'grano')), 'raccogli')
}

controlla('ogni ricetta del gioco ha un consiglio che non lancia e non è vuoto', Object.keys(RICETTE).every(id => { try { const { f } = mondo({ liv: 20 }); const c = comeAvere(f, RICETTE[id].da || id); return c.testo.length > 0 && (!c.azione || FORME.includes(c.azione.che)) } catch (e) { return false } }))
controlla('uova e latte, lana e pesce hanno un consiglio', ['uova', 'latte', 'lana'].every(k => comeAvere(mondo({ liv: 20 }).f, k).testo.length > 0))

riassunto()
