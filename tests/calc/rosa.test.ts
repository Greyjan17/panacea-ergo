import { describe, expect, it } from 'vitest'
import { calcRosa, type ROSAInput } from '@/lib/calc/rosa'

const IDEAL: ROSAInput = {
  altura: 1, alturaEspacio: false, alturaNoReg: false,
  profundidad: 1, profundidadNoReg: false,
  reposabrazos: 1, reposaSeparados: false, reposaDuro: false, reposaNoAjust: false,
  respaldo: 1, respaldoMesaAlta: false, respaldoNoAjust: false, tSilla: 0,
  pantalla: 1, pantallaGiro: false, pantallaDocs: false, pantallaBrillos: false, pantallaLejos: false, tPantalla: 0,
  telefono: 1, telefonoCuello: false, telefonoSinManos: false, tTelefono: 0,
  mouse: 1, mousePinza: false, mouseAlturas: false, mouseReposa: false, tMouse: 0,
  teclado: 1, tecladoDesv: false, tecladoAlto: false, tecladoAlcance: false, tecladoNoAjust: false, tTeclado: 0,
}

describe('ROSA', () => {
  it('puesto ideal con uso moderado → silla 2, final 2 (mejorable)', () => {
    const r = calcRosa(IDEAL)
    expect(r.silla).toBe(2) // Tabla A[2][2] = 2
    expect(r.pantallaTelefono).toBe(1) // Tabla B[1][1]
    expect(r.mouseTeclado).toBe(1) // Tabla C[1][1]
    expect(r.perifericos).toBe(1)
    expect(r.fin).toBe(2)
    expect(r.nivelActuacion).toBe(1)
  })

  it('uso breve de todo → final 1 (inapreciable)', () => {
    const r = calcRosa({ ...IDEAL, tSilla: -1, tPantalla: -1, tTelefono: -1, tMouse: -1, tTeclado: -1 })
    expect(r.silla).toBe(1)
    expect(r.fin).toBe(1)
    expect(r.nivelActuacion).toBe(0)
  })

  it('ejemplo de Ergonautas: asiento bajo + sin espacio + no regulable = altura 4', () => {
    // altura 2 +1 +1 = 4; profundidad 1 → fila 5; reposabrazos 1 + respaldo 1 → col 2 → Tabla A = 4
    const r = calcRosa({ ...IDEAL, altura: 2, alturaEspacio: true, alturaNoReg: true, tSilla: 1 })
    expect(r.silla).toBe(5)
    expect(r.fin).toBe(5) // Tabla E[5][1] = 5 → alto
    expect(r.nivelActuacion).toBe(2)
  })

  it('pantalla lejos solo suma si está muy baja', () => {
    expect(calcRosa({ ...IDEAL, pantalla: 3, pantallaLejos: true }).pantalla).toBe(3)
    expect(calcRosa({ ...IDEAL, pantalla: 2, pantallaLejos: true }).pantalla).toBe(3)
  })

  it('teléfono en el cuello suma 2', () => {
    expect(calcRosa({ ...IDEAL, telefonoCuello: true }).telefono).toBe(3)
  })

  it('peor caso → final 10 (extremo)', () => {
    const r = calcRosa({
      altura: 3, alturaEspacio: true, alturaNoReg: true,
      profundidad: 2, profundidadNoReg: true,
      reposabrazos: 2, reposaSeparados: true, reposaDuro: true, reposaNoAjust: true,
      respaldo: 2, respaldoMesaAlta: true, respaldoNoAjust: true, tSilla: 1,
      pantalla: 2, pantallaGiro: true, pantallaDocs: true, pantallaBrillos: true, pantallaLejos: true, tPantalla: 1,
      telefono: 2, telefonoCuello: true, telefonoSinManos: true, tTelefono: 1,
      mouse: 2, mousePinza: true, mouseAlturas: true, mouseReposa: true, tMouse: 1,
      teclado: 2, tecladoDesv: true, tecladoAlto: true, tecladoAlcance: true, tecladoNoAjust: true, tTeclado: 1,
    })
    expect(r.silla).toBe(10) // Tabla A[8][9] = 9, +1
    expect(r.pantalla).toBe(7)
    expect(r.telefono).toBe(6)
    expect(r.pantallaTelefono).toBe(9)
    expect(r.mouseTeclado).toBe(9)
    expect(r.fin).toBe(10)
    expect(r.nivelActuacion).toBe(4)
  })

  it('celdas puntuales de las tablas', () => {
    // Tabla B fila teléfono 2, pantalla 6 = 6 ; Tabla C fila mouse 3, teclado 4 = 5
    const r = calcRosa({ ...IDEAL, telefono: 2, pantalla: 3, pantallaGiro: true, pantallaDocs: true, pantallaBrillos: true, mouse: 2, mousePinza: true, teclado: 2, tecladoDesv: true, tecladoAlto: true })
    expect(r.telefono).toBe(2)
    expect(r.pantalla).toBe(6)
    expect(r.pantallaTelefono).toBe(6)
    expect(r.mouse).toBe(3)
    expect(r.teclado).toBe(4)
    expect(r.mouseTeclado).toBe(5)
    expect(r.perifericos).toBe(6) // Tabla D[6][5]
  })
})

import { getConclusiones } from '@/lib/informe/conclusiones'
import { getRecomendaciones } from '@/lib/informe/recomendaciones'

describe('ROSA en conclusiones y recomendaciones', () => {
  it('ROSA alto sin otros métodos no se reporta como riesgo bajo y no pide rotación de MMC', () => {
    const input = { ...IDEAL, altura: 2 as const, alturaEspacio: true, alturaNoReg: true, tSilla: 1 as const }
    const result = calcRosa(input)
    const c = getConclusiones({ rosa: { input, result } })
    expect(c.some(x => x.startsWith('ROSA: 5/10'))).toBe(true)
    expect(c.at(-1)).toBe('Implementar medidas correctivas y re-evaluar.')
    const r = getRecomendaciones({ rosa: { input, result }, limAp: 25 })
    expect(r.ingenieria[0]).toMatch(/Silla regulable/)
    expect(r.administrativas.some(x => x.includes('manipulación manual'))).toBe(false)
  })
})
