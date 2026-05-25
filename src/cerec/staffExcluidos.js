/** Personal que ya no forma parte del equipo (no aparece en asignaciones, etc.) */
const NOMBRES_EXCLUIDOS = ["saul", "saúl"];

export function esStaffExcluido(fullName) {
    if (!fullName?.trim()) return false;
    const n = fullName.trim().toLowerCase();
    return NOMBRES_EXCLUIDOS.some(
        (ex) => n === ex || n.startsWith(`${ex} `) || n.includes(` ${ex} `) || n.endsWith(` ${ex}`)
    );
}

export function filtrarStaffActivo(perfiles) {
    return (perfiles ?? []).filter((p) => !esStaffExcluido(p.full_name));
}
