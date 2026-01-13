import { useState } from "react";
import { supabase } from "../supabase";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function login() {
        setError("");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError("Correo o contraseña incorrectos");
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-6 rounded-xl shadow w-full max-w-sm">
                <h2 className="text-xl font-bold text-center">Inventario CEREC</h2>
                <p className="text-sm text-gray-600 text-center mt-1">Inicia sesión</p>

                <div className="mt-4 grid gap-2">
                    <input
                        className="border p-2 rounded"
                        placeholder="Correo"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        className="border p-2 rounded"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {error && <div className="text-red-600 text-sm">{error}</div>}

                    <button onClick={login} className="bg-black text-white p-2 rounded mt-2">
                        Entrar
                    </button>
                </div>
            </div>
        </div>
    );
}
