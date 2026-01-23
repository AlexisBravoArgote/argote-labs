import { useState, useEffect, useMemo } from "react";

const TIPOS_TRATAMIENTO = [
    { value: "carillas", label: "Carillas", requiereMateriales: false, fresadoDespues: true },
    { value: "corona_implante", label: "Corona sobre implante", requiereMateriales: false, fresadoDespues: true },
    { value: "coronas", label: "Coronas", requiereMateriales: false, fresadoDespues: true },
    { value: "diseno_sonrisa", label: "Diseño de sonrisa", requiereMateriales: false, fresadoDespues: true },
    { value: "guardas", label: "Guardas", requiereMateriales: false },
    { value: "guia_quirurgica", label: "Guía quirúrgica", requiereMateriales: false },
    { value: "incrustaciones", label: "Incrustaciones", requiereMateriales: false, fresadoDespues: true },
    { value: "modelo_ortodoncia", label: "Modelo de ortodoncia", requiereMateriales: false },
    { value: "otra", label: "Otra", requiereMateriales: false, fresadoDespues: true, requiereNombre: true },
    { value: "rehabilitacion_completa", label: "Rehabilitación completa", requiereMateriales: false, fresadoDespues: true },
];

const DOCTORES = ["Alvaro", "Andrea", "Angulo", "Claudia", "Enrique", "Fierro", "Gustavo", "Ivan", "Linda", "Nathali", "Otro"];

export default function NuevoTrabajoModal({ items, onClose, onConfirm }) {
    const [tipoTratamiento, setTipoTratamiento] = useState("");
    const [nombreTratamiento, setNombreTratamiento] = useState("");
    const [nombrePaciente, setNombrePaciente] = useState("");
    const [pieza, setPieza] = useState("");
    const [doctor, setDoctor] = useState("");
    const [doctorOtro, setDoctorOtro] = useState("");
    const [fechaEspera, setFechaEspera] = useState("");
    const [error, setError] = useState("");

    const tratamientoSeleccionado = TIPOS_TRATAMIENTO.find(t => t.value === tipoTratamiento);
    const requiereNombre = tratamientoSeleccionado?.requiereNombre;

    useEffect(() => {
        // Resetear cuando cambia el tipo de tratamiento
        setNombreTratamiento("");
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

        if (!doctor) {
            setError("Por favor selecciona el doctor.");
            return;
        }

        if (doctor === "Otro" && !doctorOtro.trim()) {
            setError("Por favor ingresa el nombre del doctor.");
            return;
        }

        if (!fechaEspera) {
            setError("Por favor selecciona la fecha de espera.");
            return;
        }

        // No validar materiales al crear trabajo - los materiales se seleccionan al fresar

        // Convertir fecha a formato local (sin conversión UTC) para evitar problemas de timezone
        // Si la fecha es "2024-01-21", la guardamos como "2024-01-21T00:00:00" en hora local
        let fechaEsperaFormateada = null;
        if (fechaEspera) {
            // Crear fecha en hora local (medianoche local)
            const fechaLocal = new Date(fechaEspera + "T00:00:00");
            fechaEsperaFormateada = fechaLocal.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        }

        // Determinar el nombre del doctor final
        const nombreDoctorFinal = doctor === "Otro" ? doctorOtro.trim() : doctor;

        onConfirm({
            treatment_type: tipoTratamiento,
            treatment_name: requiereNombre ? nombreTratamiento.trim() : null,
            patient_name: nombrePaciente.trim(),
            pieza: pieza.trim() || null,
            doctor: nombreDoctorFinal,
            fecha_espera: fechaEsperaFormateada,
            materials: [] // Los materiales se seleccionan al fresar, no al crear el trabajo
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
                        Doctor *
                        <select
                            value={doctor}
                            onChange={(e) => {
                                setDoctor(e.target.value);
                                if (e.target.value !== "Otro") {
                                    setDoctorOtro("");
                                }
                            }}
                            className="border rounded p-2 w-full mt-1"
                        >
                            <option value="">Selecciona un doctor</option>
                            {DOCTORES.map(doc => (
                                <option key={doc} value={doc}>
                                    {doc}
                                </option>
                            ))}
                        </select>
                    </label>

                    {doctor === "Otro" && (
                        <label className="text-sm font-medium">
                            Nombre del doctor *
                            <input
                                type="text"
                                value={doctorOtro}
                                onChange={(e) => setDoctorOtro(e.target.value)}
                                placeholder="Escribe el nombre del doctor"
                                className="border rounded p-2 w-full mt-1"
                            />
                        </label>
                    )}

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

