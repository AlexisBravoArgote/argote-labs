import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabase";
import ModalEnviarTrabajo from "./ModalEnviarTrabajo";

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

export default function DoctorView({ user, perfil }) {
    const [trabajos, setTrabajos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mostrarModalEnviar, setMostrarModalEnviar] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("todos"); // "todos", "pendiente", "finalizado"

    // Función para obtener nombre de tratamiento
    function obtenerNombreTratamiento(trabajo) {
        if (trabajo.treatment_name) return trabajo.treatment_name;
        
        const tratamiento = TIPOS_TRATAMIENTO.find(t => t.value === trabajo.treatment_type);
        return tratamiento ? tratamiento.label : trabajo.treatment_type;
    }

    // Función para obtener el estado del trabajo
    function obtenerEstadoTrabajo(trabajo) {
        if (trabajo.status === "completed") {
            return { texto: "Finalizado", color: "green", etapa: "Finalizado" };
        }
        
        if (trabajo.etapa === "fresado") {
            return { texto: "En proceso - Fresado", color: "blue", etapa: "Fresado" };
        }
        
        if (trabajo.etapa === "diseño") {
            return { texto: "En proceso - Diseño", color: "purple", etapa: "Diseño" };
        }
        
        return { texto: "Pendiente", color: "orange", etapa: "Pendiente" };
    }

    async function cargarTrabajos() {
        setCargando(true);
        setError("");

        try {
            // Cargar trabajos del doctor (filtrar por created_by)
            const { data: trabajosData, error: errTrabajos } = await supabase
                .from("jobs")
                .select("id, treatment_type, treatment_name, patient_name, pieza, doctor, status, etapa, fecha_espera, created_at, completed_at, notas_doctor")
                .eq("created_by", user.id)
                .order("created_at", { ascending: false });

            if (errTrabajos) {
                setError(`Error al cargar trabajos: ${errTrabajos.message}`);
                setCargando(false);
                return;
            }

            // Cargar materiales para cada trabajo
            const jobIds = (trabajosData || []).map(t => t.id);
            if (jobIds.length > 0) {
                const { data: materialesData } = await supabase
                    .from("job_materials")
                    .select("job_id, item_id, quantity")
                    .in("job_id", jobIds);

                if (materialesData) {
                    const itemIds = [...new Set(materialesData.map(m => m.item_id))];
                    const { data: itemsData } = await supabase
                        .from("items")
                        .select("id, name")
                        .in("id", itemIds.length ? itemIds : ["00000000-0000-0000-0000-000000000000"]);

                    const itemMap = new Map((itemsData || []).map(i => [i.id, i.name]));

                    // Agrupar materiales por trabajo
                    const materialesPorJob = new Map();
                    materialesData.forEach(m => {
                        if (!materialesPorJob.has(m.job_id)) {
                            materialesPorJob.set(m.job_id, []);
                        }
                        materialesPorJob.get(m.job_id).push({
                            item_name: itemMap.get(m.item_id) || m.item_id,
                            quantity: m.quantity
                        });
                    });

                    // Agregar materiales a cada trabajo
                    trabajosData.forEach(t => {
                        t.materiales = materialesPorJob.get(t.id) || [];
                    });
                }
            }

            setTrabajos(trabajosData || []);
        } catch (err) {
            setError(`Error inesperado: ${err.message}`);
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargarTrabajos();
    }, [user]);

    async function enviarTrabajo(datosTrabajo) {
        setError("");
        setMostrarModalEnviar(false);

        try {
            // Crear el trabajo con el doctor del perfil
            const nombreDoctor = perfil?.full_name || "Doctor";
            
            const { error: errTrabajo } = await supabase
                .from("jobs")
                .insert({
                    treatment_type: datosTrabajo.treatment_type,
                    treatment_name: datosTrabajo.treatment_name,
                    patient_name: datosTrabajo.patient_name,
                    pieza: datosTrabajo.pieza || null,
                    doctor: nombreDoctor,
                    status: "pending",
                    etapa: "diseño",
                    fecha_espera: datosTrabajo.fecha_espera,
                    notas_doctor: datosTrabajo.notas_doctor || null,
                    created_by: user.id
                });

            if (errTrabajo) {
                setError(`Error al enviar trabajo: ${errTrabajo.message}`);
                return;
            }

            await cargarTrabajos();
        } catch (err) {
            setError(`Error inesperado: ${err.message}`);
        }
    }

    // Filtrar trabajos
    const trabajosFiltrados = useMemo(() => {
        let filtrados = trabajos;

        // Filtro por búsqueda
        const q = busqueda.trim().toLowerCase();
        if (q) {
            filtrados = filtrados.filter(t => 
                t.patient_name?.toLowerCase().includes(q) ||
                obtenerNombreTratamiento(t).toLowerCase().includes(q) ||
                t.pieza?.toLowerCase().includes(q)
            );
        }

        // Filtro por estado
        if (filtroEstado === "pendiente") {
            filtrados = filtrados.filter(t => t.status === "pending");
        } else if (filtroEstado === "finalizado") {
            filtrados = filtrados.filter(t => t.status === "completed");
        }

        return filtrados;
    }, [trabajos, busqueda, filtroEstado]);

    async function logout() {
        await supabase.auth.signOut();
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Portal Doctor</h1>
                    <div className="text-sm text-gray-600">
                        {perfil?.full_name ?? "Doctor"}
                    </div>
                </div>
                <button 
                    onClick={logout} 
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                    title="Cerrar sesión"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>

            {error && <div className="text-red-600 mb-4 bg-red-50 border border-red-200 rounded p-3">{error}</div>}

            {/* Botón para enviar trabajo */}
            <div className="mb-6">
                <button
                    onClick={() => setMostrarModalEnviar(true)}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 text-lg font-medium shadow-md"
                >
                    Mandar trabajo al CEREC
                </button>
            </div>

            {/* Filtros */}
            <div className="mb-4 flex gap-4 items-center">
                <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar trabajos..."
                    className="border rounded p-2 flex-1"
                />
                <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="border rounded p-2"
                >
                    <option value="todos">Todos los estados</option>
                    <option value="pendiente">En proceso</option>
                    <option value="finalizado">Finalizados</option>
                </select>
            </div>

            {/* Lista de trabajos */}
            <h2 className="text-lg font-semibold mb-4">Mis Trabajos</h2>

            {cargando ? (
                <div className="text-gray-600">Cargando trabajos…</div>
            ) : trabajosFiltrados.length === 0 ? (
                <div className="text-gray-500 text-sm">
                    {busqueda || filtroEstado !== "todos" 
                        ? "No se encontraron trabajos con esos filtros." 
                        : "No has enviado ningún trabajo aún."}
                </div>
            ) : (
                <div className="grid gap-4">
                    {trabajosFiltrados.map((trabajo) => {
                        const estado = obtenerEstadoTrabajo(trabajo);
                        return (
                            <div key={trabajo.id} className="border rounded-lg p-4 bg-white shadow-sm">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold">
                                                {obtenerNombreTratamiento(trabajo)} - {trabajo.patient_name}
                                                {trabajo.pieza && ` (Pieza: ${trabajo.pieza})`}
                                            </h3>
                                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                                                estado.color === "green" 
                                                    ? "bg-green-100 text-green-800"
                                                    : estado.color === "blue"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : estado.color === "purple"
                                                            ? "bg-purple-100 text-purple-800"
                                                            : "bg-orange-100 text-orange-800"
                                            }`}>
                                                {estado.texto}
                                            </span>
                                        </div>

                                        <div className="text-sm text-gray-600 space-y-1">
                                            <div>
                                                <span className="font-medium">Etapa actual:</span>{" "}
                                                <span className={`font-semibold ${
                                                    estado.color === "green" 
                                                        ? "text-green-600"
                                                        : estado.color === "blue"
                                                            ? "text-blue-600"
                                                            : estado.color === "purple"
                                                                ? "text-purple-600"
                                                                : "text-orange-600"
                                                }`}>
                                                    {estado.etapa}
                                                </span>
                                            </div>

                                            {trabajo.fecha_espera && (
                                                <div>
                                                    <span className="font-medium">Fecha esperada:</span>{" "}
                                                    <span className="text-blue-600">
                                                        {new Date(trabajo.fecha_espera + "T00:00:00").toLocaleDateString("es-MX", {
                                                            weekday: "long",
                                                            year: "numeric",
                                                            month: "long",
                                                            day: "numeric"
                                                        })}
                                                    </span>
                                                </div>
                                            )}

                                            <div>
                                                <span className="font-medium">Enviado:</span>{" "}
                                                {new Date(trabajo.created_at).toLocaleString("es-MX")}
                                            </div>

                                            {trabajo.status === "completed" && trabajo.completed_at && (
                                                <div>
                                                    <span className="font-medium">Finalizado:</span>{" "}
                                                    <span className="text-green-600">
                                                        {new Date(trabajo.completed_at).toLocaleString("es-MX")}
                                                    </span>
                                                </div>
                                            )}

                                            {trabajo.notas_doctor && (
                                                <div className="mt-2 p-2 bg-gray-50 rounded border-l-4 border-blue-500">
                                                    <span className="font-medium text-sm">Notas adicionales:</span>
                                                    <p className="text-sm text-gray-700 mt-1">{trabajo.notas_doctor}</p>
                                                </div>
                                            )}
                                        </div>

                                        {trabajo.materiales && trabajo.materiales.length > 0 && (
                                            <div className="mt-3 p-3 bg-gray-50 rounded">
                                                <div className="text-sm font-medium mb-2">Materiales utilizados:</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {trabajo.materiales.map((m, idx) => (
                                                        <span 
                                                            key={idx}
                                                            className="text-xs bg-white border rounded px-2 py-1"
                                                        >
                                                            {m.item_name} × {m.quantity}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {mostrarModalEnviar && (
                <ModalEnviarTrabajo
                    perfil={perfil}
                    onClose={() => setMostrarModalEnviar(false)}
                    onConfirm={enviarTrabajo}
                />
            )}
        </div>
    );
}
