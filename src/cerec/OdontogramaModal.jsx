import { useState, useEffect } from "react";
import { CUADRANTES, formatPiezas, parsePiezas } from "./odontogramaUtils";

function Diente({ numero, seleccionado, onToggle }) {
    const esMolar = [16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48].includes(numero);
    const esPremolar = [14, 15, 24, 25, 34, 35, 44, 45].includes(numero);
    const esCanino = [13, 23, 33, 43].includes(numero);
    const esIncisivo = [11, 12, 21, 22, 31, 32, 41, 42].includes(numero);

    let forma = "rounded-md";
    if (esMolar) forma = "rounded-lg";
    else if (esCanino) forma = "rounded-full";
    else if (esIncisivo) forma = "rounded-sm";

    return (
        <button
            type="button"
            onClick={() => onToggle(numero)}
            title={`Pieza ${numero}`}
            className={`
                relative flex flex-col items-center justify-center
                flex-1 min-w-0 h-9 sm:flex-none sm:w-11 sm:h-14
                transition-all duration-150 border-2 ${forma}
                ${seleccionado
                    ? "bg-blue-600 border-blue-700 text-white shadow-md sm:scale-105 z-10"
                    : "bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                }
            `}
        >
            <span className="text-[8px] sm:text-xs font-bold leading-none">{numero}</span>
            <svg
                viewBox="0 0 24 28"
                className={`w-3.5 h-4 sm:w-5 sm:h-6 mt-0.5 shrink-0 ${seleccionado ? "text-blue-100" : "text-gray-400"}`}
                fill="currentColor"
            >
                {esMolar && (
                    <path d="M4 8c0-2 2-4 8-4s8 2 8 4v12c0 2-2 3-8 3s-8-1-8-3V8z" />
                )}
                {esPremolar && (
                    <path d="M6 6c0-2 3-3 6-3s6 1 6 3v14c0 2-2 3-6 3s-6-1-6-3V6z" />
                )}
                {esCanino && (
                    <path d="M8 4c0-2 4-3 4-3s4 1 4 3v18c0 2-1 3-4 3s-4-1-4-3V4z" />
                )}
                {esIncisivo && (
                    <path d="M9 4c0-1 3-2 3-2s3 1 3 2v18c0 1-1 2-3 2s-3-1-3-2V4z" />
                )}
            </svg>
        </button>
    );
}

function FilaCuadrantes({ cuadranteIzq, cuadranteDer, seleccionadas, onToggle, esSuperior }) {
    return (
        <div
            className={`flex w-full min-w-0 justify-center gap-px sm:gap-1.5 max-w-full sm:max-w-3xl sm:mx-auto ${esSuperior ? "items-end" : "items-start"}`}
        >
            <div className="flex flex-1 min-w-0 gap-px sm:flex-none sm:gap-1.5">
                {cuadranteIzq.map((n) => (
                    <Diente
                        key={n}
                        numero={n}
                        seleccionado={seleccionadas.has(n)}
                        onToggle={onToggle}
                    />
                ))}
            </div>
            <div className="w-px shrink-0 h-10 sm:h-[4.5rem] bg-gray-300 mx-0.5 sm:mx-3 self-center" />
            <div className="flex flex-1 min-w-0 gap-px sm:flex-none sm:gap-1.5">
                {cuadranteDer.map((n) => (
                    <Diente
                        key={n}
                        numero={n}
                        seleccionado={seleccionadas.has(n)}
                        onToggle={onToggle}
                    />
                ))}
            </div>
        </div>
    );
}

export default function OdontogramaModal({ piezaInicial = "", onClose, onConfirm }) {
    const [seleccionadas, setSeleccionadas] = useState(() => new Set(parsePiezas(piezaInicial)));

    useEffect(() => {
        setSeleccionadas(new Set(parsePiezas(piezaInicial)));
    }, [piezaInicial]);

    function togglePieza(numero) {
        setSeleccionadas((prev) => {
            const next = new Set(prev);
            if (next.has(numero)) next.delete(numero);
            else next.add(numero);
            return next;
        });
    }

    function limpiar() {
        setSeleccionadas(new Set());
    }

    function confirmar() {
        onConfirm(formatPiezas([...seleccionadas]));
        onClose();
    }

    const lista = [...seleccionadas].sort((a, b) => a - b);

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-[60]"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl sm:max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[95vh] overflow-hidden flex flex-col min-h-0"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 sm:px-5 sm:py-4 rounded-t-2xl shrink-0">
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-white">Odontograma</h3>
                            <p className="text-blue-100 text-xs sm:text-sm mt-0.5">
                                Toca las piezas (numeración FDI)
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
                            aria-label="Cerrar"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 min-h-0 p-3 sm:p-6 overscroll-contain">
                    <div className="w-full min-w-0 max-w-full sm:overflow-visible">
                    <div className="flex justify-between text-[9px] sm:text-xs text-gray-500 font-medium mb-1.5 sm:mb-2 px-0.5">
                        <span className="truncate pr-1">Izq. paciente</span>
                        <span className="truncate pl-1 text-right">Der. paciente</span>
                    </div>

                    {/* Arco superior */}
                    <div className="mb-1 w-full min-w-0">
                        <p className="text-center text-xs text-gray-400 mb-2 uppercase tracking-wide">Arco superior</p>
                        <FilaCuadrantes
                            cuadranteIzq={CUADRANTES.superiorDerecho}
                            cuadranteDer={CUADRANTES.superiorIzquierdo}
                            seleccionadas={seleccionadas}
                            onToggle={togglePieza}
                            esSuperior
                        />
                    </div>

                    {/* Línea de mordida */}
                    <div className="flex items-center gap-1.5 sm:gap-2 my-2 sm:my-4">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">Mordida</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Arco inferior */}
                    <div className="w-full min-w-0">
                        <FilaCuadrantes
                            cuadranteIzq={CUADRANTES.inferiorDerecho}
                            cuadranteDer={CUADRANTES.inferiorIzquierdo}
                            seleccionadas={seleccionadas}
                            onToggle={togglePieza}
                            esSuperior={false}
                        />
                        <p className="text-center text-xs text-gray-400 mt-2 uppercase tracking-wide">Arco inferior</p>
                    </div>
                    </div>

                    {/* Piezas seleccionadas */}
                    <div className="mt-3 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-sm font-semibold text-gray-700">
                                Piezas seleccionadas {lista.length > 0 && `(${lista.length})`}
                            </span>
                            {lista.length > 0 && (
                                <button
                                    type="button"
                                    onClick={limpiar}
                                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                                >
                                    Limpiar todo
                                </button>
                            )}
                        </div>
                        {lista.length === 0 ? (
                            <p className="text-sm text-gray-500">Ninguna pieza seleccionada. Toca los dientes arriba.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {lista.map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => togglePieza(n)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium hover:bg-blue-200 transition-colors"
                                    >
                                        {n}
                                        <span className="text-blue-500 text-xs">×</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="sticky bottom-0 shrink-0 border-t border-gray-100 bg-gray-50/95 backdrop-blur px-4 py-3 sm:px-5 sm:py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 rounded-b-2xl pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-white"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={confirmar}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-md"
                    >
                        Aplicar piezas{lista.length > 0 ? ` (${lista.length})` : ""}
                    </button>
                </div>
            </div>
        </div>
    );
}
