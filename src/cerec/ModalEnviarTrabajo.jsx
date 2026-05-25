import { useState, useEffect } from "react";
import { DOCTORES_CEREC } from "./doctoresCerec";

const TIPOS_TRATAMIENTO = [
    { value: "carillas", label: "Carilla" },
    { value: "corona_implante", label: "Corona sobre implante" },
    { value: "coronas", label: "Corona" },
    { value: "diseno_sonrisa", label: "Diseño de sonrisa" },
    { value: "guardas", label: "Guarda funcional" },
    { value: "guia_quirurgica", label: "Guía quirúrgica" },
    { value: "incrustaciones", label: "Incrustación" },
    { value: "modelo_ortodoncia", label: "Modelo de ortodoncia" },
    { value: "modelos_guarda_acetato", label: "Modelo para guarda de acetato" },
    { value: "rpa", label: "RPA" },
    { value: "encerado_digital", label: "Encerado digital" },
    { value: "provisional_pmma", label: "Provisional PMMA" },
    { value: "otra", label: "Otro", requiereNombre: true },
    { value: "rehabilitacion_completa", label: "Rehabilitación completa" },
];

const inputClass =
    "w-full mt-1.5 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow";
const labelClass = "block text-xs font-semibold text-gray-600 uppercase tracking-wide";

