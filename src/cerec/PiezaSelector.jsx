import { useState } from "react";
import OdontogramaModal from "./OdontogramaModal";

/**
 * Campo de pieza con entrada manual + botón para abrir odontograma visual.
 */
export default function PiezaSelector({
    value,
    onChange,
    label = "Pieza",
    placeholder = "Ej: 21, 32",
    inputClass = "border rounded p-2 w-full mt-1",
    labelClass = "text-sm font-medium",
    showOdontograma = true,
}) {
    const [mostrarOdontograma, setMostrarOdontograma] = useState(false);

    return (
        <div>
            <div className={labelClass}>{label}</div>
            <div className="flex flex-col sm:flex-row gap-2 mt-1 sm:mt-1.5">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`${inputClass} flex-1 min-w-0 mt-0`}
                />
                {showOdontograma && (
                    <button
                        type="button"
                        onClick={() => setMostrarOdontograma(true)}
                        className="w-full sm:w-auto sm:shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 hover:border-blue-300 transition-colors"
                        title="Abrir odontograma"
                    >
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 10c0-2 3-3 8-3s8 1 8 3v8c0 2-3 3-8 3s-8-1-8-3v-8z"
                            />
                            <path strokeLinecap="round" strokeWidth={1.5} d="M12 3v4M8 5l1 2M16 5l-1 2" />
                        </svg>
                        <span>Odontograma</span>
                    </button>
                )}
            </div>
            {showOdontograma && (
                <p className="hidden sm:block text-xs text-gray-500 mt-1.5">
                    Escribe la pieza manualmente o usa el odontograma para seleccionarla visualmente.
                </p>
            )}

            {mostrarOdontograma && (
                <OdontogramaModal
                    piezaInicial={value}
                    onClose={() => setMostrarOdontograma(false)}
                    onConfirm={onChange}
                />
            )}
        </div>
    );
}
