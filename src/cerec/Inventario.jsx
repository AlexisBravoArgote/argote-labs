import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import MovimientoModal from "./MovimientoModal";
import NuevoTrabajoModal from "./NuevoTrabajoModal";

export default function Inventario({ user, perfil, onIrAdmin }) {
    const [items, setItems] = useState([]);
    const [movs, setMovs] = useState([]);
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(true);
    const [cargandoMasMovs, setCargandoMasMovs] = useState(false);
    const [hasMoreMovs, setHasMoreMovs] = useState(true);

    const [busqueda, setBusqueda] = useState("");
    const [categoria, setCategoria] = useState("todas");
    const [tagsFiltrados, setTagsFiltrados] = useState([]);
    const [busquedaHistorial, setBusquedaHistorial] = useState("");
    const [busquedaTrabajos, setBusquedaTrabajos] = useState("");
    const [filtroTrabajosPendientes, setFiltroTrabajosPendientes] = useState("todos"); // "todos", "exocad", "cerec", "otro"
    
    // Filtros para historial de trabajos
    const [mostrarFiltrosHistorial, setMostrarFiltrosHistorial] = useState(false);
    const [filtroTagHistorial, setFiltroTagHistorial] = useState(""); // "exocad", "cerec", ""
    const [filtroFinalizadoPor, setFiltroFinalizadoPor] = useState(""); // nombre del usuario
    const [filtroDoctorHistorial, setFiltroDoctorHistorial] = useState(""); // nombre del doctor
    const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
    const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
    const [filtroTratamientoHistorial, setFiltroTratamientoHistorial] = useState(""); // tipo de tratamiento

    const TAGS_DISPONIBLES = ["E.MAX", "RECICLADO", "SIRONA"];
    const DOCTORES = ["Alvaro", "Andrea", "Angulo", "Claudia", "Enrique", "Fierro", "Gustavo", "Ivan", "Linda", "Nathali", "Otro"];

    // Paginación
    const [paginaItems, setPaginaItems] = useState(1);
    const [paginaMovs, setPaginaMovs] = useState(1);
    const [paginaTrabajos, setPaginaTrabajos] = useState(1);
    const [paginaTrabajosPendientes, setPaginaTrabajosPendientes] = useState(1);
    const itemsPorPagina = 4;

    const [modalItem, setModalItem] = useState(null);
    const [mostrarModalTrabajo, setMostrarModalTrabajo] = useState(false);
    const [mostrarModalFresar, setMostrarModalFresar] = useState(false);
    const [mostrarModalAditamento, setMostrarModalAditamento] = useState(false);
    const [mostrarModalReporte, setMostrarModalReporte] = useState(false);
    const [trabajoParaFresar, setTrabajoParaFresar] = useState(null);
    const [trabajoParaAditamento, setTrabajoParaAditamento] = useState(null);
    const [trabajoParaReporte, setTrabajoParaReporte] = useState(null);
    const [trabajosPendientes, setTrabajosPendientes] = useState([]);
    const [historialTrabajos, setHistorialTrabajos] = useState([]);
    const [cargandoTrabajos, setCargandoTrabajos] = useState(false);
    const [reportes, setReportes] = useState([]);
    const [cargandoReportes, setCargandoReportes] = useState(false);
    const [paginaReportes, setPaginaReportes] = useState(1);
    const [mostrarModalCalendario, setMostrarModalCalendario] = useState(false);
    const [trabajosCalendario, setTrabajosCalendario] = useState([]);
    const [cargandoCalendario, setCargandoCalendario] = useState(false);

    // Función para obtener nombre de tratamiento (debe estar antes de los useMemo)
    function obtenerNombreTratamiento(trabajo) {
        if (trabajo.treatment_name) return trabajo.treatment_name;
        
        const nombres = {
            "corona_implante": "Corona sobre implante",
            "guia_quirurgica": "Guía quirúrgica",
            "guardas": "Guardas",
            "modelo_ortodoncia": "Modelo de ortodoncia",
            "diseno_sonrisa": "Diseño de sonrisa",
            "rehabilitacion_completa": "Rehabilitación completa",
            "coronas": "Coronas",
            "carillas": "Carillas",
            "incrustaciones": "Incrustaciones",
            "otra": "Otro"
        };
        
        return nombres[trabajo.treatment_type] || trabajo.treatment_type;
    }

    // Función para obtener el tag del trabajo (EXOCAD, CEREC, OTRO)
    function obtenerTagTrabajo(trabajo) {
        const tipo = trabajo.treatment_type;
        
        // EXOCAD: guardas, diseño de sonrisa, guía quirúrgica, modelos de ortodoncia
        if (["guardas", "diseno_sonrisa", "guia_quirurgica", "modelo_ortodoncia"].includes(tipo)) {
            return "EXOCAD";
        }
        
        // OTRO: otra
        if (tipo === "otra") {
            return "OTRO";
        }
        
        // CEREC: todos los demás
        return "CEREC";
    }

    const itemsFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return items.filter((it) => {
            const okTexto = !q || it.name.toLowerCase().includes(q);
            const okCat = categoria === "todas" || it.category === categoria;
            
            // Filtrar por tags: si hay tags seleccionados, el item debe tener al menos uno
            let okTags = true;
            if (tagsFiltrados.length > 0) {
                const itemTags = it.tags || [];
                okTags = tagsFiltrados.some(tag => itemTags.includes(tag));
            }
            
            return okTexto && okCat && okTags;
        });
    }, [items, busqueda, categoria, tagsFiltrados]);

    // Filtrar y paginar items
    const itemsPaginados = useMemo(() => {
        const inicio = (paginaItems - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        return itemsFiltrados.slice(inicio, fin);
    }, [itemsFiltrados, paginaItems]);

    const totalPaginasItems = Math.ceil(itemsFiltrados.length / itemsPorPagina);

    // Filtrar movimientos por búsqueda
    const movsFiltrados = useMemo(() => {
        const q = busquedaHistorial.trim().toLowerCase();
        if (!q) return movs;
        return movs.filter(m => 
            m.item_name?.toLowerCase().includes(q) ||
            m.user_name?.toLowerCase().includes(q) ||
            m.reason?.toLowerCase().includes(q) ||
            m.delta?.toString().includes(q)
        );
    }, [movs, busquedaHistorial]);

    // Paginar movimientos
    const movsPaginados = useMemo(() => {
        const inicio = (paginaMovs - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        return movsFiltrados.slice(inicio, fin);
    }, [movsFiltrados, paginaMovs]);

    const totalPaginasMovs = Math.ceil(movsFiltrados.length / itemsPorPagina);

    // Obtener usuarios únicos que han finalizado trabajos
    const usuariosFinalizadores = useMemo(() => {
        const nombres = new Set();
        historialTrabajos.forEach(t => {
            if (t.completed_by_name) {
                nombres.add(t.completed_by_name);
            }
        });
        return Array.from(nombres).sort();
    }, [historialTrabajos]);

    // Filtrar trabajos por búsqueda y filtros avanzados
    const trabajosFiltrados = useMemo(() => {
        let filtrados = historialTrabajos;
        
        // Filtro por búsqueda de texto
        const q = busquedaTrabajos.trim().toLowerCase();
        if (q) {
            filtrados = filtrados.filter(t => 
                t.patient_name?.toLowerCase().includes(q) ||
                t.treatment_name?.toLowerCase().includes(q) ||
                obtenerNombreTratamiento(t).toLowerCase().includes(q) ||
                t.created_by_name?.toLowerCase().includes(q) ||
                t.completed_by_name?.toLowerCase().includes(q)
            );
        }
        
        // Filtro por tag (EXOCAD, CEREC)
        if (filtroTagHistorial) {
            filtrados = filtrados.filter(t => {
                const tag = obtenerTagTrabajo(t);
                return tag === filtroTagHistorial.toUpperCase();
            });
        }
        
        // Filtro por finalizado por
        if (filtroFinalizadoPor) {
            filtrados = filtrados.filter(t => 
                t.completed_by_name?.toLowerCase() === filtroFinalizadoPor.toLowerCase()
            );
        }
        
        // Filtro por doctor
        if (filtroDoctorHistorial) {
            filtrados = filtrados.filter(t => 
                t.doctor?.toLowerCase() === filtroDoctorHistorial.toLowerCase()
            );
        }
        
        // Filtro por fechas
        if (filtroFechaDesde) {
            const fechaDesde = new Date(filtroFechaDesde + "T00:00:00");
            filtrados = filtrados.filter(t => {
                const fechaTrabajo = new Date(t.created_at);
                return fechaTrabajo >= fechaDesde;
            });
        }
        
        if (filtroFechaHasta) {
            const fechaHasta = new Date(filtroFechaHasta + "T23:59:59");
            filtrados = filtrados.filter(t => {
                const fechaTrabajo = new Date(t.created_at);
                return fechaTrabajo <= fechaHasta;
            });
        }
        
        // Filtro por tratamiento
        if (filtroTratamientoHistorial) {
            filtrados = filtrados.filter(t => 
                t.treatment_type === filtroTratamientoHistorial
            );
        }
        
        return filtrados;
    }, [historialTrabajos, busquedaTrabajos, filtroTagHistorial, filtroFinalizadoPor, filtroDoctorHistorial, filtroFechaDesde, filtroFechaHasta, filtroTratamientoHistorial]);

    // Paginar trabajos
    const trabajosPaginados = useMemo(() => {
        const inicio = (paginaTrabajos - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        return trabajosFiltrados.slice(inicio, fin);
    }, [trabajosFiltrados, paginaTrabajos]);

    const totalPaginasTrabajos = Math.ceil(trabajosFiltrados.length / itemsPorPagina);

    // Filtrar trabajos pendientes por tag
    const trabajosPendientesFiltrados = useMemo(() => {
        if (filtroTrabajosPendientes === "todos") {
            return trabajosPendientes;
        }
        return trabajosPendientes.filter(t => {
            const tag = obtenerTagTrabajo(t);
            return tag === filtroTrabajosPendientes.toUpperCase();
        });
    }, [trabajosPendientes, filtroTrabajosPendientes]);

    // Contadores para cada filtro
    const contadoresTrabajosPendientes = useMemo(() => {
        const todos = trabajosPendientes.length;
        const exocad = trabajosPendientes.filter(t => obtenerTagTrabajo(t) === "EXOCAD").length;
        const cerec = trabajosPendientes.filter(t => obtenerTagTrabajo(t) === "CEREC").length;
        const otro = trabajosPendientes.filter(t => obtenerTagTrabajo(t) === "OTRO").length;
        return { todos, exocad, cerec, otro };
    }, [trabajosPendientes]);

    // Paginar trabajos pendientes
    const trabajosPendientesPaginados = useMemo(() => {
        const inicio = (paginaTrabajosPendientes - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        return trabajosPendientesFiltrados.slice(inicio, fin);
    }, [trabajosPendientesFiltrados, paginaTrabajosPendientes]);

    const totalPaginasTrabajosPendientes = Math.ceil(trabajosPendientesFiltrados.length / itemsPorPagina);

    async function cargarMovimientos(offset = 0, limit = 50) {
        try {
            const { data: m, error: mErr, count } = await supabase
                .from("stock_movements")
                .select("id, item_id, delta, reason, created_by, created_at", { count: "exact" })
                .order("created_at", { ascending: false })
                .range(offset, offset + limit - 1);

            if (mErr) {
                console.error("Error al cargar movimientos:", mErr);
                setError(`Error al cargar historial: ${mErr.message}`);
                return { movs: [], hasMore: false };
            }

            const movBase = m ?? [];
            if (movBase.length === 0) {
                return { movs: [], hasMore: false };
            }

            // Mapear nombres bonitos: items + perfiles
            const itemIds = [...new Set(movBase.map((x) => x.item_id))];
            const userIds = [...new Set(movBase.map((x) => x.created_by))];

            const [{ data: itemNames, error: itemsErr }, { data: perfiles, error: profilesErr }] = await Promise.all([
                supabase.from("items").select("id, name").in("id", itemIds.length ? itemIds : ["00000000-0000-0000-0000-000000000000"]),
                supabase.from("profiles").select("id, full_name").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
            ]);

            if (itemsErr) {
                console.error("Error al cargar nombres de items:", itemsErr);
            }
            if (profilesErr) {
                console.error("Error al cargar perfiles:", profilesErr);
            }

            const itemMap = new Map((itemNames ?? []).map((x) => [x.id, x.name]));
            const userMap = new Map((perfiles ?? []).map((x) => [x.id, x.full_name || x.id]));

            const movsMapeados = movBase.map((x) => ({
                ...x,
                item_name: itemMap.get(x.item_id) || x.item_id,
                user_name: userMap.get(x.created_by) || x.created_by,
            }));

            const hasMore = count ? offset + limit < count : movBase.length === limit;

            return { movs: movsMapeados, hasMore };
        } catch (err) {
            console.error("Error inesperado al cargar movimientos:", err);
            setError(`Error inesperado al cargar historial: ${err.message}`);
            return { movs: [], hasMore: false };
        }
    }

    async function cargarTrabajos() {
        setCargandoTrabajos(true);
        
        // Cargar trabajos en proceso
        const { data: pendientes, error: errPendientes } = await supabase
            .from("jobs")
            .select("id, treatment_type, treatment_name, patient_name, pieza, doctor, created_by, created_at, etapa, fecha_espera")
            .eq("status", "pending")
            .order("created_at", { ascending: false });

        if (errPendientes) {
            console.error("Error cargando trabajos en proceso:", errPendientes);
        } else {
            // Mapear nombres de usuarios
            const userIds = [...new Set((pendientes || []).map(t => t.created_by))];
            const { data: perfiles } = await supabase
                .from("profiles")
                .select("id, full_name")
                .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

            const userMap = new Map((perfiles || []).map(p => [p.id, p.full_name || p.id]));

            const trabajosConNombres = (pendientes || []).map(t => ({
                ...t,
                created_by_name: userMap.get(t.created_by) || t.created_by
            }));

            // Cargar materiales fresados para trabajos en proceso
            const jobIds = trabajosConNombres.map(t => t.id);
            if (jobIds.length > 0) {
                const [{ data: materiales, error: errMateriales }, { data: reportesData, error: errReportes }] = await Promise.all([
                    supabase
                        .from("job_materials")
                        .select("job_id, item_id, quantity")
                        .in("job_id", jobIds),
                    supabase
                        .from("job_reports")
                        .select("job_id, report_type")
                        .in("job_id", jobIds)
                ]);

                if (!errMateriales && materiales) {
                    const itemIds = [...new Set(materiales.map(m => m.item_id))];
                    const { data: itemsData } = await supabase
                        .from("items")
                        .select("id, name, category")
                        .in("id", itemIds.length ? itemIds : ["00000000-0000-0000-0000-000000000000"]);

                    const itemMap = new Map((itemsData || []).map(i => [i.id, { name: i.name, category: i.category }]));

                    // Agrupar materiales por job_id
                    const materialesPorJob = new Map();
                    materiales.forEach(m => {
                        if (!materialesPorJob.has(m.job_id)) {
                            materialesPorJob.set(m.job_id, []);
                        }
                        const itemInfo = itemMap.get(m.item_id) || { name: m.item_id, category: null };
                        materialesPorJob.get(m.job_id).push({
                            item_name: itemInfo.name,
                            quantity: m.quantity,
                            item_category: itemInfo.category
                        });
                    });

                    // Agrupar reportes por job_id
                    const reportesPorJob = new Map();
                    if (!errReportes && reportesData) {
                        reportesData.forEach(r => {
                            if (!reportesPorJob.has(r.job_id)) {
                                reportesPorJob.set(r.job_id, []);
                            }
                            reportesPorJob.get(r.job_id).push(r.report_type);
                        });
                    }

                    // Agregar materiales y reportes a cada trabajo
                    trabajosConNombres.forEach(t => {
                        t.materiales = materialesPorJob.get(t.id) || [];
                        // Verificar si ya tiene aditamento (categoría "other" o nombre contiene "aditamento")
                        t.tieneAditamento = t.materiales.some(m => 
                            m.item_category === "other" || 
                            m.item_name.toLowerCase().includes("aditamento")
                        );
                        // Agregar reportes
                        t.reportes = reportesPorJob.get(t.id) || [];
                    });
                } else {
                    // Si no hay materiales, marcar que no tiene aditamento
                    trabajosConNombres.forEach(t => {
                        t.tieneAditamento = false;
                        t.reportes = [];
                    });
                }
            } else {
                // Si no hay trabajos, marcar que no tienen aditamento
                trabajosConNombres.forEach(t => {
                    t.tieneAditamento = false;
                    t.reportes = [];
                });
            }

            setTrabajosPendientes(trabajosConNombres);
        }

        // Cargar historial de trabajos
        const { data: historial, error: errHistorial } = await supabase
            .from("jobs")
            .select("id, treatment_type, treatment_name, patient_name, pieza, doctor, status, created_by, completed_by, created_at, completed_at, etapa, fecha_espera")
            .order("created_at", { ascending: false })
            .limit(50);

        if (errHistorial) {
            console.error("Error cargando historial de trabajos:", errHistorial);
        } else {
            const userIds = [...new Set((historial || []).flatMap(t => [t.created_by, t.completed_by]).filter(Boolean))];
            const { data: perfiles } = await supabase
                .from("profiles")
                .select("id, full_name")
                .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

            const userMap = new Map((perfiles || []).map(p => [p.id, p.full_name || p.id]));

            const historialConNombres = (historial || []).map(t => ({
                ...t,
                created_by_name: userMap.get(t.created_by) || t.created_by,
                completed_by_name: t.completed_by ? (userMap.get(t.completed_by) || t.completed_by) : null
            }));

            // Cargar materiales fresados y reportes para historial
            const jobIdsHistorial = historialConNombres.map(t => t.id);
            if (jobIdsHistorial.length > 0) {
                const [{ data: materiales, error: errMateriales }, { data: reportesData, error: errReportes }] = await Promise.all([
                    supabase
                        .from("job_materials")
                        .select("job_id, item_id, quantity")
                        .in("job_id", jobIdsHistorial),
                    supabase
                        .from("job_reports")
                        .select("job_id, report_type")
                        .in("job_id", jobIdsHistorial)
                ]);

                if (!errMateriales && materiales) {
                    const itemIds = [...new Set(materiales.map(m => m.item_id))];
                    const { data: itemsData } = await supabase
                        .from("items")
                        .select("id, name")
                        .in("id", itemIds.length ? itemIds : ["00000000-0000-0000-0000-000000000000"]);

                    const itemMap = new Map((itemsData || []).map(i => [i.id, i.name]));

                    // Agrupar materiales por job_id
                    const materialesPorJob = new Map();
                    materiales.forEach(m => {
                        if (!materialesPorJob.has(m.job_id)) {
                            materialesPorJob.set(m.job_id, []);
                        }
                        materialesPorJob.get(m.job_id).push({
                            item_name: itemMap.get(m.item_id) || m.item_id,
                            quantity: m.quantity
                        });
                    });

                    // Agrupar reportes por job_id
                    const reportesPorJob = new Map();
                    if (!errReportes && reportesData) {
                        reportesData.forEach(r => {
                            if (!reportesPorJob.has(r.job_id)) {
                                reportesPorJob.set(r.job_id, []);
                            }
                            reportesPorJob.get(r.job_id).push(r.report_type);
                        });
                    }

                    // Agregar materiales y reportes a cada trabajo
                    historialConNombres.forEach(t => {
                        t.materiales = materialesPorJob.get(t.id) || [];
                        t.reportes = reportesPorJob.get(t.id) || [];
                    });
                } else {
                    historialConNombres.forEach(t => {
                        t.materiales = [];
                        t.reportes = [];
                    });
                }
            }

            setHistorialTrabajos(historialConNombres);
        }

        setCargandoTrabajos(false);
    }

    async function cargar() {
        setError("");
        setCargando(true);

        try {
            const { data: it, error: iErr } = await supabase
                .from("items")
                .select("id, name, category, unit, current_qty, image_url, tags")
                .order("name", { ascending: true });

            if (iErr) {
                console.error("Error al cargar items:", iErr);
                setError(`Error al cargar artículos: ${iErr.message}`);
                setCargando(false);
                return;
            }
            
            setItems(it ?? []);

            const { movs: movsData, hasMore } = await cargarMovimientos(0, 50);
            setMovs(movsData);
            setHasMoreMovs(hasMore);

            await cargarTrabajos();
            await cargarReportes();
        } catch (err) {
            console.error("Error inesperado al cargar:", err);
            setError(`Error inesperado: ${err.message}`);
        } finally {
            setCargando(false);
        }
    }

    async function cargarTrabajosCalendario() {
        setCargandoCalendario(true);
        try {
            // Cargar todos los trabajos (pendientes y finalizados)
            const { data: todosTrabajos, error: errTrabajos } = await supabase
                .from("jobs")
                .select("id, treatment_type, treatment_name, patient_name, pieza, doctor, status, fecha_espera, completed_at, created_at")
                .order("created_at", { ascending: false });

            if (errTrabajos) {
                console.error("Error cargando trabajos para calendario:", errTrabajos);
                setTrabajosCalendario([]);
                setCargandoCalendario(false);
                return;
            }

            // Mapear trabajos con sus fechas relevantes
            const trabajosConFechas = (todosTrabajos || []).map(t => {
                let fechaRelevante = null;
                let tipoFecha = null; // "esperada" o "finalizado"
                
                if (t.status === "completed" && t.completed_at) {
                    // Trabajo finalizado: usar fecha de finalización
                    fechaRelevante = new Date(t.completed_at);
                    tipoFecha = "finalizado";
                } else if (t.fecha_espera) {
                    // Trabajo pendiente: usar fecha esperada
                    fechaRelevante = new Date(t.fecha_espera + "T00:00:00");
                    tipoFecha = "esperada";
                }
                
                return {
                    ...t,
                    fechaRelevante,
                    tipoFecha,
                    treatment_name_display: obtenerNombreTratamiento(t)
                };
            }).filter(t => t.fechaRelevante !== null); // Solo trabajos con fecha relevante

            setTrabajosCalendario(trabajosConFechas);
        } catch (err) {
            console.error("Error inesperado al cargar trabajos para calendario:", err);
            setTrabajosCalendario([]);
        } finally {
            setCargandoCalendario(false);
        }
    }

    async function cargarReportes() {
        setCargandoReportes(true);
        try {
            const { data: reportesData, error: errReportes } = await supabase
                .from("job_reports")
                .select("id, job_id, report_type, description, reported_by, created_at")
                .order("created_at", { ascending: false })
                .limit(50);

            if (errReportes) {
                // Si la tabla no existe, simplemente no cargar reportes
                if (errReportes.message.includes("does not exist") || errReportes.message.includes("no existe")) {
                    console.log("Tabla job_reports no existe aún. Ejecuta el script SQL para crearla.");
                    setReportes([]);
                    setCargandoReportes(false);
                    return;
                }
                console.error("Error al cargar reportes:", errReportes);
                setReportes([]);
                setCargandoReportes(false);
                return;
            }

            const reportesBase = reportesData || [];
            if (reportesBase.length === 0) {
                setReportes([]);
                setCargandoReportes(false);
                return;
            }

            // Obtener información de trabajos y usuarios
            const jobIds = [...new Set(reportesBase.map(r => r.job_id))];
            const userIds = [...new Set(reportesBase.map(r => r.reported_by))];

            const [{ data: trabajosData }, { data: perfiles }] = await Promise.all([
                supabase
                    .from("jobs")
                    .select("id, treatment_type, treatment_name, patient_name")
                    .in("id", jobIds.length ? jobIds : ["00000000-0000-0000-0000-000000000000"]),
                supabase
                    .from("profiles")
                    .select("id, full_name")
                    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"])
            ]);

            const trabajoMap = new Map((trabajosData || []).map(t => [t.id, t]));
            const userMap = new Map((perfiles || []).map(p => [p.id, p.full_name || p.id]));

            setReportes(
                reportesBase.map(r => {
                    const trabajo = trabajoMap.get(r.job_id);
                    return {
                        ...r,
                        job_info: trabajo ? {
                            patient_name: trabajo.patient_name,
                            treatment_name: obtenerNombreTratamiento(trabajo)
                        } : null,
                        reported_by_name: userMap.get(r.reported_by) || r.reported_by
                    };
                })
            );
        } catch (err) {
            console.error("Error inesperado al cargar reportes:", err);
            setReportes([]);
        } finally {
            setCargandoReportes(false);
        }
    }

    async function cargarMasMovimientos() {
        setCargandoMasMovs(true);
        const { movs: nuevosMovs, hasMore } = await cargarMovimientos(movs.length, 50);
        setMovs([...movs, ...nuevosMovs]);
        setHasMoreMovs(hasMore);
        setCargandoMasMovs(false);
    }

    useEffect(() => {
        cargar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function logout() {
        await supabase.auth.signOut();
    }

    async function registrarMovimiento(tipo, cantidad, nota) {
        if (!modalItem) return;
        if (!cantidad || cantidad <= 0) {
            setError("La cantidad debe ser mayor a 0.");
            return;
        }

        setError("");

        // Verificar que el item aún existe antes de intentar el movimiento
        const { data: itemExists, error: checkError } = await supabase
            .from("items")
            .select("id, current_qty")
            .eq("id", modalItem.id)
            .single();

        if (checkError || !itemExists) {
            setError("El artículo ya no existe o no tienes permiso para accederlo. Por favor, actualiza la página.");
            return;
        }

        // Verificar stock suficiente si es una retirada
        if (tipo === "remove" && itemExists.current_qty < cantidad) {
            setError(`Stock insuficiente. Solo hay ${itemExists.current_qty} disponible(s).`);
            return;
        }

        const delta = tipo === "add" ? Math.abs(cantidad) : -Math.abs(cantidad);

        const { error } = await supabase.from("stock_movements").insert({
            item_id: modalItem.id,
            delta,
            reason: nota?.trim() ? nota.trim() : null,
            created_by: user.id,
        });

        if (error) {
            // Mejorar mensajes de error comunes
            if (error.message.includes('item no existe')) {
                setError("Error: El artículo no existe. Por favor, actualiza la página e intenta de nuevo.");
            } else if (error.message.includes('Stock insuficiente')) {
                setError(error.message);
            } else {
                setError(`Error: ${error.message}`);
            }
            console.error("Error al registrar movimiento:", error);
            return;
        }

        // Mantener máximo de 1000 movimientos (eliminar los más antiguos)
        const { count } = await supabase
            .from("stock_movements")
            .select("*", { count: "exact", head: true });

        if (count && count > 1000) {
            // Obtener los IDs de los movimientos más antiguos (los que exceden 1000)
            const { data: movsAntiguos } = await supabase
                .from("stock_movements")
                .select("id")
                .order("created_at", { ascending: true })
                .limit(count - 1000);

            if (movsAntiguos && movsAntiguos.length > 0) {
                const idsAEliminar = movsAntiguos.map((m) => m.id);
                await supabase
                    .from("stock_movements")
                    .delete()
                    .in("id", idsAEliminar);
            }
        }

        setModalItem(null);
        await cargar();
    }

    async function crearTrabajo(datosTrabajo) {
        setError("");
        setMostrarModalTrabajo(false);

        try {
            // 1. Crear el trabajo
            const { data: trabajo, error: errTrabajo } = await supabase
                .from("jobs")
                .insert({
                    treatment_type: datosTrabajo.treatment_type,
                    treatment_name: datosTrabajo.treatment_name,
                    patient_name: datosTrabajo.patient_name,
                    pieza: datosTrabajo.pieza,
                    doctor: datosTrabajo.doctor,
                    status: "pending",
                    etapa: "diseño",
                    fecha_espera: datosTrabajo.fecha_espera,
                    created_by: user.id
                })
                .select()
                .single();

            if (errTrabajo) {
                setError(`Error al crear trabajo: ${errTrabajo.message}`);
                return;
            }

            // 2. Si hay materiales, crear registros de materiales y restar del inventario
            if (datosTrabajo.materials && datosTrabajo.materials.length > 0) {
                // Crear registros de materiales del trabajo
                const materialesInsert = datosTrabajo.materials.map(m => ({
                    job_id: trabajo.id,
                    item_id: m.item_id,
                    quantity: m.quantity
                }));

                const { error: errMateriales } = await supabase
                    .from("job_materials")
                    .insert(materialesInsert);

                if (errMateriales) {
                    setError(`Error al registrar materiales: ${errMateriales.message}`);
                    // Intentar eliminar el trabajo creado
                    await supabase.from("jobs").delete().eq("id", trabajo.id);
                    return;
                }

                // Restar del inventario y crear movimientos
                for (const material of datosTrabajo.materials) {
                    const { error: errMovimiento } = await supabase
                        .from("stock_movements")
                        .insert({
                            item_id: material.item_id,
                            delta: -material.quantity,
                            reason: `Trabajo: ${datosTrabajo.patient_name} - ${datosTrabajo.treatment_name || datosTrabajo.treatment_type}`,
                            created_by: user.id
                        });

                    if (errMovimiento) {
                        console.error(`Error al restar inventario para ${material.item_name}:`, errMovimiento);
                        // Continuar con los demás materiales
                    }
                }
            }

            await cargar();
        } catch (err) {
            setError(`Error inesperado: ${err.message}`);
        }
    }

    async function finalizarTrabajo(trabajoId) {
        if (!confirm("¿Marcar este trabajo como finalizado?")) return;

        setError("");

        const { error } = await supabase
            .from("jobs")
            .update({
                status: "completed",
                completed_by: user.id,
                completed_at: new Date().toISOString()
            })
            .eq("id", trabajoId);

        if (error) {
            setError(`Error al finalizar trabajo: ${error.message}`);
            return;
        }

        await cargarTrabajos();
    }

    function necesitaFresado(trabajo) {
        const tiposConFresado = ["corona_implante", "coronas", "carillas", "incrustaciones", "diseno_sonrisa", "rehabilitacion_completa", "otra"];
        return tiposConFresado.includes(trabajo.treatment_type);
    }

    function abrirModalFresar(trabajo) {
        setTrabajoParaFresar(trabajo);
        setMostrarModalFresar(true);
    }

    function abrirModalAditamento(trabajo) {
        setTrabajoParaAditamento(trabajo);
        setMostrarModalAditamento(true);
    }

    function abrirModalReporte(trabajo) {
        setTrabajoParaReporte(trabajo);
        setMostrarModalReporte(true);
    }

    async function confirmarReporte(tipoReporte, descripcion) {
        if (!trabajoParaReporte || !tipoReporte || !descripcion.trim()) {
            setError("Debes completar todos los campos del reporte.");
            return;
        }

        setError("");
        setMostrarModalReporte(false);

        try {
            const { error: errReporte } = await supabase
                .from("job_reports")
                .insert({
                    job_id: trabajoParaReporte.id,
                    report_type: tipoReporte,
                    description: descripcion.trim(),
                    reported_by: user.id
                });

            if (errReporte) {
                setError(`Error al crear reporte: ${errReporte.message}`);
                return;
            }

            setTrabajoParaReporte(null);
            await cargar();
        } catch (err) {
            setError(`Error inesperado: ${err.message}`);
        }
    }

    async function confirmarFresado(materiales) {
        if (!trabajoParaFresar || !materiales || materiales.length === 0) {
            setError("Debes seleccionar al menos un cubo para fresar.");
            return;
        }

        setError("");
        setMostrarModalFresar(false);

        try {
            // 1. Crear registros de materiales del trabajo
            const materialesInsert = materiales.map(m => ({
                job_id: trabajoParaFresar.id,
                item_id: m.item_id,
                quantity: m.quantity
            }));

            const { error: errMateriales } = await supabase
                .from("job_materials")
                .insert(materialesInsert);

            if (errMateriales) {
                setError(`Error al registrar materiales: ${errMateriales.message}`);
                return;
            }

            // 2. Restar del inventario y crear movimientos
            for (const material of materiales) {
                const { error: errMovimiento } = await supabase
                    .from("stock_movements")
                    .insert({
                        item_id: material.item_id,
                        delta: -material.quantity,
                        reason: `Fresado - Trabajo: ${trabajoParaFresar.patient_name} - ${obtenerNombreTratamiento(trabajoParaFresar)}`,
                        created_by: user.id
                    });

                if (errMovimiento) {
                    console.error(`Error al restar inventario para ${material.item_name}:`, errMovimiento);
                }
            }

            // 3. Actualizar etapa del trabajo a "fresado"
            const { error: errEtapa } = await supabase
                .from("jobs")
                .update({ etapa: "fresado" })
                .eq("id", trabajoParaFresar.id);

            if (errEtapa) {
                setError(`Error al actualizar etapa: ${errEtapa.message}`);
                return;
            }

            setTrabajoParaFresar(null);
            await cargar();
        } catch (err) {
            setError(`Error inesperado: ${err.message}`);
        }
    }

    async function confirmarAditamento(materiales) {
        if (!trabajoParaAditamento || !materiales || materiales.length === 0) {
            setError("Debes seleccionar al menos un aditamento.");
            return;
        }

        setError("");
        setMostrarModalAditamento(false);

        try {
            // 1. Crear registros de materiales del trabajo
            const materialesInsert = materiales.map(m => ({
                job_id: trabajoParaAditamento.id,
                item_id: m.item_id,
                quantity: m.quantity
            }));

            const { error: errMateriales } = await supabase
                .from("job_materials")
                .insert(materialesInsert);

            if (errMateriales) {
                setError(`Error al registrar materiales: ${errMateriales.message}`);
                return;
            }

            // 2. Restar del inventario y crear movimientos
            for (const material of materiales) {
                const { error: errMovimiento } = await supabase
                    .from("stock_movements")
                    .insert({
                        item_id: material.item_id,
                        delta: -material.quantity,
                        reason: `Aditamento - Trabajo: ${trabajoParaAditamento.patient_name} - ${obtenerNombreTratamiento(trabajoParaAditamento)}`,
                        created_by: user.id
                    });

                if (errMovimiento) {
                    console.error(`Error al restar inventario para ${material.item_name}:`, errMovimiento);
                }
            }

            setTrabajoParaAditamento(null);
            await cargar();
        } catch (err) {
            setError(`Error inesperado: ${err.message}`);
        }
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">CEREC</h1>
                    <div className="text-sm text-gray-600">
                        {perfil?.full_name ?? "Usuario"} ·{" "}
                        {perfil?.role === "admin" ? "Administrador" : "Personal"}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={async () => {
                            setMostrarModalCalendario(true);
                            await cargarTrabajosCalendario();
                        }}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                        title="Ver calendario de trabajos"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </button>
                    {perfil?.role === "admin" && (
                        <button
                            onClick={onIrAdmin}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                            title="Panel de administración"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    )}
                    <button 
                        onClick={logout} 
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                        title="Cerrar sesión"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>

            {error && <div className="text-red-600 mt-4">{error}</div>}

            <div className="flex items-center justify-between mt-6">
                <h2 className="text-lg font-semibold">Trabajos en proceso</h2>
                <button
                    onClick={() => setMostrarModalTrabajo(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    Empezar trabajo
                </button>
            </div>

            {cargandoTrabajos ? (
                <div className="mt-3 text-gray-600">Cargando trabajos…</div>
            ) : trabajosPendientes.length === 0 ? (
                <div className="mt-3 text-gray-500 text-sm">No hay trabajos en proceso.</div>
            ) : (
                <>
                    <div className="mt-3 flex gap-4 flex-wrap items-center">
                        <span className="text-sm font-medium">Filtrar por:</span>
                        <button
                            onClick={() => {
                                setFiltroTrabajosPendientes("todos");
                                setPaginaTrabajosPendientes(1);
                            }}
                            className={`px-3 py-1 rounded text-sm ${
                                filtroTrabajosPendientes === "todos"
                                    ? "bg-blue-600 text-white"
                                    : "border hover:bg-gray-50"
                            }`}
                        >
                            Todos ({contadoresTrabajosPendientes.todos})
                        </button>
                        <button
                            onClick={() => {
                                setFiltroTrabajosPendientes("exocad");
                                setPaginaTrabajosPendientes(1);
                            }}
                            className={`px-3 py-1 rounded text-sm ${
                                filtroTrabajosPendientes === "exocad"
                                    ? "bg-blue-600 text-white"
                                    : "border hover:bg-gray-50"
                            }`}
                        >
                            EXOCAD ({contadoresTrabajosPendientes.exocad})
                        </button>
                        <button
                            onClick={() => {
                                setFiltroTrabajosPendientes("cerec");
                                setPaginaTrabajosPendientes(1);
                            }}
                            className={`px-3 py-1 rounded text-sm ${
                                filtroTrabajosPendientes === "cerec"
                                    ? "bg-blue-600 text-white"
                                    : "border hover:bg-gray-50"
                            }`}
                        >
                            CEREC ({contadoresTrabajosPendientes.cerec})
                        </button>
                        <button
                            onClick={() => {
                                setFiltroTrabajosPendientes("otro");
                                setPaginaTrabajosPendientes(1);
                            }}
                            className={`px-3 py-1 rounded text-sm ${
                                filtroTrabajosPendientes === "otro"
                                    ? "bg-blue-600 text-white"
                                    : "border hover:bg-gray-50"
                            }`}
                        >
                            Otro ({contadoresTrabajosPendientes.otro})
                        </button>
                    </div>

                    {trabajosPendientesFiltrados.length === 0 ? (
                        <div className="mt-3 text-gray-500 text-sm">No hay trabajos con ese filtro.</div>
                    ) : (
                        <>
                            <div className="grid gap-2 mt-3">
                        {trabajosPendientesPaginados.map((trabajo) => (
                            <div key={trabajo.id} className="border rounded p-3">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <div className="font-semibold">
                                                {obtenerNombreTratamiento(trabajo)} - {trabajo.patient_name}
                                                {trabajo.pieza && ` (Pieza: ${trabajo.pieza})`}
                                            </div>
                                            <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">
                                                {obtenerTagTrabajo(trabajo)}
                                            </span>
                                        </div>
                                        {trabajo.doctor && (
                                            <div className="text-sm text-gray-600 mt-1">
                                                Doctor: {trabajo.doctor}
                                            </div>
                                        )}
                                        <div className="text-sm text-gray-600">
                                            Iniciado: {new Date(trabajo.created_at).toLocaleString("es-MX")} · {trabajo.created_by_name}
                                        </div>
                                        {trabajo.fecha_espera && (
                                            <div className="text-sm text-blue-600 mt-1">
                                                Fecha esperada: {new Date(trabajo.fecha_espera + "T00:00:00").toLocaleDateString("es-MX")}
                                            </div>
                                        )}
                                        <div className="text-sm font-medium mt-1">
                                            Etapa: <span className="text-purple-600">{trabajo.etapa === "fresado" ? "Fresado" : "Diseño"}</span>
                                        </div>
                                        <div className="mt-2">
                                            <button
                                                onClick={() => abrirModalReporte(trabajo)}
                                                className="text-orange-600 hover:text-orange-700 text-sm underline"
                                            >
                                                Reportar
                                            </button>
                                        </div>
                                        {trabajo.materiales && trabajo.materiales.length > 0 && (
                                            <div className="text-sm mt-2">
                                                <span className="font-medium">Materiales utilizados:</span>{" "}
                                                {trabajo.materiales.map((m, idx) => (
                                                    <span key={idx}>
                                                        {m.item_name} ({m.quantity})
                                                        {idx < trabajo.materiales.length - 1 ? ", " : ""}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {trabajo.reportes && trabajo.reportes.length > 0 && (
                                            <div className="flex gap-1 mt-2 flex-wrap">
                                                {trabajo.reportes.map((tipo, idx) => (
                                                    <span 
                                                        key={idx}
                                                        className={`text-xs px-2 py-1 rounded ${
                                                            tipo === "error" 
                                                                ? "bg-red-100 text-red-800" 
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {tipo === "error" ? "ERROR" : "FALLA"}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {trabajo.treatment_type === "corona_implante" && !trabajo.tieneAditamento && (
                                            <button
                                                onClick={() => abrirModalAditamento(trabajo)}
                                                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
                                            >
                                                Aditamento
                                            </button>
                                        )}
                                        {necesitaFresado(trabajo) && trabajo.etapa === "diseño" && (
                                            <button
                                                onClick={() => abrirModalFresar(trabajo)}
                                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                                            >
                                                Fresar
                                            </button>
                                        )}
                                        <button
                                            onClick={() => finalizarTrabajo(trabajo.id)}
                                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                                        >
                                            Finalizar trabajo
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {totalPaginasTrabajosPendientes > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <button
                                onClick={() => setPaginaTrabajosPendientes(p => Math.max(1, p - 1))}
                                disabled={paginaTrabajosPendientes === 1}
                                className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-gray-600">
                                Página {paginaTrabajosPendientes} de {totalPaginasTrabajosPendientes} ({trabajosPendientesFiltrados.length} trabajos)
                            </span>
                            <button
                                onClick={() => setPaginaTrabajosPendientes(p => Math.min(totalPaginasTrabajosPendientes, p + 1))}
                                disabled={paginaTrabajosPendientes === totalPaginasTrabajosPendientes}
                                className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                        </>
                    )}
                </>
            )}

            <div className="flex items-center justify-between mt-10">
                <h2 className="text-lg font-semibold">Historial de trabajos</h2>
                <div className="flex items-center gap-2">
                    {(() => {
                        const filtrosActivos = [
                            filtroTagHistorial,
                            filtroFinalizadoPor,
                            filtroDoctorHistorial,
                            filtroFechaDesde,
                            filtroFechaHasta,
                            filtroTratamientoHistorial
                        ].filter(f => f !== "").length;
                        
                        if (filtrosActivos > 0) {
                            return (
                                <span className="text-sm text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded border border-orange-200">
                                    {filtrosActivos} filtro{filtrosActivos > 1 ? "s" : ""} activo{filtrosActivos > 1 ? "s" : ""}
                                </span>
                            );
                        }
                        return null;
                    })()}
                    <button
                        onClick={() => setMostrarFiltrosHistorial(!mostrarFiltrosHistorial)}
                        className="border rounded px-3 py-1 text-sm hover:bg-gray-50"
                    >
                        {mostrarFiltrosHistorial ? "Ocultar filtros" : "Mostrar filtros"}
                    </button>
                </div>
            </div>

            {mostrarFiltrosHistorial && (
                <div className="mt-3 p-4 border rounded bg-gray-50 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Filtro por tag */}
                        <div>
                            <label className="text-sm font-medium block mb-2">Filtrar por tag:</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setFiltroTagHistorial(filtroTagHistorial === "exocad" ? "" : "exocad");
                                        setPaginaTrabajos(1);
                                    }}
                                    className={`px-3 py-1 rounded text-sm border ${filtroTagHistorial === "exocad" ? "bg-blue-100 border-blue-500" : ""}`}
                                >
                                    EXOCAD
                                </button>
                                <button
                                    onClick={() => {
                                        setFiltroTagHistorial(filtroTagHistorial === "cerec" ? "" : "cerec");
                                        setPaginaTrabajos(1);
                                    }}
                                    className={`px-3 py-1 rounded text-sm border ${filtroTagHistorial === "cerec" ? "bg-blue-100 border-blue-500" : ""}`}
                                >
                                    CEREC
                                </button>
                            </div>
                        </div>

                        {/* Filtro por finalizado por */}
                        <div>
                            <label className="text-sm font-medium block mb-2">Finalizado por:</label>
                            <select
                                value={filtroFinalizadoPor}
                                onChange={(e) => {
                                    setFiltroFinalizadoPor(e.target.value);
                                    setPaginaTrabajos(1);
                                }}
                                className="border rounded p-2 w-full text-sm"
                            >
                                <option value="">Todos</option>
                                {usuariosFinalizadores.map(usuario => (
                                    <option key={usuario} value={usuario}>
                                        {usuario}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro por doctor */}
                        <div>
                            <label className="text-sm font-medium block mb-2">Filtrar por doctor:</label>
                            <select
                                value={filtroDoctorHistorial}
                                onChange={(e) => {
                                    setFiltroDoctorHistorial(e.target.value);
                                    setPaginaTrabajos(1);
                                }}
                                className="border rounded p-2 w-full text-sm"
                            >
                                <option value="">Todos los doctores</option>
                                {DOCTORES.filter(d => d !== "Otro").map(doctor => (
                                    <option key={doctor} value={doctor}>
                                        {doctor}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro por tratamiento */}
                        <div>
                            <label className="text-sm font-medium block mb-2">Filtrar por tratamiento:</label>
                            <select
                                value={filtroTratamientoHistorial}
                                onChange={(e) => {
                                    setFiltroTratamientoHistorial(e.target.value);
                                    setPaginaTrabajos(1);
                                }}
                                className="border rounded p-2 w-full text-sm"
                            >
                                <option value="">Todos los tratamientos</option>
                                <option value="carillas">Carillas</option>
                                <option value="corona_implante">Corona sobre implante</option>
                                <option value="coronas">Coronas</option>
                                <option value="diseno_sonrisa">Diseño de sonrisa</option>
                                <option value="guardas">Guardas</option>
                                <option value="guia_quirurgica">Guía quirúrgica</option>
                                <option value="incrustaciones">Incrustaciones</option>
                                <option value="modelo_ortodoncia">Modelo de ortodoncia</option>
                                <option value="otra">Otra</option>
                                <option value="rehabilitacion_completa">Rehabilitación completa</option>
                            </select>
                        </div>

                        {/* Filtro por fecha desde */}
                        <div>
                            <label className="text-sm font-medium block mb-2">Desde:</label>
                            <input
                                type="date"
                                value={filtroFechaDesde}
                                onChange={(e) => {
                                    setFiltroFechaDesde(e.target.value);
                                    setPaginaTrabajos(1);
                                }}
                                className="border rounded p-2 w-full text-sm"
                            />
                        </div>

                        {/* Filtro por fecha hasta */}
                        <div>
                            <label className="text-sm font-medium block mb-2">Hasta:</label>
                            <input
                                type="date"
                                value={filtroFechaHasta}
                                onChange={(e) => {
                                    setFiltroFechaHasta(e.target.value);
                                    setPaginaTrabajos(1);
                                }}
                                className="border rounded p-2 w-full text-sm"
                            />
                        </div>
                    </div>

                    {/* Botón para limpiar filtros */}
                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setFiltroTagHistorial("");
                                setFiltroFinalizadoPor("");
                                setFiltroDoctorHistorial("");
                                setFiltroFechaDesde("");
                                setFiltroFechaHasta("");
                                setFiltroTratamientoHistorial("");
                                setPaginaTrabajos(1);
                            }}
                            className="text-sm text-gray-600 hover:text-gray-800 underline"
                        >
                            Limpiar todos los filtros
                        </button>
                    </div>
                </div>
            )}

            {cargandoTrabajos ? (
                <div className="mt-3 text-gray-600">Cargando…</div>
            ) : historialTrabajos.length === 0 ? (
                <div className="mt-3 text-gray-500 text-sm">No hay trabajos en el historial.</div>
            ) : (
                <>
                    <div className="mt-3 mb-3">
                        <input
                            type="text"
                            value={busquedaTrabajos}
                            onChange={(e) => {
                                setBusquedaTrabajos(e.target.value);
                                setPaginaTrabajos(1); // Resetear a página 1 al buscar
                            }}
                            placeholder="Buscar en historial de trabajos..."
                            className="border rounded p-2 w-full"
                        />
                    </div>
                    {trabajosFiltrados.length === 0 ? (
                        <div className="mt-3 text-gray-500 text-sm">No se encontraron trabajos con esa búsqueda.</div>
                    ) : (
                        <>
                            <div className="grid gap-2 mt-3">
                                {trabajosPaginados.map((trabajo) => (
                        <div key={trabajo.id} className="border rounded p-3">
                            <div className="flex items-center gap-2">
                                <div className="font-semibold">
                                    {obtenerNombreTratamiento(trabajo)} - {trabajo.patient_name}
                                    {trabajo.pieza && ` (Pieza: ${trabajo.pieza})`}
                                </div>
                                <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">
                                    {obtenerTagTrabajo(trabajo)}
                                </span>
                            </div>
                            {trabajo.doctor && (
                                <div className="text-sm text-gray-600 mt-1">
                                    Doctor: {trabajo.doctor}
                                </div>
                            )}
                            <div className="text-sm text-gray-600">
                                {trabajo.status === "completed" ? (
                                    <>
                                        <span className="text-green-600 font-medium">Finalizado</span> ·{" "}
                                        Finalizado por {trabajo.completed_by_name} ·{" "}
                                        {new Date(trabajo.completed_at).toLocaleString("es-MX")} ·{" "}
                                        Iniciado: {new Date(trabajo.created_at).toLocaleString("es-MX")} por {trabajo.created_by_name}
                                    </>
                                ) : (
                                    <>
                                        <span className="text-orange-600 font-medium">Pendiente</span> ·{" "}
                                        Iniciado: {new Date(trabajo.created_at).toLocaleString("es-MX")} · {trabajo.created_by_name}
                                    </>
                                )}
                                {trabajo.fecha_espera && (
                                    <> · <span className="text-blue-600">Esperado: {new Date(trabajo.fecha_espera + "T00:00:00").toLocaleDateString("es-MX")}</span></>
                                )}
                                {trabajo.etapa && trabajo.status !== "completed" && (
                                    <> · <span className="text-purple-600">Etapa: {trabajo.etapa === "fresado" ? "Fresado" : "Diseño"}</span></>
                                )}
                            </div>
                            {trabajo.materiales && trabajo.materiales.length > 0 && (
                                <div className="text-sm mt-2">
                                    <span className="font-medium">Materiales utilizados:</span>{" "}
                                    {trabajo.materiales.map((m, idx) => (
                                        <span key={idx}>
                                            {m.item_name} ({m.quantity})
                                            {idx < trabajo.materiales.length - 1 ? ", " : ""}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {trabajo.reportes && trabajo.reportes.length > 0 && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                    {trabajo.reportes.map((tipo, idx) => (
                                        <span 
                                            key={idx}
                                            className={`text-xs px-2 py-1 rounded ${
                                                tipo === "error" 
                                                    ? "bg-red-100 text-red-800" 
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {tipo === "error" ? "ERROR" : "FALLA"}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className="mt-2">
                                <button
                                    onClick={() => abrirModalReporte(trabajo)}
                                    className="text-orange-600 hover:text-orange-700 text-sm underline"
                                >
                                    Reportar
                                </button>
                            </div>
                        </div>
                    ))}
                            </div>
                            {totalPaginasTrabajos > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-4">
                                    <button
                                        onClick={() => setPaginaTrabajos(p => Math.max(1, p - 1))}
                                        disabled={paginaTrabajos === 1}
                                        className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Anterior
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        Página {paginaTrabajos} de {totalPaginasTrabajos} ({trabajosFiltrados.length} trabajos)
                                    </span>
                                    <button
                                        onClick={() => setPaginaTrabajos(p => Math.min(totalPaginasTrabajos, p + 1))}
                                        disabled={paginaTrabajos === totalPaginasTrabajos}
                                        className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            <h2 className="text-lg font-semibold mt-10">Artículos</h2>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <input
                    value={busqueda}
                    onChange={(e) => {
                        setBusqueda(e.target.value);
                        setPaginaItems(1); // Resetear a página 1 al buscar
                    }}
                    placeholder="Buscar artículo…"
                    className="border rounded p-2"
                />
                <select
                    value={categoria}
                    onChange={(e) => {
                        setCategoria(e.target.value);
                        setPaginaItems(1); // Resetear a página 1 al cambiar categoría
                    }}
                    className="border rounded p-2"
                >
                    <option value="todas">Todas las categorías</option>
                    <option value="bloc">Bloques (CEREC)</option>
                    <option value="bur">Fresas</option>
                    <option value="other">Otros</option>
                </select>
                <button onClick={cargar} className="border rounded p-2">
                    Actualizar
                </button>
            </div>

            <div className="mt-3 flex gap-4 flex-wrap items-center">
                <span className="text-sm font-medium">Tags:</span>
                {TAGS_DISPONIBLES.map(tag => (
                    <label key={tag} className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={tagsFiltrados.includes(tag)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setTagsFiltrados([...tagsFiltrados, tag]);
                                } else {
                                    setTagsFiltrados(tagsFiltrados.filter(t => t !== tag));
                                }
                                setPaginaItems(1); // Resetear a página 1 al cambiar tags
                            }}
                            className="w-4 h-4"
                        />
                        <span className="text-sm">{tag}</span>
                    </label>
                ))}
            </div>

            {cargando ? (
                <div className="mt-3 text-gray-600">Cargando…</div>
            ) : (
                <>
                    <div className="grid gap-2 mt-3">
                        {itemsPaginados.map((it) => (
                            <div key={it.id} className="border rounded p-3 flex justify-between gap-3">
                                <div className="flex-1">
                                    <div className="font-semibold">{it.name}</div>
                                    <div className="text-sm text-gray-600">
                                        Stock: <b>{it.current_qty}</b> {it.unit} ·{" "}
                                        {it.category === "bloc"
                                            ? "Bloque"
                                            : it.category === "bur"
                                                ? "Fresa"
                                                : "Otro"}
                                    </div>
                                    {it.tags && it.tags.length > 0 && (
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                            {it.tags.map(tag => (
                                                <span 
                                                    key={tag} 
                                                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setModalItem(it)}
                                    className="bg-black text-white px-3 py-2 rounded"
                                >
                                    Agregar / Retirar
                                </button>
                            </div>
                        ))}
                    </div>
                    {totalPaginasItems > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <button
                                onClick={() => setPaginaItems(p => Math.max(1, p - 1))}
                                disabled={paginaItems === 1}
                                className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-gray-600">
                                Página {paginaItems} de {totalPaginasItems} ({itemsFiltrados.length} artículos)
                            </span>
                            <button
                                onClick={() => setPaginaItems(p => Math.min(totalPaginasItems, p + 1))}
                                disabled={paginaItems === totalPaginasItems}
                                className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}

            <div className="flex items-center justify-between mt-10">
                <h2 className="text-lg font-semibold">Historial global</h2>
            </div>

            <div className="mt-3 mb-3">
                <input
                    type="text"
                    value={busquedaHistorial}
                    onChange={(e) => {
                        setBusquedaHistorial(e.target.value);
                        setPaginaMovs(1); // Resetear a página 1 al buscar
                    }}
                    placeholder="Buscar en historial global..."
                    className="border rounded p-2 w-full"
                />
            </div>

            {movsFiltrados.length === 0 ? (
                <div className="mt-3 text-gray-500 text-sm">No se encontraron movimientos con esa búsqueda.</div>
            ) : (
                <>
                    <div className="grid gap-2 mt-3">
                        {movsPaginados.map((m) => (
                            <div key={m.id} className="border rounded p-3">
                                <div className="font-semibold">
                                    {m.delta > 0 ? `+${m.delta}` : m.delta} · {m.item_name}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {new Date(m.created_at).toLocaleString("es-MX")} · {m.user_name}
                                    {m.reason ? ` · ${m.reason}` : ""}
                                </div>
                            </div>
                        ))}
                    </div>
                    {totalPaginasMovs > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <button
                                onClick={() => setPaginaMovs(p => Math.max(1, p - 1))}
                                disabled={paginaMovs === 1}
                                className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-gray-600">
                                Página {paginaMovs} de {totalPaginasMovs} ({movsFiltrados.length} movimientos)
                            </span>
                            <button
                                onClick={() => setPaginaMovs(p => Math.min(totalPaginasMovs, p + 1))}
                                disabled={paginaMovs === totalPaginasMovs}
                                className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}

            {modalItem && (
                <MovimientoModal
                    item={modalItem}
                    onClose={() => setModalItem(null)}
                    onConfirm={registrarMovimiento}
                />
            )}

            {mostrarModalTrabajo && (
                <NuevoTrabajoModal
                    items={items}
                    onClose={() => setMostrarModalTrabajo(false)}
                    onConfirm={crearTrabajo}
                />
            )}

            {mostrarModalFresar && trabajoParaFresar && (
                <ModalFresar
                    trabajo={trabajoParaFresar}
                    items={items.filter(item => item.category === "bloc")}
                    onClose={() => {
                        setMostrarModalFresar(false);
                        setTrabajoParaFresar(null);
                    }}
                    onConfirm={confirmarFresado}
                />
            )}

            {mostrarModalAditamento && trabajoParaAditamento && (
                <ModalAditamento
                    trabajo={trabajoParaAditamento}
                    items={items.filter(item => item.category === "other" || item.name.toLowerCase().includes("aditamento"))}
                    onClose={() => {
                        setMostrarModalAditamento(false);
                        setTrabajoParaAditamento(null);
                    }}
                    onConfirm={confirmarAditamento}
                />
            )}

            {mostrarModalReporte && trabajoParaReporte && (
                <ModalReporte
                    trabajo={trabajoParaReporte}
                    onClose={() => {
                        setMostrarModalReporte(false);
                        setTrabajoParaReporte(null);
                    }}
                    onConfirm={confirmarReporte}
                />
            )}

            {mostrarModalCalendario && (
                <ModalCalendario
                    trabajos={trabajosCalendario}
                    cargando={cargandoCalendario}
                    onClose={() => setMostrarModalCalendario(false)}
                    obtenerNombreTratamiento={obtenerNombreTratamiento}
                />
            )}

            <h2 className="text-lg font-semibold mt-10">Historial de errores y fallas</h2>
            <p className="text-sm text-gray-600 mt-1 mb-3">
                Reportes de errores y fallas en los trabajos.
            </p>

            {cargandoReportes ? (
                <div className="text-gray-600 mt-3">Cargando reportes…</div>
            ) : reportes.length === 0 ? (
                <div className="text-gray-500 text-sm mt-3">No hay reportes.</div>
            ) : (
                <>
                    <div className="grid gap-2 mt-3">
                        {reportes.slice((paginaReportes - 1) * itemsPorPagina, paginaReportes * itemsPorPagina).map((reporte) => (
                            <div key={reporte.id} className="border rounded p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                                        reporte.report_type === "error" 
                                            ? "bg-red-100 text-red-800" 
                                            : "bg-red-100 text-red-800"
                                    }`}>
                                        {reporte.report_type === "error" ? "ERROR" : "FALLA"}
                                    </span>
                                    {reporte.job_info && (
                                        <span className="text-sm font-medium">
                                            {reporte.job_info.treatment_name} - {reporte.job_info.patient_name}
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-700 mb-2">
                                    {reporte.description}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Reportado por {reporte.reported_by_name} · {new Date(reporte.created_at).toLocaleString("es-MX")}
                                </div>
                            </div>
                        ))}
                    </div>
                    {Math.ceil(reportes.length / itemsPorPagina) > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <button
                                onClick={() => setPaginaReportes(p => Math.max(1, p - 1))}
                                disabled={paginaReportes === 1}
                                className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-gray-600">
                                Página {paginaReportes} de {Math.ceil(reportes.length / itemsPorPagina)} ({reportes.length} reportes)
                            </span>
                            <button
                                onClick={() => setPaginaReportes(p => Math.min(Math.ceil(reportes.length / itemsPorPagina), p + 1))}
                                disabled={paginaReportes === Math.ceil(reportes.length / itemsPorPagina)}
                                className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// Componente Modal para Calendario
function ModalCalendario({ trabajos, cargando, onClose, obtenerNombreTratamiento }) {
    const [mesActual, setMesActual] = useState(new Date().getMonth());
    const [añoActual, setAñoActual] = useState(new Date().getFullYear());
    const [fechaSeleccionada, setFechaSeleccionada] = useState(null);

    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    // Obtener primer día del mes y cantidad de días
    const primerDia = new Date(añoActual, mesActual, 1);
    const ultimoDia = new Date(añoActual, mesActual + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaInicioSemana = primerDia.getDay();

    // Agrupar trabajos por fecha
    const trabajosPorFecha = useMemo(() => {
        const mapa = new Map();
        trabajos.forEach(t => {
            if (t.fechaRelevante) {
                const fechaKey = t.fechaRelevante.toISOString().split('T')[0];
                if (!mapa.has(fechaKey)) {
                    mapa.set(fechaKey, []);
                }
                mapa.get(fechaKey).push(t);
            }
        });
        return mapa;
    }, [trabajos]);

    // Obtener trabajos del día seleccionado
    const trabajosDiaSeleccionado = fechaSeleccionada 
        ? trabajosPorFecha.get(fechaSeleccionada) || []
        : [];

    function cambiarMes(delta) {
        let nuevoMes = mesActual + delta;
        let nuevoAño = añoActual;
        
        if (nuevoMes < 0) {
            nuevoMes = 11;
            nuevoAño--;
        } else if (nuevoMes > 11) {
            nuevoMes = 0;
            nuevoAño++;
        }
        
        setMesActual(nuevoMes);
        setAñoActual(nuevoAño);
        setFechaSeleccionada(null);
    }

    function obtenerFechaKey(dia) {
        const fecha = new Date(añoActual, mesActual, dia);
        return fecha.toISOString().split('T')[0];
    }

    function esHoy(dia) {
        const hoy = new Date();
        return dia === hoy.getDate() && 
               mesActual === hoy.getMonth() && 
               añoActual === hoy.getFullYear();
    }

    function tieneTrabajos(dia) {
        const fechaKey = obtenerFechaKey(dia);
        return trabajosPorFecha.has(fechaKey);
    }

    function seleccionarFecha(dia) {
        const fechaKey = obtenerFechaKey(dia);
        setFechaSeleccionada(fechaSeleccionada === fechaKey ? null : fechaKey);
    }

    // Crear array de días del mes
    const dias = [];
    for (let i = 0; i < diaInicioSemana; i++) {
        dias.push(null); // Días vacíos al inicio
    }
    for (let dia = 1; dia <= diasEnMes; dia++) {
        dias.push(dia);
    }

    return (
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
                    <h3 className="text-xl font-bold">Calendario de Trabajos</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {cargando ? (
                        <div className="text-center py-8 text-gray-600">Cargando trabajos...</div>
                    ) : (
                        <>
                            {/* Controles del calendario */}
                            <div className="flex items-center justify-between mb-6">
                                <button
                                    onClick={() => cambiarMes(-1)}
                                    className="p-2 hover:bg-gray-100 rounded"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h4 className="text-lg font-semibold">
                                    {meses[mesActual]} {añoActual}
                                </h4>
                                <button
                                    onClick={() => cambiarMes(1)}
                                    className="p-2 hover:bg-gray-100 rounded"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Calendario */}
                            <div className="grid grid-cols-7 gap-1 mb-6">
                                {diasSemana.map(dia => (
                                    <div key={dia} className="text-center text-sm font-medium text-gray-600 py-2">
                                        {dia}
                                    </div>
                                ))}
                                {dias.map((dia, idx) => {
                                    if (dia === null) {
                                        return <div key={`empty-${idx}`} className="aspect-square" />;
                                    }
                                    
                                    const fechaKey = obtenerFechaKey(dia);
                                    const tieneTrab = tieneTrabajos(dia);
                                    const esHoyDia = esHoy(dia);
                                    const estaSeleccionado = fechaSeleccionada === fechaKey;
                                    
                                    return (
                                        <button
                                            key={dia}
                                            onClick={() => seleccionarFecha(dia)}
                                            className={`aspect-square border rounded p-1 text-sm transition-colors ${
                                                esHoyDia 
                                                    ? "bg-blue-100 border-blue-500 font-bold" 
                                                    : estaSeleccionado
                                                        ? "bg-blue-200 border-blue-600"
                                                        : tieneTrab
                                                            ? "bg-orange-50 border-orange-300 hover:bg-orange-100"
                                                            : "hover:bg-gray-50"
                                            }`}
                                        >
                                            <div className="flex flex-col items-center justify-center h-full">
                                                <span>{dia}</span>
                                                {tieneTrab && (
                                                    <span className="text-xs mt-1">
                                                        <span className="inline-block w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Trabajos del día seleccionado */}
                            {fechaSeleccionada && (
                                <div className="border-t pt-4">
                                    <h5 className="font-semibold mb-3">
                                        Trabajos del {new Date(fechaSeleccionada + "T00:00:00").toLocaleDateString("es-MX", { 
                                            weekday: "long", 
                                            year: "numeric", 
                                            month: "long", 
                                            day: "numeric" 
                                        })}
                                    </h5>
                                    {trabajosDiaSeleccionado.length === 0 ? (
                                        <p className="text-gray-500 text-sm">No hay trabajos en esta fecha.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {trabajosDiaSeleccionado.map(trabajo => (
                                                <div 
                                                    key={trabajo.id} 
                                                    className={`border rounded p-3 ${
                                                        trabajo.tipoFecha === "finalizado" 
                                                            ? "bg-green-50 border-green-200" 
                                                            : "bg-orange-50 border-orange-200"
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-xs px-2 py-1 rounded font-medium ${
                                                                    trabajo.tipoFecha === "finalizado"
                                                                        ? "bg-green-200 text-green-800"
                                                                        : "bg-orange-200 text-orange-800"
                                                                }`}>
                                                                    {trabajo.tipoFecha === "finalizado" ? "Finalizado" : "Pendiente"}
                                                                </span>
                                                                <span className="font-semibold">
                                                                    {trabajo.treatment_name_display} - {trabajo.patient_name}
                                                                </span>
                                                            </div>
                                                            {trabajo.pieza && (
                                                                <div className="text-sm text-gray-600">
                                                                    Pieza: {trabajo.pieza}
                                                                </div>
                                                            )}
                                                            {trabajo.doctor && (
                                                                <div className="text-sm text-gray-600">
                                                                    Doctor: {trabajo.doctor}
                                                                </div>
                                                            )}
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {trabajo.tipoFecha === "finalizado" 
                                                                    ? `Finalizado el ${new Date(trabajo.completed_at).toLocaleString("es-MX")}`
                                                                    : `Fecha esperada: ${new Date(trabajo.fecha_espera + "T00:00:00").toLocaleDateString("es-MX")}`
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {!fechaSeleccionada && (
                                <div className="text-center text-gray-500 text-sm py-4">
                                    Selecciona una fecha para ver los trabajos
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Componente Modal para Reporte
function ModalReporte({ trabajo, onClose, onConfirm }) {
    const [tipoReporte, setTipoReporte] = useState(""); // "error" o "falla"
    const [descripcion, setDescripcion] = useState("");
    const [error, setError] = useState("");

    function validarYConfirmar() {
        setError("");

        if (!tipoReporte) {
            setError("Debes seleccionar el tipo de reporte (Error o Falla).");
            return;
        }

        if (!descripcion.trim()) {
            setError("Debes escribir una descripción del problema.");
            return;
        }

        onConfirm(tipoReporte, descripcion);
    }

    return (
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold mb-4">Reportar - {trabajo.patient_name}</h3>

                {error && <div className="text-red-600 mb-4 text-sm">{error}</div>}

                <div className="mb-4">
                    <label className="text-sm font-medium block mb-2">
                        Tipo de reporte:
                    </label>
                    <div className="space-y-2">
                        <label className="flex items-start gap-2 cursor-pointer p-3 border rounded hover:bg-gray-50">
                            <input
                                type="radio"
                                name="tipoReporte"
                                value="error"
                                checked={tipoReporte === "error"}
                                onChange={(e) => setTipoReporte(e.target.value)}
                                className="mt-1"
                            />
                            <div>
                                <div className="font-medium">Error</div>
                                <div className="text-xs text-gray-600">
                                    Algo no tan grave que necesita atención pero no requiere volver a hacer el trabajo.
                                </div>
                            </div>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer p-3 border rounded hover:bg-gray-50">
                            <input
                                type="radio"
                                name="tipoReporte"
                                value="falla"
                                checked={tipoReporte === "falla"}
                                onChange={(e) => setTipoReporte(e.target.value)}
                                className="mt-1"
                            />
                            <div>
                                <div className="font-medium">Falla</div>
                                <div className="text-xs text-gray-600">
                                    El trabajo falló y se tiene que volver a hacer completamente.
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="text-sm font-medium block mb-2">
                        Descripción del problema:
                    </label>
                    <textarea
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Describe qué pasó..."
                        className="border rounded p-2 w-full h-32 resize-none"
                    />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="border px-4 py-2 rounded hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button
                        onClick={validarYConfirmar}
                        className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                    >
                        Confirmar reporte
                    </button>
                </div>
            </div>
        </div>
    );
}

// Componente Modal para Aditamento
function ModalAditamento({ trabajo, items, onClose, onConfirm }) {
    const [materialesSeleccionados, setMaterialesSeleccionados] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [error, setError] = useState("");

    const itemsFiltrados = items.filter(item => 
        !busqueda.trim() || item.name.toLowerCase().includes(busqueda.trim().toLowerCase())
    );

    function agregarMaterial(item) {
        const existente = materialesSeleccionados.find(m => m.item_id === item.id);
        if (existente) {
            setMaterialesSeleccionados(
                materialesSeleccionados.map(m =>
                    m.item_id === item.id
                        ? { ...m, quantity: m.quantity + 1 }
                        : m
                )
            );
        } else {
            setMaterialesSeleccionados([
                ...materialesSeleccionados,
                { item_id: item.id, item_name: item.name, quantity: 1 }
            ]);
        }
    }

    function quitarMaterial(itemId) {
        setMaterialesSeleccionados(
            materialesSeleccionados.filter(m => m.item_id !== itemId)
        );
    }

    function ajustarCantidad(itemId, delta) {
        setMaterialesSeleccionados(
            materialesSeleccionados.map(m => {
                if (m.item_id === itemId) {
                    const nuevaCantidad = Math.max(0, m.quantity + delta);
                    if (nuevaCantidad === 0) {
                        return null;
                    }
                    return { ...m, quantity: nuevaCantidad };
                }
                return m;
            }).filter(Boolean)
        );
    }

    function validarYConfirmar() {
        setError("");

        if (materialesSeleccionados.length === 0) {
            setError("Debes seleccionar al menos un aditamento.");
            return;
        }

        // Validar stock
        for (const material of materialesSeleccionados) {
            const item = items.find(i => i.id === material.item_id);
            if (!item) {
                setError(`El artículo ${material.item_name} no se encuentra disponible.`);
                return;
            }
            if (item.current_qty < material.quantity) {
                setError(`Stock insuficiente para ${material.item_name}. Disponible: ${item.current_qty}`);
                return;
            }
        }

        onConfirm(materialesSeleccionados);
    }

    return (
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold mb-4">Aditamento - {trabajo.patient_name}</h3>

                {error && <div className="text-red-600 mb-4 text-sm">{error}</div>}

                <div className="mb-4">
                    <label className="text-sm font-medium block mb-2">
                        Seleccionar aditamento
                    </label>
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar aditamentos..."
                        className="border rounded p-2 w-full mb-3"
                    />

                    <div className="border rounded p-3 space-y-2 max-h-60 overflow-y-auto">
                        {itemsFiltrados.length === 0 ? (
                            <p className="text-sm text-gray-500">No hay aditamentos disponibles.</p>
                        ) : (
                            itemsFiltrados.map(item => {
                                const materialSeleccionado = materialesSeleccionados.find(m => m.item_id === item.id);
                                
                                return (
                                    <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{item.name}</div>
                                            <div className="text-xs text-gray-600">
                                                Stock: {item.current_qty} {item.unit}
                                            </div>
                                        </div>
                                        {materialSeleccionado ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => ajustarCantidad(item.id, -1)}
                                                    className="w-6 h-6 rounded border flex items-center justify-center"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center text-sm">{materialSeleccionado.quantity}</span>
                                                <button
                                                    onClick={() => ajustarCantidad(item.id, 1)}
                                                    disabled={item.current_qty <= materialSeleccionado.quantity}
                                                    className="w-6 h-6 rounded border flex items-center justify-center disabled:opacity-50"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => quitarMaterial(item.id)}
                                                    className="text-red-600 text-xs ml-2"
                                                >
                                                    Quitar
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => agregarMaterial(item)}
                                                className="text-sm border px-2 py-1 rounded hover:bg-gray-50"
                                            >
                                                Agregar
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {materialesSeleccionados.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                            <div className="text-sm font-medium mb-2">Aditamentos seleccionados:</div>
                            <div className="space-y-1">
                                {materialesSeleccionados.map(m => (
                                    <div key={m.item_id} className="text-sm">
                                        {m.item_name} × {m.quantity}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="border px-4 py-2 rounded hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button
                        onClick={validarYConfirmar}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                    >
                        Confirmar aditamento
                    </button>
                </div>
            </div>
        </div>
    );
}

// Componente Modal para Fresar
function ModalFresar({ trabajo, items, onClose, onConfirm }) {
    const [materialesSeleccionados, setMaterialesSeleccionados] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [error, setError] = useState("");

    const itemsFiltrados = items.filter(item => 
        !busqueda.trim() || item.name.toLowerCase().includes(busqueda.trim().toLowerCase())
    );

    function agregarMaterial(item) {
        const existente = materialesSeleccionados.find(m => m.item_id === item.id);
        if (existente) {
            setMaterialesSeleccionados(
                materialesSeleccionados.map(m =>
                    m.item_id === item.id
                        ? { ...m, quantity: m.quantity + 1 }
                        : m
                )
            );
        } else {
            setMaterialesSeleccionados([
                ...materialesSeleccionados,
                { item_id: item.id, item_name: item.name, quantity: 1 }
            ]);
        }
    }

    function quitarMaterial(itemId) {
        setMaterialesSeleccionados(
            materialesSeleccionados.filter(m => m.item_id !== itemId)
        );
    }

    function ajustarCantidad(itemId, delta) {
        setMaterialesSeleccionados(
            materialesSeleccionados.map(m => {
                if (m.item_id === itemId) {
                    const nuevaCantidad = Math.max(0, m.quantity + delta);
                    if (nuevaCantidad === 0) {
                        return null;
                    }
                    return { ...m, quantity: nuevaCantidad };
                }
                return m;
            }).filter(Boolean)
        );
    }

    function validarYConfirmar() {
        setError("");

        if (materialesSeleccionados.length === 0) {
            setError("Debes seleccionar al menos un cubo para fresar.");
            return;
        }

        // Validar stock
        for (const material of materialesSeleccionados) {
            const item = items.find(i => i.id === material.item_id);
            if (!item) {
                setError(`El artículo ${material.item_name} no se encuentra disponible.`);
                return;
            }
            if (item.current_qty < material.quantity) {
                setError(`Stock insuficiente para ${material.item_name}. Disponible: ${item.current_qty}`);
                return;
            }
        }

        onConfirm(materialesSeleccionados);
    }

    return (
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold mb-4">Fresar - {trabajo.patient_name}</h3>

                {error && <div className="text-red-600 mb-4 text-sm">{error}</div>}

                <div className="mb-4">
                    <label className="text-sm font-medium block mb-2">
                        Seleccionar cubos para fresar
                    </label>
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar cubos..."
                        className="border rounded p-2 w-full mb-3"
                    />

                    <div className="border rounded p-3 space-y-2 max-h-60 overflow-y-auto">
                        {itemsFiltrados.length === 0 ? (
                            <p className="text-sm text-gray-500">No hay cubos disponibles.</p>
                        ) : (
                            itemsFiltrados.map(item => {
                                const materialSeleccionado = materialesSeleccionados.find(m => m.item_id === item.id);
                                
                                return (
                                    <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{item.name}</div>
                                            <div className="text-xs text-gray-600">
                                                Stock: {item.current_qty} {item.unit}
                                            </div>
                                        </div>
                                        {materialSeleccionado ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => ajustarCantidad(item.id, -1)}
                                                    className="w-6 h-6 rounded border flex items-center justify-center"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center text-sm">{materialSeleccionado.quantity}</span>
                                                <button
                                                    onClick={() => ajustarCantidad(item.id, 1)}
                                                    disabled={item.current_qty <= materialSeleccionado.quantity}
                                                    className="w-6 h-6 rounded border flex items-center justify-center disabled:opacity-50"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => quitarMaterial(item.id)}
                                                    className="text-red-600 text-xs ml-2"
                                                >
                                                    Quitar
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => agregarMaterial(item)}
                                                className="text-sm border px-2 py-1 rounded hover:bg-gray-50"
                                            >
                                                Agregar
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {materialesSeleccionados.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                            <div className="text-sm font-medium mb-2">Cubos seleccionados:</div>
                            <div className="space-y-1">
                                {materialesSeleccionados.map(m => (
                                    <div key={m.item_id} className="text-sm">
                                        {m.item_name} × {m.quantity}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="border px-4 py-2 rounded hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button
                        onClick={validarYConfirmar}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Confirmar fresado
                    </button>
                </div>
            </div>
        </div>
    );
}
