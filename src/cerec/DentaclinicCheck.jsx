function formatearFecha(iso) {
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
 * Check "Dentaclinic" — solo se renderiza en el portal de Logística.
 * @param {object} props
 * @param {{ id: string, dentaclinic_at?: string | null }} props.trabajo
 * @param {(jobId: string, marcar: boolean) => void | Promise<void>} props.onToggle
 * @param {boolean} [props.guardando]
 */
export default function DentaclinicCheck({ trabajo, onToggle, guardando = false }) {
    const registrado = Boolean(trabajo?.dentaclinic_at);

    function handleChange(e) {
        const marcar = e.target.checked;
        if (!marcar && !confirm("¿Quitar el registro de Dentaclinic de este trabajo?")) return;
        onToggle?.(trabajo.id, marcar);
    }

    return (
        <label
            className={`inline-flex flex-col gap-0.5 px-3 py-2 rounded-xl border-2 cursor-pointer select-none transition-colors ${
                registrado
                    ? "border-sky-300 bg-sky-50"
                    : "border-gray-200 bg-white hover:border-sky-300 hover:bg-sky-50/50"
            } ${guardando ? "opacity-60 pointer-events-none" : ""}`}
        >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-sky-800">
                {guardando ? (
                    <span className="w-4 h-4 border-2 border-sky-300 border-t-sky-700 rounded-full animate-spin" />
                ) : (
                    <input
                        type="checkbox"
                        checked={registrado}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                )}
                Dentaclinic
            </span>
            {registrado && (
                <span className="text-xs text-sky-700">
                    Registrado: {formatearFecha(trabajo.dentaclinic_at)}
                </span>
            )}
        </label>
    );
}
