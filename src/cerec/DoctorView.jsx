import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabase";
import ModalEnviarTrabajo from "./ModalEnviarTrabajo";
import DentalCityLogo from "../assets/DentalCity.png";

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

const TAGS_DISPONIBLES = ["E.MAX", "RECICLADO", "SIRONA"];

export default function DoctorView({ user, perfil }) {
    const [vista, setVista] = useState("trabajos");
    const [trabajos, setTrabajos] = useState([]);
    const [items, setItems] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [cargandoInventario, setCargandoInventario] = useState(true);
    const [error, setError] = useState("");
    const [mostrarModalEnviar, setMostrarModalEnviar] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [busquedaInventario, setBusquedaInventario] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("todos"); // "todos", "pendiente", "finalizado"
    const [categoriaInventario, setCategoriaInventario] = useState("todas");
    const [tagsFiltrados, setTagsFiltrados] = useState([]);
    const [paginaItems, setPaginaItems] = useState(1);
    const itemsPorPagina = 4;

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

    async function cargarInventario() {
        setCargandoInventario(true);
        setError("");
        try {
            const { data: itemsData, error: errItems } = await supabase
                .from("items")
                .select("id, name, category, unit, current_qty, tags")
                .order("name", { ascending: true });

            if (errItems) {
                setError(`Error al cargar inventario: ${errItems.message}`);
                return;
            }

            setItems(itemsData || []);
        } catch (err) {
            setError(`Error inesperado al cargar inventario: ${err.message}`);
        } finally {
            setCargandoInventario(false);
        }
    }

    useEffect(() => {
        cargarTrabajos();
        cargarInventario();

        // Realtime: auto-refresh for jobs and inventory
        const channel = supabase
            .channel('doctor-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => cargarTrabajos())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => cargarInventario())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_movements' }, () => cargarInventario())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
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

    const itemsFiltrados = useMemo(() => {
        const q = busquedaInventario.trim().toLowerCase();
        return items.filter((it) => {
            const okTexto = !q || it.name?.toLowerCase().includes(q);
            const okCat = categoriaInventario === "todas" || it.category === categoriaInventario;
            let okTags = true;
            if (tagsFiltrados.length > 0) {
                const itemTags = it.tags || [];
                okTags = tagsFiltrados.some((tag) => itemTags.includes(tag));
            }
            return okTexto && okCat && okTags;
        });
    }, [items, busquedaInventario, categoriaInventario, tagsFiltrados]);

    const itemsPaginados = useMemo(() => {
        const inicio = (paginaItems - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        return itemsFiltrados.slice(inicio, fin);
    }, [itemsFiltrados, paginaItems, itemsPorPagina]);

    const totalPaginasItems = Math.ceil(itemsFiltrados.length / itemsPorPagina);

    async function logout() {
        await supabase.auth.signOut();
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <img src={DentalCityLogo} alt="Dental City" className="w-10 h-10 rounded-xl object-contain shadow-sm" />
                                <div>
                                    <div className="text-lg font-bold text-gray-800">Portal Doctor</div>
                                    <div className="text-xs text-gray-500 hidden sm:block">{perfil?.full_name ?? "Doctor"}</div>
                                </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                                {[
                                    { v: "trabajos", label: "Mis Trabajos" },
                                    { v: "inventario", label: "Inventario CEREC" },
                                ].map((tab) => (
                                    <button
                                        key={tab.v}
                                        onClick={() => setVista(tab.v)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${vista === tab.v ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600 hover:text-gray-800"}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Cerrar sesión"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="sm:hidden border-t border-gray-100 flex">
                    {[
                        { v: "trabajos", label: "Trabajos" },
                        { v: "inventario", label: "Inventario" },
                    ].map((tab) => (
                        <button
                            key={tab.v}
                            onClick={() => setVista(tab.v)}
                            className={`flex-1 py-3 text-xs font-medium text-center transition-colors ${vista === tab.v ? "text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/50" : "text-gray-500"}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                {error && <div className="text-red-600 mb-4 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>}

                {vista === "trabajos" && (
                    <>
                        <div className="mb-6">
                            <button
                                onClick={() => setMostrarModalEnviar(true)}
                                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 text-lg font-medium shadow-md"
                            >
                                Mandar trabajo al CEREC
                            </button>
                        </div>

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

                        <h2 className="text-lg font-semibold mb-4">Mis Trabajos</h2>
                        {cargando ? (
                            <div className="text-gray-600">Cargando trabajos...</div>
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
                    </>
                )}

                {vista === "inventario" && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Inventario CEREC</h2>
                                <p className="text-sm text-gray-500">{itemsFiltrados.length} artículo{itemsFiltrados.length !== 1 ? "s" : ""} · Solo lectura</p>
                            </div>
                            <button
                                onClick={cargarInventario}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Actualizar
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    value={busquedaInventario}
                                    onChange={(e) => {
                                        setBusquedaInventario(e.target.value);
                                        setPaginaItems(1);
                                    }}
                                    placeholder="Buscar artículo..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <select
                                value={categoriaInventario}
                                onChange={(e) => {
                                    setCategoriaInventario(e.target.value);
                                    setPaginaItems(1);
                                }}
                                className="px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-sm"
                            >
                                <option value="todas">Todas las categorías</option>
                                <option value="bloc">Bloques (CEREC)</option>
                                <option value="bur">Fresas</option>
                                <option value="anillas">Anillas</option>
                                <option value="other">Otros</option>
                            </select>
                        </div>

                        <div className="flex gap-2 flex-wrap items-center">
                            <span className="text-sm font-medium text-gray-600">Tags:</span>
                            {TAGS_DISPONIBLES.map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => {
                                        if (tagsFiltrados.includes(tag)) {
                                            setTagsFiltrados(tagsFiltrados.filter((t) => t !== tag));
                                        } else {
                                            setTagsFiltrados([...tagsFiltrados, tag]);
                                        }
                                        setPaginaItems(1);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${tagsFiltrados.includes(tag) ? "bg-blue-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>

                        {cargandoInventario ? (
                            <div className="text-center py-12">
                                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-gray-500 text-sm">Cargando inventario...</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {itemsPaginados.map((it) => {
                                        const catLabel = it.category === "bloc" ? "Bloque" : it.category === "bur" ? "Fresa" : it.category === "anillas" ? "Anilla" : "Otro";
                                        const catColor = it.category === "bloc" ? "bg-blue-100 text-blue-700" : it.category === "bur" ? "bg-amber-100 text-amber-700" : it.category === "anillas" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700";
                                        return (
                                            <div key={it.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all">
                                                <div className="flex items-start justify-between mb-3">
                                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${catColor}`}>{catLabel}</span>
                                                    {it.tags && it.tags.length > 0 && (
                                                        <div className="flex gap-1 flex-wrap justify-end">
                                                            {it.tags.map((tag) => (
                                                                <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-medium">{tag}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-800 mb-1">{it.name}</h3>
                                                <div className="flex items-end justify-between mb-2">
                                                    <span className="text-2xl font-bold text-gray-800">{it.current_qty}</span>
                                                    <span className="text-xs text-gray-500">{it.unit}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${it.current_qty === 0 ? "bg-red-500" : it.current_qty <= 3 ? "bg-amber-500" : "bg-blue-500"}`}
                                                        style={{ width: `${Math.min(100, (it.current_qty / 20) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {totalPaginasItems > 1 && (
                                    <div className="flex items-center justify-center gap-3 mt-4">
                                        <button
                                            onClick={() => setPaginaItems((p) => Math.max(1, p - 1))}
                                            disabled={paginaItems === 1}
                                            className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Anterior
                                        </button>
                                        <span className="text-sm text-gray-600">{paginaItems} / {totalPaginasItems}</span>
                                        <button
                                            onClick={() => setPaginaItems((p) => Math.min(totalPaginasItems, p + 1))}
                                            disabled={paginaItems === totalPaginasItems}
                                            className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

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
