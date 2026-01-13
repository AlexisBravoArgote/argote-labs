import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Link } from "react-router-dom";

export default function Admin({ user }) {
    const [items, setItems] = useState([]);
    const [error, setError] = useState("");

    const [name, setName] = useState("");
    const [category, setCategory] = useState("bloc");
    const [unit, setUnit] = useState("pzas");
    const [qty, setQty] = useState(0);

    async function cargarItems() {
        setError("");
        const { data, error } = await supabase
            .from("items")
            .select("id, name, category, unit, current_qty")
            .order("name", { ascending: true });

        if (error) setError(error.message);
        setItems(data ?? []);
    }

    useEffect(() => {
        cargarItems();
    }, []);

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
            created_by: user.id,
        });

        if (error) {
            setError(error.message);
            return;
        }

        setName("");
        setQty(0);
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

                <button onClick={crear} className="bg-black text-white px-4 py-2 rounded mt-4">
                    Crear
                </button>
            </div>

            <h2 className="font-semibold mt-8">Artículos</h2>
            <div className="grid gap-2 mt-3">
                {items.map((it) => (
                    <div key={it.id} className="border rounded p-3 flex justify-between gap-3">
                        <div>
                            <div className="font-semibold">{it.name}</div>
                            <div className="text-sm text-gray-600">
                                Stock: <b>{it.current_qty}</b> {it.unit} · {it.category}
                            </div>
                        </div>

                        <button onClick={() => borrar(it.id)} className="border px-3 py-2 rounded">
                            Borrar
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
