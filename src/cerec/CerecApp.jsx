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
        let mounted = true;

        // Cargar usuario inicial - más rápido, sin esperar perfil
        (async () => {
            try {
                const { data, error } = await supabase.auth.getUser();
                
                if (!mounted) return;

                if (error) {
                    console.error("Error al obtener usuario:", error);
                    setUser(null);
                    setPerfil(null);
                    setLoading(false);
                    return;
                }

                const u = data.user ?? null;
                setUser(u);
                setLoading(false); // Completar loading inmediatamente después de obtener usuario

                // Cargar perfil en paralelo (no bloquea el loading)
                if (u) {
                    supabase
                        .from("profiles")
                        .select("id, full_name, role")
                        .eq("id", u.id)
                        .single()
                        .then(({ data: p, error: profileError }) => {
                            if (mounted) {
                                if (profileError) {
                                    console.error("Error al obtener perfil:", profileError);
                                    setPerfil(null);
                                } else {
                                    setPerfil(p ?? null);
                                }
                            }
                        })
                        .catch((err) => {
                            console.error("Excepción al obtener perfil:", err);
                            if (mounted) {
                                setPerfil(null);
                            }
                        });
                } else {
                    setPerfil(null);
                }
            } catch (err) {
                console.error("Error inesperado al cargar:", err);
                if (mounted) {
                    setUser(null);
                    setPerfil(null);
                    setLoading(false);
                }
            }
        })();

        // Escuchar cambios de autenticación
        const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;

            const u = session?.user ?? null;
            setUser(u);

            if (u) {
                supabase
                    .from("profiles")
                    .select("id, full_name, role")
                    .eq("id", u.id)
                    .single()
                    .then(({ data: p, error: profileError }) => {
                        if (mounted) {
                            if (profileError) {
                                console.error("Error al obtener perfil en cambio de estado:", profileError);
                                setPerfil(null);
                            } else {
                                setPerfil(p ?? null);
                            }
                        }
                    })
                    .catch((err) => {
                        console.error("Excepción al obtener perfil en cambio de estado:", err);
                        if (mounted) {
                            setPerfil(null);
                        }
                    });
            } else {
                setPerfil(null);
            }
        });

        return () => {
            mounted = false;
            if (sub?.subscription) {
                sub.subscription.unsubscribe();
            }
        };
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
