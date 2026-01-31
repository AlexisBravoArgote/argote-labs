import { useState, useEffect } from "react";

const TIPOS_TRATAMIENTO = [
    { value: "carillas", label: "Carillas" },
    { value: "corona_implante", label: "Corona sobre implante" },
    { value: "coronas", label: "Coronas" },
    { value: "diseno_sonrisa", label: "Diseño de sonrisa" },
    { value: "guardas", label: "Guardas" },
    { value: "guia_quirurgica", label: "Guía quirúrgica" },
    { value: "incrustaciones", label: "Incrustaciones" },
    { value: "modelo_ortodoncia", label: "Modelo de ortodoncia" },
    { value: "otra", label: "Otra", requiereNombre: true },
    { value: "rehabilitacion_completa", label: "Rehabilitación completa" },
];

export default function ModalEnviarTrabajo({ perfil, onClose, onConfirm }) {
    const [tipoTratamiento, setTipoTratamiento] = useState("");
    const [nombreTratamiento, setNombreTratamiento] = useState("");
    const [nombrePaciente, setNombrePaciente] = useState("");
    const [pieza, setPieza] = useState("");
    const [fechaEspera, setFechaEspera] = useState("");
    const [notasDoctor, setNotasDoctor] = useState("");
    const [error, setError] = useState("");

    const tratamientoSeleccionado = TIPOS_TRATAMIENTO.find(t => t.value === tipoTratamiento);
    const requiereNombre = tratamientoSeleccionado?.requiereNombre;

    useEffect(() => {
        // Resetear cuando cambia el tipo de tratamiento
        setNombreTratamiento("");
    }, [tipoTratamiento]);

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

        // Convertir fecha a formato YYYY-MM-DD
        let fechaEsperaFormateada = null;
        if (fechaEspera) {
            const fechaLocal = new Date(fechaEspera + "T00:00:00");
            fechaEsperaFormateada = fechaLocal.toISOString().split('T')[0];
        }

        onConfirm({
            treatment_type: tipoTratamiento,
            treatment_name: requiereNombre ? nombreTratamiento.trim() : null,
            patient_name: nombrePaciente.trim(),
            pieza: pieza.trim() || null,
            fecha_espera: fechaEsperaFormateada,
            notas_doctor: notasDoctor.trim() || null
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
                <h3 className="text-xl font-bold mb-4">Mandar Trabajo al CEREC</h3>

                {error && <div className="text-red-600 mb-4 text-sm bg-red-50 border border-red-200 rounded p-2">{error}</div>}

                <div className="grid gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm text-blue-800">
                            <strong>Doctor:</strong> {perfil?.full_name || "Doctor"}
                        </p>
                    </div>

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
                        Fecha de espera *
                        <input
                            type="date"
                            value={fechaEspera}
                            onChange={(e) => setFechaEspera(e.target.value)}
                            className="border rounded p-2 w-full mt-1"
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </label>

                    <label className="text-sm font-medium">
                        Notas adicionales para el laboratorista (opcional)
                        <textarea
                            value={notasDoctor}
                            onChange={(e) => setNotasDoctor(e.target.value)}
                            placeholder="Cualquier información adicional que pueda ayudar al laboratorista..."
                            className="border rounded p-2 w-full mt-1 h-24 resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Esta información será visible para el laboratorista y puede ayudar en el proceso de fabricación.
                        </p>
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
                        Enviar trabajo
                    </button>
                </div>
            </div>
        </div>
    );
}
