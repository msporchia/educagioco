/* ═══════════════════════════════════════════════════════════════════
   UN PANNELLO DEL SOTTERRANEO, DA SOLO — il riquadro di `pannelli.html`

   `pannello.html?p=zaino&tema=legno` monta un pannello solo, coi
   componenti VERI di `src/giochi/sotterraneo/viste/` e la Domanda comune,
   dentro una radice `.sot` col tema chiesto: è il pezzo che il banco
   mette in un iframe (così le regole `@media` dei pannelli rispondono
   alla larghezza del riquadro, non a quella del monitor). Si apre anche
   da solo, ed è quello che fotografa `scatta-app.mjs --pagina`.

   I numeri li fa il motore vero (Corredo, Bottega) su un eroe tipo: il
   cavaliere a metà storia. I tasti non fanno niente: si guarda.
   Docs: docs/sotterraneo/tema-pannelli.md
   ═══════════════════════════════════════════════════════════════════ */
import { createApp, h } from 'vue'
import '../../src/emoji/emoji.css'
import '../../src/style.css'
import '../../src/giochi/sotterraneo/stile.css'
import '../../src/giochi/sotterraneo/stile-scontro.css'
import '../../src/giochi/sotterraneo/stile-effetti.css'
import '../../src/giochi/sotterraneo/stile-3d.css'
import '../../src/giochi/sotterraneo/tema/legno.css'
import '../../src/giochi/sotterraneo/tema/rilievo.css'
import { ATTRIBUTO, temaDi } from '../../src/giochi/sotterraneo/tema/tema.js'
import { accendiRilievo } from '../../src/giochi/sotterraneo/tema/rilievo.js'
import Domanda from '../../src/quiz/Domanda.vue'
import VeloPausa from '../../src/giochi/VeloPausa.vue'
import Foglio from '../../src/giochi/sotterraneo/viste/Foglio.vue'
import Cornice from '../../src/giochi/sotterraneo/viste/Cornice.vue'
import Pannello3d from '../../src/giochi/sotterraneo/viste/Pannello3d.vue'
import Zaino from '../../src/giochi/sotterraneo/viste/Zaino.vue'
import LaBottega from '../../src/giochi/sotterraneo/viste/Bottega.vue'
import PaginaEroe from '../../src/giochi/sotterraneo/viste/PaginaEroe.vue'
import PaginaAbilita from '../../src/giochi/sotterraneo/viste/PaginaAbilita.vue'
import ScegliPozione from '../../src/giochi/sotterraneo/viste/ScegliPozione.vue'
import Dialogo from '../../src/giochi/sotterraneo/viste/Dialogo.vue'
import CaselleAbilita from '../../src/giochi/sotterraneo/viste/CaselleAbilita.vue'
import FilaDeiTurni from '../../src/giochi/sotterraneo/viste/FilaDeiTurni.vue'
import BarraDiSotto from '../../src/giochi/sotterraneo/viste/BarraDiSotto.vue'
import Medaglione from '../../src/giochi/sotterraneo/viste/Medaglione.vue'
import Fine from '../../src/giochi/sotterraneo/viste/Fine.vue'
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { eroeDi } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { mercanteDi, schedeDi } from '../../src/giochi/sotterraneo/dati/mercanti.js'
import { NODI, RAMI } from '../../src/giochi/sotterraneo/dati/abilita.js'
import { Corredo } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { Bottega } from '../../src/giochi/sotterraneo/motore/bottega.js'
import { robaAttesa } from '../../src/giochi/sotterraneo/motore/storia.js'
import { crescitaA, puntiDaDare } from '../../src/giochi/sotterraneo/motore/crescita.js'
import { puntiAbilita, caselleDella } from '../../src/giochi/sotterraneo/motore/abilita.js'
import { quotaDi } from '../../src/giochi/sotterraneo/dati/livelli.js'

const q = new URLSearchParams(location.search)
const P = q.get('p') || 'domanda'
const TEMA = temaDi(q.get('tema')) || 'attuale'
const nulla = () => {}

