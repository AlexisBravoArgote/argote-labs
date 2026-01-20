import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Link } from "react-router-dom";

const TAGS_DISPONIBLES = ["E.MAX", "RECICLADO", "SIRONA"];

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

    // Estados para historial de movimientos
    const [movimientos, setMovimientos] = useState([]);
    const [cargandoMovimientos, setCargandoMovimientos] = useState(false);
    const [busquedaMovimientos, setBusquedaMovimientos] = useState("");

    async function cargarItems() {
        setError("");
        const { data, error } = await supabase
            .from("items")
            .select("id, name, category, unit, current_qty, tags")
            .order("name", { ascending: true });

        if (error) setError(error.message);
        setItems(data ?? []);
    }

    useEffect(() => {
        cargarItems();
        cargarMovimientos();
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

    async function borrarMovimiento(movimientoId) {
        if (!confirm("¿Seguro que quieres borrar este movimiento del historial?\n\nNota: Esto solo eliminará el registro del historial. El stock del artículo NO se modificará.")) return;

        setError("");
        const { error } = await supabase
            .from("stock_movements")
            .delete()
            .eq("id", movimientoId);

        if (error) {
            setError(`Error al borrar movimiento: ${error.message}`);
            return;
        }

        await cargarMovimientos();
    }

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
            <div className="grid gap-2 mt-3">
                {items.map((it) => (
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

            <h2 className="font-semibold mt-10">Historial de movimientos</h2>
            <p className="text-sm text-gray-600 mt-1 mb-3">
                Puedes borrar movimientos del historial para mantenerlo limpio. Esto solo elimina el registro, NO afecta el stock actual.
            </p>

            <div className="mt-3 mb-3">
                <input
                    type="text"
                    value={busquedaMovimientos}
                    onChange={(e) => setBusquedaMovimientos(e.target.value)}
                    placeholder="Buscar en historial..."
                    className="border rounded p-2 w-full"
                />
            </div>

            {cargandoMovimientos ? (
                <div className="text-gray-600 mt-3">Cargando movimientos…</div>
            ) : movimientos.length === 0 ? (
                <div className="text-gray-500 text-sm mt-3">No hay movimientos en el historial.</div>
            ) : (
                <div className="grid gap-2 mt-3">
                    {movimientos
                        .filter(m => {
                            const q = busquedaMovimientos.trim().toLowerCase();
                            if (!q) return true;
                            return (
                                m.item_name?.toLowerCase().includes(q) ||
                                m.user_name?.toLowerCase().includes(q) ||
                                m.reason?.toLowerCase().includes(q) ||
                                m.delta?.toString().includes(q)
                            );
                        })
                        .map((m) => (
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
            )}
        </div>
    );
}
