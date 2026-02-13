import { useState } from "react";

export default function MovimientoModal({
    item,
    onClose,
    onConfirm, // (tipo, cantidad, nota)
}) {
    const [confirmacion, setConfirmacion] = useState(null); // { tipo, cantidad, nota }

    function handleAccion(tipo) {
        const cantidad = parseInt(document.getElementById("cantidad").value || "1", 10);
        const nota = document.getElementById("nota").value || "";
        setConfirmacion({ tipo, cantidad, nota });
    }

    function handleConfirmar() {
        if (!confirmacion) return;
        onConfirm(confirmacion.tipo, confirmacion.cantidad, confirmacion.nota);
        setConfirmacion(null);
    }

    return (
        <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Confirmation step */}
                {confirmacion ? (
                    <div className="text-center">
                        <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center ${confirmacion.tipo === "add" ? "bg-emerald-100" : "bg-rose-100"}`}>
                            {confirmacion.tipo === "add" ? (
                                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" /></svg>
                            ) : (
                                <svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" /></svg>
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                            {confirmacion.tipo === "add" ? "¿Agregar stock?" : "¿Retirar stock?"}
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">
                            {confirmacion.tipo === "add"
                                ? `¿Estás seguro que quieres agregar ${confirmacion.cantidad} ${item?.name}?`
                                : `¿Estás seguro que quieres retirar ${confirmacion.cantidad} ${item?.name}?`
                            }
                        </p>
                        {confirmacion.nota && (
                            <p className="text-xs text-gray-500 mb-4">Nota: {confirmacion.nota}</p>
                        )}
                        <div className="flex justify-center gap-3 mt-5">
                            <button
                                onClick={() => setConfirmacion(null)}
                                className="border border-gray-300 px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                No
                            </button>
                            <button
                                onClick={handleConfirmar}
                                className={`px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-colors shadow-sm ${
                                    confirmacion.tipo === "add"
                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                        : "bg-rose-600 hover:bg-rose-700"
                                }`}
                            >
                                Sí, {confirmacion.tipo === "add" ? "agregar" : "retirar"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h3 className="text-lg font-bold text-gray-800">Movimiento de stock</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Artículo: <b>{item?.name}</b>
                        </p>

                        <div className="mt-4 grid gap-3">
                            <label className="text-sm">
                                Cantidad
                                <input
                                    id="cantidad"
                                    type="number"
                                    min={1}
                                    defaultValue={1}
                                    className="border rounded-xl p-2.5 w-full mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </label>

                            <label className="text-sm">
                                Nota (opcional)
                                <input
                                    id="nota"
                                    type="text"
                                    placeholder="Ej: Corona paciente #12"
                                    className="border rounded-xl p-2.5 w-full mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </label>

                            <div className="flex justify-end gap-2 mt-2">
                                <button onClick={onClose} className="border border-gray-300 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                    Cancelar
                                </button>

                                <button
                                    onClick={() => handleAccion("add")}
                                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                                >
                                    Agregar
                                </button>

                                <button
                                    onClick={() => handleAccion("remove")}
                                    className="bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-rose-700 transition-colors shadow-sm"
                                >
                                    Retirar
                                </button>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 mt-3">
                            Nota: el sistema no permite que el stock baje de 0.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
