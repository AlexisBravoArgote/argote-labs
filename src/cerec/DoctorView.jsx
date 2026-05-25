import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabase";
import LogisticaTrabajoControl from "./LogisticaTrabajoControl";
import ModalEnviarTrabajo from "./ModalEnviarTrabajo";
import EnviarTrabajoCerecCta from "./EnviarTrabajoCerecCta";
import DoctorTrabajoCard from "./DoctorTrabajoCard";
import DentalCityLogo from "../assets/DentalCity.png";

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

const TAGS_DISPONIBLES = ["E.MAX", "RECICLADO", "SIRONA"];

export default function DoctorView({ user, perfil, esAsistenteDental = false }) {
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
                .select("id, treatment_type, treatment_name, patient_name, pieza, color, doctor, status, etapa, fecha_espera, created_at, completed_at, notas_doctor, logistics_received_at")
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

        const nombreDoctor = esAsistenteDental
            ? (datosTrabajo.doctor || "Sin doctor")
            : (perfil?.full_name || "Doctor");

        if (esAsistenteDental && !datosTrabajo.doctor) {
            const msg = "Por favor selecciona el doctor.";
            setError(msg);
            setErrorModalEnviar(msg);
            return;
        }

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

    const resumenTrabajos = useMemo(() => {
        const esNuevo = (t) => t.status === "pending" && t.etapa === "nuevo";
        const esProceso = (t) => t.status === "pending" && t.etapa !== "nuevo";
        return {
            total: trabajos.length,
            nuevos: trabajos.filter(esNuevo).length,
            proceso: trabajos.filter(esProceso).length,
            finalizados: trabajos.filter((t) => t.status === "completed").length,
        };
    }, [trabajos]);

    function aplicarFiltroResumen(filtro) {
        setFiltroEstado((prev) => (prev === filtro ? "todos" : filtro));
        setPaginaTrabajos(1);
    }

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
                                    <div className="text-lg font-bold text-gray-800">
                                        {esAsistenteDental ? "Portal Asistente Dental" : "Portal Doctor"}
                                    </div>
                                    <div className="text-xs text-gray-500 hidden sm:block">{perfil?.full_name ?? (esAsistenteDental ? "Asistente" : "Doctor")}</div>
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
                            <EnviarTrabajoCerecCta
                                esAsistente={esAsistenteDental}
                                onClick={() => {
                                    setErrorModalEnviar("");
                                    setMostrarModalEnviar(true);
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            {[
                                {
                                    label: "Total",
                                    value: resumenTrabajos.total,
                                    filtro: "todos",
                                    cls: "from-gray-50 to-white border-gray-200 text-gray-800",
                                    activeRing: "ring-2 ring-gray-400 ring-offset-2 border-gray-300",
                                },
                                {
                                    label: "Nuevos",
                                    value: resumenTrabajos.nuevos,
                                    filtro: "nuevo",
                                    cls: "from-amber-50 to-white border-amber-100 text-amber-800",
                                    activeRing: "ring-2 ring-amber-400 ring-offset-2 border-amber-300",
                                },
                                {
                                    label: "En proceso",
                                    value: resumenTrabajos.proceso,
                                    filtro: "proceso",
                                    cls: "from-sky-50 to-white border-sky-100 text-sky-800",
                                    activeRing: "ring-2 ring-sky-400 ring-offset-2 border-sky-300",
                                },
                                {
                                    label: "Finalizados",
                                    value: resumenTrabajos.finalizados,
                                    filtro: "finalizado",
                                    cls: "from-emerald-50 to-white border-emerald-100 text-emerald-800",
                                    activeRing: "ring-2 ring-emerald-400 ring-offset-2 border-emerald-300",
                                },
                            ].map((s) => {
                                const activo = filtroEstado === s.filtro;
                                return (
                                    <button
                                        key={s.label}
                                        type="button"
                                        onClick={() => aplicarFiltroResumen(s.filtro)}
                                        className={`rounded-xl border bg-gradient-to-br px-4 py-3 text-left transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none ${
                                            activo ? s.activeRing : s.cls
                                        }`}
                                    >
                                        <div className="text-2xl font-bold tabular-nums">{s.value}</div>
                                        <div className="text-xs font-semibold uppercase tracking-wide opacity-80">{s.label}</div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mb-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                <div className="relative flex-1 w-full">
                                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={busqueda}
                                        onChange={(e) => { setBusqueda(e.target.value); setPaginaTrabajos(1); }}
                                        placeholder="Buscar por paciente, tratamiento, pieza…"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-gray-50/50 focus:bg-white"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMostrarFiltrosTrabajos(!mostrarFiltrosTrabajos)}
                                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap border ${
                                        mostrarFiltrosTrabajos
                                            ? "bg-emerald-600 text-white border-emerald-600"
                                            : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    {mostrarFiltrosTrabajos ? "Ocultar filtros" : "Filtros"}
                                </button>
                            </div>
                            {(() => {
                                const filtrosActivos = [filtroEstado !== "todos", filtroFechaDesde, filtroFechaHasta, filtroTratamiento].filter(Boolean).length;
                                return filtrosActivos > 0 ? (
                                    <div className="mt-3 text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                                        {filtrosActivos} filtro{filtrosActivos > 1 ? "s" : ""} activo{filtrosActivos > 1 ? "s" : ""}
                                    </div>
                                ) : null;
                            })()}
                        </div>

                        {mostrarFiltrosTrabajos && (
                            <div className="mb-4 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 rounded-2xl border border-emerald-100 p-4 sm:p-5 space-y-4 shadow-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Estado</label>
                                        <select
                                            value={filtroEstado}
                                            onChange={(e) => { setFiltroEstado(e.target.value); setPaginaTrabajos(1); }}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
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
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
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
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Hasta</label>
                                        <input
                                            type="date"
                                            value={filtroFechaHasta}
                                            onChange={(e) => { setFiltroFechaHasta(e.target.value); setPaginaTrabajos(1); }}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
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
                                        className="text-sm text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
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
                                <div className="mb-5 flex flex-wrap gap-2">
                                    {chips.map((chip) => (
                                        <button
                                            key={chip.key}
                                            type="button"
                                            onClick={chip.clear}
                                            className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
                                            title="Quitar filtro"
                                        >
                                            {chip.label}
                                            <span className="text-emerald-500">×</span>
                                        </button>
                                    ))}
                                </div>
                            );
                        })()}

                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Mis trabajos</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {trabajosFiltrados.length} resultado{trabajosFiltrados.length !== 1 ? "s" : ""}
                                    {trabajosFiltrados.length !== trabajos.length && (
                                        <span className="text-gray-400"> · de {trabajos.length} en total</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {cargando ? (
                            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200">
                                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-3" />
                                <p className="text-sm text-gray-500">Cargando tus trabajos…</p>
                            </div>
                        ) : trabajosFiltrados.length === 0 ? (
                            <div className="text-center py-16 px-6 bg-white rounded-2xl border border-dashed border-gray-200">
                                <svg className="w-14 h-14 text-emerald-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <p className="text-gray-700 font-medium">
                                    {busqueda || filtroEstado !== "todos" || filtroTratamiento || filtroFechaDesde || filtroFechaHasta
                                        ? "No hay trabajos con esos filtros"
                                        : "Aún no has enviado trabajos"}
                                </p>
                                <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                                    {busqueda || filtroEstado !== "todos"
                                        ? "Prueba cambiar la búsqueda o limpiar los filtros."
                                        : "Usa el botón de arriba para enviar tu primer caso al laboratorio."}
                                </p>
                            </div>
                        ) : (
                            <>
                            <div className="grid gap-4">
                                {trabajosPaginados.map((trabajo) => (
                                    <DoctorTrabajoCard
                                        key={trabajo.id}
                                        trabajo={trabajo}
                                        obtenerNombreTratamiento={obtenerNombreTratamiento}
                                        obtenerEstadoTrabajo={obtenerEstadoTrabajo}
                                    />
                                ))}
                            </div>
                            {totalPaginasTrabajos > 1 && (
                                <div className="flex items-center justify-center gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setPaginaTrabajos((p) => Math.max(1, p - 1))}
                                        disabled={paginaTrabajos === 1}
                                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Anterior
                                    </button>
                                    <span className="text-sm font-medium text-gray-600 tabular-nums px-2">
                                        {paginaTrabajos} / {totalPaginasTrabajos}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setPaginaTrabajos((p) => Math.min(totalPaginasTrabajos, p + 1))}
                                        disabled={paginaTrabajos === totalPaginasTrabajos}
                                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    seleccionarDoctor={esAsistenteDental}
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
    const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    const primerDia = new Date(añoActual, mesActual, 1);
    const ultimoDia = new Date(añoActual, mesActual + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    // Ajustar para semana que inicia en lunes (0 = lunes, 6 = domingo)
    const diaInicioSemana = (primerDia.getDay() + 6) % 7;

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
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
                    <div className="flex items-center justify-between mb-5">
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

                    <div className="grid grid-cols-7 gap-2 mb-4">
                        {diasSemana.map((dia) => (
                            <div key={dia} className="text-center text-sm font-semibold text-gray-600 py-1.5">{dia}</div>
                        ))}

                        {dias.map((dia, idx) => {
                            if (dia === null) return <div key={`empty-${idx}`} className="h-14 sm:h-16" />;

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
                                    className={`h-14 sm:h-16 border rounded p-1 text-sm transition-colors ${fondoClase}`}
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
                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
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