// l'eroe tipo: il cavaliere con tre discese finite, al livello 8 e qualche cosa in tasca
const EROE = 'cavaliere'
const roba = robaAttesa(EROE, 3, { gemme: 240 })
roba.zaino = ['pozione', 'pozione', 'pozione-grande', 'ascia', 'anello-verde', 'pozione-blu']
const crescita = crescitaA(eroeDi(EROE), 8)
const c = new Corredo({ eroe: EROE, roba, crescita })
// come lo zaino di Gioco.vue: una voce per tasca, le pozioni uguali insieme
const voce = k => (k ? { chiave: k, ...COSE[k], nonPuoi: c.perchéNo(k), ancora: c.porta(k) && !c.posso(k),
                         prova: c.seLoMetto(k, { ancora: true }), ...((COSE[k].cura || COSE[k].tutta) ? { cura: c.curaDi(k) } : {}) } : null)
const tasche = () => Array.from({ length: c.capienza }, (_, i) => { const t = c.tasche()[i]; return t ? { ...voce(t.k), n: t.n } : null })

const DOMANDA = {
  testo: 'Quante decine ci sono nel 41?', chiave: 'banco:decine', giusta: 1,
  aiuto: 'La cifra a sinistra dice quante decine: 41 è 4 decine e 1 unità.',
  risposte: [{ testo: '41', perche: '41 è tutto il numero, non le decine.' }, { testo: '4' },
             { testo: '1', perche: '1 è la cifra delle unità.' }, { testo: '5', perche: 'Le decine di 41 sono 4.' }],
}

function scelte() {
  const nodi = caselleDella(c.crescita).filter(Boolean)
  const ramo = id => (RAMI[EROE] || []).find(r => r.chiave === NODI[id].ramo)
  const caselle = nodi.slice(0, 2).map((id, i) => ({ id, glifo: NODI[id].glifo, tinta: ramo(id) && ramo(id).tinta, nome: NODI[id].nome,
                                                      costo: 3 + i * 2, dice: i ? '' : 'colpisce due nemici vicini', perche: i ? 'poca energia' : '' }))
  return { attacco: 'fai 7 di danno', caselle, energia: 4, energiaMax: 12,
           bevi: { cura: 18, n: 3, tipi: 2, fatto: false }, scappa: { graffio: 4 } }
}
const MOSTRI = [{ sprite: 'scheletro-fermo-0', em: '💀', nome: 'Scheletro' }, { sprite: 'goblin-fermo-0', em: '👺', nome: 'Goblin' },
                { sprite: 'ratto-fermo-0', em: '🐀', nome: 'Ratto' }]
const TURNI = [{ chi: 'eroe' }, { chi: 0 }, { chi: 1 }, { chi: 2, salta: true }, { chi: 'eroe' }, { chi: 0 }, { chi: 1 }]
// il fondale dello scontro, finto: i turni ci stanno sopra a destra come sul palco vero
const palcoFila = () => h(FilaDeiTurni, { turni: TURNI, mostri: MOSTRI, eroe: { sprite: 'cavaliere-fermo-0', em: '🛡️' } })
const palco = () => h('div', { class: 'banco-palco' }, [palcoFila()])

function bottega() {
  const b = new Bottega({ eroe: EROE, roba, finite: 3, crescita })
  b.prepara('armaiolo')
  const m = mercanteDi('armaiolo')
  const vendibili = b.mercanziaVista('armaiolo').map(({ chiave: x, sempre, avanti, ruolo }) => {
    const costa = b.quantoCosta(x)
    return { chiave: x, sempre, ...COSE[x], costa, avanti, posso: b.gemme >= costa, ruolo, nonPuoi: b.porta(x) ? '' : b.perchéNo(x),
             serve: b.porta(x) ? b.perchéNo(x) : '', prova: b.seLoMetto(x, { ancora: true }), va: b.vaAddosso(x), mancano: Math.max(0, costa - b.gemme),
             quante: b.quanteNeHo(x) }
  })
  const v = x => (x && COSE[x] ? { chiave: x, ...COSE[x] } : null)
  return { chi: { ...m, schede: schedeDi(m, eroeDi(EROE)) }, roba: vendibili,
           addosso: { mano: v(b.mano), mancina: v(b.mancina), corpo: v(b.corpo), collo: v(b.collo), dito: v(b.dito), dito2: v(b.dito2) },
           numeri: { vita: b.vitaConLaRoba, att: b.att, dif: b.dif, gemme: b.gemme }, tasche: null, riacquisto: null,
           eroe: eroeDi(EROE), chiCompra: 'al mercante' }
}

