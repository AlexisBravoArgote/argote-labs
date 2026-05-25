/**
 * CTA principal para enviar trabajos al laboratorio CEREC (doctor / asistente dental).
 */
export default function EnviarTrabajoCerecCta({ onClick, esAsistente = false }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-2xl"
        >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 shadow-lg shadow-emerald-900/20 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-emerald-800/30 group-hover:-translate-y-0.5">
                <div
                    className="absolute -top-12 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none"
                    aria-hidden
                />
                <div
                    className="absolute -bottom-16 -left-8 w-48 h-48 rounded-full bg-teal-400/20 blur-2xl pointer-events-none"
                    aria-hidden
                />
                <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.08)_50%,transparent_75%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="relative px-5 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/15 border border-white/20 items-center justify-center shrink-0 backdrop-blur-sm">
                            <svg
                                className="w-7 h-7 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.75}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-emerald-100/90 mb-1">
                                Laboratorio CEREC
                            </p>
                            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                                Enviar trabajo al laboratorio
                            </h2>
                            <p className="text-sm text-emerald-50/90 mt-1.5 max-w-lg">
                                {esAsistente
                                    ? "Registra el caso del doctor: el equipo de laboratorio lo verá al instante en su panel."
                                    : "Tu caso aparece de inmediato en el panel del laboratorio para diseño y fresado."}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 sm:self-center">
                        <span className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-emerald-800 font-semibold text-sm sm:text-base shadow-md transition-transform duration-300 group-hover:scale-[1.02] group-active:scale-[0.98]">
                            <svg
                                className="w-5 h-5 text-emerald-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Nuevo trabajo
                            <svg
                                className="w-4 h-4 text-emerald-500 transition-transform group-hover:translate-x-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                    </div>
                </div>
            </div>
        </button>
    );
}
