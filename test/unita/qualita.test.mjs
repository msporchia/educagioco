/* La fascia grafica: le soglie danno ai tre telefoni veri la fascia giusta, e una misura vecchia si rifà. */
import { fasciaDa, SOGLIE } from '../../src/grafica/benchmark/qualita-rapida.js'
import { PROFILI, FASCE, serveMisura, salvaMisura, misura } from '../../src/store/qualita.js'
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
riassunto('la fascia grafica')
