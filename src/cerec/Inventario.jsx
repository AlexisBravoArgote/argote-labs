import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import { Link } from "react-router-dom";
import MovimientoModal from "./MovimientoModal";
import NuevoTrabajoModal from "./NuevoTrabajoModal";

export default function Inventario({ user, perfil }) {
    const [items, setItems] = useState([]);
    const [movs, setMovs] = useState([]);
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(true);
    const [cargandoMasMovs, setCargandoMasMovs] = useState(false);
    const [hasMoreMovs, setHasMoreMovs] = useState(true);

    const [busqueda, setBusqueda] = useState("");
    const [categoria, setCategoria] = useState("todas");
    const [tagsFiltrados, setTagsFiltrados] = useState([]);
    const [busquedaHistorial, setBusquedaHistorial] = useState("");
    const [busquedaTrabajos, setBusquedaTrabajos] = useState("");

    const TAGS_DISPONIBLES = ["E.MAX", "RECICLADO", "SIRONA"];

    // Paginación
    const [paginaItems, setPaginaItems] = useState(1);
    const [paginaMovs, setPaginaMovs] = useState(1);
    const [paginaTrabajos, setPaginaTrabajos] = useState(1);
    const itemsPorPagina = 4;

    const [modalItem, setModalItem] = useState(null);
    const [mostrarModalTrabajo, setMostrarModalTrabajo] = useState(false);
    const [mostrarModalFresar, setMostrarModalFresar] = useState(false);
    const [trabajoParaFresar, setTrabajoParaFresar] = useState(null);
    const [trabajosPendientes, setTrabajosPendientes] = useState([]);
    const [historialTrabajos, setHistorialTrabajos] = useState([]);
    const [cargandoTrabajos, setCargandoTrabajos] = useState(false);

    // Función para obtener nombre de tratamiento (debe estar antes de los useMemo)
    function obtenerNombreTratamiento(trabajo) {
        if (trabajo.treatment_name) return trabajo.treatment_name;
        
        const nombres = {
            "corona_implante": "Corona sobre implante",
            "guia_quirurgica": "Guía quirúrgica",
            "guardas": "Guardas",
            "modelo_ortodoncia": "Modelo de ortodoncia",
            "diseno_sonrisa": "Diseño de sonrisa",
            "rehabilitacion_completa": "Rehabilitación completa",
            "coronas": "Coronas",
            "carillas": "Carillas",
            "incrustaciones": "Incrustaciones",
            "otra": "Otro"
        };
        
        return nombres[trabajo.treatment_type] || trabajo.treatment_type;
    }

    const itemsFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return items.filter((it) => {
            const okTexto = !q || it.name.toLowerCase().includes(q);
            const okCat = categoria === "todas" || it.category === categoria;
            
            // Filtrar por tags: si hay tags seleccionados, el item debe tener al menos uno
            let okTags = true;
            if (tagsFiltrados.length > 0) {
                const itemTags = it.tags || [];
                okTags = tagsFiltrados.some(tag => itemTags.includes(tag));
            }
            
            return okTexto && okCat && okTags;
        });
    }, [items, busqueda, categoria, tagsFiltrados]);

    // Filtrar y paginar items
    const itemsPaginados = useMemo(() => {
        const inicio = (paginaItems - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        return itemsFiltrados.slice(inicio, fin);
    }, [itemsFiltrados, paginaItems]);

    const totalPaginasItems = Math.ceil(itemsFiltrados.length / itemsPorPagina);

    // Filtrar movimientos por búsqueda
    const movsFiltrados = useMemo(() => {
        const q = busquedaHistorial.trim().toLowerCase();
        if (!q) return movs;
        return movs.filter(m => 
            m.item_name?.toLowerCase().includes(q) ||
            m.user_name?.toLowerCase().includes(q) ||
            m.reason?.toLowerCase().includes(q) ||
            m.delta?.toString().includes(q)
        );
    }, [movs, busquedaHistorial]);

    // Paginar movimientos
    const movsPaginados = useMemo(() => {
        const inicio = (paginaMovs - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        return movsFiltrados.slice(inicio, fin);
    }, [movsFiltrados, paginaMovs]);

    const totalPaginasMovs = Math.ceil(movsFiltrados.length / itemsPorPagina);

    // Filtrar trabajos por búsqueda
    const trabajosFiltrados = useMemo(() => {
        const q = busquedaTrabajos.trim().toLowerCase();
        if (!q) return historialTrabajos;
        return historialTrabajos.filter(t => 
            t.patient_name?.toLowerCase().includes(q) ||
            t.treatment_name?.toLowerCase().includes(q) ||
            obtenerNombreTratamiento(t).toLowerCase().includes(q) ||
            t.created_by_name?.toLowerCase().includes(q) ||
            t.completed_by_name?.toLowerCase().includes(q)
        );
    }, [historialTrabajos, busquedaTrabajos]);

    // Paginar trabajos
    const trabajosPaginados = useMemo(() => {
        const inicio = (paginaTrabajos - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        return trabajosFiltrados.slice(inicio, fin);
    }, [trabajosFiltrados, paginaTrabajos]);

    const totalPaginasTrabajos = Math.ceil(trabajosFiltrados.length / itemsPorPagina);

    async function cargarMovimientos(offset = 0, limit = 50) {
        try {
            const { data: m, error: mErr, count } = await supabase
                .from("stock_movements")
                .select("id, item_id, delta, reason, created_by, created_at", { count: "exact" })
                .order("created_at", { ascending: false })
                .range(offset, offset + limit - 1);

            if (mErr) {
                console.error("Error al cargar movimientos:", mErr);
                setError(`Error al cargar historial: ${mErr.message}`);
                return { movs: [], hasMore: false };
            }

            const movBase = m ?? [];
            if (movBase.length === 0) {
                return { movs: [], hasMore: false };
            }

            // Mapear nombres bonitos: items + perfiles
            const itemIds = [...new Set(movBase.map((x) => x.item_id))];
            const userIds = [...new Set(movBase.map((x) => x.created_by))];

            const [{ data: itemNames, error: itemsErr }, { data: perfiles, error: profilesErr }] = await Promise.all([
                supabase.from("items").select("id, name").in("id", itemIds.length ? itemIds : ["00000000-0000-0000-0000-000000000000"]),
                supabase.from("profiles").select("id, full_name").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
            ]);

            if (itemsErr) {
                console.error("Error al cargar nombres de items:", itemsErr);
            }
            if (profilesErr) {
                console.error("Error al cargar perfiles:", profilesErr);
            }

            const itemMap = new Map((itemNames ?? []).map((x) => [x.id, x.name]));
            const userMap = new Map((perfiles ?? []).map((x) => [x.id, x.full_name || x.id]));

            const movsMapeados = movBase.map((x) => ({
                ...x,
                item_name: itemMap.get(x.item_id) || x.item_id,
                user_name: userMap.get(x.created_by) || x.created_by,
            }));

            const hasMore = count ? offset + limit < count : movBase.length === limit;

            return { movs: movsMapeados, hasMore };
        } catch (err) {
            console.error("Error inesperado al cargar movimientos:", err);
            setError(`Error inesperado al cargar historial: ${err.message}`);
            return { movs: [], hasMore: false };
        }
    }

    async function cargarTrabajos() {
        setCargandoTrabajos(true);
        
        // Cargar trabajos en proceso
        const { data: pendientes, error: errPendientes } = await supabase
            .from("jobs")
            .select("id, treatment_type, treatment_name, patient_name, created_by, created_at, etapa, fecha_espera")
            .eq("status", "pending")
            .order("created_at", { ascending: false });

        if (errPendientes) {
            console.error("Error cargando trabajos en proceso:", errPendientes);
        } else {
            // Mapear nombres de usuarios
            const userIds = [...new Set((pendientes || []).map(t => t.created_by))];
            const { data: perfiles } = await supabase
                .from("profiles")
                .select("id, full_name")
                .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

            const userMap = new Map((perfiles || []).map(p => [p.id, p.full_name || p.id]));

            setTrabajosPendientes(
                (pendientes || []).map(t => ({
                    ...t,
                    created_by_name: userMap.get(t.created_by) || t.created_by
                }))
            );
        }

        // Cargar historial de trabajos
        const { data: historial, error: errHistorial } = await supabase
            .from("jobs")
            .select("id, treatment_type, treatment_name, patient_name, status, created_by, completed_by, created_at, completed_at, etapa, fecha_espera")
            .order("created_at", { ascending: false })
            .limit(50);

        if (errHistorial) {
            console.error("Error cargando historial de trabajos:", errHistorial);
        } else {
            const userIds = [...new Set((historial || []).flatMap(t => [t.created_by, t.completed_by]).filter(Boolean))];
            const { data: perfiles } = await supabase
                .from("profiles")
                .select("id, full_name")
                .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

            const userMap = new Map((perfiles || []).map(p => [p.id, p.full_name || p.id]));

            setHistorialTrabajos(
                (historial || []).map(t => ({
                    ...t,
                    created_by_name: userMap.get(t.created_by) || t.created_by,
                    completed_by_name: t.completed_by ? (userMap.get(t.completed_by) || t.completed_by) : null
                }))
            );
        }

        setCargandoTrabajos(false);
    }

    async function cargar() {
        setError("");
        setCargando(true);

        try {
            const { data: it, error: iErr } = await supabase
                .from("items")
                .select("id, name, category, unit, current_qty, image_url, tags")
                .order("name", { ascending: true });

            if (iErr) {
                console.error("Error al cargar items:", iErr);
                setError(`Error al cargar artículos: ${iErr.message}`);
                setCargando(false);
                return;
            }
            
            setItems(it ?? []);

            const { movs: movsData, hasMore } = await cargarMovimientos(0, 50);
            setMovs(movsData);
            setHasMoreMovs(hasMore);

            await cargarTrabajos();
        } catch (err) {
            console.error("Error inesperado al cargar:", err);
            setError(`Error inesperado: ${err.message}`);
        } finally {
            setCargando(false);
        }
    }

    async function cargarMasMovimientos() {
        setCargandoMasMovs(true);
        const { movs: nuevosMovs, hasMore } = await cargarMovimientos(movs.length, 50);
        setMovs([...movs, ...nuevosMovs]);
        setHasMoreMovs(hasMore);
        setCargandoMasMovs(false);
    }

    useEffect(() => {
        cargar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function logout() {
        await supabase.auth.signOut();
    }

    async function registrarMovimiento(tipo, cantidad, nota) {
        if (!modalItem) return;
        if (!cantidad || cantidad <= 0) {
            setError("La cantidad debe ser mayor a 0.");
            return;
        }

        setError("");

        // Verificar que el item aún existe antes de intentar el movimiento
        const { data: itemExists, error: checkError } = await supabase
            .from("items")
            .select("id, current_qty")
            .eq("id", modalItem.id)
            .single();

        if (checkError || !itemExists) {
            setError("El artículo ya no existe o no tienes permiso para accederlo. Por favor, actualiza la página.");
            return;
        }

        // Verificar stock suficiente si es una retirada
        if (tipo === "remove" && itemExists.current_qty < cantidad) {
            setError(`Stock insuficiente. Solo hay ${itemExists.current_qty} disponible(s).`);
            return;
        }

        const delta = tipo === "add" ? Math.abs(cantidad) : -Math.abs(cantidad);

        const { error } = await supabase.from("stock_movements").insert({
            item_id: modalItem.id,
            delta,
            reason: nota?.trim() ? nota.trim() : null,
            created_by: user.id,
        });

        if (error) {
            // Mejorar mensajes de error comunes
            if (error.message.includes('item no existe')) {
                setError("Error: El artículo no existe. Por favor, actualiza la página e intenta de nuevo.");
            } else if (error.message.includes('Stock insuficiente')) {
                setError(error.message);
            } else {
                setError(`Error: ${error.message}`);
            }
            console.error("Error al registrar movimiento:", error);
            return;
        }

        // Mantener máximo de 1000 movimientos (eliminar los más antiguos)
        const { count } = await supabase
            .from("stock_movements")
            .select("*", { count: "exact", head: true });

        if (count && count > 1000) {
            // Obtener los IDs de los movimientos más antiguos (los que exceden 1000)
            const { data: movsAntiguos } = await supabase
                .from("stock_movements")
                .select("id")
                .order("created_at", { ascending: true })
                .limit(count - 1000);

            if (movsAntiguos && movsAntiguos.length > 0) {
                const idsAEliminar = movsAntiguos.map((m) => m.id);
                await supabase
                    .from("stock_movements")
                    .delete()
                    .in("id", idsAEliminar);
            }
        }

        setModalItem(null);
        await cargar();
    }

    async function crearTrabajo(datosTrabajo) {
        setError("");
        setMostrarModalTrabajo(false);

        try {
            // 1. Crear el trabajo
            const { data: trabajo, error: errTrabajo } = await supabase
                .from("jobs")
                .insert({
                    treatment_type: datosTrabajo.treatment_type,
                    treatment_name: datosTrabajo.treatment_name,
                    patient_name: datosTrabajo.patient_name,
                    status: "pending",
                    etapa: "diseño",
                    fecha_espera: datosTrabajo.fecha_espera,
                    created_by: user.id
                })
                .select()
                .single();

            if (errTrabajo) {
                setError(`Error al crear trabajo: ${errTrabajo.message}`);
                return;
            }

            // 2. Si hay materiales, crear registros de materiales y restar del inventario
            if (datosTrabajo.materials && datosTrabajo.materials.length > 0) {
                // Crear registros de materiales del trabajo
                const materialesInsert = datosTrabajo.materials.map(m => ({
                    job_id: trabajo.id,
                    item_id: m.item_id,
                    quantity: m.quantity
                }));

                const { error: errMateriales } = await supabase
                    .from("job_materials")
                    .insert(materialesInsert);

                if (errMateriales) {
                    setError(`Error al registrar materiales: ${errMateriales.message}`);
                    // Intentar eliminar el trabajo creado
                    await supabase.from("jobs").delete().eq("id", trabajo.id);
                    return;
                }

                // Restar del inventario y crear movimientos
                for (const material of datosTrabajo.materials) {
                    const { error: errMovimiento } = await supabase
                        .from("stock_movements")
                        .insert({
                            item_id: material.item_id,
                            delta: -material.quantity,
                            reason: `Trabajo: ${datosTrabajo.patient_name} - ${datosTrabajo.treatment_name || datosTrabajo.treatment_type}`,
                            created_by: user.id
                        });

                    if (errMovimiento) {
                        console.error(`Error al restar inventario para ${material.item_name}:`, errMovimiento);
                        // Continuar con los demás materiales
                    }
                }
            }

            await cargar();
        } catch (err) {
            setError(`Error inesperado: ${err.message}`);
        }
    }

    async function finalizarTrabajo(trabajoId) {
        if (!confirm("¿Marcar este trabajo como finalizado?")) return;

        setError("");

        const { error } = await supabase
            .from("jobs")
            .update({
                status: "completed",
                completed_by: user.id,
                completed_at: new Date().toISOString()
            })
            .eq("id", trabajoId);

        if (error) {
            setError(`Error al finalizar trabajo: ${error.message}`);
            return;
        }

        await cargarTrabajos();
    }

    function necesitaFresado(trabajo) {
        const tiposConFresado = ["corona_implante", "coronas", "carillas", "incrustaciones", "diseno_sonrisa", "otra"];
        return tiposConFresado.includes(trabajo.treatment_type);
    }

    function abrirModalFresar(trabajo) {
        setTrabajoParaFresar(trabajo);
        setMostrarModalFresar(true);
    }

    async function confirmarFresado(materiales) {
        if (!trabajoParaFresar || !materiales || materiales.length === 0) {
            setError("Debes seleccionar al menos un cubo para fresar.");
            return;
        }

        setError("");
        setMostrarModalFresar(false);

        try {
            // 1. Crear registros de materiales del trabajo
            const materialesInsert = materiales.map(m => ({
                job_id: trabajoParaFresar.id,
                item_id: m.item_id,
                quantity: m.quantity
            }));

            const { error: errMateriales } = await supabase
                .from("job_materials")
                .insert(materialesInsert);

            if (errMateriales) {
                setError(`Error al registrar materiales: ${errMateriales.message}`);
                return;
            }

            // 2. Restar del inventario y crear movimientos
            for (const material of materiales) {
                const { error: errMovimiento } = await supabase
                    .from("stock_movements")
                    .insert({
                        item_id: material.item_id,
                        delta: -material.quantity,
                        reason: `Fresado - Trabajo: ${trabajoParaFresar.patient_name} - ${obtenerNombreTratamiento(trabajoParaFresar)}`,
                        created_by: user.id
                    });

                if (errMovimiento) {
                    console.error(`Error al restar inventario para ${material.item_name}:`, errMovimiento);
                }
            }

            // 3. Actualizar etapa del trabajo a "fresado"
            const { error: errEtapa } = await supabase
                .from("jobs")
                .update({ etapa: "fresado" })
                .eq("id", trabajoParaFresar.id);

            if (errEtapa) {
                setError(`Error al actualizar etapa: ${errEtapa.message}`);
                return;
            }

            setTrabajoParaFresar(null);
            await cargar();
        } catch (err) {
            setError(`Error inesperado: ${err.message}`);
        }
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">CEREC</h1>
                    <div className="text-sm text-gray-600">
                        {perfil?.full_name ?? "Usuario"} ·{" "}
                        {perfil?.role === "admin" ? "Administrador" : "Personal"}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {perfil?.role === "admin" && (
                        <Link to="/cerec/admin" className="border px-3 py-2 rounded">
                            Panel admin
                        </Link>
                    )}
                    <button onClick={logout} className="border px-3 py-2 rounded">
                        Cerrar sesión
                    </button>
                </div>
            </div>

            {error && <div className="text-red-600 mt-4">{error}</div>}

            <div className="flex items-center justify-between mt-6">
                <h2 className="text-lg font-semibold">Trabajos en proceso</h2>
                <button
                    onClick={() => setMostrarModalTrabajo(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    Empezar trabajo
                </button>
            </div>

            {cargandoTrabajos ? (
                <div className="mt-3 text-gray-600">Cargando trabajos…</div>
            ) : trabajosPendientes.length === 0 ? (
                <div className="mt-3 text-gray-500 text-sm">No hay trabajos en proceso.</div>
            ) : (
                <div className="grid gap-2 mt-3">
                    {trabajosPendientes.map((trabajo) => (
                        <div key={trabajo.id} className="border rounded p-3">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                    <div className="font-semibold">
                                        {obtenerNombreTratamiento(trabajo)} - {trabajo.patient_name}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Iniciado: {new Date(trabajo.created_at).toLocaleString("es-MX")} · {trabajo.created_by_name}
                                    </div>
                                    {trabajo.fecha_espera && (
                                        <div className="text-sm text-blue-600 mt-1">
                                            Fecha esperada: {new Date(trabajo.fecha_espera).toLocaleDateString("es-MX")}
                                        </div>
                                    )}
                                    <div className="text-sm font-medium mt-1">
                                        Etapa: <span className="text-purple-600">{trabajo.etapa === "fresado" ? "Fresado" : "Diseño"}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {necesitaFresado(trabajo) && trabajo.etapa === "diseño" && (
                                        <button
                                            onClick={() => abrirModalFresar(trabajo)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                                        >
                                            Fresar
                                        </button>
                                    )}
                                    <button
                                        onClick={() => finalizarTrabajo(trabajo.id)}
                                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                                    >
                                        Trabajo finalizado
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between mt-10">
                <h2 className="text-lg font-semibold">Historial de trabajos</h2>
            </div>

            {cargandoTrabajos ? (
                <div className="mt-3 text-gray-600">Cargando…</div>
            ) : historialTrabajos.length === 0 ? (
                <div className="mt-3 text-gray-500 text-sm">No hay trabajos en el historial.</div>
            ) : (
                <>
                    <div className="mt-3 mb-3">
                        <input
                            type="text"
                            value={busquedaTrabajos}
                            onChange={(e) => {
                                setBusquedaTrabajos(e.target.value);
                                setPaginaTrabajos(1); // Resetear a página 1 al buscar
                            }}
                            placeholder="Buscar en historial de trabajos..."
                            className="border rounded p-2 w-full"
                        />
                    </div>
                    {trabajosFiltrados.length === 0 ? (
                        <div className="mt-3 text-gray-500 text-sm">No se encontraron trabajos con esa búsqueda.</div>
                    ) : (
                        <>
                            <div className="grid gap-2 mt-3">
                                {trabajosPaginados.map((trabajo) => (
                        <div key={trabajo.id} className="border rounded p-3">
                            <div className="font-semibold">
                                {obtenerNombreTratamiento(trabajo)} - {trabajo.patient_name}
                            </div>
                            <div className="text-sm text-gray-600">
                                {trabajo.status === "completed" ? (
                                    <>
                                        <span className="text-green-600 font-medium">Finalizado</span> ·{" "}
                                        {new Date(trabajo.completed_at).toLocaleString("es-MX")} · {trabajo.completed_by_name}
                                    </>
                                ) : (
                                    <>
                                        <span className="text-orange-600 font-medium">Pendiente</span> ·{" "}
                                        {new Date(trabajo.created_at).toLocaleString("es-MX")} · {trabajo.created_by_name}
                                    </>
                                )}
                                {trabajo.fecha_espera && (
                                    <> · <span className="text-blue-600">Esperado: {new Date(trabajo.fecha_espera).toLocaleDateString("es-MX")}</span></>
                                )}
                                {trabajo.etapa && (
                                    <> · <span className="text-purple-600">Etapa: {trabajo.etapa === "fresado" ? "Fresado" : "Diseño"}</span></>
                                )}
                            </div>
                        </div>
                    ))}
                            </div>
                            {totalPaginasTrabajos > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-4">
                                    <button
                                        onClick={() => setPaginaTrabajos(p => Math.max(1, p - 1))}
                                        disabled={paginaTrabajos === 1}
                                        className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Anterior
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        Página {paginaTrabajos} de {totalPaginasTrabajos} ({trabajosFiltrados.length} trabajos)
                                    </span>
                                    <button
                                        onClick={() => setPaginaTrabajos(p => Math.min(totalPaginasTrabajos, p + 1))}
                                        disabled={paginaTrabajos === totalPaginasTrabajos}
                                        className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            <h2 className="text-lg font-semibold mt-10">Artículos</h2>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <input
                    value={busqueda}
                    onChange={(e) => {
                        setBusqueda(e.target.value);
                        setPaginaItems(1); // Resetear a página 1 al buscar
                    }}
                    placeholder="Buscar artículo…"
                    className="border rounded p-2"
                />
                <select
                    value={categoria}
                    onChange={(e) => {
                        setCategoria(e.target.value);
                        setPaginaItems(1); // Resetear a página 1 al cambiar categoría
                    }}
                    className="border rounded p-2"
                >
                    <option value="todas">Todas las categorías</option>
                    <option value="bloc">Bloques (CEREC)</option>
                    <option value="bur">Fresas</option>
                    <option value="other">Otros</option>
                </select>
                <button onClick={cargar} className="border rounded p-2">
                    Actualizar
                </button>
            </div>

            <div className="mt-3 flex gap-4 flex-wrap items-center">
                <span className="text-sm font-medium">Tags:</span>
                {TAGS_DISPONIBLES.map(tag => (
                    <label key={tag} className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={tagsFiltrados.includes(tag)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setTagsFiltrados([...tagsFiltrados, tag]);
                                } else {
                                    setTagsFiltrados(tagsFiltrados.filter(t => t !== tag));
                                }
                                setPaginaItems(1); // Resetear a página 1 al cambiar tags
                            }}
                            className="w-4 h-4"
                        />
                        <span className="text-sm">{tag}</span>
                    </label>
                ))}
            </div>

            {cargando ? (
                <div className="mt-3 text-gray-600">Cargando…</div>
            ) : (
                <>
                    <div className="grid gap-2 mt-3">
                        {itemsPaginados.map((it) => (
                            <div key={it.id} className="border rounded p-3 flex justify-between gap-3">
                                <div className="flex-1">
                                    <div className="font-semibold">{it.name}</div>
                                    <div className="text-sm text-gray-600">
                                        Stock: <b>{it.current_qty}</b> {it.unit} ·{" "}
                                        {it.category === "bloc"
                                            ? "Bloque"
                                            : it.category === "bur"
                                                ? "Fresa"
                                                : "Otro"}
                                    </div>
                                    {it.tags && it.tags.length > 0 && (
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                            {it.tags.map(tag => (
                                                <span 
                                                    key={tag} 
                                                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setModalItem(it)}
                                    className="bg-black text-white px-3 py-2 rounded"
                                >
                                    Agregar / Retirar
                                </button>
                            </div>
                        ))}
                    </div>
                    {totalPaginasItems > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <button
                                onClick={() => setPaginaItems(p => Math.max(1, p - 1))}
                                disabled={paginaItems === 1}
                                className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-gray-600">
                                Página {paginaItems} de {totalPaginasItems} ({itemsFiltrados.length} artículos)
                            </span>
                            <button
                                onClick={() => setPaginaItems(p => Math.min(totalPaginasItems, p + 1))}
                                disabled={paginaItems === totalPaginasItems}
                                className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}

            <div className="flex items-center justify-between mt-10">
                <h2 className="text-lg font-semibold">Historial global</h2>
            </div>

            <div className="mt-3 mb-3">
                <input
                    type="text"
                    value={busquedaHistorial}
                    onChange={(e) => {
                        setBusquedaHistorial(e.target.value);
                        setPaginaMovs(1); // Resetear a página 1 al buscar
                    }}
                    placeholder="Buscar en historial global..."
                    className="border rounded p-2 w-full"
                />
            </div>

            {movsFiltrados.length === 0 ? (
                <div className="mt-3 text-gray-500 text-sm">No se encontraron movimientos con esa búsqueda.</div>
            ) : (
                <>
                    <div className="grid gap-2 mt-3">
                        {movsPaginados.map((m) => (
                            <div key={m.id} className="border rounded p-3">
                                <div className="font-semibold">
                                    {m.delta > 0 ? `+${m.delta}` : m.delta} · {m.item_name}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {new Date(m.created_at).toLocaleString("es-MX")} · {m.user_name}
                                    {m.reason ? ` · ${m.reason}` : ""}
                                </div>
                            </div>
                        ))}
                    </div>
                    {totalPaginasMovs > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <button
                                onClick={() => setPaginaMovs(p => Math.max(1, p - 1))}
                                disabled={paginaMovs === 1}
                                className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-gray-600">
                                Página {paginaMovs} de {totalPaginasMovs} ({movsFiltrados.length} movimientos)
                            </span>
                            <button
                                onClick={() => setPaginaMovs(p => Math.min(totalPaginasMovs, p + 1))}
                                disabled={paginaMovs === totalPaginasMovs}
                                className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}

            {modalItem && (
                <MovimientoModal
                    item={modalItem}
                    onClose={() => setModalItem(null)}
                    onConfirm={registrarMovimiento}
                />
            )}

            {mostrarModalTrabajo && (
                <NuevoTrabajoModal
                    items={items}
                    onClose={() => setMostrarModalTrabajo(false)}
                    onConfirm={crearTrabajo}
                />
            )}

            {mostrarModalFresar && trabajoParaFresar && (
                <ModalFresar
                    trabajo={trabajoParaFresar}
                    items={items.filter(item => item.category === "bloc")}
                    onClose={() => {
                        setMostrarModalFresar(false);
                        setTrabajoParaFresar(null);
                    }}
                    onConfirm={confirmarFresado}
                />
            )}
        </div>
    );
}

// Componente Modal para Fresar
function ModalFresar({ trabajo, items, onClose, onConfirm }) {
    const [materialesSeleccionados, setMaterialesSeleccionados] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [error, setError] = useState("");

    const itemsFiltrados = items.filter(item => 
        !busqueda.trim() || item.name.toLowerCase().includes(busqueda.trim().toLowerCase())
    );

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

        if (materialesSeleccionados.length === 0) {
            setError("Debes seleccionar al menos un cubo para fresar.");
            return;
        }

        // Validar stock
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

        onConfirm(materialesSeleccionados);
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
                <h3 className="text-xl font-bold mb-4">Fresar - {trabajo.patient_name}</h3>

                {error && <div className="text-red-600 mb-4 text-sm">{error}</div>}

                <div className="mb-4">
                    <label className="text-sm font-medium block mb-2">
                        Seleccionar cubos para fresar
                    </label>
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar cubos..."
                        className="border rounded p-2 w-full mb-3"
                    />

                    <div className="border rounded p-3 space-y-2 max-h-60 overflow-y-auto">
                        {itemsFiltrados.length === 0 ? (
                            <p className="text-sm text-gray-500">No hay cubos disponibles.</p>
                        ) : (
                            itemsFiltrados.map(item => {
                                const materialSeleccionado = materialesSeleccionados.find(m => m.item_id === item.id);
                                
                                return (
                                    <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{item.name}</div>
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
                            <div className="text-sm font-medium mb-2">Cubos seleccionados:</div>
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

                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="border px-4 py-2 rounded hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button
                        onClick={validarYConfirmar}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Confirmar fresado
                    </button>
                </div>
            </div>
        </div>
    );
}
