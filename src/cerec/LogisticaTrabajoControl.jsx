import { useState } from "react";

const PIN_ICON = (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

function formatearRecibido(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * @param {object} props
 * @param {{ id: string, logistics_received_at?: string | null, patient_name?: string }} props.trabajo
 * @param {"logistica" | "lectura"} props.modo — logística: botón + fecha; doctor/cerec: solo badge
 * @param {(jobId: string) => void | Promise<void>} [props.onRecibir]
 * @param {boolean} [props.guardando]
 */
export default function LogisticaTrabajoControl({ trabajo, modo, onRecibir, guardando = false }) {
    const [confirmar, setConfirmar] = useState(false);
    const recibido = Boolean(trabajo?.logistics_received_at);

    async function confirmarRecepcion() {
        setConfirmar(false);
        await onRecibir?.(trabajo.id);
    }

    if (modo === "logistica") {
        if (!recibido) {
            return (
                <>
                    <button
                        type="button"
                        disabled={guardando}
                        onClick={() => setConfirmar(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm"
                    >
                        {guardando ? (
                            <span className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-700 rounded-full animate-spin" />
                        ) : (
                            PIN_ICON
                        )}
                        Recibir en logística
                    </button>

                    {confirmar && (
                        <div
                            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
                            onClick={() => !guardando && setConfirmar(false)}
                        >
                            <div
                                className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 border border-emerald-100"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center gap-2 text-emerald-800 mb-2">
                                    {PIN_ICON}
                                    <h3 className="font-bold text-gray-900">¿Recibir en logística?</h3>
                                </div>
                                {trabajo.patient_name && (
                                    <p className="text-sm text-gray-700 mb-1">
                                        Paciente: <span className="font-medium">{trabajo.patient_name}</span>
                                    </p>
                                )}
                                <p className="text-sm text-gray-600 mb-5">
                                    Se registrará la fecha y hora. El doctor y el laboratorio verán que el trabajo está en logística.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        disabled={guardando}
                                        onClick={() => setConfirmar(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                    >
                                        No
                                    </button>
                                    <button
                                        type="button"
                                        disabled={guardando}
                                        onClick={confirmarRecepcion}
                                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2"
                                    >
                                        {guardando ? (
                                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        ) : null}
                                        Sí, recibir
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            );
        }

        return (
            <div className="inline-flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                    {PIN_ICON}
                    Logística
                </span>
                <span className="text-xs text-emerald-700">
                    Recibido: {formatearRecibido(trabajo.logistics_received_at)}
                </span>
            </div>
        );
    }

    if (!recibido) return null;

    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
            {PIN_ICON}
            Logística
        </span>
    );
}
