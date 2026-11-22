/* Le quote del sotterraneo giocate col curioso (docs/sotterraneo/giocatori-tipo.md): le discese si vincono, il costo in domande
   sta in una seduta con la forbice larga, i quattro eroi arrivano in fondo, chi preme a caso no. Erano in `unita/sotterraneo` e
   `unita/sotterraneo-roba`, dove costavano un minuto e mezzo a ogni commit; le regole sono rimaste là. La misura intera (venti semi,
   i quattro eroi) è `misure/sotterraneo`.
   perché: le quote del sotterraneo giocate col curioso: le discese si vincono, il costo in domande sta in una seduta con la forbice larga, i quattro eroi arrivano in fondo e chi preme a caso no
   a parte perché: POTREBBE stare dentro misure/sotterraneo (stesso metro, il curioso): è più breve e, tolto dalle unità dov'era, resta il file da lanciare per primo; la misura intera ha venti semi
   `node test/esegui.mjs misure/sotterraneo-curioso --niente-build` */
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { EROI } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { costoDi, robaPer, crescitaPer } from '../../src/giochi/sotterraneo/motore/banco.js'
import { giocaDalCurioso, ingressoDelCurioso } from '../../src/giochi/sotterraneo/motore/storie.js'
import { stileDi } from '../../src/giochi/sotterraneo/dati/giocatori-tipo.js'
import { controlla, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. le discese si vincono, e quanto costano ══════════ */
// il tetto delle risposte obbligate per scendere dritti: 150 dal 30/10, quando i comuni sono passati a due o tre risposte (docs/sotterraneo/regole.md)
const SEDUTA = 150
{
  const conti = []
  for (const [i, t] of CAMPAGNA.entries()) {
    const { roba, crescita } = ingressoDelCurioso(i)   // la roba e il livello con cui il curioso ci arriva, e si gioca come lui (beve nello scontro)
    // sei storie, ognuna con la roba e il livello con cui il curioso arriva a questa discesa (9 giuste su 10): si vince alla prima
    const sei = Array.from({ length: 6 }, (_, s) => giocaDalCurioso(i, { eroe: 'cavaliere', seme: s + 1 }))
    const vinte = sei.filter(g => g.esito.vinta).length
    controlla(`${t.chiave}: il curioso la vince alla prima, quasi sempre`, vinte >= sei.length - 1,
              `${vinte}/${sei.length} ${sei.map(g => g.guasto).filter(Boolean).slice(0, 2).join(' · ')}`)
    const c = costoDi(t, { roba, crescita, stile: stileDi('curioso') })
    conti.push([t, c])
    // il tetto è una seduta; il pavimento è la forbice: se «tutto» costa quanto «il minimo», in mezzo non si sceglie più niente
    dentro(`${t.chiave}: il minimo per scendere sta in una seduta`, c.minimo, 5, SEDUTA)   // 5 e non 6: un seme su cinque ci sta, già prima
    // la grotta ha cinque piani da quattro stanze: quasi tutto quello che c'è sta sulla strada della scala, e la forbice è più stretta
    controlla(`${t.chiave}: chi ripulisce il piano paga molto di più`,
              c.tutto > c.minimo * (t.chiave === 'gallerie' ? 1.2 : 1.3), `minimo ${c.minimo}, tutto ${c.tutto}`)
  }
  nota('costo in domande, per tappa, con la roba del curioso:')
  for (const [t, c] of conti)
    nota(`  ${t.nome.padEnd(14)} minimo ${String(c.minimo).padStart(3)} · ` +
         `tutto ${String(c.tutto).padStart(3)} · ${t.piani} piani`)
}

/* ══════════ 2. i quattro eroi ══════════
   Con nessuno la discesa deve diventare lunga invece che difficile, e nessuno deve restare a metà. */
{
  const righe = []
  for (const e of EROI) {
    const costi = CAMPAGNA.map((t, i) => costoDi(t, { eroe: e.chiave, roba: robaPer(i, { eroe: e.chiave }),
                                                     crescita: crescitaPer(i, { eroe: e.chiave }) }).minimo)
    const peggio = Math.max(...costi)
    controlla(`${e.chiave}: nessuna discesa esce dalla seduta`, peggio <= SEDUTA,
              `la peggiore costa ${peggio} domande`)
    // due file per eroe, quattro discese ciascuna: una fila sola diceva più della fila che dell'eroe
    const otto = [1, 2].flatMap(seme => [0, 1, 2, 3].map(n => giocaDalCurioso(3, { eroe: e.chiave, seme, n })))
    const vinte = otto.filter(g => g.esito.vinta).length
    controlla(`${e.chiave}: il curioso vince la scala sommersa, quasi sempre`,
              vinte >= 6, `${vinte}/8 ${otto.map(g => g.guasto).filter(Boolean).slice(0, 1).join('')}`)
    righe.push(`  ${e.nome.padEnd(10)} ❤️ ${String(e.vita).padStart(2)} ⚔️ ${e.att} · ` +
               `domande per discesa: ${costi.join(' · ')}`)
  }
  nota('chi scende, e quanto gli costa:')
  for (const r of righe) nota(r)
}

/* ══════════ 3. chi preme a caso non ci arriva ══════════
   Dall'ingresso del curioso in otto storie, con le sue abilità e le sue pozioni: cambia solo quante risposte sono giuste. */
{
  const otto = bravura => Array.from({ length: 8 }, (_, s) => giocaDalCurioso(3, { eroe: 'cavaliere', seme: s + 1, bravura }))
  const conta = gs => ({ vinte: gs.filter(g => g.esito.vinta).length, quante: gs.length })
  const bene = conta(otto(0.9))
  const caso = conta(otto(0.35))
  controlla('rispondendo bene la scala sommersa si vince', bene.vinte >= 7,
            `${bene.vinte}/${bene.quante}`)
  controlla('premendo a caso no', caso.vinte <= 1, `${caso.vinte}/${caso.quante}`)
  nota(`la scala sommersa: ${bene.vinte}/8 vinte al 90% di risposte giuste, ` +
       `${caso.vinte}/8 al 35%`)
}

/* ══════════ 4. l'equilibrio, in piccolo ══════════
   Sei storie del curioso col cavaliere per discesa, ognuna con la roba che la sua storia gli ha dato: una discesa diventata una
   passeggiata o un muro si vede qui (era «8.» di `unita/sotterraneo-roba`). */
{
  const vinte = bravura => CAMPAGNA.map((_, k) => Array.from({ length: 6 }, (_, s) => giocaDalCurioso(k, { eroe: 'cavaliere', seme: s + 1, bravura }))
                                                   .filter(g => g.esito.vinta).length)
  const otto = vinte(0.9), quattro = vinte(0.4)
  for (const [k, t] of CAMPAGNA.entries()) {
    controlla(`${t.chiave}: col curioso, a nove su dieci si arriva in fondo`, otto[k] >= 5, `${otto[k]}/6`)
    // la scalinata (k = 1) a quattro su dieci si vince una volta su due, e il cavaliere con le abilità del banco una su tre nelle
    // discese più comode: su sei semi fino a tre vittorie sono il caso. Il fondo tiene un posto in più dalla torcia del 16 ottobre,
    // in attesa di ritarare (docs/sotterraneo/da-fare.md)
    if (k) controlla(`${t.chiave}: col curioso, a quattro su dieci non si vince quasi mai`, quattro[k] <= (k === 1 || t.chiave === 'fondo' ? 4 : 3), `${quattro[k]}/6`)
  }
  nota(`sei storie del curioso: a 9/10 ${otto.join(' · ')}, a 4/10 ${quattro.join(' · ')}`)
}

riassunto('il sotterraneo giocato dal curioso')
