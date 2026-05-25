import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";

const ESTADOS = [
    { v: "pendiente", label: "Pendiente", color: "amber" },
    { v: "en_progreso", label: "En progreso", color: "sky" },
    { v: "completada", label: "Completada", color: "emerald" },
];

const PRIORIDADES = [
    { v: "baja", label: "Baja", ring: "ring-gray-200", bg: "bg-gray-100", text: "text-gray-700" },
    { v: "media", label: "Media", ring: "ring-blue-200", bg: "bg-blue-100", text: "text-blue-800" },
    { v: "alta", label: "Alta", ring: "ring-orange-200", bg: "bg-orange-100", text: "text-orange-800" },
    { v: "urgente", label: "Urgente", ring: "ring-red-200", bg: "bg-red-100", text: "text-red-800" },
];

function iniciales(nombre) {
    if (!nombre?.trim()) return "?";
    const p = nombre.trim().split(/\s+/);
    if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
    return nombre.slice(0, 2).toUpperCase();
}

function prioridadMeta(p) {
    return PRIORIDADES.find((x) => x.v === p) ?? PRIORIDADES[1];
}

function esVencida(tarea) {
    if (!tarea.due_at || tarea.status === "completada") return false;
    return new Date(tarea.due_at) < new Date();
}

function formatearFecha(iso) {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function TareaModal({ tarea, staff, user, onClose, onGuardado }) {
    const [form, setForm] = useState({
        title: tarea?.title ?? "",
        description: tarea?.description ?? "",
        status: tarea?.status ?? "pendiente",
        priority: tarea?.priority ?? "media",
        assigned_to: tarea?.assigned_to ?? "",
        due_at: tarea?.due_at ? tarea.due_at.slice(0, 16) : "",
    });
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        const title = form.title.trim();
        if (!title) {
            setError("El título es obligatorio.");
            return;
        }
        if (!user?.id) {
            setError("No hay sesión activa.");
            return;
        }

        setGuardando(true);
        setError("");

        const now = new Date().toISOString();
        const payload = {
            title,
            description: form.description.trim(),
            status: form.status,
            priority: form.priority,
            assigned_to: form.assigned_to || null,
            due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
            updated_at: now,
            completed_at:
                form.status === "completada"
                    ? tarea?.completed_at ?? now
                    : null,
        };

        if (tarea?.id) {
            const { error: err } = await supabase.from("staff_tasks").update(payload).eq("id", tarea.id);
            if (err) {
                setError(err.message || "No se pudo actualizar.");
                setGuardando(false);
                return;
            }
        } else {
            const { error: err } = await supabase.from("staff_tasks").insert({
                ...payload,
                created_by: user.id,
            });
            if (err) {
                setError(err.message || "No se pudo crear.");
                setGuardando(false);
                return;
            }
        }

        setGuardando(false);
        onGuardado();
        onClose();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-indigo-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-sky-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">
                        {tarea ? "Editar tarea" : "Nueva tarea"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-white/90 hover:bg-white/20 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Título *</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Ej. Preparar fresas para mañana"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            rows={3}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                            placeholder="Detalles opcionales…"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                            >
                                {ESTADOS.map((s) => (
                                    <option key={s.v} value={s.v}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Prioridad</label>
                            <select
                                value={form.priority}
                                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                            >
                                {PRIORIDADES.map((p) => (
                                    <option key={p.v} value={p.v}>
                                        {p.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Asignar a</label>
                        <select
                            value={form.assigned_to}
                            onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Sin asignar</option>
                            {staff.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.full_name || "Usuario"}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha límite</label>
                        <input
                            type="datetime-local"
                            value={form.due_at}
                            onChange={(e) => setForm((f) => ({ ...f, due_at: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={guardando}
                            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                        >
                            {guardando ? "Guardando…" : tarea ? "Guardar cambios" : "Crear tarea"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function TarjetaTarea({ tarea, nombres, onEditar, onCambiarEstado, onEliminar }) {
    const pri = prioridadMeta(tarea.priority);
    const vencida = esVencida(tarea);
    const asignado = tarea.assigned_to ? nombres[tarea.assigned_to] : null;

    return (
        <article
            className={`group bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all ${
                vencida ? "border-red-200 ring-1 ring-red-100" : "border-gray-200 hover:border-indigo-200"
            }`}
        >
            <div className="flex items-start gap-2">
                <button
                    type="button"
                    title={tarea.status === "completada" ? "Marcar pendiente" : "Marcar completada"}
                    onClick={() =>
                        onCambiarEstado(
                            tarea,
                            tarea.status === "completada" ? "pendiente" : "completada"
                        )
                    }
                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        tarea.status === "completada"
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-gray-300 hover:border-indigo-500"
                    }`}
                >
                    {tarea.status === "completada" && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${pri.bg} ${pri.text}`}>
                            {pri.label}
                        </span>
                        {vencida && (
                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-red-100 text-red-700">
                                Vencida
                            </span>
                        )}
                    </div>
                    <h3
                        className={`font-semibold text-gray-900 leading-snug ${
                            tarea.status === "completada" ? "line-through text-gray-400" : ""
                        }`}
                    >
                        {tarea.title}
                    </h3>
                    {tarea.description?.trim() && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{tarea.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-500">
                        {tarea.due_at && (
                            <span className={`inline-flex items-center gap-1 ${vencida ? "text-red-600 font-medium" : ""}`}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formatearFecha(tarea.due_at)}
                            </span>
                        )}
                        {asignado && (
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px] flex items-center justify-center">
                                    {iniciales(asignado)}
                                </span>
                                {asignado}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        type="button"
                        onClick={() => onEditar(tarea)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-indigo-50 hover:text-indigo-700"
                        title="Editar"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => onEliminar(tarea)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"
                        title="Eliminar"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
            {tarea.status !== "completada" && (
                <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100">
                    {ESTADOS.filter((s) => s.v !== tarea.status).map((s) => (
                        <button
                            key={s.v}
                            type="button"
                            onClick={() => onCambiarEstado(tarea, s.v)}
                            className="text-[11px] font-medium px-2 py-1 rounded-lg bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                            → {s.label}
                        </button>
                    ))}
                </div>
            )}
        </article>
    );
}

export default function TareasTab({ user }) {
    const [tareas, setTareas] = useState([]);
    const [staff, setStaff] = useState([]);
    const [nombres, setNombres] = useState({});
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("activas");
    const [filtroAsignado, setFiltroAsignado] = useState("todos");
    const [vista, setVista] = useState("tablero");
    const [modalTarea, setModalTarea] = useState(null);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [borrarPendiente, setBorrarPendiente] = useState(null);

    const cargar = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setCargando(true);
        setError("");

        const [tareasRes, staffRes] = await Promise.all([
            supabase
                .from("staff_tasks")
                .select("*")
                .order("updated_at", { ascending: false }),
            supabase
                .from("profiles")
                .select("id, full_name, role")
                .in("role", ["admin", "Staff"]),
        ]);

        if (tareasRes.error) {
            console.error(tareasRes.error);
            setError(
                tareasRes.error.message.includes("staff_tasks")
                    ? "Ejecuta CREAR_TABLA_TAREAS_STAFF.sql en Supabase para activar Tareas."
                    : tareasRes.error.message
            );
            setTareas([]);
        } else {
            setTareas(tareasRes.data ?? []);
        }

        const equipo = staffRes.data ?? [];
        setStaff(equipo);
        const map = {};
        equipo.forEach((p) => {
            map[p.id] = p.full_name || "Usuario";
        });
        setNombres(map);

        if (!silent) setCargando(false);
    }, []);

    useEffect(() => {
        cargar();
        const channel = supabase
            .channel("staff-tasks-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "staff_tasks" }, () =>
                cargar({ silent: true })
            )
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [cargar]);

    const stats = useMemo(() => {
        const activas = tareas.filter((t) => t.status !== "completada");
        return {
            total: tareas.length,
            pendientes: tareas.filter((t) => t.status === "pendiente").length,
            enProgreso: tareas.filter((t) => t.status === "en_progreso").length,
            completadas: tareas.filter((t) => t.status === "completada").length,
            vencidas: activas.filter(esVencida).length,
            mias: activas.filter((t) => t.assigned_to === user?.id).length,
        };
    }, [tareas, user?.id]);

    const tareasFiltradas = useMemo(() => {
        let list = [...tareas];
        const q = busqueda.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (t) =>
                    t.title?.toLowerCase().includes(q) ||
                    t.description?.toLowerCase().includes(q)
            );
        }
        if (filtroEstado === "activas") {
            list = list.filter((t) => t.status !== "completada");
        } else if (filtroEstado !== "todas") {
            list = list.filter((t) => t.status === filtroEstado);
        }
        if (filtroAsignado === "mias") {
            list = list.filter((t) => t.assigned_to === user?.id);
        } else if (filtroAsignado === "sin_asignar") {
            list = list.filter((t) => !t.assigned_to);
        } else if (filtroAsignado !== "todos") {
            list = list.filter((t) => t.assigned_to === filtroAsignado);
        }
        const ordenPrioridad = { urgente: 0, alta: 1, media: 2, baja: 3 };
        list.sort((a, b) => {
            if (a.status === "completada" && b.status !== "completada") return 1;
            if (b.status === "completada" && a.status !== "completada") return -1;
            const va = esVencida(a) ? 0 : 1;
            const vb = esVencida(b) ? 0 : 1;
            if (va !== vb) return va - vb;
            return (ordenPrioridad[a.priority] ?? 2) - (ordenPrioridad[b.priority] ?? 2);
        });
        return list;
    }, [tareas, busqueda, filtroEstado, filtroAsignado, user?.id]);

    const porColumna = useMemo(() => {
        const cols = { pendiente: [], en_progreso: [], completada: [] };
        tareasFiltradas.forEach((t) => {
            if (cols[t.status]) cols[t.status].push(t);
        });
        return cols;
    }, [tareasFiltradas]);

    async function cambiarEstado(tarea, nuevoEstado) {
        const now = new Date().toISOString();
        const { error: err } = await supabase
            .from("staff_tasks")
            .update({
                status: nuevoEstado,
                updated_at: now,
                completed_at: nuevoEstado === "completada" ? now : null,
            })
            .eq("id", tarea.id);
        if (err) {
            setError(err.message);
            return;
        }
        setTareas((prev) =>
            prev.map((t) =>
                t.id === tarea.id
                    ? {
                          ...t,
                          status: nuevoEstado,
                          updated_at: now,
                          completed_at: nuevoEstado === "completada" ? now : null,
                      }
                    : t
            )
        );
    }

    async function confirmarEliminar() {
        if (!borrarPendiente) return;
        const { error: err } = await supabase.from("staff_tasks").delete().eq("id", borrarPendiente.id);
        if (err) {
            setError(err.message);
            return;
        }
        setTareas((prev) => prev.filter((t) => t.id !== borrarPendiente.id));
        setBorrarPendiente(null);
    }

    return (
        <div className="space-y-6">
            {/* Hero + stats */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-sky-700 text-white p-6 sm:p-8 shadow-lg">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-sky-400/20 rounded-full translate-y-1/2 -translate-x-1/4" />
                <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">
                            Centro de trabajo
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-bold">Tareas del laboratorio</h2>
                        <p className="text-indigo-100 text-sm mt-1 max-w-md">
                            Organiza pendientes del equipo CEREC. Se sincroniza en tiempo real entre
                            dispositivos.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setModalTarea(null);
                            setMostrarModal(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-indigo-700 font-semibold text-sm shadow-md hover:bg-indigo-50 transition-colors shrink-0"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nueva tarea
                    </button>
                </div>
                <div className="relative grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
                    {[
                        { label: "Activas", value: stats.total - stats.completadas, sub: `${stats.pendientes} pendientes` },
                        { label: "En progreso", value: stats.enProgreso },
                        { label: "Completadas", value: stats.completadas },
                        { label: "Vencidas", value: stats.vencidas, alert: stats.vencidas > 0 },
                        { label: "Asignadas a ti", value: stats.mias },
                    ].map((s) => (
                        <div
                            key={s.label}
                            className={`rounded-xl bg-white/10 backdrop-blur px-3 py-2.5 border border-white/10 ${
                                s.alert ? "ring-2 ring-red-300/80" : ""
                            }`}
                        >
                            <div className="text-2xl font-bold tabular-nums">{s.value}</div>
                            <div className="text-[11px] text-indigo-100 font-medium">{s.label}</div>
                            {s.sub && <div className="text-[10px] text-indigo-200/80">{s.sub}</div>}
                        </div>
                    ))}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between gap-2">
                    <span>{error}</span>
                    <button type="button" onClick={() => setError("")} className="text-red-500 hover:text-red-700 shrink-0">
                        ×
                    </button>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                    {[
                        { v: "activas", label: "Activas" },
                        { v: "todas", label: "Todas" },
                        ...ESTADOS.map((s) => ({ v: s.v, label: s.label })),
                    ].map((f) => (
                        <button
                            key={f.v}
                            type="button"
                            onClick={() => setFiltroEstado(f.v)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                filtroEstado === f.v
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative flex-1 min-w-[180px]">
                        <svg
                            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="search"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar tareas…"
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <select
                        value={filtroAsignado}
                        onChange={(e) => setFiltroAsignado(e.target.value)}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="todos">Todos</option>
                        <option value="mias">Mis tareas</option>
                        <option value="sin_asignar">Sin asignar</option>
                        {staff.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.full_name}
                            </option>
                        ))}
                    </select>
                    <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
                        <button
                            type="button"
                            onClick={() => setVista("tablero")}
                            className={`px-3 py-2 text-xs font-medium ${vista === "tablero" ? "bg-indigo-100 text-indigo-800" : "text-gray-600"}`}
                        >
                            Tablero
                        </button>
                        <button
                            type="button"
                            onClick={() => setVista("lista")}
                            className={`px-3 py-2 text-xs font-medium ${vista === "lista" ? "bg-indigo-100 text-indigo-800" : "text-gray-600"}`}
                        >
                            Lista
                        </button>
                    </div>
                </div>
            </div>

            {cargando ? (
                <div className="text-center py-16">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Cargando tareas…</p>
                </div>
            ) : tareasFiltradas.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-indigo-200">
                    <svg className="w-14 h-14 text-indigo-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <p className="text-gray-700 font-medium">No hay tareas con estos filtros</p>
                    <p className="text-gray-400 text-sm mt-1">Crea la primera con el botón «Nueva tarea».</p>
                </div>
            ) : vista === "tablero" ? (
                <div className="grid md:grid-cols-3 gap-4">
                    {ESTADOS.map((col) => {
                        const items = porColumna[col.v] ?? [];
                        const colStyles =
                            col.v === "pendiente"
                                ? "border-amber-200 bg-amber-50/40"
                                : col.v === "en_progreso"
                                  ? "border-sky-200 bg-sky-50/40"
                                  : "border-emerald-200 bg-emerald-50/40";
                        return (
                            <div key={col.v} className={`rounded-2xl border p-4 min-h-[200px] ${colStyles}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-gray-800 text-sm">{col.label}</h3>
                                    <span className="text-xs font-semibold text-gray-500 bg-white/80 px-2 py-0.5 rounded-full">
                                        {items.length}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {items.map((t) => (
                                        <TarjetaTarea
                                            key={t.id}
                                            tarea={t}
                                            nombres={nombres}
                                            onEditar={(tar) => {
                                                setModalTarea(tar);
                                                setMostrarModal(true);
                                            }}
                                            onCambiarEstado={cambiarEstado}
                                            onEliminar={setBorrarPendiente}
                                        />
                                    ))}
                                    {items.length === 0 && (
                                        <p className="text-xs text-gray-400 text-center py-6">Vacío</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {tareasFiltradas.map((t) => (
                        <TarjetaTarea
                            key={t.id}
                            tarea={t}
                            nombres={nombres}
                            onEditar={(tar) => {
                                setModalTarea(tar);
                                setMostrarModal(true);
                            }}
                            onCambiarEstado={cambiarEstado}
                            onEliminar={setBorrarPendiente}
                        />
                    ))}
                </div>
            )}

            {mostrarModal && (
                <TareaModal
                    tarea={modalTarea}
                    staff={staff}
                    user={user}
                    onClose={() => {
                        setMostrarModal(false);
                        setModalTarea(null);
                    }}
                    onGuardado={() => cargar({ silent: true })}
                />
            )}

            {borrarPendiente && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setBorrarPendiente(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="font-bold text-gray-900">¿Eliminar tarea?</h3>
                        <p className="text-sm text-gray-600 mt-2">
                            «{borrarPendiente.title}» se borrará permanentemente.
                        </p>
                        <div className="flex gap-3 mt-5">
                            <button
                                type="button"
                                onClick={() => setBorrarPendiente(null)}
                                className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmarEliminar}
                                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
