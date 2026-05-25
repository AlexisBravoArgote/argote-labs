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
 * @param {{ id: string, logistics_received_at?: string | null }} props.trabajo
 * @param {"logistica" | "lectura"} props.modo — logística: botón + fecha; doctor/cerec: solo badge
 * @param {(jobId: string) => void | Promise<void>} [props.onRecibir]
 * @param {boolean} [props.guardando]
 */
export default function LogisticaTrabajoControl({ trabajo, modo, onRecibir, guardando = false }) {
    const recibido = Boolean(trabajo?.logistics_received_at);

    if (modo === "logistica") {
        if (!recibido) {
            return (
                <button
                    type="button"
                    disabled={guardando}
                    onClick={() => onRecibir?.(trabajo.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm"
                >
                    {guardando ? (
                        <span className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-700 rounded-full animate-spin" />
                    ) : (
                        PIN_ICON
                    )}
                    Recibir en logística
                </button>
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
