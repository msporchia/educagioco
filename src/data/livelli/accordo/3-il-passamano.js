/* 3 ─ DUE CHE SI RISPONDONO. Non un segnale solo, una catena di tre: il
      cavaliere sgombra il primo tratto e grida «pronto», l'eroe entra e
      scopre un secondo guardiano che lui da fuori non poteva vedere,
      grida «aiuto», e il cavaliere — che nel frattempo è di nuovo
      libero — riparte da lì e, quando anche il secondo è caduto, grida
      «fatto». È lo stesso «uno suona, l'altro ascolta» di «Mettetevi
      d'accordo» (tutorial 4), ripetuto due volte, con lo stesso che una
      volta parla e una volta ascolta.

      PERCHÉ TRE GRIDI E NON UN'ATTESA — l'eroe è dall'altra parte della
      stanza: quel secondo combattimento non lo vede, e «aspetta che sia
      caduto» sarebbe la stessa onniscienza che il gioco vieta altrove.
      Quello che non vede te lo deve dire qualcuno — è la regola di
      questa campagna — e allora è chi combatte a chiuderla, con un
      grido in più invece di uno sguardo che l'eroe non ha.

      IL SECONDO GUARDIANO STA IN UNO DI TRE POSTI, sempre più lontano
      dalla sala interna e sempre più vicino a dove aspetta l'eroe — e
      QUESTO È IL PUNTO: se è vicino alla sala, il cavaliere lo
      raggiunge molto prima che l'eroe possa avvicinarsi, e non c'è
      partita. Se è lontano, dalla parte dell'eroe, chi non aspetta ci
      arriva prima lei — viva, e lo trova ancora in piedi.

      LA FRAGILE aspetta il primo grido e il secondo che lei stessa manda
      — quelli li sa aspettare — ma non il terzo: dopo aver chiamato
      aiuto si fionda sul tesoro senza sapere se il cavaliere abbia
      davvero finito. È la stessa fretta di sempre, spostata sull'ultimo
      anello della catena invece che sul primo. */

import { livello, campo, cose, chi, fai, se } from '../scrivi.js'

const cavaliere = chi.nostro('cavaliere', 'il cavaliere', { corpo: 'cavaliere', emoji: '🛡️', vita: 30, vista: 10 })
const eroe = chi.nostro('eroe', "l'eroe", { corpo: 'ladra', emoji: '🦸', vita: 1 })
/* IL PRIMO GUARDIANO — fisso, e sempre lo stesso: non è lui a cambiare
   da una battaglia all'altra, è il secondo. */
const orco1 = chi.orco('orco1', 'il primo guardiano', { vista: 2, vita: 4,
  fa: [fai.aspettaDiVedere('nostri'), fai.attacca('nostri')] })
const guardiano2 = chi.orco('orco2', 'il secondo guardiano', { vista: 2, vita: 3,
  fa: [fai.aspettaDiVedere('nostri'), fai.attacca('nostri')] })

const tesoro = cose.tesoro()
const interno = cose.posto('interno', 'la sala interna')
const pronto = cose.segnale('pronto', 'pronto!', { em: '📣', col: '#3fb872' })
const aiuto = cose.segnale('aiuto', 'aiuto!', { em: '❗', col: '#d84f4f' })
const fatto = cose.segnale('fatto', 'fatto!', { em: '✅', col: '#3fb872' })
const dove = cose.segnaposto()

/* UN CORRIDOIO SOLO — il cavaliere e l'eroe partono ai due capi
   opposti. Il cavaliere sgombra il primo guardiano vicino al suo,
   raggiunge la sala interna, e da lì il secondo guardiano può essere
   in uno di tre posti lungo il resto del corridoio: il primo è vicino
   alla sala, l'ultimo è vicino a dove aspetta l'eroe. */
const CORRIDOIO = campo([
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|CA|..|G1|..|II|T$|g1|..|g2|..|..|..|..|..|g3|..|..|..|EE|..|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
], { CA: cavaliere, EE: eroe, G1: orco1, II: interno, 'T$': tesoro,
     g1: dove, g2: dove, g3: dove })

export const PASSAMANO = livello({
  id: 'accordo-passamano', nome: 'Il passamano',
  idea: "Una catena di tre segnali: chi combatte chiude la catena, non chi aspetta.",
  dritta: "Obiettivo: <b>il tesoro deve finire in mano all'eroe</b>. E l'eroe cade al primo colpo.",
  racconto: "Il cavaliere sgombra l'ingresso e grida che è pronto. L'eroe entra, trova un secondo guardiano che il cavaliere da fuori non vedeva — <b>in quale dei tre posti cambia a ogni battaglia</b> — e grida aiuto: il cavaliere riparte da lì, e quando anche quello è caduto grida che è fatta.",
  aiuti: ["Il cavaliere non vede tutto il corridoio da dov'è: solo il primo tratto.",
          "L'eroe non vede il secondo combattimento: deve essere qualcun altro a dirle come va a finire.",
          "Sono tre gridi in fila, non due: ognuno parte solo se il precedente è già arrivato."],
  ambiente: 'ingranaggi',

  scena: CORRIDOIO,
  segnali: [pronto, aiuto, fatto],
  complementi: ['tesoro', 'orchi', 'orco1', 'interno', 'pronto', 'aiuto', 'fatto'],
  verbi: ['vai', 'prendi', 'attacca', 'suona', 'quando'],
  vince: [se.ha(eroe, tesoro)],
  perde: [se.caduto(eroe)],
  motivoSconfitta: 'Un guardiano ha preso l\'eroe.',
  mostraNemici: true,

  varianti: [
    { nome: 'il secondo guardiano è vicino alla sala', metti: { g1: guardiano2 } },
    { nome: 'il secondo guardiano è a metà corridoio', metti: { g2: guardiano2 } },
    { nome: "il secondo guardiano è vicino all'eroe", metti: { g3: guardiano2 } },
  ],

  soluzioni: [
    { nome: 'uno chiama, l\'altra risponde, il primo chiude la catena', piano: {
      cavaliere: [fai.attacca(orco1), fai.suona(pronto),
                  fai.quando(aiuto, fai.vai(interno), fai.attacca('orchi'), fai.suona(fatto))],
      eroe: [fai.quando(pronto, fai.suona(aiuto), fai.quando(fatto, fai.prendi(tesoro)))],
    } },
    /* FRAGILE: aspetta il primo grido, e manda lei stessa il secondo —
       quelli li sa aspettare — ma non il terzo: dopo aver chiamato
       aiuto si fionda sul tesoro senza sapere se il cavaliere abbia già
       finito. Quando il secondo guardiano è vicino alla sala il
       cavaliere lo raggiunge molto prima che lei si avvicini; quando è
       dalla sua parte lei ci arriva prima, viva, e lo trova ancora in
       piedi. */
    { nome: 'chiama e corre, senza aspettare il terzo grido', fragile: true, piano: {
      cavaliere: [fai.attacca(orco1), fai.suona(pronto),
                  fai.quando(aiuto, fai.vai(interno), fai.attacca('orchi'), fai.suona(fatto))],
      eroe: [fai.quando(pronto, fai.suona(aiuto), fai.prendi(tesoro))],
    } },
  ],

  verifiche: {
    nonInFila: true,
    serveOgnuno: true,
  },
})

export default PASSAMANO
