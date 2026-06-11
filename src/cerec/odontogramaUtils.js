/** Numeración FDI (ISO 3950) — estándar en México y Latinoamérica */

export const CUADRANTES = {
    superiorDerecho: [18, 17, 16, 15, 14, 13, 12, 11],
    superiorIzquierdo: [21, 22, 23, 24, 25, 26, 27, 28],
    inferiorIzquierdo: [38, 37, 36, 35, 34, 33, 32, 31],
    inferiorDerecho: [41, 42, 43, 44, 45, 46, 47, 48],
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
