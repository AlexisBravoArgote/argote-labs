import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabase";

// ─── Modal para agregar/editar item ────────────────────────────────
function ItemModal({ item, categories, onClose, onSave }) {
    const [form, setForm] = useState({
        name: item?.name || "",
        description: item?.description || "",
        category_id: item?.category_id || "",
        sku: item?.sku || "",
        quantity: item?.quantity ?? 0,
        min_stock: item?.min_stock ?? 0,
        unit: item?.unit || "unidad",
        brand: item?.brand || "",
        supplier: item?.supplier || "",
        cost: item?.cost || "",
        location: item?.location || "",
        notes: item?.notes || "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.name.trim()) { setError("El nombre es obligatorio"); return; }
        setSaving(true);
        setError("");

        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim() || null,
                category_id: form.category_id || null,
                sku: form.sku.trim() || null,
                quantity: parseInt(form.quantity) || 0,
                min_stock: parseInt(form.min_stock) || 0,
                unit: form.unit.trim() || "unidad",
                brand: form.brand.trim() || null,
                supplier: form.supplier.trim() || null,
                cost: form.cost ? parseFloat(form.cost) : null,
                location: form.location.trim() || null,
                notes: form.notes.trim() || null,
            };

            if (item) {
                const { error: err } = await supabase
                    .from("logistics_items")
                    .update(payload)
                    .eq("id", item.id);
                if (err) throw err;
            } else {
                const { error: err } = await supabase
                    .from("logistics_items")
                    .insert(payload);
                if (err) throw err;
            }
            onSave();
        } catch (err) {
            setError(err.message || "Error al guardar");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">
                        {item ? "Editar Producto" : "Nuevo Producto"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
                    )}

                    {/* Nombre + SKU */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                placeholder="Ej: Resina A2" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SKU / Código</label>
                            <input type="text" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                placeholder="Ej: RES-A2-001" />
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
                            rows={2} placeholder="Descripción del producto..." />
                    </div>

                    {/* Categoría + Marca */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                            <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-white">
                                <option value="">Sin categoría</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                            <input type="text" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                placeholder="Ej: 3M, Ivoclar" />
                        </div>
                    </div>

                    {/* Cantidad + Mínimo + Unidad */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad actual</label>
                            <input type="number" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
                            <input type="number" min="0" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                            <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-white">
                                <option value="unidad">Unidad</option>
                                <option value="caja">Caja</option>
                                <option value="paquete">Paquete</option>
                                <option value="botella">Botella</option>
                                <option value="tubo">Tubo</option>
                                <option value="jeringa">Jeringa</option>
                                <option value="rollo">Rollo</option>
                                <option value="bolsa">Bolsa</option>
                                <option value="par">Par</option>
                                <option value="kit">Kit</option>
                            </select>
                        </div>
                    </div>

                    {/* Proveedor + Costo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                            <input type="text" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                placeholder="Ej: Dental Express" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Costo unitario (MXN)</label>
                            <input type="number" min="0" step="0.01" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                placeholder="0.00" />
                        </div>
                    </div>

                    {/* Ubicación + Notas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                            <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                placeholder="Ej: Estante A, Cajón 3" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                            <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                placeholder="Notas adicionales..." />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose}
                            className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving}
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 flex items-center gap-2">
                            {saving ? (
                                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Guardando...</>
                            ) : (
                                <>{item ? "Actualizar" : "Crear Producto"}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Modal de movimiento de stock ──────────────────────────────────
function MovimientoStockModal({ item, userId, onClose, onSave }) {
    const [type, setType] = useState("entrada");
    const [quantity, setQuantity] = useState(1);
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        if (quantity <= 0) { setError("La cantidad debe ser mayor a 0"); return; }
        if (type === "salida" && quantity > item.quantity) { setError("No hay suficiente stock"); return; }
        setSaving(true);
        setError("");

        try {
            const newStock = type === "entrada"
                ? item.quantity + quantity
                : type === "salida"
                    ? item.quantity - quantity
                    : quantity; // ajuste = nueva cantidad directa

            // Insert movement
            const { error: movError } = await supabase.from("logistics_movements").insert({
                item_id: item.id,
                type,
                quantity,
                previous_stock: item.quantity,
                new_stock: type === "ajuste" ? quantity : newStock,
                reason: reason.trim() || null,
                performed_by: userId,
            });
            if (movError) throw movError;

            // Update item stock
            const { error: updateError } = await supabase
                .from("logistics_items")
                .update({ quantity: type === "ajuste" ? quantity : newStock })
                .eq("id", item.id);
            if (updateError) throw updateError;

            onSave();
        } catch (err) {
            setError(err.message || "Error al registrar movimiento");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Movimiento de Stock</h2>
                        <p className="text-sm text-gray-500">{item.name} — Stock actual: <span className="font-semibold text-emerald-600">{item.quantity} {item.unit}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

                    {/* Type selector */}
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { v: "entrada", label: "Entrada", icon: "M12 4v16m8-8H4", color: "emerald" },
                            { v: "salida", label: "Salida", icon: "M20 12H4", color: "red" },
                            { v: "ajuste", label: "Ajuste", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", color: "amber" },
                        ].map(t => (
                            <button key={t.v} type="button" onClick={() => setType(t.v)}
                                className={`p-3 rounded-xl border-2 transition-all text-center ${type === t.v
                                    ? t.color === "emerald" ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                        : t.color === "red" ? "border-red-500 bg-red-50 text-red-700"
                                            : "border-amber-500 bg-amber-50 text-amber-700"
                                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                                    }`}>
                                <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
                                </svg>
                                <span className="text-xs font-medium">{t.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {type === "ajuste" ? "Nueva cantidad total" : "Cantidad"}
                        </label>
                        <input type="number" min={type === "ajuste" ? 0 : 1} value={quantity}
                            onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-lg font-semibold text-center" />
                    </div>

                    {/* Preview */}
                    {type !== "ajuste" && (
                        <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between text-sm">
                            <span className="text-gray-600">Nuevo stock:</span>
                            <span className={`font-bold text-lg ${type === "entrada" ? "text-emerald-600" : "text-red-600"}`}>
                                {type === "entrada" ? item.quantity + (quantity || 0) : Math.max(0, item.quantity - (quantity || 0))} {item.unit}
                            </span>
                        </div>
                    )}

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
                        <input type="text" value={reason} onChange={e => setReason(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ej: Compra semanal, Uso en consultorio..." />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving}
                            className={`px-5 py-2.5 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center gap-2 ${type === "entrada" ? "bg-emerald-600 hover:bg-emerald-700"
                                : type === "salida" ? "bg-red-600 hover:bg-red-700"
                                    : "bg-amber-600 hover:bg-amber-700"
                                }`}>
                            {saving ? "Guardando..." : "Registrar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Componente principal: LogisticaView (igual que DoctorView) ────
export default function LogisticaView({ user, perfil }) {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // UI State
    const [vista, setVista] = useState("dashboard"); // dashboard, inventario, movimientos
    const [busqueda, setBusqueda] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("todas");
    const [filtroStock, setFiltroStock] = useState("todos"); // todos, bajo, ok, agotado
    const [vistaGrid, setVistaGrid] = useState(true);
    const [modalItem, setModalItem] = useState(null); // null = cerrado, "new" = nuevo, item = editar
    const [modalMov, setModalMov] = useState(null);   // item para movimiento
    const [paginaMovs, setPaginaMovs] = useState(1);

    // ─── Cargar datos ──────────────────────────────────────────────
    async function cargarDatos() {
        setLoading(true);
        try {
            const [catRes, itemRes, movRes] = await Promise.all([
                supabase.from("logistics_categories").select("*").order("name"),
                supabase.from("logistics_items").select("*").eq("is_active", true).order("name"),
                supabase.from("logistics_movements").select("*").order("created_at", { ascending: false }).limit(100),
            ]);

            if (catRes.error) throw catRes.error;
            if (itemRes.error) throw itemRes.error;
            if (movRes.error) throw movRes.error;

            setCategories(catRes.data || []);
            setItems(itemRes.data || []);
            setMovements(movRes.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        cargarDatos();

        // Realtime: auto-refresh when logistics data changes
        const channel = supabase
            .channel('logistica-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'logistics_items' }, () => cargarDatos())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'logistics_movements' }, () => cargarDatos())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'logistics_categories' }, () => cargarDatos())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    // ─── Datos derivados ───────────────────────────────────────────
    const itemsFiltrados = useMemo(() => {
        let f = items;
        const q = busqueda.trim().toLowerCase();
        if (q) f = f.filter(i => i.name.toLowerCase().includes(q) || i.sku?.toLowerCase().includes(q) || i.brand?.toLowerCase().includes(q));
        if (filtroCategoria !== "todas") f = f.filter(i => i.category_id === filtroCategoria);
        if (filtroStock === "agotado") f = f.filter(i => i.quantity === 0);
        else if (filtroStock === "bajo") f = f.filter(i => i.quantity > 0 && i.quantity <= i.min_stock);
        else if (filtroStock === "ok") f = f.filter(i => i.quantity > i.min_stock);
        return f;
    }, [items, busqueda, filtroCategoria, filtroStock]);

    const stats = useMemo(() => ({
        total: items.length,
        agotados: items.filter(i => i.quantity === 0).length,
        stockBajo: items.filter(i => i.quantity > 0 && i.quantity <= i.min_stock).length,
        valorTotal: items.reduce((sum, i) => sum + (i.cost || 0) * i.quantity, 0),
        categorias: categories.length,
    }), [items, categories]);

    function getCategoryName(id) {
        return categories.find(c => c.id === id)?.name || "Sin categoría";
    }

    function getCategoryColor(id) {
        return categories.find(c => c.id === id)?.color || "#6b7280";
    }

    async function eliminarItem(item) {
        if (!confirm(`¿Eliminar "${item.name}" del inventario?`)) return;
        const { error } = await supabase.from("logistics_items").update({ is_active: false }).eq("id", item.id);
        if (error) { setError(error.message); return; }
        cargarDatos();
    }

    async function logout() {
        await supabase.auth.signOut();
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Cargando inventario...</p>
                </div>
            </div>
        );
    }

    // ─── Render ────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navbar */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        {/* Left: Logo + nav */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <span className="text-lg font-bold text-gray-800 hidden sm:block">Logística</span>
                            </div>

                            <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                                {[
                                    { v: "dashboard", label: "Dashboard", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
                                    { v: "inventario", label: "Inventario", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
                                    { v: "movimientos", label: "Historial", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
                                ].map(tab => (
                                    <button key={tab.v} onClick={() => setVista(tab.v)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${vista === tab.v ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600 hover:text-gray-800"
                                            }`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                                        </svg>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right: user + logout */}
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-medium text-gray-800">{perfil?.full_name || "Logística"}</div>
                                <div className="text-xs text-emerald-600">Portal Logística</div>
                            </div>
                            <button onClick={logout}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Cerrar sesión">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile tabs */}
                <div className="sm:hidden border-t border-gray-100 flex">
                    {[
                        { v: "dashboard", label: "Dashboard" },
                        { v: "inventario", label: "Inventario" },
                        { v: "movimientos", label: "Historial" },
                    ].map(tab => (
                        <button key={tab.v} onClick={() => setVista(tab.v)}
                            className={`flex-1 py-3 text-xs font-medium text-center transition-colors ${vista === tab.v ? "text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/50" : "text-gray-500"}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                        <span className="text-sm flex-1">{error}</span>
                        <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}

                {/* ─── DASHBOARD ───────────────────────────────── */}
                {vista === "dashboard" && (
                    <div className="space-y-6">
                        {/* Welcome */}
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-500/20">
                            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                                Bienvenido, {perfil?.full_name?.split(" ")[0] || "Logística"}
                            </h1>
                            <p className="text-emerald-100 text-sm sm:text-base">Gestión de inventario odontológico — Dental City</p>
                        </div>

                        {/* Stats cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: "Total Productos", value: stats.total, icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: "blue", bg: "bg-blue-50", text: "text-blue-700", iconBg: "bg-blue-100" },
                                { label: "Stock Bajo", value: stats.stockBajo, icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z", color: "amber", bg: "bg-amber-50", text: "text-amber-700", iconBg: "bg-amber-100" },
                                { label: "Agotados", value: stats.agotados, icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636", color: "red", bg: "bg-red-50", text: "text-red-700", iconBg: "bg-red-100" },
                                { label: "Valor Total", value: `$${stats.valorTotal.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`, icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "emerald", bg: "bg-emerald-50", text: "text-emerald-700", iconBg: "bg-emerald-100" },
                            ].map((s, i) => (
                                <div key={i} className={`${s.bg} rounded-2xl p-5 border border-${s.color}-100`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`${s.iconBg} p-2.5 rounded-xl`}>
                                            <svg className={`w-5 h-5 ${s.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
                                    <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Alerts */}
                        {(stats.agotados > 0 || stats.stockBajo > 0) && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-5">
                                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Alertas de Inventario
                                </h3>
                                <div className="space-y-2">
                                    {items.filter(i => i.quantity === 0).map(i => (
                                        <div key={i.id} className="flex items-center gap-3 bg-red-50 rounded-xl px-4 py-3 border border-red-100">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                            <span className="text-sm flex-1"><span className="font-medium text-red-700">{i.name}</span> — <span className="text-red-600">Agotado</span></span>
                                            <button onClick={() => setModalMov(i)} className="text-xs text-red-600 hover:text-red-800 font-medium hover:underline">Reabastecer</button>
                                        </div>
                                    ))}
                                    {items.filter(i => i.quantity > 0 && i.quantity <= i.min_stock).map(i => (
                                        <div key={i.id} className="flex items-center gap-3 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
                                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                            <span className="text-sm flex-1"><span className="font-medium text-amber-700">{i.name}</span> — <span className="text-amber-600">{i.quantity} {i.unit} (mín: {i.min_stock})</span></span>
                                            <button onClick={() => setModalMov(i)} className="text-xs text-amber-600 hover:text-amber-800 font-medium hover:underline">Reabastecer</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent movements */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">Movimientos Recientes</h3>
                            {movements.length === 0 ? (
                                <p className="text-sm text-gray-500">No hay movimientos registrados.</p>
                            ) : (
                                <div className="space-y-2">
                                    {movements.slice(0, 8).map(m => {
                                        const item = items.find(i => i.id === m.item_id);
                                        return (
                                            <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${m.type === "entrada" ? "bg-emerald-500" : m.type === "salida" ? "bg-red-500" : "bg-amber-500"}`}>
                                                    {m.type === "entrada" ? "+" : m.type === "salida" ? "−" : "~"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-800 truncate">{item?.name || "Item eliminado"}</div>
                                                    <div className="text-xs text-gray-500">{m.reason || m.type} — {new Date(m.created_at).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                                                </div>
                                                <div className={`text-sm font-semibold ${m.type === "entrada" ? "text-emerald-600" : m.type === "salida" ? "text-red-600" : "text-amber-600"}`}>
                                                    {m.type === "entrada" ? "+" : m.type === "salida" ? "−" : ""}{m.quantity}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Quick action */}
                        <div className="flex gap-3">
                            <button onClick={() => { setVista("inventario"); setModalItem("new"); }}
                                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-2xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Agregar Producto
                            </button>
                            <button onClick={() => setVista("inventario")}
                                className="flex-1 bg-white border-2 border-emerald-200 text-emerald-700 py-4 rounded-2xl font-semibold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                                Ver Inventario
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── INVENTARIO ──────────────────────────────── */}
                {vista === "inventario" && (
                    <div className="space-y-4">
                        {/* Header + actions */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Inventario</h2>
                                <p className="text-sm text-gray-500">{itemsFiltrados.length} producto{itemsFiltrados.length !== 1 ? "s" : ""}</p>
                            </div>
                            <button onClick={() => setModalItem("new")}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Nuevo Producto
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Buscar por nombre, SKU o marca..." />
                            </div>
                            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
                                className="px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-white text-sm">
                                <option value="todas">Todas las categorías</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select value={filtroStock} onChange={e => setFiltroStock(e.target.value)}
                                className="px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-white text-sm">
                                <option value="todos">Todo el stock</option>
                                <option value="ok">Stock OK</option>
                                <option value="bajo">Stock Bajo</option>
                                <option value="agotado">Agotado</option>
                            </select>
                            <div className="flex border border-gray-300 rounded-xl overflow-hidden">
                                <button onClick={() => setVistaGrid(true)}
                                    className={`px-3 py-2 transition-colors ${vistaGrid ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-50"}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                </button>
                                <button onClick={() => setVistaGrid(false)}
                                    className={`px-3 py-2 transition-colors ${!vistaGrid ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-50"}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Items */}
                        {itemsFiltrados.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <p className="text-gray-500 text-lg mb-2">No se encontraron productos</p>
                                <p className="text-gray-400 text-sm mb-4">Intenta cambiar los filtros o agrega un producto nuevo</p>
                                <button onClick={() => setModalItem("new")}
                                    className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline">+ Agregar producto</button>
                            </div>
                        ) : vistaGrid ? (
                            /* Grid view */
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {itemsFiltrados.map(item => {
                                    const stockStatus = item.quantity === 0 ? "agotado" : item.quantity <= item.min_stock ? "bajo" : "ok";
                                    return (
                                        <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg hover:border-emerald-200 transition-all group">
                                            {/* Top: category badge + actions */}
                                            <div className="flex items-start justify-between mb-3">
                                                <span className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ backgroundColor: getCategoryColor(item.category_id) + "18", color: getCategoryColor(item.category_id) }}>
                                                    {getCategoryName(item.category_id)}
                                                </span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setModalItem(item)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Editar">
                                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button onClick={() => eliminarItem(item)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Eliminar">
                                                        <svg className="w-4 h-4 text-gray-500 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Name + brand */}
                                            <h3 className="text-lg font-bold text-gray-800 mb-1 leading-tight">{item.name}</h3>
                                            {item.brand && <p className="text-xs text-gray-500 mb-3">{item.brand}{item.sku ? ` — ${item.sku}` : ""}</p>}

                                            {/* Stock bar */}
                                            <div className="mb-3">
                                                <div className="flex items-end justify-between mb-1.5">
                                                    <span className="text-2xl font-bold text-gray-800">{item.quantity}</span>
                                                    <span className="text-xs text-gray-500">{item.unit}{item.min_stock > 0 ? ` • mín: ${item.min_stock}` : ""}</span>
                                                </div>
                                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all ${stockStatus === "agotado" ? "bg-red-500" : stockStatus === "bajo" ? "bg-amber-500" : "bg-emerald-500"}`}
                                                        style={{ width: `${item.min_stock > 0 ? Math.min(100, (item.quantity / (item.min_stock * 3)) * 100) : item.quantity > 0 ? 100 : 0}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Status badge */}
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-medium px-2 py-1 rounded-lg ${stockStatus === "agotado" ? "bg-red-100 text-red-700"
                                                    : stockStatus === "bajo" ? "bg-amber-100 text-amber-700"
                                                        : "bg-emerald-100 text-emerald-700"
                                                    }`}>
                                                    {stockStatus === "agotado" ? "Agotado" : stockStatus === "bajo" ? "Stock Bajo" : "En stock"}
                                                </span>
                                                <button onClick={() => setModalMov(item)}
                                                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium px-3 py-1.5 hover:bg-emerald-50 rounded-lg transition-colors">
                                                    Movimiento
                                                </button>
                                            </div>

                                            {/* Location & cost */}
                                            {(item.location || item.cost) && (
                                                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-500">
                                                    {item.location && (
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                            {item.location}
                                                        </span>
                                                    )}
                                                    {item.cost && (
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
                                                            ${parseFloat(item.cost).toLocaleString("es-MX")}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* List view */
                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="text-left text-xs font-semibold text-gray-600 px-5 py-3">Producto</th>
                                                <th className="text-left text-xs font-semibold text-gray-600 px-5 py-3">Categoría</th>
                                                <th className="text-center text-xs font-semibold text-gray-600 px-5 py-3">Stock</th>
                                                <th className="text-left text-xs font-semibold text-gray-600 px-5 py-3">Estado</th>
                                                <th className="text-left text-xs font-semibold text-gray-600 px-5 py-3">Ubicación</th>
                                                <th className="text-right text-xs font-semibold text-gray-600 px-5 py-3">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {itemsFiltrados.map(item => {
                                                const stockStatus = item.quantity === 0 ? "agotado" : item.quantity <= item.min_stock ? "bajo" : "ok";
                                                return (
                                                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-5 py-3">
                                                            <div className="font-medium text-gray-800">{item.name}</div>
                                                            <div className="text-xs text-gray-500">{item.brand}{item.sku ? ` — ${item.sku}` : ""}</div>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <span className="text-xs font-medium px-2 py-1 rounded-lg" style={{ backgroundColor: getCategoryColor(item.category_id) + "18", color: getCategoryColor(item.category_id) }}>
                                                                {getCategoryName(item.category_id)}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 text-center">
                                                            <span className="text-lg font-bold text-gray-800">{item.quantity}</span>
                                                            <span className="text-xs text-gray-500 ml-1">{item.unit}</span>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <span className={`text-xs font-medium px-2 py-1 rounded-lg ${stockStatus === "agotado" ? "bg-red-100 text-red-700"
                                                                : stockStatus === "bajo" ? "bg-amber-100 text-amber-700"
                                                                    : "bg-emerald-100 text-emerald-700"
                                                                }`}>
                                                                {stockStatus === "agotado" ? "Agotado" : stockStatus === "bajo" ? "Stock Bajo" : "OK"}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 text-sm text-gray-600">{item.location || "—"}</td>
                                                        <td className="px-5 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button onClick={() => setModalMov(item)} className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600" title="Movimiento">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                                                                </button>
                                                                <button onClick={() => setModalItem(item)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Editar">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                                </button>
                                                                <button onClick={() => eliminarItem(item)} className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600" title="Eliminar">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── MOVIMIENTOS (HISTORIAL) ─────────────────── */}
                {vista === "movimientos" && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-800">Historial de Movimientos</h2>

                        {movements.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <p className="text-gray-500 text-lg">No hay movimientos aún</p>
                                <p className="text-gray-400 text-sm">Los movimientos aparecerán aquí cuando registres entradas o salidas</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-50">
                                {movements.slice(0, paginaMovs * 20).map(m => {
                                    const itm = items.find(i => i.id === m.item_id);
                                    return (
                                        <div key={m.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${m.type === "entrada" ? "bg-emerald-500" : m.type === "salida" ? "bg-red-500" : "bg-amber-500"}`}>
                                                {m.type === "entrada" ? "+" : m.type === "salida" ? "−" : "~"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-800">{itm?.name || "Producto eliminado"}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                    <span className={`px-1.5 py-0.5 rounded font-medium ${m.type === "entrada" ? "bg-emerald-100 text-emerald-700" : m.type === "salida" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                                        {m.type.charAt(0).toUpperCase() + m.type.slice(1)}
                                                    </span>
                                                    {m.reason && <span>• {m.reason}</span>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-bold ${m.type === "entrada" ? "text-emerald-600" : m.type === "salida" ? "text-red-600" : "text-amber-600"}`}>
                                                    {m.type === "entrada" ? "+" : m.type === "salida" ? "−" : ""}{m.quantity}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {m.previous_stock} → {m.new_stock}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-400 text-right whitespace-nowrap">
                                                {new Date(m.created_at).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                            </div>
                                        </div>
                                    );
                                })}

                                {movements.length > paginaMovs * 20 && (
                                    <div className="p-4 text-center">
                                        <button onClick={() => setPaginaMovs(p => p + 1)}
                                            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm hover:underline">
                                            Cargar más movimientos...
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* ─── Modals ───────────────────────────────────────── */}
            {modalItem && (
                <ItemModal
                    item={modalItem === "new" ? null : modalItem}
                    categories={categories}
                    onClose={() => setModalItem(null)}
                    onSave={() => { setModalItem(null); cargarDatos(); }}
                />
            )}

            {modalMov && (
                <MovimientoStockModal
                    item={modalMov}
                    userId={user.id}
                    onClose={() => setModalMov(null)}
                    onSave={() => { setModalMov(null); cargarDatos(); }}
                />
            )}
        </div>
    );
}
