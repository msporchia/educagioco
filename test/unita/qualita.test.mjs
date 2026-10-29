/* La fascia grafica: le soglie danno ai tre telefoni veri la fascia giusta, e una misura vecchia si rifà. */
import { fasciaDa, SOGLIE } from '../../src/grafica/benchmark/qualita-rapida.js'
import { PROFILI, FASCE, serveMisura, salvaMisura, misura, scelta } from '../../src/store/qualita.js'
import { ACCESI, applicaFascia, N_FUOCHI } from '../../src/giochi/sotterraneo/scena3d/costanti.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

// somma dei ms di pieno-1.5, pesante-1, strati-1, scoppi-500 nei log veri (strumenti/vecchio-telefono/log/)
uguale('Redmi Note 7 (52 punti, JS lento): bassa', fasciaDa(9.3 + 20.6 + 10.2 + 12.1, 117), 'bassa')
uguale('Pixel 9a (19 punti): alta', fasciaDa(3.5 + 5.9 + 4.1 + 6, 27), 'alta')
uguale('iPhone 12 Pro Max (23 punti): alta', fasciaDa(4 + 8 + 6 + 5, 17), 'alta')
uguale('a metà strada: media', fasciaDa(32, 50), 'media')
uguale('un JS lento scende di una fascia', fasciaDa(32, SOGLIE.jsLento), 'bassa')
for (const f of FASCE) controlla(`la fascia ${f} ha i numeri di tutti e due i giochi`, PROFILI[f].asteroidi.scintille > 0 && PROFILI[f].sotterraneo.dprMax > 0)
controlla('la bassa è più leggera dell\'alta', PROFILI.bassa.asteroidi.scintille < PROFILI.alta.asteroidi.scintille && PROFILI.bassa.sotterraneo.dprMax < PROFILI.alta.sotterraneo.dprMax)

globalThis.window = { devicePixelRatio: 2.75 }
controlla('senza misura serve', serveMisura(Date.now(), 2.75))
await salvaMisura({ fascia: 'bassa', punti: 50, js: 117, quando: Date.now(), dpr: 2.75, v: 1 })
controlla('misurata adesso: non serve', !serveMisura(Date.now(), 2.75))
controlla('dopo 31 giorni si rifà', serveMisura(Date.now() + 31 * 86400000, 2.75))
controlla('se cambia lo schermo si rifà', serveMisura(Date.now(), 2))

// il Sotterraneo 3D: la bassa spegne pezzi di ACCESI (anche numeri, `fuochi:2`), l'alta e la media li lasciano com'erano, e le
// fasce e il cheat `&spegni=` non si accumulano (docs/sotterraneo/grafica-3d-costi.md, «La fascia bassa»)
for (const f of FASCE) for (const v of PROFILI[f].sotterraneo.spegni) controlla(`${f}: «${v}» è un pezzo di ACCESI`, String(v).split(':')[0] in ACCESI, v)
scelta.value = 'bassa'; applicaFascia()
uguale('bassa: due fuochi', ACCESI.fuochi, 2)
controlla('bassa: niente passaggio finale, lampi e palco', !ACCESI.post && !ACCESI.lampi && !ACCESI.palco)
controlla('bassa: niente ombra del cono né del sole (misurato sul Note 7: ~8 ms), nebbia a una fetta, meno polvere', !ACCESI.ombre && !ACCESI.nebbiaFitta && ACCESI.quantaPolvere === 0.4)
uguale('bassa: metà scintille', ACCESI.quanteScintille, 0.5)
controlla('bassa: il piano con la luce per vertice (docs/sotterraneo/appiattimento-3d.md, «Nel gioco»)', !!ACCESI.lucePerVertice)
controlla('bassa: il terreno semplice, senza trame; le armi intere (docs/sotterraneo/prestazioni-3d-bassa.md)', !!ACCESI.terrenoSemplice && !!ACCESI.arredoSemplice && !ACCESI.armiSemplici)
applicaFascia([], ['lucePerVertice'])
controlla('bassa con `&riaccendi=lucePerVertice`: la bassa di prima, per confronto', !ACCESI.lucePerVertice && !ACCESI.ombre)
applicaFascia(['lucePerVertice'])
controlla('bassa con `&spegni=lucePerVertice`: tolta a mano', !ACCESI.lucePerVertice)
for (const f of ['alta', 'media']) {
  scelta.value = f; applicaFascia()
  controlla(`${f}: tutto come prima`, ACCESI.post && ACCESI.lampi && ACCESI.palco && ACCESI.fuochi === N_FUOCHI && ACCESI.ombraMappa === 1024 && ACCESI.ombraOgni === 1 && ACCESI.quanteScintille === 1 && ACCESI.ottaveNebbia === 4 && !ACCESI.lucePerVertice && !ACCESI.terrenoSemplice && !ACCESI.arredoSemplice && !ACCESI.armiSemplici)
}
applicaFascia(['fuochi:3', 'nebbia', 'ombraMappa'])
controlla('a mano: un numero, un nome spento, un numero senza valore va a zero', ACCESI.fuochi === 3 && !ACCESI.nebbia && ACCESI.ombraMappa === 0)
applicaFascia()
controlla('e la volta dopo si riparte da capo', ACCESI.fuochi === N_FUOCHI && ACCESI.nebbia)
scelta.value = 'auto'

riassunto('la fascia grafica')
