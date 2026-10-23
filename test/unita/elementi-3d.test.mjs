/* Gli elementi di una scena 3D (grafica/elementi3d.js, docs/core/vecchio-telefono-veri.md «Dove eravamo rimasti»): un elemento spento
   va sullo strato 31 coi suoi figli (la `visible` di chi gioca non si tocca) e torna com'era; il materiale di una mesh a più materiali
   si spegne da solo; quello senza nome in cima è il `resto`; tutto acceso non si tocca niente. E `&riaccendi=` rimette quello che la
   fascia spegne (scena3d/costanti.js, applicaFascia). */
import { Scene, Group, Mesh, BoxGeometry, MeshBasicMaterial, PointLight } from 'three'
import { segna, segnaNuovi, nascondiElementi, creaElementi } from '../../src/grafica/elementi3d.js'
import { ACCESI, applicaFascia, elementoAcceso } from '../../src/giochi/sotterraneo/scena3d/costanti.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const geo = new BoxGeometry(), mat = () => new MeshBasicMaterial()
const scena = new Scene()
const pav = segna(new Mesh(geo, mat()), 'pavimento')
const muri = segna(new Mesh(geo, [mat(), mat(), mat()]), 'pareti'); muri.userData.elementiMateriali = ['lontana', 'vicina', null]
const gruppo = segna(new Group(), 'mostri')
const figlio = new Mesh(geo, mat()); figlio.visible = false; gruppo.add(figlio)
const luce = new PointLight()          // senza nome: il resto
scena.add(pav, muri, gruppo, luce)
const nuove = segnaNuovi(scena, 'nebbia', () => { const a = new Mesh(geo, mat()); scena.add(a); return a })
uguale('segnaNuovi segna quello che si aggiunge', nuove.userData.elemento3d, 'nebbia')
const giu = o => (o.layers.mask & 1) === 0

nascondiElementi(scena, k => k === 'mostri' || k === 'vicina' || k === 'resto', 'resto')
controlla('il gruppo spento spegne i figli, senza toccare la loro visible', giu(gruppo) && giu(figlio) && figlio.visible === false)
controlla('gli altri restano', !giu(pav) && !giu(nuove))
controlla('il materiale spento e basta', muri.material[1].visible === false && muri.material[0].visible === true && !giu(muri))
controlla('quello senza nome in cima è il resto', giu(luce))
nascondiElementi(scena, () => false, 'resto')
controlla('riacceso torna com\'era', !giu(gruppo) && !giu(figlio) && !giu(luce) && muri.material[1].visible === true && figlio.visible === false)

// il passo di ogni fotogramma: niente se tutto è acceso, e una volta in più quando si riaccende
const spenti = new Set(['pavimento'])
const passo = creaElementi(['pavimento', 'nebbia'], k => !spenti.has(k))
passo(scena)
controlla('il passo spegne', giu(pav))
spenti.clear(); passo(scena)
controlla('e riaccende una volta', !giu(pav))
pav.layers.mask = 0; passo(scena)
controlla('poi non tocca più niente', pav.layers.mask === 0)
pav.layers.mask = 1

// la fascia e il confronto
applicaFascia(['ombre', 'fuochi:2'], [])
controlla('spegni mette false e numeri', ACCESI.ombre === false && ACCESI.fuochi === 2)
applicaFascia(['nebbia'], ['ombre', 'nebbia'])
controlla('riaccendi non vince su quello chiesto a mano', ACCESI.nebbia === false && ACCESI.ombre === true)
applicaFascia(['mostri3d:0', 'pavimento'])
controlla('un numero a zero è un elemento spento', !elementoAcceso('mostri3d') && !elementoAcceso('pavimento') && elementoAcceso('torcia'))
applicaFascia()
riassunto('gli elementi di una scena 3D')
