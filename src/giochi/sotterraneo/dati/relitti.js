// I relitti: roba ferma, rotta e pesante che sta in mezzo a una stanza e si aggira (docs/sotterraneo/piani-caverne.md). Bloccano il
// passo e fermano la luce del cono come un muro; non si toccano, non si spostano e non si raccolgono: niente casse, sacchi o barili
// (regola dell'utente, 12 ottobre 2026). Dato puro.
//
// Due cose separate, perché lo scenario non deve spostare niente del piano (come per l'arredo): la CLASSE dice quanto sta e dove (la
// geometria, uguale per tutti i piani), l'ASPETTO dice com'è fatto e cosa risponde (uno scenario e una famiglia, una lista per classe).
// Il piano pesca la classe, la posa, e solo dopo l'aspetto, da un numero fisso dalla cella: lo stesso piano con un altro scenario ha gli
// stessi ostacoli negli stessi posti, vestiti d'altro.
//
// classe: w, h (quante celle; il lato lungo sta in w, `orienta: 'entrambe'` lo gira anche in piedi) · peso: quanto è comune · posa:
//   'parete' (contro un muro), 'libero' (staccato, tutt'attorno stanza), 'qualsiasi'.
// aspetto: id · pezzo (lo sprite nell'atlante) oppure disegno (in codice, scena/relitti.js: provvisorio, da dipingere) · dice: cosa
//   risponde a chi lo tocca · `inPiedi: false` se non si può girare lungo due celle in verticale.

export const FAMIGLIE = ['costruita', 'caverna']
export const POSE_RELITTI = ['parete', 'libero', 'qualsiasi']

// i disegni in codice: ognuno ha il suo pittore in scena/relitti.js
export const DISEGNI = ['macerie', 'crollo', 'roccia', 'trave', 'stalagmite', 'carro', 'binari']

// i colori di pietra dei disegni in codice, uno per scenario: chiaro, medio, scuro, il filo attorno, il ferro e il legno
export const TINTE_RELITTI = {
  cantine: { chiaro: '#8d7a63', medio: '#615141', scuro: '#3a3028', filo: '#1e1713', ferro: '#6a6a6e', legno: '#6b4a2c' },
  cripta: { chiaro: '#8f9ba5', medio: '#5d6972', scuro: '#363f47', filo: '#14191d', ferro: '#6d7479', legno: '#5b4a3a' },
  fornace: { chiaro: '#8a665c', medio: '#5b413b', scuro: '#33231f', filo: '#150e0d', ferro: '#5c5456', legno: '#59391f' },
}

export const CLASSI = {
  cumulo: { w: 1, h: 1, peso: 4, posa: 'qualsiasi' },                       // macerie, blocchi: un mucchio dove capita
  pesante: { w: 1, h: 1, peso: 3, posa: 'parete' },                          // roba grossa che sta contro un muro
  isolato: { w: 1, h: 1, peso: 3, posa: 'libero' },                          // un pezzo solo in mezzo alla stanza, da girarci attorno
  lungo: { w: 2, h: 1, peso: 3, posa: 'qualsiasi', orienta: 'entrambe' },    // un crollo, una trave, un carro: due celle
}

const a = (id, dice, extra = {}) => ({ id, ...(extra.pezzo ? {} : { disegno: id }), dice, ...extra })
const MACERIE = a('macerie', 'Macerie: pietre cadute dal soffitto. Di qua non si passa.')
const CROLLO = a('crollo', 'Un crollo di pietre: bisogna girarci attorno.')
const ROCCIA = a('roccia', 'Una roccia grossa, rimasta lì da sempre.')
const TRAVE = a('trave', 'Una trave marcia, crollata di traverso.')
const STALAGMITE = a('stalagmite', 'Una stalagmite: ci ha messo mille anni a crescere.')
const p = (id, pezzo, dice) => ({ id, pezzo, dice })

