/** Numeración FDI (ISO 3950) — estándar en México y Latinoamérica */

export const CUADRANTES = {
    superiorDerecho: [18, 17, 16, 15, 14, 13, 12, 11],
    superiorIzquierdo: [21, 22, 23, 24, 25, 26, 27, 28],
    // Vista del odontólogo: izquierda = der. del paciente (48→41), derecha = izq. del paciente (31→38)
    inferiorDerecho: [48, 47, 46, 45, 44, 43, 42, 41],
    inferiorIzquierdo: [31, 32, 33, 34, 35, 36, 37, 38],
};

export const TODAS_LAS_PIEZAS = [
    ...CUADRANTES.superiorDerecho,
    ...CUADRANTES.superiorIzquierdo,
    ...CUADRANTES.inferiorIzquierdo,
    ...CUADRANTES.inferiorDerecho,
];

/** Convierte "21, 32" o "21 32" en lista ordenada de números */
export function parsePiezas(texto) {
    if (!texto?.trim()) return [];
    return [...new Set(
        texto
            .split(/[,;\s]+/)
            .map((p) => parseInt(p.trim(), 10))
            .filter((n) => TODAS_LAS_PIEZAS.includes(n))
    )].sort((a, b) => a - b);
}

/** Convierte lista de piezas a texto "11, 21, 32" */
export function formatPiezas(piezas) {
    return [...piezas].sort((a, b) => a - b).join(", ");
}
