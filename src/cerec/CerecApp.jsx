import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Login from "./Login";
import Inventario from "./Inventario";
import Admin from "./Admin";
import DoctorView from "./DoctorView";

export default function CerecApp() {
    const [user, setUser] = useState(null);
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [vista, setVista] = useState("inventario"); // "inventario" o "admin"

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

        // Cerrar sesión cuando se cierra la pestaña/navegador
        // Usar pagehide que es más confiable que beforeunload
        const handlePageHide = () => {
            // Cerrar sesión cuando la página se oculta (cierre de pestaña/navegador)
            // Usar navigator.sendBeacon si está disponible para mayor confiabilidad
            if (navigator.sendBeacon) {
                // Intentar cerrar sesión de forma síncrona
                supabase.auth.signOut().catch(() => {});
            } else {
                // Fallback: cerrar sesión normalmente
                supabase.auth.signOut().catch(() => {});
            }
        };

        // También usar beforeunload como respaldo
        const handleBeforeUnload = () => {
            // Intentar cerrar sesión (puede no completarse si el navegador cierra muy rápido)
            supabase.auth.signOut().catch(() => {});
        };

        // Agregar listeners
        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            mounted = false;
            window.removeEventListener('pagehide', handlePageHide);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (sub?.subscription) {
                sub.subscription.unsubscribe();
            }
        };
    }, []);

    if (loading) return <div style={{ padding: 24 }}>Cargando…</div>;

    // Si no hay usuario, mostrar login
    if (!user) {
        return <Login />;
    }

    // Si el usuario es doctor, mostrar vista de doctor
    if (perfil?.role === "doctor") {
        return <DoctorView user={user} perfil={perfil} />;
    }

    // Si hay usuario, mostrar inventario o admin según la vista
    if (vista === "admin" && perfil?.role === "admin") {
        return <Admin user={user} onVolver={() => setVista("inventario")} />;
    }

    return <Inventario user={user} perfil={perfil} onIrAdmin={() => setVista("admin")} />;
}
