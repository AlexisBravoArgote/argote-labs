import LogisticaTrabajoControl from "./LogisticaTrabajoControl";

const ESTADO_ESTILOS = {
    green: {
        badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
        accent: "border-l-emerald-500",
        etapa: "text-emerald-700",
        iconBg: "bg-emerald-100 text-emerald-600",
    },
    blue: {
        badge: "bg-sky-100 text-sky-800 border-sky-200",
        accent: "border-l-sky-500",
        etapa: "text-sky-700",
        iconBg: "bg-sky-100 text-sky-600",
    },
    purple: {
        badge: "bg-violet-100 text-violet-800 border-violet-200",
        accent: "border-l-violet-500",
        etapa: "text-violet-700",
        iconBg: "bg-violet-100 text-violet-600",
    },
    orange: {
        badge: "bg-amber-100 text-amber-800 border-amber-200",
        accent: "border-l-amber-500",
        etapa: "text-amber-700",
        iconBg: "bg-amber-100 text-amber-600",
    },
};

function MetaItem({ icon, label, children }) {
    return (
        <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div className="min-w-0 text-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
                <div className="text-gray-800 font-medium leading-snug">{children}</div>
            </div>
        </div>
    );
}

/**
 * @param {object} props
 * @param {object} props.trabajo
 * @param {(t: object) => string} props.obtenerNombreTratamiento
 * @param {(t: object) => { texto: string, color: string, etapa: string }} props.obtenerEstadoTrabajo
 */
export default function DoctorTrabajoCard({ trabajo, obtenerNombreTratamiento, obtenerEstadoTrabajo }) {
    const estado = obtenerEstadoTrabajo(trabajo);
    const est = ESTADO_ESTILOS[estado.color] || ESTADO_ESTILOS.orange;

    return (
        <article
            className={`bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden border-l-4 ${est.accent}`}
        >
            <div className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                            {trabajo.doctor ? `Dr. ${trabajo.doctor}` : "Trabajo CEREC"}
                        </p>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                            {obtenerNombreTratamiento(trabajo)}
                        </h3>
                        <p className="text-base text-gray-600 mt-0.5 font-medium">
                            Paciente {trabajo.patient_name}
                            {trabajo.pieza && (
                                <span className="text-gray-400 font-normal"> · Pieza {trabajo.pieza}</span>
                            )}
                        </p>
                    </div>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${est.iconBg}`}>
                        {estado.color === "green" ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : estado.color === "blue" ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${est.badge}`}>
                        {estado.texto}
                    </span>
                    <LogisticaTrabajoControl trabajo={trabajo} modo="lectura" />
                    {trabajo.color && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
                            Color {trabajo.color}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <MetaItem
                        label="Etapa en laboratorio"
                        icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        }
                    >
                        <span className={est.etapa}>{estado.etapa}</span>
                    </MetaItem>

                    {trabajo.fecha_espera && (
                        <MetaItem
                            label="Fecha esperada"
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            }
                        >
                            {new Date(trabajo.fecha_espera + "T00:00:00").toLocaleDateString("es-MX", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            })}
                        </MetaItem>
                    )}

                    <MetaItem
                        label="Enviado"
                        icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        }
                    >
                        {new Date(trabajo.created_at).toLocaleString("es-MX", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </MetaItem>

                    {trabajo.status === "completed" && trabajo.completed_at && (
                        <MetaItem
                            label="Finalizado"
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        >
                            <span className="text-emerald-700">
                                {new Date(trabajo.completed_at).toLocaleString("es-MX", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </MetaItem>
                    )}
                </div>

                {trabajo.notas_doctor && (
                    <div className="mb-4 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                        <div className="text-xs font-semibold text-gray-600 mb-1">Tus notas para el laboratorio</div>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{trabajo.notas_doctor}</p>
                    </div>
                )}

                {trabajo.materiales && trabajo.materiales.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                            Materiales utilizados
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {trabajo.materiales.map((m, idx) => (
                                <span
                                    key={idx}
                                    className="text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-lg"
                                >
                                    {m.item_name}
                                    <span className="text-gray-400 ml-1">×{m.quantity}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </article>
    );
}