// com'è fatto un relitto, per scenario e famiglia: una lista per classe (la scelta dentro la lista è di chi gioca la cella)
export const ASPETTI = {
  cantine: {
    costruita: { cumulo: [MACERIE], pesante: [ROCCIA, MACERIE], isolato: [ROCCIA], lungo: [CROLLO, TRAVE] },
    caverna: { cumulo: [MACERIE, ROCCIA], pesante: [ROCCIA, STALAGMITE], isolato: [STALAGMITE, ROCCIA], lungo: [CROLLO] },
  },

  // arredo-cripta-2.png: sarcofagi e statue rotte per le costruite, le rovine che sono rimaste per le grotte
  cripta: {
    costruita: {
      cumulo: [p('blocchi-caduti', 'cripta-blocchi-caduti', 'Blocchi di pietra caduti dal soffitto: di qua non si passa.'),
        p('colonna-moncone', 'cripta-colonna-moncone', 'Il moncone di una colonna.'), MACERIE],
      pesante: [
        p('sarcofago-liscio', 'cripta-sarcofago-liscio', 'Un sarcofago di pietra, pesantissimo. Meglio lasciarlo chiuso.'),
        p('sarcofago-spada', 'cripta-sarcofago-spada', 'Un sarcofago con una spada incisa: troppo pesante per spostarlo.'),
        p('sarcofago-stemma', 'cripta-sarcofago-stemma', 'Un sarcofago con uno stemma consumato.'),
        p('sarcofago-croce', 'cripta-sarcofago-croce', 'Un sarcofago con una croce. Dorme in pace, o ci prova.'),
        p('lastra-funeraria', 'cripta-lastra-funeraria', 'Una lastra funeraria in piedi. Il nome è consumato.'),
        p('cavaliere-spada', 'cripta-cavaliere-spada', 'Un cavaliere di pietra, di guardia da secoli. Pesa quanto un muro.'),
        p('cavaliere-scudo', 'cripta-cavaliere-scudo', 'Un cavaliere di pietra con lo scudo: non si sposta.'),
        p('pilastro-grata', 'cripta-pilastro-grata', 'Un pilastro con una grata di ferro.')],
      isolato: [
        p('colonna', 'cripta-colonna', 'Una colonna di pietra, ancora in piedi in mezzo alla sala.'),
        p('colonna-doppia', 'cripta-colonna-doppia', 'Due colonne gemelle, strette come fratelli.'),
        p('cavaliere-inginocchiato', 'cripta-cavaliere-inginocchiato', 'Un cavaliere di pietra inginocchiato sulla spada.'),
        p('cavaliere-seduto', 'cripta-cavaliere-seduto', 'Un cavaliere di pietra seduto, stanco di aspettare.'),
        p('cavaliere-mani', 'cripta-cavaliere-mani', 'Un cavaliere di pietra con le mani giunte.'),
        p('colonna-spezzata', 'cripta-colonna-spezzata', 'Una colonna spezzata: la cima è lì vicino, in pezzi.'),
        p('colonna-inclinata', 'cripta-colonna-inclinata', 'Una colonna storta, pronta a cadere da secoli.'),
        p('cavaliere-caduto', 'cripta-cavaliere-caduto', 'Un cavaliere di pietra, caduto e spezzato.'),
        p('sarcofago-crepato', 'cripta-sarcofago-crepato', 'Un sarcofago crepato. Dentro non si vede niente.'),
        p('sarcofago-aperto', 'cripta-sarcofago-aperto', 'Un sarcofago aperto. Vuoto, per fortuna.')],
      lungo: [CROLLO, TRAVE],
    },
    caverna: {
      cumulo: [p('blocchi-caduti', 'cripta-blocchi-caduti', 'Blocchi di pietra caduti dal soffitto: di qua non si passa.'),
        p('colonna-moncone', 'cripta-colonna-moncone', 'Il moncone di una colonna.'), MACERIE],
      pesante: [ROCCIA, p('lastra-funeraria', 'cripta-lastra-funeraria', 'Una lastra funeraria in piedi. Il nome è consumato.')],
      isolato: [STALAGMITE, p('colonna-inclinata', 'cripta-colonna-inclinata', 'Una colonna storta, pronta a cadere da secoli.'),
        p('cavaliere-caduto', 'cripta-cavaliere-caduto', 'Un cavaliere di pietra, caduto e spezzato.')],
      lungo: [CROLLO],
    },
  },

  // sotterraneo_5_3.png e il disegno: la torre ha statue e crolli, la miniera rocce, travi, un carro rovesciato e dei binari
  fornace: {
    costruita: {
      cumulo: [MACERIE, ROCCIA],
      pesante: [p('gargoyle', 'fornace-gargoyle-0', 'Un gargoyle di pietra, troppo pesante per spostarlo. Ti guarda male e basta.'),
        p('gargoyle-ala', 'fornace-gargoyle-1', 'Un gargoyle con le ali, di pietra e fermo da sempre.')],
      isolato: [ROCCIA, MACERIE],
      lungo: [CROLLO, TRAVE],
    },
    caverna: {
      cumulo: [MACERIE, ROCCIA],
      pesante: [ROCCIA, STALAGMITE],
      isolato: [STALAGMITE, ROCCIA],
      lungo: [a('carro', 'Un carro da miniera rovesciato, pesante e arrugginito.', { inPiedi: false }),
        a('binari', 'Binari divelti e attorcigliati.', { inPiedi: false }), TRAVE, CROLLO],
    },
  },
}

