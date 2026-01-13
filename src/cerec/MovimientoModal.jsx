export default function MovimientoModal({
    item,
    onClose,
    onConfirm, // (tipo, cantidad, nota)
}) {
    return (
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow w-full max-w-md p-5"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold">Movimiento de stock</h3>
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
                            className="border rounded p-2 w-full mt-1"
                        />
                    </label>

                    <label className="text-sm">
                        Nota (opcional)
                        <input
                            id="nota"
                            type="text"
                            placeholder="Ej: Corona paciente #12"
                            className="border rounded p-2 w-full mt-1"
                        />
                    </label>

                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={onClose} className="border px-3 py-2 rounded">
                            Cancelar
                        </button>

                        <button
                            onClick={() => {
                                const cantidad = parseInt(document.getElementById("cantidad").value || "1", 10);
                                const nota = document.getElementById("nota").value || "";
                                onConfirm("add", cantidad, nota);
                            }}
                            className="bg-emerald-600 text-white px-3 py-2 rounded"
                        >
                            Agregar
                        </button>

                        <button
                            onClick={() => {
                                const cantidad = parseInt(document.getElementById("cantidad").value || "1", 10);
                                const nota = document.getElementById("nota").value || "";
                                onConfirm("remove", cantidad, nota);
                            }}
                            className="bg-rose-600 text-white px-3 py-2 rounded"
                        >
                            Retirar
                        </button>
                    </div>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                    Nota: el sistema no permite que el stock baje de 0.
                </p>
            </div>
        </div>
    );
}
