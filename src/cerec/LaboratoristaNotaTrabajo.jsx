import { useEffect, useState } from "react";
import { supabase } from "../supabase";

/**
 * @param {object} props
 * @param {string} props.jobId
 * @param {import("@supabase/supabase-js").User} props.user
 * @param {{ job_id: string, content: string, updated_at?: string, updated_by?: string } | null | undefined} props.nota
 * @param {(jobId: string, nota: object | null) => void} [props.onNotaChange]
 * @param {boolean} [props.soloLectura] — solo muestra texto (p. ej. panel admin)
 */
export default function LaboratoristaNotaTrabajo({ jobId, user, nota, onNotaChange = () => {}, soloLectura = false }) {
    const [editando, setEditando] = useState(false);
    const [borrarPendiente, setBorrarPendiente] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");
    const [borrando, setBorrando] = useState(false);
    const [texto, setTexto] = useState(nota?.content ?? "");

    const tieneTexto = Boolean(nota?.content?.trim());

    useEffect(() => {
        if (!editando) setTexto(nota?.content ?? "");
    }, [nota?.content, editando]);

    async function guardar() {
        const t = texto.trim();
        setError("");
        if (!t) {
            await eliminarNota();
            return;
        }
        if (!user?.id) {
            setError("No hay sesión.");
            return;
        }
        setGuardando(true);
        const row = {
            job_id: jobId,
            content: t,
            updated_at: new Date().toISOString(),
            updated_by: user.id,
        };
        const { data, error: err } = await supabase
            .from("job_laboratorista_notes")
            .upsert(row, { onConflict: "job_id" })
            .select("job_id, content, updated_at, updated_by")
            .single();

        setGuardando(false);
        if (err) {
            console.error(err);
            setError(err.message || "No se pudo guardar.");
            return;
        }
        onNotaChange(jobId, data);
        setEditando(false);
    }

    async function eliminarNota(opts = {}) {
        const { loadingKey = "guardar" } = opts;
        if (!user?.id) {
            setError("No hay sesión.");
            return;
        }
        if (loadingKey === "borrar") setBorrando(true);
        else setGuardando(true);
        const { error: err } = await supabase.from("job_laboratorista_notes").delete().eq("job_id", jobId);
        if (loadingKey === "borrar") setBorrando(false);
        else setGuardando(false);
        if (err) {
            console.error(err);
            setError(err.message || "No se pudo eliminar.");
            return;
        }
        onNotaChange(jobId, null);
        setEditando(false);
        setBorrarPendiente(false);
        setTexto("");
    }

    async function confirmarBorrar() {
        setError("");
        await eliminarNota({ loadingKey: "borrar" });
    }

    if (soloLectura) {
        if (!tieneTexto) return null;
        return (
            <div className="mt-2 p-2 bg-violet-50 border border-violet-200 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">
                <div className="text-xs font-semibold text-violet-800 mb-1">Nota del laboratorista</div>
                {nota.content}
            </div>
        );
    }

    return (
        <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/60 p-3">
            <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-violet-900">Nota del laboratorista</span>
                <div className="flex items-center gap-1 shrink-0">
                    {!editando && !tieneTexto && (
                        <button
                            type="button"
                            title="Escribir nota"
                            onClick={() => {
                                setError("");
                                setTexto("");
                                setEditando(true);
                            }}
                            className="p-1.5 rounded-lg text-violet-700 hover:bg-violet-100 transition-colors"
                            aria-label="Escribir nota del laboratorista"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    )}
                    {!editando && tieneTexto && (
                        <>
                            <button
                                type="button"
                                title="Editar nota"
                                onClick={() => {
                                    setError("");
                                    setTexto(nota.content);
                                    setEditando(true);
                                }}
                                className="p-1.5 rounded-lg text-violet-700 hover:bg-violet-100 transition-colors"
                                aria-label="Editar nota"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                title="Eliminar nota"
                                onClick={() => {
                                    setError("");
                                    setBorrarPendiente(true);
                                }}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                aria-label="Eliminar nota"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {editando && (
                <div className="mt-2 space-y-2">
                    <textarea
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        rows={4}
                        placeholder="Escribe la nota interna del laboratorio…"
                        className="w-full px-3 py-2 text-sm border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none resize-y bg-white"
                    />
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            disabled={guardando}
                            onClick={guardar}
                            className="px-3 py-1.5 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                        >
                            {guardando ? "Guardando…" : "Guardar"}
                        </button>
                        <button
                            type="button"
                            disabled={guardando}
                            onClick={() => {
                                setEditando(false);
                                setTexto(nota?.content ?? "");
                                setError("");
                            }}
                            className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {!editando && tieneTexto && (
                <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap pr-1">{nota.content}</p>
            )}

            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

            {borrarPendiente && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true" aria-labelledby="lab-nota-borrar-titulo">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200">
                        <h3 id="lab-nota-borrar-titulo" className="text-base font-semibold text-gray-900">
                            ¿Estás seguro que quieres borrar esta nota de laboratorio?
                        </h3>
                        <p className="text-sm text-gray-600 mt-2">Esta acción no se puede deshacer.</p>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                type="button"
                                disabled={borrando}
                                onClick={() => setBorrarPendiente(false)}
                                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50"
                            >
                                No
                            </button>
                            <button
                                type="button"
                                disabled={borrando}
                                onClick={confirmarBorrar}
                                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50"
                            >
                                {borrando ? "Borrando…" : "Sí"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
