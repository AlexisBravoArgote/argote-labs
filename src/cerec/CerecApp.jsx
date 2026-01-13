import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "../supabase";
import Login from "./Login";
import Inventario from "./Inventario";
import Admin from "./Admin";

export default function CerecApp() {
    const [user, setUser] = useState(null);
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const { data } = await supabase.auth.getUser();
            const u = data.user ?? null;
            setUser(u);

            if (u) {
                const { data: p } = await supabase
                    .from("profiles")
                    .select("id, full_name, role")
                    .eq("id", u.id)
                    .single();
                setPerfil(p ?? null);
            }

            setLoading(false);
        })();

        const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const u = session?.user ?? null;
            setUser(u);

            if (u) {
                const { data: p } = await supabase
                    .from("profiles")
                    .select("id, full_name, role")
                    .eq("id", u.id)
                    .single();
                setPerfil(p ?? null);
            } else {
                setPerfil(null);
            }
        });

        return () => sub.subscription.unsubscribe();
    }, []);

    if (loading) return <div style={{ padding: 24 }}>Cargando…</div>;

    return (
        <Routes>
            {!user ? (
                <>
                    <Route path="/login" element={<Login />} />
                    <Route path="*" element={<Navigate to="/cerec/login" replace />} />
                </>
            ) : (
                <>
                    <Route path="/" element={<Inventario user={user} perfil={perfil} />} />
                    <Route
                        path="/admin"
                        element={
                            perfil?.role === "admin" ? (
                                <Admin user={user} />
                            ) : (
                                <Navigate to="/cerec" replace />
                            )
                        }
                    />
                    <Route path="*" element={<Navigate to="/cerec" replace />} />
                </>
            )}
        </Routes>
    );

}
