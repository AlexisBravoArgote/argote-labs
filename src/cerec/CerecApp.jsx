import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Login from "./Login";
import Inventario from "./Inventario";
import Admin from "./Admin";
import DoctorView from "./DoctorView";
import LogisticaView from "./LogisticaView";

export default function CerecApp() {
    const [user, setUser] = useState(null);
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [vista, setVista] = useState("inventario"); // "inventario" o "admin"

    // Cargar perfil dado un usuario
    async function cargarPerfil(u) {
        if (!u) { setPerfil(null); return; }
        try {
            const { data: p, error } = await supabase
                .from("profiles")
                .select("id, full_name, role")
                .eq("id", u.id)
                .single();
            setPerfil(error ? null : (p ?? null));
        } catch {
            setPerfil(null);
        }
    }

    useEffect(() => {
        let mounted = true;
        let initialized = false;

        // 1) Carga inicial: getSession() es instantáneo (lee de localStorage, no hace red)
        (async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!mounted) return;

                const u = session?.user ?? null;
                setUser(u);
                await cargarPerfil(u);
            } catch (err) {
                console.error("Error al cargar sesión:", err);
                if (mounted) { setUser(null); setPerfil(null); }
            } finally {
                if (mounted) {
                    initialized = true;
                    setLoading(false);
                }
            }
        })();

        // 2) Escuchar cambios de auth (login/logout) — ignora el evento inicial
        const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted || !initialized) return; // Ignorar el INITIAL_SESSION

            const u = session?.user ?? null;
            setUser(u);
            setLoading(true); // Mostrar loading mientras carga perfil
            await cargarPerfil(u);
            if (mounted) setLoading(false);
        });

        // 3) Cerrar sesión al cerrar pestaña/navegador
        const handlePageHide = () => { supabase.auth.signOut().catch(() => {}); };
        const handleBeforeUnload = () => { supabase.auth.signOut().catch(() => {}); };

        window.addEventListener("pagehide", handlePageHide);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            mounted = false;
            window.removeEventListener("pagehide", handlePageHide);
            window.removeEventListener("beforeunload", handleBeforeUnload);
            if (sub?.subscription) sub.subscription.unsubscribe();
        };
    }, []);

    // ─── Pantalla de carga profesional ─────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
                </div>
                <div className="relative z-10 text-center">
                    <div className="relative w-16 h-16 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{ animationDuration: "1.5s", animationDirection: "reverse" }}></div>
                    </div>
                    <p className="text-white/60 text-sm font-medium tracking-wide">Cargando portal...</p>
                </div>
            </div>
        );
    }

    // Si no hay usuario, mostrar login
    if (!user) return <Login />;

    // Si el usuario es de logística, mostrar vista de logística
    if (perfil?.role === "logistica") return <LogisticaView user={user} perfil={perfil} />;

    // Si el usuario es doctor, mostrar vista de doctor
    if (perfil?.role === "doctor") return <DoctorView user={user} perfil={perfil} />;

    // Si hay usuario (admin/staff), mostrar inventario o admin según la vista
    if (vista === "admin" && perfil?.role === "admin") {
        return <Admin user={user} onVolver={() => setVista("inventario")} />;
    }

    return <Inventario user={user} perfil={perfil} onIrAdmin={() => setVista("admin")} />;
}
