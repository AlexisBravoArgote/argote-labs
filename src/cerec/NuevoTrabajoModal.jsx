import { useState, useEffect, useMemo } from "react";

const TIPOS_TRATAMIENTO = [
    { value: "corona_implante", label: "Corona sobre implante", requiereMateriales: false, fresadoDespues: true },
    { value: "guia_quirurgica", label: "Guía quirúrgica", requiereMateriales: false },
    { value: "guardas", label: "Guardas", requiereMateriales: false },
    { value: "modelo_ortodoncia", label: "Modelo de ortodoncia", requiereMateriales: false },
    { value: "diseno_sonrisa", label: "Diseño de sonrisa", requiereMateriales: false, fresadoDespues: true },
    { value: "rehabilitacion_completa", label: "Rehabilitación completa", requiereMateriales: true, materialesOpcionales: ["cubo"] },
    { value: "coronas", label: "Coronas", requiereMateriales: false, fresadoDespues: true },
    { value: "carillas", label: "Carillas", requiereMateriales: false, fresadoDespues: true },
    { value: "incrustaciones", label: "Incrustaciones", requiereMateriales: false, fresadoDespues: true },
    { value: "otra", label: "Otra", requiereMateriales: false, fresadoDespues: true, requiereNombre: true },
];

export default function NuevoTrabajoModal({ items, onClose, onConfirm }) {
    const [tipoTratamiento, setTipoTratamiento] = useState("");
    const [nombreTratamiento, setNombreTratamiento] = useState("");
    const [nombrePaciente, setNombrePaciente] = useState("");
    const [pieza, setPieza] = useState("");
    const [doctor, setDoctor] = useState("");
    const [fechaEspera, setFechaEspera] = useState("");
    const [materialesSeleccionados, setMaterialesSeleccionados] = useState([]);
    const [busquedaMateriales, setBusquedaMateriales] = useState("");
    const [error, setError] = useState("");

    const tratamientoSeleccionado = TIPOS_TRATAMIENTO.find(t => t.value === tipoTratamiento);
    const requiereNombre = tratamientoSeleccionado?.requiereNombre;
    const requiereMateriales = tratamientoSeleccionado?.requiereMateriales;
    const materialesObligatorios = tratamientoSeleccionado?.materialesObligatorios || [];
    const materialesOpcionales = tratamientoSeleccionado?.materialesOpcionales || [];

    // Filtrar items por categoría según materiales requeridos
    const itemsDisponiblesBase = useMemo(() => {
        return items.filter(item => {
            if (!requiereMateriales) return false;
            
            // Para corona sobre implante, necesitamos cubos (bloc) y aditamientos (other o que contenga "aditamiento" en el nombre)
            if (tipoTratamiento === "corona_implante") {
                return item.category === "bloc" || 
                       item.category === "other" || 
                       item.name.toLowerCase().includes("aditamiento");
            }
            
            // Para otros tratamientos, solo cubos (bloc)
            if (materialesOpcionales.includes("cubo")) {
                return item.category === "bloc";
            }
            
            return false;
        });
    }, [items, requiereMateriales, tipoTratamiento, materialesOpcionales]);

    // Filtrar por búsqueda
    const itemsDisponibles = useMemo(() => {
        if (!busquedaMateriales.trim()) {
            return itemsDisponiblesBase;
        }
        const busqueda = busquedaMateriales.trim().toLowerCase();
        return itemsDisponiblesBase.filter(item => 
            item.name.toLowerCase().includes(busqueda)
        );
    }, [itemsDisponiblesBase, busquedaMateriales]);

    useEffect(() => {
        // Resetear materiales cuando cambia el tipo de tratamiento
        setMaterialesSeleccionados([]);
        setNombreTratamiento("");
        setBusquedaMateriales("");
    }, [tipoTratamiento]);

    function agregarMaterial(item) {
        const existente = materialesSeleccionados.find(m => m.item_id === item.id);
        if (existente) {
            setMaterialesSeleccionados(
                materialesSeleccionados.map(m =>
                    m.item_id === item.id
                        ? { ...m, quantity: m.quantity + 1 }
                        : m
                )
            );
        } else {
            setMaterialesSeleccionados([
                ...materialesSeleccionados,
                { item_id: item.id, item_name: item.name, quantity: 1 }
            ]);
        }
    }

    function quitarMaterial(itemId) {
        setMaterialesSeleccionados(
            materialesSeleccionados.filter(m => m.item_id !== itemId)
        );
    }

    function ajustarCantidad(itemId, delta) {
        setMaterialesSeleccionados(
            materialesSeleccionados.map(m => {
                if (m.item_id === itemId) {
                    const nuevaCantidad = Math.max(0, m.quantity + delta);
                    if (nuevaCantidad === 0) {
                        return null;
                    }
                    return { ...m, quantity: nuevaCantidad };
                }
                return m;
            }).filter(Boolean)
        );
    }

    function validarYConfirmar() {
        setError("");

        if (!tipoTratamiento) {
            setError("Por favor selecciona un tipo de tratamiento.");
            return;
        }

        if (requiereNombre && !nombreTratamiento.trim()) {
            setError("Por favor ingresa el nombre del tratamiento.");
            return;
        }

        if (!nombrePaciente.trim()) {
            setError("Por favor ingresa el nombre del paciente.");
            return;
        }

        if (!fechaEspera) {
            setError("Por favor selecciona la fecha de espera.");
            return;
        }

        // Validar materiales obligatorios para corona sobre implante (solo si requiereMateriales es true)
        if (tipoTratamiento === "corona_implante" && requiereMateriales) {
            const tieneCubo = materialesSeleccionados.some(m => {
                const item = items.find(i => i.id === m.item_id);
                return item?.category === "bloc";
            });
            const tieneAditamiento = materialesSeleccionados.some(m => {
                const item = items.find(i => i.id === m.item_id);
                return item?.category === "other" || 
                       item?.name.toLowerCase().includes("aditamiento");
            });

            if (!tieneCubo || !tieneAditamiento) {
                setError("Corona sobre implante requiere al menos un cubo y un aditamiento.");
                return;
            }
        }

        // Validar que haya stock suficiente
        for (const material of materialesSeleccionados) {
            const item = items.find(i => i.id === material.item_id);
            if (!item) {
                setError(`El artículo ${material.item_name} no se encuentra disponible.`);
                return;
            }
            if (item.current_qty < material.quantity) {
                setError(`Stock insuficiente para ${material.item_name}. Disponible: ${item.current_qty}`);
                return;
            }
        }

        // Convertir fecha a formato local (sin conversión UTC) para evitar problemas de timezone
        // Si la fecha es "2024-01-21", la guardamos como "2024-01-21T00:00:00" en hora local
        let fechaEsperaFormateada = null;
        if (fechaEspera) {
            // Crear fecha en hora local (medianoche local)
            const fechaLocal = new Date(fechaEspera + "T00:00:00");
            fechaEsperaFormateada = fechaLocal.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        }

        onConfirm({
            treatment_type: tipoTratamiento,
            treatment_name: requiereNombre ? nombreTratamiento.trim() : null,
            patient_name: nombrePaciente.trim(),
            pieza: pieza.trim() || null,
            doctor: doctor.trim() || null,
            fecha_espera: fechaEsperaFormateada,
            materials: materialesSeleccionados
        });
    }

    return (
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold mb-4">Nuevo Trabajo</h3>

                {error && <div className="text-red-600 mb-4 text-sm">{error}</div>}

                <div className="grid gap-4">
                    <label className="text-sm font-medium">
                        Tipo de tratamiento *
                        <select
                            value={tipoTratamiento}
                            onChange={(e) => setTipoTratamiento(e.target.value)}
                            className="border rounded p-2 w-full mt-1"
                        >
                            <option value="">Selecciona un tratamiento</option>
                            {TIPOS_TRATAMIENTO.map(tipo => (
                                <option key={tipo.value} value={tipo.value}>
                                    {tipo.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    {requiereNombre && (
                        <label className="text-sm font-medium">
                            Nombre del tratamiento *
                            <input
                                type="text"
                                value={nombreTratamiento}
                                onChange={(e) => setNombreTratamiento(e.target.value)}
                                placeholder="Ej: Prótesis parcial"
                                className="border rounded p-2 w-full mt-1"
                            />
                        </label>
                    )}

                    <label className="text-sm font-medium">
                        Nombre del paciente *
                        <input
                            type="text"
                            value={nombrePaciente}
                            onChange={(e) => setNombrePaciente(e.target.value)}
                            placeholder="Nombre completo del paciente"
                            className="border rounded p-2 w-full mt-1"
                        />
                    </label>

                    <label className="text-sm font-medium">
                        Pieza
                        <input
                            type="text"
                            value={pieza}
                            onChange={(e) => setPieza(e.target.value)}
                            placeholder="Ej: 21, 32, etc."
                            className="border rounded p-2 w-full mt-1"
                        />
                    </label>

                    <label className="text-sm font-medium">
                        Doctor
                        <input
                            type="text"
                            value={doctor}
                            onChange={(e) => setDoctor(e.target.value)}
                            placeholder="Nombre del doctor"
                            className="border rounded p-2 w-full mt-1"
                        />
                    </label>

                    <label className="text-sm font-medium">
                        Fecha de espera *
                        <input
                            type="date"
                            value={fechaEspera}
                            onChange={(e) => setFechaEspera(e.target.value)}
                            className="border rounded p-2 w-full mt-1"
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </label>

                    {requiereMateriales && (
                        <div>
                            <label className="text-sm font-medium block mb-2">
                                Materiales {materialesObligatorios.length > 0 && "(marcados con * son obligatorios)"}
                            </label>
                            
                            {tipoTratamiento === "corona_implante" && (
                                <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                                    <strong>Requerido:</strong> Al menos 1 cubo y 1 aditamiento
                                </div>
                            )}

                            <input
                                type="text"
                                value={busquedaMateriales}
                                onChange={(e) => setBusquedaMateriales(e.target.value)}
                                placeholder="Buscar materiales..."
                                className="border rounded p-2 w-full mb-3"
                            />

                            <div className="border rounded p-3 space-y-2 max-h-60 overflow-y-auto">
                                {itemsDisponibles.length === 0 ? (
                                    <p className="text-sm text-gray-500">No hay materiales disponibles para este tratamiento.</p>
                                ) : (
                                    itemsDisponibles.map(item => {
                                        const materialSeleccionado = materialesSeleccionados.find(m => m.item_id === item.id);
                                        const esObligatorio = tipoTratamiento === "corona_implante" && 
                                            (item.category === "bloc" || item.name.toLowerCase().includes("aditamiento"));
                                        
                                        return (
                                            <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">
                                                        {item.name}
                                                        {esObligatorio && <span className="text-red-600 ml-1">*</span>}
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                        Stock: {item.current_qty} {item.unit}
                                                    </div>
                                                </div>
                                                {materialSeleccionado ? (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => ajustarCantidad(item.id, -1)}
                                                            className="w-6 h-6 rounded border flex items-center justify-center"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-8 text-center text-sm">{materialSeleccionado.quantity}</span>
                                                        <button
                                                            onClick={() => ajustarCantidad(item.id, 1)}
                                                            disabled={item.current_qty <= materialSeleccionado.quantity}
                                                            className="w-6 h-6 rounded border flex items-center justify-center disabled:opacity-50"
                                                        >
                                                            +
                                                        </button>
                                                        <button
                                                            onClick={() => quitarMaterial(item.id)}
                                                            className="text-red-600 text-xs ml-2"
                                                        >
                                                            Quitar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => agregarMaterial(item)}
                                                        className="text-sm border px-2 py-1 rounded hover:bg-gray-50"
                                                    >
                                                        Agregar
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {materialesSeleccionados.length > 0 && (
                                <div className="mt-3 p-3 bg-gray-50 rounded">
                                    <div className="text-sm font-medium mb-2">Materiales seleccionados:</div>
                                    <div className="space-y-1">
                                        {materialesSeleccionados.map(m => (
                                            <div key={m.item_id} className="text-sm">
                                                {m.item_name} × {m.quantity}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!requiereMateriales && (
                        <div className="p-3 bg-gray-50 rounded text-sm text-gray-600">
                            Este tipo de tratamiento no requiere materiales del inventario.
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="border px-4 py-2 rounded hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button
                        onClick={validarYConfirmar}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                        Comenzar tratamiento
                    </button>
                </div>
            </div>
        </div>
    );
}

