export function MetaItem({ icon, label, children }) {
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

export function temaAccent(integradoEnLogistica) {
    return integradoEnLogistica
        ? {
              accent: "border-l-emerald-500",
              ring: "focus:ring-emerald-500 focus:border-emerald-500",
              spinner: "border-emerald-200 border-t-emerald-600",
              pillActive: "bg-emerald-600",
              emptyIcon: "text-emerald-200",
          }
        : {
              accent: "border-l-blue-500",
              ring: "focus:ring-blue-500 focus:border-blue-500",
              spinner: "border-blue-200 border-t-blue-600",
              pillActive: "bg-blue-600",
              emptyIcon: "text-blue-200",
          };
}

export function tagColors(tag) {
    if (tag === "EXOCAD") return "bg-orange-100 text-orange-800 border-orange-200";
    if (tag === "CEREC") return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
}

/** Borde izquierdo: naranja=nuevo, morado=diseño, azul=fresado, verde=finalizado */
export function bordeAccentTrabajo(trabajo, variant) {
    if (variant === "nuevo" || trabajo?.etapa === "nuevo") {
        return "border-l-amber-500";
    }
    if (trabajo?.status === "completed") {
        return "border-l-emerald-500";
    }
    if (trabajo?.etapa === "fresado") {
        return "border-l-blue-500";
    }
    return "border-l-violet-500";
}

export const ICON_CALENDAR = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

export const ICON_SEND = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);

export const ICON_USER = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

export const ICON_CHECK = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
