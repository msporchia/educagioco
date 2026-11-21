/* Le guide «Come si gioca» richiamate col ? (docs/core/come-si-gioca.md), dei giochi che avevano già il primo giro o che non
   hanno un file di prova suo: il passo dal quadro, puro. Ognuna fa fare una mossa vera e finisce con la riga col ✓.
   `node test/esegui.mjs guide-richiamate`
   tempo: 1 */
import { guidaDelLivello as passo, FRECCE, BERSAGLI as PP } from '../../src/giochi/passo-passo/motore/guida.js'
import { guidaDelLivello as robot, CASSETTA, BERSAGLI as CST } from '../../src/giochi/costruttore/motore/guida.js'
import { guidaDelSotterraneo, BERSAGLI as SOT } from '../../src/giochi/sotterraneo/motore/guida.js'
import { guidaDiSurvivors, BERSAGLI as SV } from '../../src/giochi/survivors/motore/guida.js'
import { guidaDellePozioni, BERSAGLI as PZ } from '../../src/giochi/pozioni/motore/guida.js'
import { guidaDellaCucina, BERSAGLI as CU } from '../../src/motore/bancarella/guida.js'
import { guidaDiEnglish, BERSAGLI as EN } from '../../src/giochi/inglese/motore/guida.js'
import { controlla, uguale as ug, riassunto } from '../aiuto/verifica.mjs'
const uguale = (n, a, b) => ug(n, JSON.stringify(a), JSON.stringify(b))

/* ── Passo passo: frecce, ▶, finché arriva alla tana ── */
uguale('Passo passo, fila vuota: l\'anello sulle frecce, senza manine (sono tante)', [passo({}).dove, !!passo({}).mano], [FRECCE, false])
uguale('una freccia in fila: ▶ con la manina', [passo({ fila: ['destra'] }).dove, passo({ fila: ['destra'] }).mano], [PP.via, true])
uguale('ha sbattuto: togli', passo({ fila: ['su'], provato: true, sbattuto: true }).dove, PP.togli)
uguale('lo zaino con 🔁 e nessuna scatola: 🔁', passo({ ripeti: true }).dove, PP.ripeti)
uguale('mentre corre tace', passo({ fila: ['su'], fermo: true }), null)
controlla('arrivato alla tana: la riga finale', passo({ vinto: true }).fine === true)
controlla('provato e non arrivato: dice di cambiare le frecce', /cambia/.test(passo({ fila: ['su'], provato: true }).testo))

/* ── il Robot: aggiungi, la cassetta, ▶ Via, finché il livello è vinto ── */
uguale('Robot, programma vuoto: «＋ aggiungi»', robot({}).dove, CST.aggiungi)
uguale('la cassetta aperta: i comandi', robot({ cassetta: true }).dove, CASSETTA)
uguale('righe scritte e mai provate: ▶ Via', robot({ righe: [{}] }).dove, CST.via)
uguale('mentre lavora tace', robot({ righe: [{}], inCorso: true }), null)
controlla('vinto: la riga finale', robot({ vinto: true }).fine === true)

/* ── il sotterraneo: camminare, una domanda, ⚔️ ── */
controlla('sotterraneo, all\'inizio: camminare, senza anello (il pavimento è nel 3D)', /pavimento/.test(guidaDelSotterraneo({}).testo) && guidaDelSotterraneo({}).dove === null)
controlla('camminato: porte, forzieri e mostri', /domanda/.test(guidaDelSotterraneo({ camminato: true }).testo))
uguale('nello scontro: ⚔️', guidaDelSotterraneo({ scontro: true }).dove, SOT.attacco)
uguale('con la domanda aperta tace', guidaDelSotterraneo({ domanda: true }), null)
controlla('tutto fatto: la riga finale', guidaDelSotterraneo({ camminato: true, risposto: true, colpito: true }).fine === true)