function eroe() {
  const qt = quotaDi(c.crescita.esp)
  return { eroe: c.io, mano: c.mano, mancina: c.mancina, livello: qt.livello, fatto: qt.fatto, serve: qt.serve, punti: puntiDaDare(c.crescita),
           numeri: { vita: c.vitaConLaRoba, vitaMax: c.vitaConLaRoba, att: c.att, dif: c.dif, gemme: c.gemme },
           caratteristiche: c.caratteristiche(), cambia: true, tratti: [], tesori: { trovati: 2, tutti: 12 },
           puntiAbilita: puntiAbilita(c.crescita), costoRiassegnare: c.costoRiassegnare, missioni: 1 }
}

const barra = () => h(BarraDiSotto, { vita: 14, vitaMax: 30, livello: 8, esperienza: 0.42, espFatta: 50,
  espServe: 120, punti: 2, energia: 7, energiaMax: 12, puntiAbilita: 1, pozioni: 3, pieni: 5, tasche: 6, gemme: 240, preparabili: 2,
  missioniPronte: 1, incanti: [{ id: 'scudo', nome: 'Scudo', glifo: 'scudo', tinta: '#5fb8ff', passi: 32, dura: 60 }] })

const PANNELLI = {
  domanda: () => h(Foglio, { em: '🚪', titolo: 'Una porta chiusa' }, () => [
    h('div', { class: 'sot-domanda' }, [h(Domanda, { domanda: DOMANDA, gioco: 'prova', respiro: 600000 })]),
    h('button', { class: 'sot-grosso sot-chiaro' }, 'ci torno dopo')]),
  scontro: () => h(Cornice, { scontro: true }, () => [h('div', { class: 'sot-modale sot-modale-cornice' }, [
    palco(), h(CaselleAbilita, { ...scelte(), pericolo: { perche: 'duro', vita: 9, male: 12, bevuto: false } })])]),
  'scontro-domanda': () => h(Cornice, { scontro: true }, () => [h('div', { class: 'sot-modale sot-modale-cornice' }, [
    palco(),
    h('div', { class: 'sot-scelta sot-pronta sot-scelta-fatta' }, [h(Medaglione, { glifo: 'spada', tinta: '#e0a23a', stato: 'preso', misura: 28 }),
      h('span', { class: 'sot-scelta-testo' }, [h('b', 'Attacco'), h('small', 'fai 7 di danno')])]),
    h('div', { class: 'sot-domanda' }, [h(Domanda, { domanda: DOMANDA, gioco: 'prova', respiro: 600000 })])])]),
  // lo scontro nel 3D: la scena è un fondo finto (il 3D vero si guarda con scatta-app), sopra la fila dei turni, in fondo il pannello
  'scontro-3d': () => [h('div', { class: 'sot-campo banco-campo banco-scena3d' }, [h('div', { class: 'sot3d-fila' }, [palcoFila()])]),
    h(Pannello3d, { scontro: true }, () => [h('div', { class: 'sot3d-scelta' }, [h(CaselleAbilita, { ...scelte(), pericolo: { perche: 'duro', vita: 9, male: 12, bevuto: false } })])]),
    barra()],
  'scontro-3d-domanda': () => [h('div', { class: 'sot-campo banco-campo banco-scena3d' }, [h('div', { class: 'sot3d-fila' }, [palcoFila()])]),
    h(Pannello3d, { scontro: true }, () => [h('div', { class: 'sot3d-scelta' }, [
      h('div', { class: 'sot-scelta sot-pronta sot-scelta-fatta' }, [h(Medaglione, { glifo: 'spada', tinta: '#e0a23a', stato: 'preso', misura: 28 }),
        h('span', { class: 'sot-scelta-testo' }, [h('b', 'Attacco'), h('small', 'fai 7 di danno')])]),
      h('div', { class: 'sot-domanda' }, [h(Domanda, { domanda: DOMANDA, gioco: 'prova', respiro: 600000 })])])]),
    barra()],
  zaino: () => h(Zaino, { eroe: eroeDi(EROE), mano: voce(c.mano), mancina: voce(c.mancina), corpo: voce(c.corpo), collo: voce(c.collo),
                          dito: voce(c.dito), dito2: voce(c.dito2), tasche: tasche(), att: c.att, dif: c.dif, vita: Math.round(c.vitaConLaRoba * 0.7), vitaMax: c.vitaConLaRoba,
                          gemme: c.gemme, piano: 2, piani: 4, punti: 2, puntiAbilita: 1, missioni: 1, costoTasca: c.costoTasca,
                          cure: { n: c.pozioniDiCura, max: 8 }, torcia: { quota: 0.6, resta: 3, scorta: 1 } }),
  bottega: () => h(LaBottega, bottega()),
  eroe: () => h(PaginaEroe, eroe()),
  abilita: () => h(PaginaAbilita, { eroe: c.io, livello: c.livelloEroe, punti: puntiAbilita(c.crescita), crescita: c.crescita,
                                    energia: c.energiaMax, energiaMax: c.energiaMax, haLArma: a => c.haLArma(a), gemme: c.gemme,
                                    costoDimenticare: c.costoDimenticare, puntiEroe: 2, vitaMax: c.vitaConLaRoba, missioni: 1 }),
  pozione: () => h(ScegliPozione, { manca: 14, scelte: [
    { k: 'pozione', n: 2, i: 0, cura: 12, nome: COSE.pozione.nome, em: COSE.pozione.em, sprite: COSE.pozione.sprite },
    { k: 'pozione-grande', n: 1, i: 2, cura: 24, nome: COSE['pozione-grande'].nome, em: COSE['pozione-grande'].em, sprite: COSE['pozione-grande'].sprite }] }),
  dialogo: () => h('div', { class: 'sot-terra-sotto banco-sotto' }, [h(Dialogo, { chi: 'minatore', nome: 'Il minatore',
    pagine: [{ testo: 'Laggiù i topi hanno rosicchiato le mie corde. Se me ne riporti tre, ti do qualcosa di buono.' }],
    scelte: [{ che: 'prendi', testo: 'Ci penso io', premio: '💎 40' }, { che: 'bottega', testo: 'Fammi vedere la roba' }, { che: 'ciao', testo: 'Arrivederci' }] })]),
  barra: () => [h('div', { class: 'sot-campo banco-campo' }), barra()],
  fine: () => h(Fine, { vinta: true, titolo: 'La scalinata antica', stelle: 2, monete: 12,
                        fatti: { piani: 4, quantiPiani: 4, domande: 23, mostri: 17, tesori: 3, esp: 140 } }),
  pausa: () => h(VeloPausa, { dove: 'La scalinata antica · piano 2 di 4' }, () => [
    h('button', { type: 'button', class: 'sot-lascia' }, 'scelgo un altro eroe'),
    h('button', { type: 'button', class: 'sot-lascia' }, 'lascio perdere questa discesa')]),
}

const radice = document.getElementById('banco')
radice.setAttribute('class', 'sot banco-sot')
if (ATTRIBUTO[TEMA]) radice.setAttribute('data-tema', ATTRIBUTO[TEMA])
const fai = PANNELLI[P] || PANNELLI.domanda
createApp({ render: () => fai() }).mount(radice)
if (TEMA === 'rilievo') accendiRilievo(radice)

// gli stati della risposta, senza toccare: dopo i 320 ms ciechi, un click sulla giusta o su una sbagliata
const stato = q.get('stato')
if (stato === 'giusta' || stato === 'sbagliata') {
  setTimeout(() => {
    const t = [...document.querySelectorAll('.qz-tasto')]
    const quale = stato === 'giusta' ? t.find(x => x.hasAttribute('data-giusta')) : t.find(x => !x.hasAttribute('data-giusta'))
    if (quale) quale.click()
  }, 450)
}
document.title = `${P} · ${TEMA}`
