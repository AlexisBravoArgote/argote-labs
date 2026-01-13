import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import { Link } from "react-router-dom";
import MovimientoModal from "./MovimientoModal";

export default function Inventario({ user, perfil }) {
    const [items, setItems] = useState([]);
    const [movs, setMovs] = useState([]);
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(true);

    const [busqueda, setBusqueda] = useState("");
    const [categoria, setCategoria] = useState("todas");

    const [modalItem, setModalItem] = useState(null);

    const itemsFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return items.filter((it) => {
            const okTexto = !q || it.name.toLowerCase().includes(q);
            const okCat = categoria === "todas" || it.category === categoria;
            return okTexto && okCat;
        });
    }, [items, busqueda, categoria]);

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

        const { data: m, error: mErr } = await supabase
            .from("stock_movements")
            .select("id, item_id, delta, reason, created_by, created_at")
            .order("created_at", { ascending: false })
            .limit(50);

        if (mErr) {
            setError(mErr.message);
            setCargando(false);
            return;
        }

        // Mapear nombres bonitos: items + perfiles
        const movBase = m ?? [];
        const itemIds = [...new Set(movBase.map((x) => x.item_id))];
        const userIds = [...new Set(movBase.map((x) => x.created_by))];

        const [{ data: itemNames }, { data: perfiles }] = await Promise.all([
            supabase.from("items").select("id, name").in("id", itemIds.length ? itemIds : ["00000000-0000-0000-0000-000000000000"]),
            supabase.from("profiles").select("id, full_name").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
        ]);

        const itemMap = new Map((itemNames ?? []).map((x) => [x.id, x.name]));
        const userMap = new Map((perfiles ?? []).map((x) => [x.id, x.full_name || x.id]));

        setMovs(
            movBase.map((x) => ({
                ...x,
                item_name: itemMap.get(x.item_id) || x.item_id,
                user_name: userMap.get(x.created_by) || x.created_by,
            }))
        );

        setCargando(false);
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

        setModalItem(null);
        await cargar();
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

            <h2 className="text-lg font-semibold mt-10">Historial global (últimos 50)</h2>

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

            {modalItem && (
                <MovimientoModal
                    item={modalItem}
                    onClose={() => setModalItem(null)}
                    onConfirm={registrarMovimiento}
                />
            )}
        </div>
    );
}
