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
    const [errorModalEnviar, setErrorModalEnviar] = useState("");
    const [mostrarModalEnviar, setMostrarModalEnviar] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [busquedaInventario, setBusquedaInventario] = useState("");
    const [mostrarFiltrosTrabajos, setMostrarFiltrosTrabajos] = useState(false);
    const [filtroEstado, setFiltroEstado] = useState("todos"); // "todos", "nuevo", "proceso", "finalizado"
    const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
    const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
    const [filtroTratamiento, setFiltroTratamiento] = useState("");
    const [categoriaInventario, setCategoriaInventario] = useState("todas");
    const [tagsFiltrados, setTagsFiltrados] = useState([]);
    const [paginaItems, setPaginaItems] = useState(1);
    const [paginaTrabajos, setPaginaTrabajos] = useState(1);
    const itemsPorPagina = 4;
    const trabajosPorPagina = 6;

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

        if (trabajo.status === "pending" && trabajo.etapa === "nuevo") {
            return { texto: "Nuevo - En espera", color: "orange", etapa: "Pendiente de iniciar" };
        }
        
        if (trabajo.etapa === "fresado") {
            return { texto: "En proceso - Fresado", color: "blue", etapa: "Fresado" };
        }
        
        if (trabajo.etapa === "diseño") {
            return { texto: "En proceso - Diseño", color: "purple", etapa: "Diseño" };
        }
        
        return { texto: "Pendiente", color: "orange", etapa: "Pendiente" };
    }

    async function cargarTrabajos(options = {}) {
        const { silent = false } = options;
        if (!silent) {
            setCargando(true);
        }
        setError("");

        try {
            // Cargar trabajos del doctor (filtrar por created_by)
            const { data: trabajosData, error: errTrabajos } = await supabase
                .from("jobs")
                .select("id, treatment_type, treatment_name, patient_name, pieza, color, doctor, status, etapa, fecha_espera, created_at, completed_at, notas_doctor")
                .eq("created_by", user.id)
                .order("created_at", { ascending: false });

            if (errTrabajos) {
                setError(`Error al cargar trabajos: ${errTrabajos.message}`);
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
            if (!silent) setCargando(false);
        }
    }

    async function cargarInventario(options = {}) {
        const { silent = false } = options;
        if (!silent) setCargandoInventario(true);
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
            if (!silent) setCargandoInventario(false);
        }
    }

    useEffect(() => {
        if (!user?.id) return;

        cargarTrabajos();
        cargarInventario();

        // Realtime: actualizar sin pantallas de carga (evita “colgado” al volver de otra pestaña)
        const channel = supabase
            .channel('doctor-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => cargarTrabajos({ silent: true }))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => cargarInventario({ silent: true }))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_movements' }, () => cargarInventario({ silent: true }))
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user?.id]);

    function errorPareceAuth(err) {
        if (!err) return false;
        const t = `${err.message ?? ""} ${err.details ?? ""} ${err.hint ?? ""} ${err.code ?? ""}`;
        return /jwt|session|auth|expired|token|unauthorized|401|permission denied/i.test(t);
    }

    async function refrescarSesionConTope(ms = 12000) {
        return Promise.race([
            supabase.auth.refreshSession(),
            new Promise((resolve) =>
                setTimeout(() => resolve({ data: { session: null }, error: { message: "timeout" } }), ms)
            ),
        ]);
    }

    function conTope(promise, ms, mensaje) {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error(mensaje)), ms)),
        ]);
    }

    async function enviarTrabajo(datosTrabajo) {
        setError("");
        setErrorModalEnviar("");

        const nombreDoctor = perfil?.full_name || "Doctor";

        try {
            // No llamar refreshSession aquí siempre: al volver de otra pestaña chocaba con otros refrescos
            // y a veces dejaba la promesa colgada (“Enviando…” eterno). getSession es inmediato (storage).
            let { data: { session } } = await supabase.auth.getSession();
            let uid = session?.user?.id ?? user?.id;

            if (!uid) {
                await refrescarSesionConTope();
                ({ data: { session } } = await supabase.auth.getSession());
                uid = session?.user?.id ?? user?.id;
            }
            if (!uid) {
                const msg = "No se pudo verificar tu sesión. Cierra sesión y entra de nuevo.";
                setError(msg);
                setErrorModalEnviar(msg);
                return;
            }

            const fila = {
                treatment_type: datosTrabajo.treatment_type,
                treatment_name: datosTrabajo.treatment_name,
                patient_name: datosTrabajo.patient_name,
                pieza: datosTrabajo.pieza || null,
                color: datosTrabajo.color || null,
                doctor: nombreDoctor,
                status: "pending",
                etapa: "nuevo",
                fecha_espera: datosTrabajo.fecha_espera,
                notas_doctor: datosTrabajo.notas_doctor || null,
                created_by: uid,
            };

            let { error: errTrabajo } = await conTope(
                supabase.from("jobs").insert(fila),
                30000,
                "La petición tardó demasiado. Revisa tu conexión y vuelve a intentar."
            );

            if (errTrabajo && errorPareceAuth(errTrabajo)) {
                await refrescarSesionConTope();
                ({ data: { session } } = await supabase.auth.getSession());
                uid = session?.user?.id ?? uid;
                ({ error: errTrabajo } = await conTope(
                    supabase.from("jobs").insert({ ...fila, created_by: uid }),
                    30000,
                    "La petición tardó demasiado. Revisa tu conexión y vuelve a intentar."
                ));
            }

            if (errTrabajo) {
                const msg = `Error al enviar trabajo: ${errTrabajo.message}`;
                setError(msg);
                setErrorModalEnviar(msg);
                return;
            }

            setMostrarModalEnviar(false);
            setErrorModalEnviar("");
            // No esperar cargarTrabajos: tras cambiar de pestaña a veces la query se retrasa y el modal
            // seguía en “Enviando…” aunque el insert ya hubiera terminado.
            void cargarTrabajos({ silent: true }).catch(() => {});
        } catch (err) {
            const msg = `Error inesperado: ${err.message}`;
            setError(msg);
            setErrorModalEnviar(msg);
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
        if (filtroEstado === "nuevo") {
            filtrados = filtrados.filter(t => t.status === "pending" && t.etapa === "nuevo");
        } else if (filtroEstado === "proceso") {
            filtrados = filtrados.filter(t => t.status === "pending" && t.etapa !== "nuevo");
        } else if (filtroEstado === "finalizado") {
            filtrados = filtrados.filter(t => t.status === "completed");
        }

        // Filtro por tratamiento
        if (filtroTratamiento) {
            filtrados = filtrados.filter(t => t.treatment_type === filtroTratamiento);
        }

        // Filtro por fecha desde/hasta (basado en fecha de creacion)
        if (filtroFechaDesde) {
            const fechaDesde = new Date(filtroFechaDesde + "T00:00:00");
            filtrados = filtrados.filter(t => new Date(t.created_at) >= fechaDesde);
        }
        if (filtroFechaHasta) {
            const fechaHasta = new Date(filtroFechaHasta + "T23:59:59");
            filtrados = filtrados.filter(t => new Date(t.created_at) <= fechaHasta);
        }

        return filtrados;
    }, [trabajos, busqueda, filtroEstado, filtroFechaDesde, filtroFechaHasta, filtroTratamiento]);

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
    const trabajosPaginados = useMemo(() => {
        const inicio = (paginaTrabajos - 1) * trabajosPorPagina;
        const fin = inicio + trabajosPorPagina;
        return trabajosFiltrados.slice(inicio, fin);
    }, [trabajosFiltrados, paginaTrabajos]);
    const totalPaginasTrabajos = Math.ceil(trabajosFiltrados.length / trabajosPorPagina);

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
                                    { v: "calendario", label: "Mi Calendario" },
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
                        { v: "calendario", label: "Calendario" },
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
                                onClick={() => { setErrorModalEnviar(""); setMostrarModalEnviar(true); }}
                                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 text-lg font-medium shadow-md"
                            >
                                Mandar trabajo al CEREC
                            </button>
                        </div>

                        <div className="mb-4 bg-white rounded-2xl border border-gray-200 p-4">
                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                <div className="relative flex-1 w-full">
                                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={busqueda}
                                        onChange={(e) => { setBusqueda(e.target.value); setPaginaTrabajos(1); }}
                                        placeholder="Buscar en mis trabajos..."
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                                    />
                                </div>
                                <button
                                    onClick={() => setMostrarFiltrosTrabajos(!mostrarFiltrosTrabajos)}
                                    className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
                                >
                                    {mostrarFiltrosTrabajos ? "Ocultar filtros" : "Filtros"}
                                </button>
                            </div>
                            {(() => {
                                const filtrosActivos = [filtroEstado !== "todos", filtroFechaDesde, filtroFechaHasta, filtroTratamiento].filter(Boolean).length;
                                return filtrosActivos > 0 ? (
                                    <div className="mt-3 text-xs text-orange-700 font-medium bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200 inline-block">
                                        {filtrosActivos} filtro{filtrosActivos > 1 ? "s" : ""} activo{filtrosActivos > 1 ? "s" : ""}
                                    </div>
                                ) : null;
                            })()}
                        </div>

                        {mostrarFiltrosTrabajos && (
                            <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-4 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Estado</label>
                                        <select
                                            value={filtroEstado}
                                            onChange={(e) => { setFiltroEstado(e.target.value); setPaginaTrabajos(1); }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                                        >
                                            <option value="todos">Todos los estados</option>
                                            <option value="nuevo">Nuevo</option>
                                            <option value="proceso">Proceso</option>
                                            <option value="finalizado">Finalizado</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Tratamiento</label>
                                        <select
                                            value={filtroTratamiento}
                                            onChange={(e) => { setFiltroTratamiento(e.target.value); setPaginaTrabajos(1); }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                                        >
                                            <option value="">Todos</option>
                                            {TIPOS_TRATAMIENTO.map((t) => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Desde</label>
                                        <input
                                            type="date"
                                            value={filtroFechaDesde}
                                            onChange={(e) => { setFiltroFechaDesde(e.target.value); setPaginaTrabajos(1); }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Hasta</label>
                                        <input
                                            type="date"
                                            value={filtroFechaHasta}
                                            onChange={(e) => { setFiltroFechaHasta(e.target.value); setPaginaTrabajos(1); }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => {
                                            setFiltroEstado("todos");
                                            setFiltroFechaDesde("");
                                            setFiltroFechaHasta("");
                                            setFiltroTratamiento("");
                                            setPaginaTrabajos(1);
                                        }}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                                    >
                                        Limpiar filtros
                                    </button>
                                </div>
                            </div>
                        )}

                        {(() => {
                            const chips = [];
                            if (filtroEstado !== "todos") {
                                const labelEstado = filtroEstado === "nuevo" ? "Estado: Nuevo" : filtroEstado === "proceso" ? "Estado: Proceso" : "Estado: Finalizado";
                                chips.push({ key: "estado", label: labelEstado, clear: () => { setFiltroEstado("todos"); setPaginaTrabajos(1); } });
                            }
                            if (filtroTratamiento) {
                                const t = TIPOS_TRATAMIENTO.find(x => x.value === filtroTratamiento);
                                chips.push({ key: "tratamiento", label: `Tratamiento: ${t?.label || filtroTratamiento}`, clear: () => { setFiltroTratamiento(""); setPaginaTrabajos(1); } });
                            }
                            if (filtroFechaDesde) {
                                chips.push({ key: "desde", label: `Desde: ${new Date(filtroFechaDesde + "T00:00:00").toLocaleDateString("es-MX")}`, clear: () => { setFiltroFechaDesde(""); setPaginaTrabajos(1); } });
                            }
                            if (filtroFechaHasta) {
                                chips.push({ key: "hasta", label: `Hasta: ${new Date(filtroFechaHasta + "T00:00:00").toLocaleDateString("es-MX")}`, clear: () => { setFiltroFechaHasta(""); setPaginaTrabajos(1); } });
                            }
                            if (!chips.length) return null;
                            return (
                                <div className="mb-4 flex flex-wrap gap-2">
                                    {chips.map((chip) => (
                                        <button
                                            key={chip.key}
                                            onClick={chip.clear}
                                            className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                                            title="Quitar filtro"
                                        >
                                            {chip.label}
                                            <span className="text-blue-500">×</span>
                                        </button>
                                    ))}
                                </div>
                            );
                        })()}

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
                            <>
                            <div className="grid gap-4">
                                {trabajosPaginados.map((trabajo) => {
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
                                                        {trabajo.color && (
                                                            <div>
                                                                <span className="font-medium">Color:</span>{" "}
                                                                <span className="text-amber-700 font-semibold">{trabajo.color}</span>
                                                            </div>
                                                        )}

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
                            {totalPaginasTrabajos > 1 && (
                                <div className="flex items-center justify-center gap-3 mt-4">
                                    <button
                                        onClick={() => setPaginaTrabajos((p) => Math.max(1, p - 1))}
                                        disabled={paginaTrabajos === 1}
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Anterior
                                    </button>
                                    <span className="text-sm text-gray-600">{paginaTrabajos} / {totalPaginasTrabajos}</span>
                                    <button
                                        onClick={() => setPaginaTrabajos((p) => Math.min(totalPaginasTrabajos, p + 1))}
                                        disabled={paginaTrabajos === totalPaginasTrabajos}
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            )}
                            </>
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
                
                {vista === "calendario" && (
                    <DoctorCalendario
                        trabajos={trabajos}
                        cargando={cargando}
                        obtenerNombreTratamiento={obtenerNombreTratamiento}
                    />
                )}
            </div>

            {mostrarModalEnviar && (
                <ModalEnviarTrabajo
                    perfil={perfil}
                    errorEnvio={errorModalEnviar}
                    onClose={() => { setMostrarModalEnviar(false); setErrorModalEnviar(""); }}
                    onConfirm={enviarTrabajo}
                />
            )}
        </div>
    );
}

function DoctorCalendario({ trabajos, cargando, obtenerNombreTratamiento }) {
    const [mesActual, setMesActual] = useState(new Date().getMonth());
    const [añoActual, setAñoActual] = useState(new Date().getFullYear());
    const [fechaSeleccionada, setFechaSeleccionada] = useState(null);

    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    const primerDia = new Date(añoActual, mesActual, 1);
    const ultimoDia = new Date(añoActual, mesActual + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaInicioSemana = primerDia.getDay();

    const trabajosCalendario = useMemo(() => {
        return (trabajos || [])
            .map((t) => {
                let fechaRelevante = null;
                let tipoFecha = null;

                if (t.status === "completed" && t.completed_at) {
                    fechaRelevante = new Date(t.completed_at);
                    tipoFecha = "finalizado";
                } else if (t.fecha_espera) {
                    fechaRelevante = new Date(t.fecha_espera + "T00:00:00");
                    tipoFecha = "pendiente";
                }

                return {
                    ...t,
                    fechaRelevante,
                    tipoFecha,
                    treatment_name_display: obtenerNombreTratamiento(t),
                };
            })
            .filter((t) => t.fechaRelevante !== null);
    }, [trabajos, obtenerNombreTratamiento]);

    const trabajosPorFecha = useMemo(() => {
        const mapa = new Map();
        trabajosCalendario.forEach((t) => {
            const fechaKey = t.fechaRelevante.toISOString().split("T")[0];
            if (!mapa.has(fechaKey)) {
                mapa.set(fechaKey, []);
            }
            mapa.get(fechaKey).push(t);
        });
        return mapa;
    }, [trabajosCalendario]);

    const trabajosDiaSeleccionado = fechaSeleccionada
        ? trabajosPorFecha.get(fechaSeleccionada) || []
        : [];

    function cambiarMes(delta) {
        let nuevoMes = mesActual + delta;
        let nuevoAño = añoActual;

        if (nuevoMes < 0) {
            nuevoMes = 11;
            nuevoAño--;
        } else if (nuevoMes > 11) {
            nuevoMes = 0;
            nuevoAño++;
        }

        setMesActual(nuevoMes);
        setAñoActual(nuevoAño);
        setFechaSeleccionada(null);
    }

    function obtenerFechaKey(dia) {
        const fecha = new Date(añoActual, mesActual, dia);
        return fecha.toISOString().split("T")[0];
    }

    function esHoy(dia) {
        const hoy = new Date();
        return dia === hoy.getDate() && mesActual === hoy.getMonth() && añoActual === hoy.getFullYear();
    }

    function tieneTrabajos(dia) {
        return trabajosPorFecha.has(obtenerFechaKey(dia));
    }

    function todosFinalizados(dia) {
        const trabajosDelDia = trabajosPorFecha.get(obtenerFechaKey(dia));
        if (!trabajosDelDia || trabajosDelDia.length === 0) return false;
        return trabajosDelDia.every((t) => t.tipoFecha === "finalizado");
    }

    function tienePendientes(dia) {
        const trabajosDelDia = trabajosPorFecha.get(obtenerFechaKey(dia));
        if (!trabajosDelDia || trabajosDelDia.length === 0) return false;
        return trabajosDelDia.some((t) => t.tipoFecha === "pendiente");
    }

    function seleccionarFecha(dia) {
        const fechaKey = obtenerFechaKey(dia);
        setFechaSeleccionada(fechaSeleccionada === fechaKey ? null : fechaKey);
    }

    const dias = [];
    for (let i = 0; i < diaInicioSemana; i++) dias.push(null);
    for (let dia = 1; dia <= diasEnMes; dia++) dias.push(dia);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Mi Calendario</h2>
                    <p className="text-sm text-gray-500">Solo muestra tus trabajos enviados</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-gray-600">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                        Finalizado
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-gray-600">
                        <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                        Pendiente
                    </span>
                </div>
            </div>

            {cargando ? (
                <div className="text-center py-12 text-gray-500">Cargando calendario...</div>
            ) : (
                <>
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={() => cambiarMes(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h3 className="text-lg font-semibold">{meses[mesActual]} {añoActual}</h3>
                        <button onClick={() => cambiarMes(1)} className="p-2 hover:bg-gray-100 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-6">
                        {diasSemana.map((dia) => (
                            <div key={dia} className="text-center text-sm font-medium text-gray-600 py-2">{dia}</div>
                        ))}

                        {dias.map((dia, idx) => {
                            if (dia === null) return <div key={`empty-${idx}`} className="aspect-square" />;

                            const fechaKey = obtenerFechaKey(dia);
                            const esHoyDia = esHoy(dia);
                            const estaSeleccionado = fechaSeleccionada === fechaKey;
                            const tieneTrab = tieneTrabajos(dia);
                            const todosFin = todosFinalizados(dia);
                            const tienePend = tienePendientes(dia);

                            let fondoClase = "";
                            let bolitaColor = "";
                            if (esHoyDia) {
                                fondoClase = "bg-blue-100 border-blue-500 font-bold";
                            } else if (estaSeleccionado) {
                                fondoClase = "bg-blue-200 border-blue-600";
                            } else if (tieneTrab) {
                                fondoClase = todosFin
                                    ? "bg-green-50 border-green-300 hover:bg-green-100"
                                    : "bg-red-50 border-red-300 hover:bg-red-100";
                            } else {
                                fondoClase = "hover:bg-gray-50";
                            }

                            if (tieneTrab) {
                                bolitaColor = todosFin ? "bg-green-500" : (tienePend ? "bg-red-500" : "");
                            }

                            return (
                                <button
                                    key={dia}
                                    onClick={() => seleccionarFecha(dia)}
                                    className={`aspect-square border rounded p-1 text-sm transition-colors ${fondoClase}`}
                                >
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <span>{dia}</span>
                                        {bolitaColor && (
                                            <span className="inline-block w-1.5 h-1.5 mt-1 rounded-full">
                                                <span className={`inline-block w-1.5 h-1.5 ${bolitaColor} rounded-full`}></span>
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {fechaSeleccionada ? (
                        <div className="border-t pt-4">
                            <h4 className="font-semibold mb-3">
                                Trabajos del {new Date(fechaSeleccionada + "T00:00:00").toLocaleDateString("es-MX", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </h4>
                            {trabajosDiaSeleccionado.length === 0 ? (
                                <p className="text-gray-500 text-sm">No hay trabajos en esta fecha.</p>
                            ) : (
                                <div className="space-y-2">
                                    {trabajosDiaSeleccionado.map((trabajo) => (
                                        <div
                                            key={trabajo.id}
                                            className={`border rounded p-3 ${
                                                trabajo.tipoFecha === "finalizado"
                                                    ? "bg-green-50 border-green-200"
                                                    : "bg-red-50 border-red-200"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs px-2 py-1 rounded font-medium ${
                                                    trabajo.tipoFecha === "finalizado"
                                                        ? "bg-green-200 text-green-800"
                                                        : "bg-red-200 text-red-800"
                                                }`}>
                                                    {trabajo.tipoFecha === "finalizado" ? "Finalizado" : "Pendiente"}
                                                </span>
                                                <span className="font-semibold">
                                                    {trabajo.treatment_name_display} - {trabajo.patient_name}
                                                </span>
                                            </div>
                                            {trabajo.pieza && (
                                                <div className="text-sm text-gray-600">Pieza: {trabajo.pieza}</div>
                                            )}
                                            <div className="text-xs text-gray-500 mt-1">
                                                {trabajo.tipoFecha === "finalizado"
                                                    ? `Finalizado el ${new Date(trabajo.completed_at).toLocaleString("es-MX")}`
                                                    : `Fecha esperada: ${new Date(trabajo.fecha_espera + "T00:00:00").toLocaleDateString("es-MX")}`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 text-sm py-4">
                            Selecciona una fecha para ver tus trabajos
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
