/* ═══════════════════════════════════════════════════════════════════
   IL CATALOGO 3D DEL SOTTERRANEO — strumenti/banco/catalogo-3d/sotterraneo.js

   Le voci sono i modelli 3D in codice del Sotterraneo, uno per voce, per
   la pagina che li mette accanto a quelli della Fattoria. Qui si guarda
   che il contratto regga: i campi ci sono, gli id sono unici, il `file`
   nomina un pezzo di codice che esiste, e ogni `crea()` torna davvero
   qualcosa che si vede. E che nessun modello nuovo del gioco resti fuori
   dall'elenco: le tabelle del gioco sono confrontate con le voci.
   In Node non c'è un canvas: le trame sono vuote, la forma c'è tutta.
   ═══════════════════════════════════════════════════════════════════ */
import { readFileSync, existsSync } from 'node:fs'
import { Box3, Vector3 } from 'three'
import { VOCI, TABELLE } from '../../strumenti/banco/catalogo-3d/sotterraneo.js'
import { MODELLI } from '../../src/giochi/sotterraneo/scena3d/mondo/props-modelli.js'
import { FORME, TABELLA, SCENARI } from '../../src/giochi/sotterraneo/scena3d/mondo/props-dove.js'
import { GEO } from '../../src/giochi/sotterraneo/scena3d/mondo/natura.js'
import { ARREDI } from '../../src/giochi/sotterraneo/scena3d/aspetti.js'
import { DISEGNI } from '../../src/giochi/sotterraneo/dati/relitti.js'
import { ilMondo } from '../../src/giochi/sotterraneo/motore/mondo-sopra-anelli.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const CATEGORIE = ['edificio', 'prop', 'pianta', 'personaggio', 'animale', 'effetto', 'altro']
const radice = new URL('../../', import.meta.url)

/* ── il contratto ── */
{
  controlla('ci sono voci', VOCI.length > 100, String(VOCI.length))
  const visti = new Set()
  for (const v of VOCI) {
    const chi = v.id || '(senza id)'
    controlla(`${chi}: id nel formato sot:gruppo:nome`, /^sot:[a-z0-9]+:[a-z0-9-]+$/.test(v.id), v.id)
    controlla(`${chi}: id unico`, !visti.has(v.id)); visti.add(v.id)
    controlla(`${chi}: nome`, typeof v.nome === 'string' && v.nome.length > 2)
    uguale(`${chi}: gioco`, v.gioco, 'sotterraneo')
    controlla(`${chi}: categoria`, CATEGORIE.includes(v.categoria), v.categoria)
    controlla(`${chi}: dove in una riga che dice qualcosa`, typeof v.dove === 'string' && v.dove.length >= 30 && !v.dove.includes('\n'), v.dove)
    controlla(`${chi}: crea è una funzione`, typeof v.crea === 'function')
    // il file: «percorso:nome» col percorso che esiste e il nome (l'ultimo dopo il punto) che nel file si legge
    const [percorso, nome] = String(v.file).split(':')
    controlla(`${chi}: file «${v.file}» esiste`, !!percorso && existsSync(new URL(percorso, radice)), v.file)
    if (percorso && nome && existsSync(new URL(percorso, radice))) {
      const ultimo = nome.split('.').pop()
      controlla(`${chi}: «${ultimo}» sta in ${percorso}`, new RegExp(`\\b${ultimo}\\b`).test(readFileSync(new URL(percorso, radice), 'utf8')))
    }
  }
}

/* ── ogni crea() costruisce qualcosa che si vede ── */
{
  const t0 = performance.now()
  const dimensioni = []
  for (const v of VOCI) {
    let o = null
    try { o = v.crea() } catch (e) { controlla(`${v.id}: crea() non deve rompersi`, false, e.message) }
    if (!o) continue
    controlla(`${v.id}: crea() torna un Object3D`, !!o.isObject3D)
    let mesh = 0, triangoli = 0
    o.traverse(x => {
      if (x.isMesh) { mesh++; const g = x.geometry; triangoli += (g.index ? g.index.count : g.attributes.position.count) / 3 * (x.isInstancedMesh ? x.count : 1) }
    })
    controlla(`${v.id}: almeno una mesh`, mesh > 0)
    controlla(`${v.id}: ha dei triangoli`, triangoli > 0, String(triangoli))
    const scatola = new Box3().setFromObject(o), misura = scatola.getSize(new Vector3())
    controlla(`${v.id}: ha una misura finita`, [misura.x, misura.y, misura.z].every(Number.isFinite) && misura.length() > 0.05, misura.toArray().join('×'))
    controlla(`${v.id}: sta sull'origine (non lontano)`, scatola.getCenter(new Vector3()).length() < 8, scatola.getCenter(new Vector3()).toArray().join(','))
    // un oggetto nuovo a ogni chiamata (la pagina ne usa uno per riquadro)
    controlla(`${v.id}: ogni crea() è un oggetto nuovo`, v.crea() !== o)
    if (o.userData.anima) {
      controlla(`${v.id}: anima è una funzione`, typeof o.userData.anima === 'function')
      try { o.userData.anima(1.3); o.userData.anima(2.6) } catch (e) { controlla(`${v.id}: anima(t) non deve rompersi`, false, e.message) }
    }
    dimensioni.push(mesh)
  }
  nota(`${VOCI.length} voci costruite in ${Math.round(performance.now() - t0)} ms, ${dimensioni.reduce((a, b) => a + b, 0)} mesh in tutto`)
}

/* ── niente di nuovo del gioco resta fuori ── */
{
  const manca = (cosa, gioco, nostre) => {
    const a = new Set(Object.keys(nostre))
    const senza = [...gioco].filter(k => !a.has(k)), inPiu = [...a].filter(k => !gioco.has(k))
    controlla(`${cosa}: ogni voce del gioco è nel catalogo`, senza.length === 0, 'mancano ' + senza.join(', '))
    controlla(`${cosa}: ogni voce del catalogo c'è ancora nel gioco`, inPiu.length === 0, 'non più nel gioco ' + inPiu.join(', '))
  }
  manca('gli oggetti delle città (MODELLI)', new Set(Object.keys(MODELLI)), TABELLE.OGGETTI_CITTA)
  manca('i props fuori dalle città (FORME)', new Set(Object.keys(FORME)), TABELLE.FORME_NOME)
  manca('la natura (GEO)', new Set(Object.keys(GEO)), TABELLE.NATURA)
  manca('l\'arredo delle discese (ARREDI)', new Set(ARREDI), TABELLE.ARREDO)
  manca('i relitti disegnati (DISEGNI)', new Set(DISEGNI), TABELLE.RELITTI)
  const monumenti = new Set(ilMondo().ingressi.map(p => p.monumento))
  manca('gli ingressi dei dungeon', monumenti, Object.fromEntries(TABELLE.INGRESSI.map(r => [r[1], 1])))
  manca('i nomi degli habitat', new Set(Object.keys(TABELLA)), TABELLE.NOMI_HABITAT)
  manca('i nomi degli ingressi nei scenari', new Set(Object.keys(SCENARI)), TABELLE.NOMI_INGRESSO)
}

riassunto('catalogo 3d del sotterraneo')