export default function ModalEnviarTrabajo({ perfil, onClose, onConfirm, errorEnvio = "", seleccionarDoctor = false }) {
    const [tipoTratamiento, setTipoTratamiento] = useState("");
    const [nombreTratamiento, setNombreTratamiento] = useState("");
    const [nombrePaciente, setNombrePaciente] = useState("");
    const [pieza, setPieza] = useState("");
    const [color, setColor] = useState("");
    const [doctor, setDoctor] = useState("");
    const [doctorOtro, setDoctorOtro] = useState("");
    const [fechaEspera, setFechaEspera] = useState("");
    const [notasDoctor, setNotasDoctor] = useState("");
    const [error, setError] = useState("");
    const [enviando, setEnviando] = useState(false);

    const tratamientoSeleccionado = TIPOS_TRATAMIENTO.find((t) => t.value === tipoTratamiento);
    const requiereNombre = tratamientoSeleccionado?.requiereNombre;

    useEffect(() => {
        setNombreTratamiento("");
    }, [tipoTratamiento]);

    async function validarYConfirmar() {
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
            setError("Por favor ingresa el ID paciente.");
            return;
        }

        if (seleccionarDoctor && !doctor) {
            setError("Por favor selecciona el doctor.");
            return;
        }

        if (seleccionarDoctor && doctor === "Otro" && !doctorOtro.trim()) {
            setError("Por favor ingresa el nombre del doctor.");
            return;
        }

        if (!fechaEspera) {
            setError("Por favor selecciona la fecha de espera.");
            return;
        }

        let fechaEsperaFormateada = null;
        if (fechaEspera) {
            const fechaLocal = new Date(fechaEspera + "T00:00:00");
            fechaEsperaFormateada = fechaLocal.toISOString().split("T")[0];
        }

        const nombreDoctorFinal = seleccionarDoctor ? (doctor === "Otro" ? doctorOtro.trim() : doctor) : null;

        setEnviando(true);
        try {
            await Promise.resolve(
                onConfirm({
                    treatment_type: tipoTratamiento,
                    treatment_name: requiereNombre ? nombreTratamiento.trim() : null,
                    patient_name: nombrePaciente.trim(),
                    pieza: pieza.trim() || null,
                    color: color.trim() || null,
                    doctor: nombreDoctorFinal,
                    fecha_espera: fechaEsperaFormateada,
                    notas_doctor: notasDoctor.trim() || null,
                })
            );
        } finally {
            setEnviando(false);
        }
    }

    const mensajeError = error || errorEnvio;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => {
                if (!enviando) onClose();
            }}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-emerald-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-100/90">
                            Nuevo envío
                        </p>
                        <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                            Trabajo al laboratorio CEREC
                        </h3>
                    </div>
                    <button
                        type="button"
                        disabled={enviando}
                        onClick={onClose}
                        className="p-2 rounded-xl text-white/90 hover:bg-white/15 transition-colors shrink-0 disabled:opacity-50"
                        aria-label="Cerrar"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 px-6 py-5">
                    {mensajeError && (
                        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
                            <svg className="w-5 h-5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>{mensajeError}</span>
                        </div>
                    )}

                    <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                            {(perfil?.full_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-700">
                            <span className="text-gray-500">
                                {seleccionarDoctor ? "Enviando como asistente" : "Doctor"}
                            </span>
                            <div className="font-semibold text-gray-900">{perfil?.full_name || "Usuario"}</div>
                        </div>
                    </div>

                    <div className="grid gap-5">
                        {seleccionarDoctor && (
                            <section className="space-y-4 pb-5 border-b border-gray-100">
                                <h4 className="text-sm font-bold text-gray-800">Doctor responsable</h4>
                                <label className={labelClass}>
                                    Doctor *
                                    <select
                                        value={doctor}
                                        onChange={(e) => {
                                            setDoctor(e.target.value);
                                            if (e.target.value !== "Otro") setDoctorOtro("");
                                        }}
                                        className={inputClass}
                                    >
                                        <option value="">Selecciona un doctor</option>
                                        {DOCTORES_CEREC.map((doc) => (
                                            <option key={doc} value={doc}>
                                                {doc}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                {doctor === "Otro" && (
                                    <label className={labelClass}>
                                        Nombre del doctor *
                                        <input
                                            type="text"
                                            value={doctorOtro}
                                            onChange={(e) => setDoctorOtro(e.target.value)}
                                            placeholder="Nombre completo"
                                            className={inputClass}
                                        />
                                    </label>
                                )}
                            </section>
                        )}

                        <section className="space-y-4 pb-5 border-b border-gray-100">
                            <h4 className="text-sm font-bold text-gray-800">Tratamiento y paciente</h4>
                            <label className={labelClass}>
                                Tipo de tratamiento *
                                <select
                                    value={tipoTratamiento}
                                    onChange={(e) => setTipoTratamiento(e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Selecciona un tratamiento</option>
                                    {TIPOS_TRATAMIENTO.map((tipo) => (
                                        <option key={tipo.value} value={tipo.value}>
                                            {tipo.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {requiereNombre && (
                                <label className={labelClass}>
                                    Nombre del tratamiento *
                                    <input
                                        type="text"
                                        value={nombreTratamiento}
                                        onChange={(e) => setNombreTratamiento(e.target.value)}
                                        placeholder="Ej: Prótesis parcial"
                                        className={inputClass}
                                    />
                                </label>
                            )}

                            <label className={labelClass}>
                                ID paciente *
                                <input
                                    type="text"
                                    value={nombrePaciente}
                                    onChange={(e) => setNombrePaciente(e.target.value)}
                                    placeholder="Ej: P-00123"
                                    className={inputClass}
                                />
                            </label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className={labelClass}>
                                    Pieza
                                    <input
                                        type="text"
                                        value={pieza}
                                        onChange={(e) => setPieza(e.target.value)}
                                        placeholder="Ej: 21, 32"
                                        className={inputClass}
                                    />
                                </label>
                                <label className={labelClass}>
                                    Color
                                    <input
                                        type="text"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        placeholder="Ej: A1, B2"
                                        className={inputClass}
                                    />
                                </label>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-800">Entrega y notas</h4>
                            <label className={labelClass}>
                                Fecha de espera *
                                <input
                                    type="date"
                                    value={fechaEspera}
                                    onChange={(e) => setFechaEspera(e.target.value)}
                                    className={inputClass}
                                    min={new Date().toISOString().split("T")[0]}
                                />
                            </label>

                            <label className={labelClass}>
                                Notas para el laboratorista
                                <span className="normal-case font-normal text-gray-400 ml-1">(opcional)</span>
                                <textarea
                                    value={notasDoctor}
                                    onChange={(e) => setNotasDoctor(e.target.value)}
                                    placeholder="Indicaciones especiales, preferencias de contacto, etc."
                                    className={`${inputClass} h-24 resize-y`}
                                />
                                <p className="text-xs text-gray-500 mt-1.5 normal-case font-normal">
                                    Visible solo para el equipo de laboratorio.
                                </p>
                            </label>
                        </section>
                    </div>
                </div>

                <div className="sticky bottom-0 border-t border-gray-100 bg-gray-50/95 backdrop-blur px-6 py-4 flex flex-col-reverse sm:flex-row justify-end gap-3">
                    <button
                        type="button"
                        disabled={enviando}
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        disabled={enviando}
                        onClick={() => void validarYConfirmar()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 shadow-md shadow-emerald-500/20 transition-all"
                    >
                        {enviando ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Enviando…
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                    />
                                </svg>
                                Enviar al CEREC
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
