import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import {
    buildReporteMensual,
    etiquetaMes,
    exportReporteExcel,
    rangoMes,
} from "./reporteMensualUtils";

function mesActual() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ReporteMensualLab({ obtenerNombreTratamiento }) {
    const [mes, setMes] = useState(mesActual);
    const [trabajos, setTrabajos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [exportando, setExportando] = useState(false);
    const [grupoAbierto, setGrupoAbierto] = useState(null);

    useEffect(() => {
        let cancelado = false;

        async function cargar() {
            setCargando(true);
            setError("");
            const { inicio, fin } = rangoMes(mes);

            const { data, error: err } = await supabase
                .from("jobs")
                .select(
                    "id, treatment_type, treatment_name, patient_name, pieza, doctor, status, completed_at"
                )
                .eq("status", "completed")
                .gte("completed_at", inicio)
                .lte("completed_at", fin)
                .order("completed_at", { ascending: false });

            if (cancelado) return;

            if (err) {
                setError(err.message);
                setTrabajos([]);
            } else {
                setTrabajos(data ?? []);
            }
            setCargando(false);
        }

        void cargar();
        return () => {
            cancelado = true;
        };
    }, [mes]);

    const reporte = useMemo(
        () => buildReporteMensual(trabajos, obtenerNombreTratamiento),
        [trabajos, obtenerNombreTratamiento]
    );

    async function handleExportar() {
        setExportando(true);
        try {
            await exportReporteExcel(reporte, mes, etiquetaMes(mes));
        } catch (e) {
            setError(`No se pudo exportar: ${e.message}`);
        } finally {
            setExportando(false);
        }
    }

    const etiqueta = etiquetaMes(mes);

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Producción del mes</h2>
                    <p className="text-sm text-gray-500 mt-1 capitalize">
                        Trabajos finalizados en {etiqueta}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <label className="text-sm font-medium text-gray-600 w-48">
                        Mes
                        <input
                            type="month"
                            value={mes}
                            onChange={(e) => setMes(e.target.value)}
                            className="mt-1 block w-full h-10 border border-gray-200 rounded-xl px-3 text-sm bg-white"
                        />
                    </label>
                    <label className="text-sm font-medium text-gray-600 w-48">
                        Exportar
                        <button
                            type="button"
                            onClick={() => void handleExportar()}
                            disabled={exportando || cargando || trabajos.length === 0}
                            className="mt-1 flex w-full h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                        >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        {exportando ? "Exportando…" : "Exportar Excel"}
                        </button>
                    </label>
                </div>
            </div>

            {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    {error}
                </div>
            )}

            {cargando ? (
                <div className="text-center py-12">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Cargando reporte…</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <StatCard
                            label="Restauraciones"
                            value={reporte.totalRestauraciones}
                            sub="piezas contabilizadas"
                            color="blue"
                        />
                        <StatCard
                            label="Guardas"
                            value={reporte.totalExocadGuardas}
                            sub="EXOCAD"
                            color="orange"
                        />
                        <StatCard
                            label="Modelos"
                            value={reporte.totalExocadModelos}
                            sub="EXOCAD"
                            color="orange"
                        />
                        <StatCard
                            label="Trabajos"
                            value={reporte.totalTrabajos}
                            sub="finalizados"
                            color="gray"
                        />
                    </div>

                    {reporte.totalTrabajos === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                            <p className="text-gray-500">No hay trabajos finalizados en este mes.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                Por tipo de tratamiento
                            </h3>

                            <GruposSeccion
                                titulo="CEREC"
                                badgeClass="bg-blue-100 text-blue-800"
                                grupos={reporte.gruposCerec}
                                grupoAbierto={grupoAbierto}
                                setGrupoAbierto={setGrupoAbierto}
                                unidad="piezas"
                            />

                            <GruposSeccion
                                titulo="EXOCAD"
                                badgeClass="bg-orange-100 text-orange-800"
                                grupos={reporte.gruposExocad}
                                grupoAbierto={grupoAbierto}
                                setGrupoAbierto={setGrupoAbierto}
                                unidad="trabajos"
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function GruposSeccion({ titulo, badgeClass, grupos, grupoAbierto, setGrupoAbierto, unidad }) {
    if (grupos.length === 0) {
        return (
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg ${badgeClass}`}>
                        {titulo}
                    </span>
                </div>
                <p className="text-sm text-gray-400 pl-1">Sin trabajos finalizados en este mes.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg ${badgeClass}`}>
                    {titulo}
                </span>
            </div>
            <div className="space-y-3">
                {grupos.map((grupo) => {
                    const key = `${titulo}-${grupo.treatment_type}`;
                    const abierto = grupoAbierto === key;
                    return (
                        <div
                            key={key}
                            className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
                        >
                            <button
                                type="button"
                                onClick={() => setGrupoAbierto(abierto ? null : key)}
                                className="w-full flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4 text-left hover:bg-gray-50 transition-colors"
                            >
                                <div className="min-w-0">
                                    <div className="font-semibold text-gray-900">{grupo.label}</div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-lg font-bold text-blue-700 tabular-nums">
                                        {grupo.count}
                                    </span>
                                    <span className="text-xs text-gray-500 hidden sm:inline">{unidad}</span>
                                    <svg
                                        className={`w-5 h-5 text-gray-400 transition-transform ${abierto ? "rotate-180" : ""}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>

                            {abierto && (
                                <div className="border-t border-gray-100 px-2 pb-3 sm:px-4 sm:pb-4 overflow-x-auto">
                                    <table className="w-full text-sm mt-2 min-w-[480px]">
                                        <thead>
                                            <tr className="text-left text-xs text-gray-500 uppercase">
                                                <th className="py-2 px-2 font-semibold">ID paciente</th>
                                                <th className="py-2 px-2 font-semibold">Piezas</th>
                                                <th className="py-2 px-2 font-semibold hidden sm:table-cell">Doctor</th>
                                                <th className="py-2 px-2 font-semibold">Finalizado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {grupo.trabajos.map((t) => (
                                                <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50/80">
                                                    <td className="py-2.5 px-2 font-medium text-gray-800">{t.patient_name}</td>
                                                    <td className="py-2.5 px-2 text-gray-700">{t.piezas}</td>
                                                    <td className="py-2.5 px-2 text-gray-600 hidden sm:table-cell">{t.doctor}</td>
                                                    <td className="py-2.5 px-2 text-gray-500 text-xs whitespace-nowrap">{t.completed_at_fmt}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function StatCard({ label, value, sub, color }) {
    const colors = {
        blue: "border-blue-200 bg-blue-50 text-blue-800",
        orange: "border-orange-200 bg-orange-50 text-orange-800",
        gray: "border-gray-200 bg-gray-50 text-gray-800",
    };
    return (
        <div className={`rounded-2xl border p-4 ${colors[color] || colors.gray}`}>
            <div className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</div>
            <div className="text-3xl font-bold mt-1 tabular-nums">{value}</div>
            <div className="text-xs mt-1 opacity-70">{sub}</div>
        </div>
    );
}