// l'aspetto di un relitto di quella classe, scelto da un numero fisso `n` (dalla cella): `inPiedi` dice se è girato in verticale
export function aspettoDi(scenario, famiglia, classe, n, inPiedi = false) {
  const lista = ((ASPETTI[scenario] || ASPETTI.cantine)[famiglia] || ASPETTI.cantine.costruita)[classe].filter(x => inPiedi ? x.inPiedi !== false : true)
  return lista[n % lista.length]
}

// tutti i nomi di sprite che un relitto chiede all'atlante
export const pezziDeiRelitti = () => [...new Set(Object.values(ASPETTI).flatMap(s => Object.values(s)).flatMap(f => Object.values(f)).flat().map(x => x.pezzo).filter(Boolean))]

export function guastiDeiRelitti(nomi = null) {
  const g = []
  for (const [k, c] of Object.entries(CLASSI)) {
    if (!(c.w >= 1 && c.h >= 1 && c.w * c.h <= 2)) g.push(`classe ${k}: da una a due celle`)
    if (!POSE_RELITTI.includes(c.posa)) g.push(`classe ${k}: posa «${c.posa}» che non esiste`)
    if (!(c.peso > 0)) g.push(`classe ${k}: senza peso`)
  }
  for (const [scenario, famiglie] of Object.entries(ASPETTI)) for (const f of FAMIGLIE) {
    if (!famiglie[f]) { g.push(`relitti ${scenario}: niente per la famiglia ${f}`); continue }
    for (const classe of Object.keys(CLASSI)) {
      const lista = famiglie[f][classe]
      if (!lista || !lista.length) { g.push(`relitti ${scenario} ${f}: la classe «${classe}» non ha aspetti`); continue }
      // girato in piedi deve restare almeno un aspetto
      if (CLASSI[classe].orienta === 'entrambe' && !lista.some(x => x.inPiedi !== false)) g.push(`relitti ${scenario} ${f} ${classe}: nessun aspetto sta in piedi`)
      const visti = new Set()
      for (const x of lista) {
        const dove = `relitti ${scenario} ${f} ${classe} «${x.id}»`
        if (visti.has(x.id)) g.push(`${dove}: c'è due volte`)
        visti.add(x.id)
        if (!!x.pezzo === !!x.disegno) g.push(`${dove}: vuole o un pezzo dell'atlante o un disegno in codice, uno solo`)
        if (x.disegno && !DISEGNI.includes(x.disegno)) g.push(`${dove}: il disegno «${x.disegno}» non esiste`)
        if (x.pezzo && nomi && !nomi.includes(x.pezzo)) g.push(`${dove}: nell'atlante non c'è «${x.pezzo}»`)
        if (!x.dice) g.push(`${dove}: non dice niente a chi lo tocca`)
        // regola dell'utente: niente che sembri da spostare o da raccogliere
        if (/\b(cassa|casse|sacco|sacchi|barile|barili|botte|forziere|baule)\b/i.test(x.id + ' ' + x.dice)) g.push(`${dove}: sembra da spostare o da raccogliere`)
      }
    }
  }
  for (const s of Object.keys(ASPETTI)) if (!TINTE_RELITTI[s]) g.push(`relitti ${s}: senza colori per i disegni in codice`)
  return g
}
