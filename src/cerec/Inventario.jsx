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

    const [modalItem, setModalItem] = useState(null);
    const [mostrarModalTrabajo, setMostrarModalTrabajo] = useState(false);
    const [trabajosPendientes, setTrabajosPendientes] = useState([]);
    const [historialTrabajos, setHistorialTrabajos] = useState([]);
    const [cargandoTrabajos, setCargandoTrabajos] = useState(false);

    const itemsFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return items.filter((it) => {
            const okTexto = !q || it.name.toLowerCase().includes(q);
            const okCat = categoria === "todas" || it.category === categoria;
            return okTexto && okCat;
        });
    }, [items, busqueda, categoria]);

    async function cargarMovimientos(offset = 0, limit = 50) {
        const { data: m, error: mErr, count } = await supabase
            .from("stock_movements")
            .select("id, item_id, delta, reason, created_by, created_at", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (mErr) {
            setError(mErr.message);
            return { movs: [], hasMore: false };
        }

        const movBase = m ?? [];
        if (movBase.length === 0) {
            return { movs: [], hasMore: false };
        }

        // Mapear nombres bonitos: items + perfiles
        const itemIds = [...new Set(movBase.map((x) => x.item_id))];
        const userIds = [...new Set(movBase.map((x) => x.created_by))];

        const [{ data: itemNames }, { data: perfiles }] = await Promise.all([
            supabase.from("items").select("id, name").in("id", itemIds.length ? itemIds : ["00000000-0000-0000-0000-000000000000"]),
            supabase.from("profiles").select("id, full_name").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
        ]);

        const itemMap = new Map((itemNames ?? []).map((x) => [x.id, x.name]));
        const userMap = new Map((perfiles ?? []).map((x) => [x.id, x.full_name || x.id]));

        const movsMapeados = movBase.map((x) => ({
            ...x,
            item_name: itemMap.get(x.item_id) || x.item_id,
            user_name: userMap.get(x.created_by) || x.created_by,
        }));

        const hasMore = count ? offset + limit < count : movBase.length === limit;

        return { movs: movsMapeados, hasMore };
    }

    async function cargarTrabajos() {
        setCargandoTrabajos(true);
        
        // Cargar trabajos pendientes
        const { data: pendientes, error: errPendientes } = await supabase
            .from("jobs")
            .select("id, treatment_type, treatment_name, patient_name, created_by, created_at")
            .eq("status", "pending")
            .order("created_at", { ascending: false });

        if (errPendientes) {
            console.error("Error cargando trabajos pendientes:", errPendientes);
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
            .select("id, treatment_type, treatment_name, patient_name, status, created_by, completed_by, created_at, completed_at")
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

        const { data: it, error: iErr } = await supabase
            .from("items")
            .select("id, name, category, unit, current_qty, image_url")
            .order("name", { ascending: true });

        if (iErr) {
            setError(iErr.message);
            setCargando(false);
            return;
        }
        setItems(it ?? []);

        const { movs: movsData, hasMore } = await cargarMovimientos(0, 50);
        setMovs(movsData);
        setHasMoreMovs(hasMore);

        await cargarTrabajos();
        setCargando(false);
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
            // Ejemplo típico: stock insuficiente por trigger
            setError(error.message);
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

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Inventario CEREC</h1>
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

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
                <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar artículo…"
                    className="border rounded p-2"
                />
                <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
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

            <h2 className="text-lg font-semibold mt-7">Artículos</h2>

            {cargando ? (
                <div className="mt-3 text-gray-600">Cargando…</div>
            ) : (
                <div className="grid gap-2 mt-3">
                    {itemsFiltrados.map((it) => (
                        <div key={it.id} className="border rounded p-3 flex justify-between gap-3">
                            <div>
                                <div className="font-semibold">{it.name}</div>
                                <div className="text-sm text-gray-600">
                                    Stock: <b>{it.current_qty}</b> {it.unit} ·{" "}
                                    {it.category === "bloc"
                                        ? "Bloque"
                                        : it.category === "bur"
                                            ? "Fresa"
                                            : "Otro"}
                                </div>
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
            )}

            <div className="flex items-center justify-between mt-10">
                <h2 className="text-lg font-semibold">Trabajos pendientes</h2>
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
                <div className="mt-3 text-gray-500 text-sm">No hay trabajos pendientes.</div>
            ) : (
                <div className="grid gap-2 mt-3">
                    {trabajosPendientes.map((trabajo) => (
                        <div key={trabajo.id} className="border rounded p-3 flex justify-between items-center">
                            <div>
                                <div className="font-semibold">
                                    {obtenerNombreTratamiento(trabajo)} - {trabajo.patient_name}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Iniciado: {new Date(trabajo.created_at).toLocaleString("es-MX")} · {trabajo.created_by_name}
                                </div>
                            </div>
                            <button
                                onClick={() => finalizarTrabajo(trabajo.id)}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                            >
                                Trabajo finalizado
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <h2 className="text-lg font-semibold mt-10">Historial de trabajos</h2>

            {cargandoTrabajos ? (
                <div className="mt-3 text-gray-600">Cargando…</div>
            ) : historialTrabajos.length === 0 ? (
                <div className="mt-3 text-gray-500 text-sm">No hay trabajos en el historial.</div>
            ) : (
                <div className="grid gap-2 mt-3">
                    {historialTrabajos.map((trabajo) => (
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
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <h2 className="text-lg font-semibold mt-10">Historial global ({movs.length} movimientos mostrados)</h2>

            <div className="grid gap-2 mt-3">
                {movs.map((m) => (
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

            {hasMoreMovs && (
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={cargarMasMovimientos}
                        disabled={cargandoMasMovs}
                        className="border rounded px-4 py-2 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        {cargandoMasMovs ? "Cargando..." : "Cargar más (50 movimientos)"}
                    </button>
                </div>
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
        </div>
    );
}
