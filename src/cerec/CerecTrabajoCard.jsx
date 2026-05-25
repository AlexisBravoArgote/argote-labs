import LogisticaTrabajoControl from "./LogisticaTrabajoControl";
import {
    MetaItem,
    tagColors,
    bordeAccentTrabajo,
    ICON_CALENDAR,
    ICON_SEND,
    ICON_USER,
    ICON_CHECK,
} from "./cerecTrabajoShared";

/**
 * @param {object} props
 * @param {"nuevo"|"proceso"|"historial"} props.variant
 * @param {boolean} props.integradoEnLogistica
 * @param {object} props.trabajo
 * @param {(t: object) => string} props.obtenerNombreTratamiento
 * @param {(t: object) => string} [props.obtenerTagTrabajo]
 * @param {import("react").ReactNode} [props.acciones]
 * @param {import("react").ReactNode} [props.notaLaboratorista]
 * @param {(id: string) => void} [props.onRecibirLogistica]
 * @param {string | null} [props.recibiendoLogisticaId]
 */
export default function CerecTrabajoCard({
    variant,
    integradoEnLogistica,
    trabajo,
    obtenerNombreTratamiento,
    obtenerTagTrabajo,
    acciones,
    notaLaboratorista,
    onRecibirLogistica,
    recibiendoLogisticaId,
}) {
    const accent = bordeAccentTrabajo(trabajo, variant);

    const tag = obtenerTagTrabajo?.(trabajo);

    return (
        <article
            className={`bg-white rounded-2xl border border-gray-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden border-l-4 ${accent}`}
        >
            <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    {variant === "nuevo" && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg border bg-amber-100 text-amber-800 border-amber-200">
                            Nuevo · Por iniciar
                        </span>
                    )}
                    {tag && (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${tagColors(tag)}`}>
                            {tag}
                        </span>
                    )}
                    {variant === "proceso" && (
                        <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                                trabajo.etapa === "fresado"
                                    ? "bg-sky-100 text-sky-800 border-sky-200"
                                    : "bg-violet-100 text-violet-800 border-violet-200"
                            }`}
                        >
                            {trabajo.etapa === "fresado" ? "Fresado" : "Diseño"}
                        </span>
                    )}
                    {variant === "historial" && (
                        <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                                trabajo.status === "completed"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : "bg-amber-100 text-amber-800 border-amber-200"
                            }`}
                        >
                            {trabajo.status === "completed" ? "Finalizado" : "Pendiente"}
                        </span>
                    )}
                    {variant === "historial" && trabajo.etapa && trabajo.status !== "completed" && (
                        <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                                trabajo.etapa === "fresado"
                                    ? "bg-sky-100 text-sky-800 border-sky-200"
                                    : "bg-violet-100 text-violet-800 border-violet-200"
                            }`}
                        >
                            {trabajo.etapa === "fresado" ? "Fresado" : "Diseño"}
                        </span>
                    )}
                    {trabajo.reportes?.map((tipo, idx) => (
                        <span
                            key={idx}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                                tipo === "error"
                                    ? "bg-red-100 text-red-800 border-red-200"
                                    : "bg-amber-100 text-amber-800 border-amber-200"
                            }`}
                        >
                            {tipo === "error" ? "ERROR" : "FALLA"}
                        </span>
                    ))}
                    {!integradoEnLogistica && trabajo.logistics_received_at && (
                        <LogisticaTrabajoControl trabajo={trabajo} modo="lectura" />
                    )}
                </div>

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div className="flex-1 min-w-0 space-y-4">
                        <div>
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
                            {trabajo.color && (
                                <span className="inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
                                    Color {trabajo.color}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {variant === "nuevo" && (
                                <MetaItem label="Enviado por doctor" icon={ICON_SEND}>
                                    {trabajo.created_by_name || "—"}
                                    <span className="block text-xs text-gray-500 font-normal mt-0.5">
                                        {new Date(trabajo.created_at).toLocaleString("es-MX", {
                                            day: "numeric",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </MetaItem>
                            )}
                            {variant !== "nuevo" && (
                                <MetaItem label={variant === "historial" ? "Creado" : "Iniciado"} icon={ICON_SEND}>
                                    {trabajo.created_by_name || "—"}
                                    <span className="block text-xs text-gray-500 font-normal mt-0.5">
                                        {new Date(trabajo.created_at).toLocaleString("es-MX", {
                                            day: "numeric",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </MetaItem>
                            )}
                            {trabajo.fecha_espera && (
                                <MetaItem label="Fecha esperada" icon={ICON_CALENDAR}>
                                    {new Date(trabajo.fecha_espera + "T00:00:00").toLocaleDateString("es-MX", {
                                        weekday: "short",
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </MetaItem>
                            )}
                            {variant === "nuevo" && !trabajo.fecha_espera && (
                                <MetaItem label="Fecha esperada" icon={ICON_CALENDAR}>
                                    <span className="text-amber-700">Sin fecha registrada</span>
                                </MetaItem>
                            )}
                            {variant === "historial" && trabajo.status === "completed" && trabajo.completed_at && (
                                <MetaItem label="Finalizado" icon={ICON_CHECK}>
                                    <span className="text-emerald-700">
                                        {trabajo.completed_by_name || "—"}
                                        <span className="block text-xs text-gray-500 font-normal mt-0.5">
                                            {new Date(trabajo.completed_at).toLocaleString("es-MX", {
                                                day: "numeric",
                                                month: "short",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </span>
                                </MetaItem>
                            )}
                            {trabajo.doctor && variant !== "nuevo" && (
                                <MetaItem label="Doctor" icon={ICON_USER}>
                                    {trabajo.doctor}
                                </MetaItem>
                            )}
                        </div>

                        {trabajo.notas_doctor && (
                            <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-100">
                                <div className="text-xs font-semibold text-blue-800 mb-1">Notas del doctor</div>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {trabajo.notas_doctor}
                                </p>
                            </div>
                        )}

                        {notaLaboratorista}

                        {trabajo.materiales?.length > 0 && (
                            <div className="pt-3 border-t border-gray-100">
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                                    Materiales
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

                    {(acciones || integradoEnLogistica) && (
                        <div className="flex flex-col gap-2 shrink-0 lg:min-w-[11rem]">
                            {integradoEnLogistica && (
                                <LogisticaTrabajoControl
                                    trabajo={trabajo}
                                    modo="logistica"
                                    onRecibir={onRecibirLogistica}
                                    guardando={recibiendoLogisticaId === trabajo.id}
                                />
                            )}
                            {acciones}
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}