/* ── Survivors: muoversi, le gemme, una carta ── */
controlla('Survivors, all\'inizio: trascinare', /trascina/.test(guidaDiSurvivors({}).testo))
uguale('le carte aperte: l\'anello sulle carte', guidaDiSurvivors({ carte: true, mosso: true }).dove, SV.carta)
controlla('una carta presa: la riga finale', guidaDiSurvivors({ carta: true }).fine === true)

/* ── le pozioni: le ampolle, «Ordina», pulire ── */
uguale('pozioni, ordine vuoto: le targhette (o «Dal mercante»)', guidaDellePozioni({}).dove, PZ.ampolle)
uguale('ampolle nell\'ordine: «Ordina»', guidaDellePozioni({ bozza: 2 }).dove, PZ.ordina)
uguale('traboccato: pulisci', guidaDellePozioni({ sporco: true, bozza: 1 }).dove, PZ.pulisci)
uguale('il mercante versa: tace', guidaDellePozioni({ occupato: true }), null)
controlla('dosi giuste dopo un ordine: la riga finale', guidaDellePozioni({ pronta: true, ordinato: true }).fine === true)

/* ── la cucina: la ricetta, il cuoco, servire e il resto ── */
uguale('cucina, all\'inizio: i piatti delle ordinazioni', guidaDellaCucina({}).dove, CU.ordinato)
controlla('letta la ricetta: muovere il cuoco', /cuoco/.test(guidaDellaCucina({ letta: true }).testo))
controlla('alla cassa: il resto', /resto/.test(guidaDellaCucina({ letta: true, mosso: true, cassa: true }).testo))
controlla('servito: la riga finale', guidaDellaCucina({ servito: true }).fine === true)

/* ── English: la pagina, le opzioni o le tessere ── */
uguale('English, la pagina: «Ho capito»', guidaDiEnglish({ pagina: true }).dove, EN.capito)
uguale('una domanda a scelta: le opzioni', guidaDiEnglish({ domanda: true }).dove, EN.opzioni)
uguale('le tessere: il banco, poi «Fatto ✓»', [guidaDiEnglish({ domanda: true, tessere: true }).dove, guidaDiEnglish({ domanda: true, tessere: true, pronto: true }).dove], [EN.tessere, EN.fatto])
uguale('con la correzione a schermo tace', guidaDiEnglish({ domanda: true, esito: true }), null)
controlla('risposto: la riga finale', guidaDiEnglish({ risposto: true }).fine === true)

const altre = [guidaDelSotterraneo({}), guidaDelSotterraneo({ camminato: true }), guidaDelSotterraneo({ scontro: true }), guidaDelSotterraneo({ camminato: true, risposto: true, colpito: true }),
               guidaDiSurvivors({}), guidaDiSurvivors({ mosso: true }), guidaDiSurvivors({ carte: true }), guidaDiSurvivors({ carta: true }),
               guidaDellePozioni({}), guidaDellePozioni({ bozza: 1 }), guidaDellePozioni({ sporco: true }), guidaDellePozioni({ pronta: true, ordinato: true }),
               guidaDellaCucina({}), guidaDellaCucina({ letta: true }), guidaDellaCucina({ letta: true, mosso: true }), guidaDellaCucina({ cassa: true }), guidaDellaCucina({ servito: true }),
               guidaDiEnglish({ pagina: true }), guidaDiEnglish({ domanda: true }), guidaDiEnglish({ domanda: true, tessere: true }), guidaDiEnglish({ risposto: true })]
controlla('ogni riga degli altri giochi è corta', altre.every(p => p.testo.length <= 100), altre.map(p => p.testo.length).join())

const righe = [passo({}), passo({ fila: ['x'] }), passo({ vinto: true }), robot({}), robot({ cassetta: true }), robot({ righe: [{}], provato: true }), robot({ vinto: true })]
controlla('ogni riga è corta', righe.every(p => p.testo.length <= 100), righe.map(p => p.testo.length).join())

riassunto('le guide richiamate')
