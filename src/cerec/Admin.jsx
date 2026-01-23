import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabase";
import { Link } from "react-router-dom";

const TAGS_DISPONIBLES = ["E.MAX", "RECICLADO", "SIRONA"];
const ITEMS_POR_PAGINA = 4;

export default function Admin({ user }) {
    const [items, setItems] = useState([]);
    const [error, setError] = useState("");

    const [name, setName] = useState("");
    const [category, setCategory] = useState("bloc");
    const [unit, setUnit] = useState("pzas");
    const [qty, setQty] = useState(0);
    const [tagsSeleccionados, setTagsSeleccionados] = useState([]);

    const [itemEditando, setItemEditando] = useState(null);
    const [nameEditando, setNameEditando] = useState("");
    const [categoryEditando, setCategoryEditando] = useState("bloc");
    const [unitEditando, setUnitEditando] = useState("pzas");
    const [tagsEditando, setTagsEditando] = useState([]);

    // Estados para búsqueda y paginación de artículos
    const [busquedaItems, setBusquedaItems] = useState("");
    const [paginaItems, setPaginaItems] = useState(1);

    // Estados para historial de movimientos
    const [movimientos, setMovimientos] = useState([]);
    const [cargandoMovimientos, setCargandoMovimientos] = useState(false);
    const [busquedaMovimientos, setBusquedaMovimientos] = useState("");
    const [paginaMovimientos, setPaginaMovimientos] = useState(1);

    // Estados para historial de trabajos
    const [trabajos, setTrabajos] = useState([]);
    const [cargandoTrabajos, setCargandoTrabajos] = useState(false);
    const [busquedaTrabajos, setBusquedaTrabajos] = useState("");
    const [paginaTrabajos, setPaginaTrabajos] = useState(1);

    // Estados para reportes
    const [reportes, setReportes] = useState([]);
    const [cargandoReportes, setCargandoReportes] = useState(false);
    const [busquedaReportes, setBusquedaReportes] = useState("");
    const [filtroTipoReporte, setFiltroTipoReporte] = useState(""); // "error", "falla", ""
    const [paginaReportes, setPaginaReportes] = useState(1);

    async function cargarItems() {
        setError("");
        const { data, error } = await supabase
            .from("items")
            .select("id, name, category, unit, current_qty, tags")
            .order("name", { ascending: true });

        if (error) setError(error.message);
        setItems(data ?? []);
    }

    // Función para obtener nombre de tratamiento
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

    // Filtrar y paginar artículos
    const itemsFiltrados = useMemo(() => {
        const q = busquedaItems.trim().toLowerCase();
        return items.filter(it => !q || it.name.toLowerCase().includes(q));
    }, [items, busquedaItems]);

    const itemsPaginados = useMemo(() => {
        const inicio = (paginaItems - 1) * ITEMS_POR_PAGINA;
        const fin = inicio + ITEMS_POR_PAGINA;
        return itemsFiltrados.slice(inicio, fin);
    }, [itemsFiltrados, paginaItems]);

    const totalPaginasItems = Math.ceil(itemsFiltrados.length / ITEMS_POR_PAGINA);

    // Filtrar y paginar movimientos
    const movimientosFiltrados = useMemo(() => {
        const q = busquedaMovimientos.trim().toLowerCase();
        if (!q) return movimientos;
        return movimientos.filter(m => 
            m.item_name?.toLowerCase().includes(q) ||
            m.user_name?.toLowerCase().includes(q) ||
            m.reason?.toLowerCase().includes(q) ||
            m.delta?.toString().includes(q)
        );
    }, [movimientos, busquedaMovimientos]);

    const movimientosPaginados = useMemo(() => {
        const inicio = (paginaMovimientos - 1) * ITEMS_POR_PAGINA;
        const fin = inicio + ITEMS_POR_PAGINA;
        return movimientosFiltrados.slice(inicio, fin);
    }, [movimientosFiltrados, paginaMovimientos]);

    const totalPaginasMovimientos = Math.ceil(movimientosFiltrados.length / ITEMS_POR_PAGINA);

    // Filtrar y paginar trabajos
    const trabajosFiltrados = useMemo(() => {
        const q = busquedaTrabajos.trim().toLowerCase();
        if (!q) return trabajos;
        return trabajos.filter(t => 
            t.patient_name?.toLowerCase().includes(q) ||
            t.treatment_name?.toLowerCase().includes(q) ||
            obtenerNombreTratamiento(t).toLowerCase().includes(q) ||
            t.created_by_name?.toLowerCase().includes(q) ||
            t.completed_by_name?.toLowerCase().includes(q)
        );
    }, [trabajos, busquedaTrabajos]);

    const trabajosPaginados = useMemo(() => {
        const inicio = (paginaTrabajos - 1) * ITEMS_POR_PAGINA;
        const fin = inicio + ITEMS_POR_PAGINA;
        return trabajosFiltrados.slice(inicio, fin);
    }, [trabajosFiltrados, paginaTrabajos]);

    const totalPaginasTrabajos = Math.ceil(trabajosFiltrados.length / ITEMS_POR_PAGINA);

    useEffect(() => {
        cargarItems();
        cargarMovimientos();
        cargarTrabajos();
        cargarReportes();
    }, []);

    async function cargarMovimientos() {
        setCargandoMovimientos(true);
        setError("");
        
        try {
            const { data: movs, error: movErr } = await supabase
                .from("stock_movements")
                .select("id, item_id, delta, reason, created_by, created_at")
                .order("created_at", { ascending: false })
                .limit(100);

            if (movErr) {
                console.error("Error al cargar movimientos:", movErr);
                setError(`Error al cargar historial: ${movErr.message}`);
                setCargandoMovimientos(false);
                return;
            }

            const movBase = movs ?? [];
            if (movBase.length === 0) {
                setMovimientos([]);
                setCargandoMovimientos(false);
                return;
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

            setMovimientos(movsMapeados);
        } catch (err) {
            console.error("Error inesperado al cargar movimientos:", err);
            setError(`Error inesperado al cargar historial: ${err.message}`);
        } finally {
            setCargandoMovimientos(false);
        }
    }

    async function cargarTrabajos() {
        setCargandoTrabajos(true);
        setError("");
        
        try {
            const { data: historial, error: errHistorial } = await supabase
                .from("jobs")
                .select("id, treatment_type, treatment_name, patient_name, pieza, doctor, status, created_by, completed_by, created_at, completed_at, etapa, fecha_espera")
                .order("created_at", { ascending: false })
                .limit(200);

            if (errHistorial) {
                console.error("Error cargando historial de trabajos:", errHistorial);
                setError(`Error al cargar trabajos: ${errHistorial.message}`);
                setCargandoTrabajos(false);
                return;
            }

            const trabajosBase = historial || [];
            if (trabajosBase.length === 0) {
                setTrabajos([]);
                setCargandoTrabajos(false);
                return;
            }

            const userIds = [...new Set(trabajosBase.flatMap(t => [t.created_by, t.completed_by]).filter(Boolean))];
            const { data: perfiles } = await supabase
                .from("profiles")
                .select("id, full_name")
                .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

            const userMap = new Map((perfiles || []).map(p => [p.id, p.full_name || p.id]));

            setTrabajos(
                trabajosBase.map(t => ({
                    ...t,
                    created_by_name: userMap.get(t.created_by) || t.created_by,
                    completed_by_name: t.completed_by ? (userMap.get(t.completed_by) || t.completed_by) : null
                }))
            );
        } catch (err) {
            console.error("Error inesperado al cargar trabajos:", err);
            setError(`Error inesperado al cargar trabajos: ${err.message}`);
        } finally {
            setCargandoTrabajos(false);
        }
    }

    async function borrarMovimiento(movimientoId) {
        if (!confirm("¿Seguro que quieres borrar este movimiento del historial?\n\nNota: Esto solo eliminará el registro del historial. El stock del artículo NO se modificará.")) return;

        setError("");
        const { error } = await supabase
            .from("stock_movements")
            .delete()
            .eq("id", movimientoId);

        if (error) {
            console.error("Error al borrar movimiento:", error);
            setError(`Error al borrar movimiento: ${error.message}`);
            return;
        }

        await cargarMovimientos();
    }

    async function borrarTrabajo(trabajoId) {
        if (!confirm("¿Seguro que quieres borrar este trabajo del historial?\n\nNota: Esto eliminará el trabajo y sus materiales asociados, pero NO afectará el stock actual.")) return;

        setError("");
        const { error } = await supabase
            .from("jobs")
            .delete()
            .eq("id", trabajoId);

        if (error) {
            console.error("Error al borrar trabajo:", error);
            setError(`Error al borrar trabajo: ${error.message}`);
            return;
        }

        await cargarTrabajos();
    }

    async function cargarReportes() {
        setCargandoReportes(true);
        setError("");
        
        try {
            const { data: reportesData, error: errReportes } = await supabase
                .from("job_reports")
                .select("id, job_id, report_type, description, reported_by, created_at")
                .order("created_at", { ascending: false })
                .limit(200);

            if (errReportes) {
                console.error("Error al cargar reportes:", errReportes);
                setError(`Error al cargar reportes: ${errReportes.message}`);
                setCargandoReportes(false);
                return;
            }

            const reportesBase = reportesData || [];
            if (reportesBase.length === 0) {
                setReportes([]);
                setCargandoReportes(false);
                return;
            }

            // Obtener información de trabajos y usuarios
            const jobIds = [...new Set(reportesBase.map(r => r.job_id))];
            const userIds = [...new Set(reportesBase.map(r => r.reported_by))];

            const [{ data: trabajosData }, { data: perfiles }] = await Promise.all([
                supabase
                    .from("jobs")
                    .select("id, treatment_type, treatment_name, patient_name")
                    .in("id", jobIds.length ? jobIds : ["00000000-0000-0000-0000-000000000000"]),
                supabase
                    .from("profiles")
                    .select("id, full_name")
                    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"])
            ]);

            const trabajoMap = new Map((trabajosData || []).map(t => [t.id, t]));
            const userMap = new Map((perfiles || []).map(p => [p.id, p.full_name || p.id]));

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

            setReportes(
                reportesBase.map(r => {
                    const trabajo = trabajoMap.get(r.job_id);
                    return {
                        ...r,
                        job_info: trabajo ? {
                            patient_name: trabajo.patient_name,
                            treatment_name: obtenerNombreTratamiento(trabajo)
                        } : null,
                        reported_by_name: userMap.get(r.reported_by) || r.reported_by
                    };
                })
            );
        } catch (err) {
            console.error("Error inesperado al cargar reportes:", err);
            setError(`Error inesperado al cargar reportes: ${err.message}`);
        } finally {
            setCargandoReportes(false);
        }
    }

    // Filtrar y paginar reportes
    const reportesFiltrados = useMemo(() => {
        let filtrados = reportes;
        
        // Filtro por tipo
        if (filtroTipoReporte) {
            filtrados = filtrados.filter(r => r.report_type === filtroTipoReporte);
        }
        
        // Filtro por búsqueda
        const q = busquedaReportes.trim().toLowerCase();
        if (q) {
            filtrados = filtrados.filter(r => 
                r.description?.toLowerCase().includes(q) ||
                r.job_info?.patient_name?.toLowerCase().includes(q) ||
                r.job_info?.treatment_name?.toLowerCase().includes(q) ||
                r.reported_by_name?.toLowerCase().includes(q)
            );
        }
        
        return filtrados;
    }, [reportes, filtroTipoReporte, busquedaReportes]);

    const reportesPaginados = useMemo(() => {
        const inicio = (paginaReportes - 1) * ITEMS_POR_PAGINA;
        const fin = inicio + ITEMS_POR_PAGINA;
        return reportesFiltrados.slice(inicio, fin);
    }, [reportesFiltrados, paginaReportes]);

    const totalPaginasReportes = Math.ceil(reportesFiltrados.length / ITEMS_POR_PAGINA);

    function toggleTag(tag) {
        setTagsSeleccionados(prev => 
            prev.includes(tag) 
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    }

    function toggleTagEditando(tag) {
        setTagsEditando(prev => 
            prev.includes(tag) 
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    }

    function iniciarEdicion(item) {
        setItemEditando(item.id);
        setNameEditando(item.name);
        setCategoryEditando(item.category);
        setUnitEditando(item.unit);
        setTagsEditando(item.tags || []);
    }

    function cancelarEdicion() {
        setItemEditando(null);
        setNameEditando("");
        setCategoryEditando("bloc");
        setUnitEditando("pzas");
        setTagsEditando([]);
    }

    async function crear() {
        setError("");
        if (!name.trim()) {
            setError("El nombre es obligatorio.");
            return;
        }

        const { error } = await supabase.from("items").insert({
            name: name.trim(),
            category,
            unit: unit.trim() || "pzas",
            current_qty: Math.max(0, Number(qty) || 0),
            tags: tagsSeleccionados.length > 0 ? tagsSeleccionados : null,
            created_by: user.id,
        });

        if (error) {
            setError(error.message);
            return;
        }

        setName("");
        setQty(0);
        setTagsSeleccionados([]);
        await cargarItems();
    }

    async function actualizar() {
        setError("");
        if (!nameEditando.trim()) {
            setError("El nombre es obligatorio.");
            return;
        }

        const { error } = await supabase
            .from("items")
            .update({
                name: nameEditando.trim(),
                category: categoryEditando,
                unit: unitEditando.trim() || "pzas",
                tags: tagsEditando.length > 0 ? tagsEditando : null,
            })
            .eq("id", itemEditando);

        if (error) {
            setError(error.message);
            return;
        }

        cancelarEdicion();
        await cargarItems();
    }

    async function borrar(id) {
        if (!confirm("¿Seguro que quieres borrar este artículo? También se borrará su historial.")) return;

        setError("");
        const { error } = await supabase.from("items").delete().eq("id", id);
        if (error) setError(error.message);
        await cargarItems();
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Panel admin</h1>
                <Link className="border px-3 py-2 rounded" to="/cerec">
                    Volver al inventario
                </Link>
            </div>

            {error && <div className="text-red-600 mt-4">{error}</div>}

            <div className="mt-6 border rounded p-4">
                <h2 className="font-semibold">Crear artículo</h2>

                <div className="grid gap-3 mt-3 sm:grid-cols-2">
                    <label className="text-sm">
                        Nombre
                        <input className="border rounded p-2 w-full mt-1" value={name} onChange={(e) => setName(e.target.value)} />
                    </label>

                    <label className="text-sm">
                        Categoría
                        <select className="border rounded p-2 w-full mt-1" value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="bloc">Bloques (CEREC)</option>
                            <option value="bur">Fresas</option>
                            <option value="other">Otros</option>
                        </select>
                    </label>

                    <label className="text-sm">
                        Unidad
                        <input className="border rounded p-2 w-full mt-1" value={unit} onChange={(e) => setUnit(e.target.value)} />
                    </label>

                    <label className="text-sm">
                        Stock inicial
                        <input type="number" min={0} className="border rounded p-2 w-full mt-1" value={qty} onChange={(e) => setQty(e.target.value)} />
                    </label>
                </div>

                <div className="mt-3">
                    <label className="text-sm font-medium block mb-2">Tags</label>
                    <div className="flex gap-4 flex-wrap">
                        {TAGS_DISPONIBLES.map(tag => (
                            <label key={tag} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={tagsSeleccionados.includes(tag)}
                                    onChange={() => toggleTag(tag)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">{tag}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <button onClick={crear} className="bg-black text-white px-4 py-2 rounded mt-4">
                    Crear
                </button>
            </div>

            <h2 className="font-semibold mt-8">Artículos</h2>
            
            <div className="mt-3 mb-3">
                <input
                    type="text"
                    value={busquedaItems}
                    onChange={(e) => {
                        setBusquedaItems(e.target.value);
                        setPaginaItems(1);
                    }}
                    placeholder="Buscar artículos..."
                    className="border rounded p-2 w-full"
                />
            </div>

            {items.length === 0 ? (
                <div className="text-gray-500 text-sm mt-3">No hay artículos.</div>
            ) : (
                <>
                    <div className="grid gap-2 mt-3">
                        {itemsPaginados.map((it) => (
                            <div key={it.id} className="border rounded p-3">
                                {itemEditando === it.id ? (
                                    <div className="space-y-3">
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <label className="text-sm">
                                                Nombre
                                                <input 
                                                    className="border rounded p-2 w-full mt-1" 
                                                    value={nameEditando} 
                                                    onChange={(e) => setNameEditando(e.target.value)} 
                                                />
                                            </label>

                                            <label className="text-sm">
                                                Categoría
                                                <select 
                                                    className="border rounded p-2 w-full mt-1" 
                                                    value={categoryEditando} 
                                                    onChange={(e) => setCategoryEditando(e.target.value)}
                                                >
                                                    <option value="bloc">Bloques (CEREC)</option>
                                                    <option value="bur">Fresas</option>
                                                    <option value="other">Otros</option>
                                                </select>
                                            </label>

                                            <label className="text-sm">
                                                Unidad
                                                <input 
                                                    className="border rounded p-2 w-full mt-1" 
                                                    value={unitEditando} 
                                                    onChange={(e) => setUnitEditando(e.target.value)} 
                                                />
                                            </label>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium block mb-2">Tags</label>
                                            <div className="flex gap-4 flex-wrap">
                                                {TAGS_DISPONIBLES.map(tag => (
                                                    <label key={tag} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={tagsEditando.includes(tag)}
                                                            onChange={() => toggleTagEditando(tag)}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="text-sm">{tag}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button 
                                                onClick={actualizar} 
                                                className="bg-green-600 text-white px-4 py-2 rounded"
                                            >
                                                Guardar
                                            </button>
                                            <button 
                                                onClick={cancelarEdicion} 
                                                className="border px-4 py-2 rounded"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="font-semibold">{it.name}</div>
                                            <div className="text-sm text-gray-600">
                                                Stock: <b>{it.current_qty}</b> {it.unit} · {it.category}
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

                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => iniciarEdicion(it)} 
                                                className="border px-3 py-2 rounded"
                                            >
                                                Editar
                                            </button>
                                            <button 
                                                onClick={() => borrar(it.id)} 
                                                className="border px-3 py-2 rounded text-red-600 hover:bg-red-50"
                                            >
                                                Borrar
                                            </button>
                                        </div>
                                    </div>
                                )}
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

            <h2 className="font-semibold mt-10">Historial de movimientos</h2>
            <p className="text-sm text-gray-600 mt-1 mb-3">
                Puedes borrar movimientos del historial para mantenerlo limpio. Esto solo elimina el registro, NO afecta el stock actual.
            </p>

            <div className="mt-3 mb-3">
                <input
                    type="text"
                    value={busquedaMovimientos}
                    onChange={(e) => {
                        setBusquedaMovimientos(e.target.value);
                        setPaginaMovimientos(1);
                    }}
                    placeholder="Buscar en historial..."
                    className="border rounded p-2 w-full"
                />
            </div>

            {cargandoMovimientos ? (
                <div className="text-gray-600 mt-3">Cargando movimientos…</div>
            ) : movimientos.length === 0 ? (
                <div className="text-gray-500 text-sm mt-3">No hay movimientos en el historial.</div>
            ) : (
                <>
                    <div className="grid gap-2 mt-3">
                        {movimientosPaginados.map((m) => (
                            <div key={m.id} className="border rounded p-3 flex justify-between items-center gap-3">
                                <div className="flex-1">
                                    <div className="font-semibold">
                                        {m.delta > 0 ? `+${m.delta}` : m.delta} · {m.item_name}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {new Date(m.created_at).toLocaleString("es-MX")} · {m.user_name}
                                        {m.reason ? ` · ${m.reason}` : ""}
                                    </div>
                                </div>
                                <button
                                    onClick={() => borrarMovimiento(m.id)}
                                    className="border px-3 py-2 rounded text-red-600 hover:bg-red-50 text-sm whitespace-nowrap"
                                >
                                    Borrar
                                </button>
                            </div>
                        ))}
                    </div>
                    {totalPaginasMovimientos > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <button
                                onClick={() => setPaginaMovimientos(p => Math.max(1, p - 1))}
                                disabled={paginaMovimientos === 1}
                                className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-gray-600">
                                Página {paginaMovimientos} de {totalPaginasMovimientos} ({movimientosFiltrados.length} movimientos)
                            </span>
                            <button
                                onClick={() => setPaginaMovimientos(p => Math.min(totalPaginasMovimientos, p + 1))}
                                disabled={paginaMovimientos === totalPaginasMovimientos}
                                className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}

            <h2 className="font-semibold mt-10">Historial de trabajos</h2>
            <p className="text-sm text-gray-600 mt-1 mb-3">
                Puedes borrar trabajos del historial para mantenerlo limpio. Esto eliminará el trabajo y sus materiales asociados, pero NO afectará el stock actual.
            </p>

            <div className="mt-3 mb-3">
                <input
                    type="text"
                    value={busquedaTrabajos}
                    onChange={(e) => {
                        setBusquedaTrabajos(e.target.value);
                        setPaginaTrabajos(1);
                    }}
                    placeholder="Buscar en historial de trabajos..."
                    className="border rounded p-2 w-full"
                />
            </div>

            {cargandoTrabajos ? (
                <div className="text-gray-600 mt-3">Cargando trabajos…</div>
            ) : trabajos.length === 0 ? (
                <div className="text-gray-500 text-sm mt-3">No hay trabajos en el historial.</div>
            ) : (
                <>
                    <div className="grid gap-2 mt-3">
                        {trabajosPaginados.map((trabajo) => (
                            <div key={trabajo.id} className="border rounded p-3 flex justify-between items-center gap-3">
                                <div className="flex-1">
                                    <div className="font-semibold">
                                        {obtenerNombreTratamiento(trabajo)} - {trabajo.patient_name}
                                        {trabajo.pieza && ` (Pieza: ${trabajo.pieza})`}
                                    </div>
                                    {trabajo.doctor && (
                                        <div className="text-sm text-gray-600 mt-1">
                                            Doctor: {trabajo.doctor}
                                        </div>
                                    )}
                                    <div className="text-sm text-gray-600">
                                        {trabajo.status === "completed" ? (
                                            <>
                                                <span className="text-green-600 font-medium">Finalizado</span> ·{" "}
                                                Finalizado por {trabajo.completed_by_name} ·{" "}
                                                {new Date(trabajo.completed_at).toLocaleString("es-MX")} ·{" "}
                                                Iniciado: {new Date(trabajo.created_at).toLocaleString("es-MX")} por {trabajo.created_by_name}
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-orange-600 font-medium">Pendiente</span> ·{" "}
                                                Iniciado: {new Date(trabajo.created_at).toLocaleString("es-MX")} · {trabajo.created_by_name}
                                            </>
                                        )}
                                        {trabajo.fecha_espera && (
                                            <> · <span className="text-blue-600">Esperado: {new Date(trabajo.fecha_espera + "T00:00:00").toLocaleDateString("es-MX")}</span></>
                                        )}
                                        {trabajo.etapa && (
                                            <> · <span className="text-purple-600">Etapa: {trabajo.etapa === "fresado" ? "Fresado" : "Diseño"}</span></>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => borrarTrabajo(trabajo.id)}
                                    className="border px-3 py-2 rounded text-red-600 hover:bg-red-50 text-sm whitespace-nowrap"
                                >
                                    Borrar
                                </button>
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

            <h2 className="font-semibold mt-10">Panel de reportes</h2>
            <p className="text-sm text-gray-600 mt-1 mb-3">
                Reportes de errores y fallas en los trabajos.
            </p>

            <div className="mt-3 mb-3 flex gap-3">
                <input
                    type="text"
                    value={busquedaReportes}
                    onChange={(e) => {
                        setBusquedaReportes(e.target.value);
                        setPaginaReportes(1);
                    }}
                    placeholder="Buscar reportes..."
                    className="border rounded p-2 flex-1"
                />
                <select
                    value={filtroTipoReporte}
                    onChange={(e) => {
                        setFiltroTipoReporte(e.target.value);
                        setPaginaReportes(1);
                    }}
                    className="border rounded p-2"
                >
                    <option value="">Todos los tipos</option>
                    <option value="error">Error</option>
                    <option value="falla">Falla</option>
                </select>
            </div>

            {cargandoReportes ? (
                <div className="text-gray-600 mt-3">Cargando reportes…</div>
            ) : reportes.length === 0 ? (
                <div className="text-gray-500 text-sm mt-3">No hay reportes.</div>
            ) : (
                <>
                    <div className="grid gap-2 mt-3">
                        {reportesPaginados.map((reporte) => (
                            <div key={reporte.id} className="border rounded p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                                        reporte.report_type === "error" 
                                            ? "bg-red-100 text-red-800" 
                                            : "bg-red-100 text-red-800"
                                    }`}>
                                        {reporte.report_type === "error" ? "ERROR" : "FALLA"}
                                    </span>
                                    {reporte.job_info && (
                                        <span className="text-sm font-medium">
                                            {reporte.job_info.treatment_name} - {reporte.job_info.patient_name}
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-700 mb-2">
                                    {reporte.description}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Reportado por {reporte.reported_by_name} · {new Date(reporte.created_at).toLocaleString("es-MX")}
                                </div>
                            </div>
                        ))}
                    </div>
                    {totalPaginasReportes > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <button
                                onClick={() => setPaginaReportes(p => Math.max(1, p - 1))}
                                disabled={paginaReportes === 1}
                                className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-gray-600">
                                Página {paginaReportes} de {totalPaginasReportes} ({reportesFiltrados.length} reportes)
                            </span>
                            <button
                                onClick={() => setPaginaReportes(p => Math.min(totalPaginasReportes, p + 1))}
                                disabled={paginaReportes === totalPaginasReportes}
                                className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
