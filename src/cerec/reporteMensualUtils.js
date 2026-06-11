import { parsePiezas, formatPiezas } from "./odontogramaUtils";

/** Tratamientos CEREC contabilizados por piezas (restauraciones) */
export const TIPOS_RESTAURACION = new Set([
    "carillas",
    "corona_implante",
    "coronas",
    "incrustaciones",
    "provisional_pmma",
    "rehabilitacion_completa",
    "rpa",
]);

/** Tratamientos EXOCAD contabilizados por trabajo */
export const TIPOS_EXOCAD = {
    guardas: "Guardas",
    modelo_ortodoncia: "Modelos de ortodoncia",
    modelos_guarda_acetato: "Modelos para guarda de acetato",
    guia_quirurgica: "Guías quirúrgicas",
    diseno_sonrisa: "Diseño de sonrisa",
    encerado_digital: "Encerado digital",
};

export function esRestauracion(treatmentType) {
    return TIPOS_RESTAURACION.has(treatmentType);
}

export function esExocad(treatmentType) {
    return treatmentType in TIPOS_EXOCAD;
}

/** Cuenta piezas dentales válidas de un trabajo (0 si no hay piezas) */
export function contarRestauracionesEnTrabajo(trabajo) {
    return parsePiezas(trabajo.pieza).length;
}

export function piezasTexto(trabajo) {
    const piezas = parsePiezas(trabajo.pieza);
    if (piezas.length > 0) return formatPiezas(piezas);
    return trabajo.pieza?.trim() || "—";
}

export function rangoMes(mesYYYYMM) {
    const [y, m] = mesYYYYMM.split("-").map(Number);
    const inicio = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const fin = new Date(y, m, 0, 23, 59, 59, 999);
    return { inicio: inicio.toISOString(), fin: fin.toISOString() };
}

export function etiquetaMes(mesYYYYMM) {
    const [y, m] = mesYYYYMM.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

export function buildReporteMensual(trabajos, obtenerNombreTratamiento) {
    let totalRestauraciones = 0;
    const conteosExocad = Object.fromEntries(Object.keys(TIPOS_EXOCAD).map((k) => [k, 0]));
    const grupos = new Map();

    const filasDetalle = [];

    for (const t of trabajos) {
        const tipo = t.treatment_type;
        const label = obtenerNombreTratamiento(t);
        const piezas = parsePiezas(t.pieza);
        const piezasStr = piezasTexto(t);
        const fecha = t.completed_at
            ? new Date(t.completed_at).toLocaleString("es-MX")
            : "—";

        const fila = {
            id: t.id,
            treatment_type: tipo,
            treatment_label: label,
            patient_name: t.patient_name,
            piezas: piezasStr,
            piezas_count: piezas.length,
            doctor: t.doctor || "—",
            completed_at: t.completed_at,
            completed_at_fmt: fecha,
        };
        filasDetalle.push(fila);

        if (esRestauracion(tipo) || tipo === "otra") {
            totalRestauraciones += contarRestauracionesEnTrabajo(t);
        }

        if (esExocad(tipo)) {
            conteosExocad[tipo] += 1;
        }

        const grupoKey = tipo;
        if (!grupos.has(grupoKey)) {
            grupos.set(grupoKey, {
                treatment_type: tipo,
                label,
                esRestauracion: esRestauracion(tipo) || tipo === "otra",
                esExocad: esExocad(tipo),
                count: 0,
                piezasTotal: 0,
                trabajos: [],
            });
        }
        const g = grupos.get(grupoKey);
        g.trabajos.push(fila);
        if (g.esRestauracion) {
            g.piezasTotal += contarRestauracionesEnTrabajo(t);
            g.count = g.piezasTotal;
        } else {
            g.count += 1;
        }
    }

    const gruposOrdenados = [...grupos.values()].sort((a, b) =>
        a.label.localeCompare(b.label, "es")
    );
    const gruposCerec = gruposOrdenados.filter((g) => !g.esExocad);
    const gruposExocad = gruposOrdenados.filter((g) => g.esExocad);

    const totalExocadGuardas = conteosExocad.guardas || 0;
    const totalExocadModelos =
        (conteosExocad.modelo_ortodoncia || 0) + (conteosExocad.modelos_guarda_acetato || 0);

    return {
        totalTrabajos: trabajos.length,
        totalRestauraciones,
        conteosExocad,
        totalExocadGuardas,
        totalExocadModelos,
        grupos: gruposOrdenados,
        gruposCerec,
        gruposExocad,
        filasDetalle,
    };
}

function filasHojaPorGrupos(grupos, unidad) {
    const rows = [];
    for (const grupo of grupos) {
        rows.push([grupo.label, `Total: ${grupo.count} ${unidad}`]);
        rows.push(["ID paciente", "Piezas", "Doctor", "Fecha finalización"]);
        for (const t of grupo.trabajos) {
            rows.push([t.patient_name, t.piezas, t.doctor, t.completed_at_fmt]);
        }
        rows.push([]);
    }
    return rows;
}

export async function exportReporteExcel(reporte, mesYYYYMM, etiquetaMesStr) {
    const XLSX = await import("xlsx");

    const wb = XLSX.utils.book_new();

    const cerecRows = [
        ["CEREC — Producción del mes"],
        ["Mes", etiquetaMesStr],
        ["Total restauraciones (piezas)", reporte.totalRestauraciones],
        [],
        ...filasHojaPorGrupos(reporte.gruposCerec, "piezas"),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cerecRows), "CEREC");

    const exocadRows = [
        ["EXOCAD — Producción del mes"],
        ["Mes", etiquetaMesStr],
        [],
        ...filasHojaPorGrupos(reporte.gruposExocad, "trabajos"),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(exocadRows), "EXOCAD");

    XLSX.writeFile(wb, `reporte-laboratorio-${mesYYYYMM}.xlsx`);
}
