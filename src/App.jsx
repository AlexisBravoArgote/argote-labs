import { Routes, Route } from "react-router-dom";
import CerecApp from "./cerec/CerecApp";


import React, { useMemo, useState } from "react";
import LabImage from "./assets/lab.jpg";
import guadalajara from "./assets/guadalajara.jpg"
import science from "./assets/science.jpg"
import ubicacion from "./assets/ubicacion.jpg"
import pastillas from "./assets/pastillas.png"

export default function App() {
    return (
        <Routes>
            <Route path="/cerec/*" element={<CerecApp />} />
            <Route path="/*" element={<LandingArgote />} />
        </Routes>
    );
}

// Simple in-app image library (royalty-free Unsplash/OG sources)
const IMG = {
   
    dental:
        "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=1600&auto=format&fit=crop",
    
};

const jobs = [
    {
        id: "Quimico computacional",
        title: "Químico Computacional",
        location: "Guadalajara, Jalisco (Híbrido)",
        type: "Tiempo completo",
        intro:
            "Únete para diseñar, priorizar y optimizar moléculas/ingredientes activos con modelado molecular y métodos de predicción.",
        requirements: [
            "Maestría/PhD en Química, Química Computacional, Bioquímica o afín",
            "Experiencia con docking molecular (p.ej., AutoDock, Glide) y dinámica molecular (GROMACS/AMBER)",
            "QSAR/QSPR, ADME/Tox in‑silico, y manejo de bases de datos químicas (ChEMBL, PubChem)",
            "Programación en Python o R (RDKit, scikit‑learn)",
            "Inglés técnico; deseable experiencia en productos de cuidado personal o farmacéuticos",
        ],
        bonus: [
            "Experiencia con diseño de formulaciones asistido por modelos (DoE)",
            "Conocimiento de normativas COFEPRIS para OTC y cosméticos",
        ],
    },
    {
        id: "Quimico formulador",
        title: "Químico Formulador",
        location: "Guadalajara, Jalisco (Presencial)",
        type: "Tiempo completo",
        intro:
            "Lidera el desarrollo de pasta dental y otras formulaciones de cuidado de la salud desde laboratorio hasta piloto.",
        requirements: [
            "Lic./Ing. en Química, QFB, IQ o afín",
            "2+ años formulando dentífricos, enjuagues, tópicos o cosméticos",
            "Experiencia con abrasivos, humectantes, fluoruración, y compatibilidad con activos",
            "Pruebas de estabilidad (ICH), viscosidad/reología y control de calidad",
            "Buenas Prácticas de Manufactura; documentación técnica (PNT, BPR)",
        ],
        bonus: [
            "Escalamiento y transferencia a manufactura",
            "Conocimiento de empaques y compatibilidad",
        ],
    },
];

const Section = ({ id, children, className = "" }) => (
    <section id={id} className={`py-20 px-4 sm:px-8 ${className}`}>{children}</section>
);

const Pill = ({ children }) => (
    <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm/6 font-medium shadow-sm">
        {children}
    </span>
);

const Stat = ({ label, value }) => (
    <div className="rounded-2xl bg-white/60 backdrop-blur p-6 text-center shadow">
        <div className="text-3xl font-bold">{value}</div>
        <div className="mt-1 text-sm text-gray-600">{label}</div>
    </div>
);

const JobCard = ({ job, onApply }) => (
    <div className="rounded-2xl border bg-white p-6 shadow hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between gap-4">
            <div>
                <h3 className="text-xl font-semibold">{job.title}</h3>
                <p className="mt-1 text-gray-600">{job.location} · {job.type}</p>
            </div>
            <Pill>Bolsa de trabajo</Pill>
        </div>
        <p className="mt-4">{job.intro}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
                <h4 className="font-semibold">Requisitos</h4>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                    {job.requirements.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
            </div>
            <div>
                <h4 className="font-semibold">Deseables</h4>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                    {job.bonus.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
            </div>
        </div>
        <div className="mt-6 flex gap-3">
            <button
                onClick={() => onApply(job)}
                className="rounded-xl bg-black text-white px-5 py-2.5 font-medium shadow hover:opacity-90"
            >
                Aplicar
            </button>
            <a
                href={`mailto:careers@argotelabs.mx?subject=Consulta%20–%20${encodeURIComponent(job.title)}&body=Hola%20Argote%20Labs%2C%0A%0AAdjunto%20mi%20CV%20para%20postularme%20a%3A%20${encodeURIComponent(job.title)}.%0A%0ASaludos.`}
                className="rounded-xl border px-5 py-2.5 font-medium hover:bg-gray-50"
            >
                Enviar CV por correo
            </a>
        </div>
    </div>
);

function LandingArgote() {
    const [search, setSearch] = useState("");
    const filteredJobs = useMemo(
        () => jobs.filter(j => j.title.toLowerCase().includes(search.toLowerCase())),
        [search]
    );

    const onApply = (job) => {
        const url = `mailto:careers@argotelabs.mx?subject=Postulaci%C3%B3n%20–%20${encodeURIComponent(job.title)}&body=Hola%20Argote%20Labs%2C%0A%0AMi%20nombre%20es%20[tu%20nombre]%20y%20me%20postulo%20a%20${encodeURIComponent(job.title)}.%0A%0ALink%20a%20CV%3A%20%5Bagrega%5D%0A%0A%C2%A1Gracias!`;
        window.location.href = url;
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
            {/* Nav */}
            <header className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b">
                <div className="mx-auto max-w-7xl flex items-center justify-between p-4">
                    <a href="#top" className="text-xl font-bold">Argote Labs</a>
                    <nav className="hidden md:flex gap-6 text-sm">
                        <a href="#mission" className="hover:opacity-80">Misión</a>
                        <a href="#productos" className="hover:opacity-80">Productos</a>
                        <a href="#projects" className="hover:opacity-80">Proyectos</a>
                        <a href="#careers" className="hover:opacity-80">Bolsa de trabajo</a>
                        <a href="#contact" className="hover:opacity-80">Contacto</a>
                    </nav>
                    <a href="#careers" className="rounded-full bg-black text-white px-4 py-2 text-sm shadow">¡Estamos contratando!</a>
                </div>
            </header>

            {/* Hero */}
            <div id="top" className="relative">
                <img src={LabImage} alt="Laboratory" className="h-[56vh] w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
                <div className="absolute inset-0 flex items-center">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="max-w-2xl text-white">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm backdrop-blur">
                                <span>Guadalajara, Jalisco</span>
                                <span className="opacity-80">•</span>
                                <span>Biotecnología aplicada</span>
                            </div>
                            <h1 className="mt-4 text-4xl sm:text-5xl font-bold leading-tight">
                                Argote Labs — Innovación en Biotecnología desde Guadalajara
                            </h1>
                            <p className="mt-4 text-lg text-white/90">
                                Transformamos ideas científicas en productos reales: software de salud, formulaciones dentales y plataformas para pacientes.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <a href="#productos" className="rounded-xl bg-white text-black px-5 py-2.5 font-medium shadow">Ver productos</a>
                                <a href="#careers" className="rounded-xl border border-white/70 text-white px-5 py-2.5 font-medium">Unirte al equipo</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mission */}
            <Section id="mission" className="bg-white">
                <div className="mx-auto max-w-7xl grid gap-10 md:grid-cols-2 items-center">
                    <div>
                        <h2 className="text-3xl font-bold">Nuestra misión</h2>
                        <p className="mt-4 text-lg">
                            <strong>Revolucionar la atención médica en México</strong> mediante biotecnología, datos y diseño de productos centrados en el paciente. Nuestro objetivo es mejorar la
                            adherencia terapéutica, la prevención y el acceso a tratamientos de calidad a través de herramientas digitales y productos físicos con respaldo científico.
                        </p>
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <Stat label="Base en Guadalajara" value="MX • GDL" />
                            <Stat label="Áreas" value="Software + Formulaciones" />
                        </div>
                    </div>
                    <div className="relative">
                        <img src={guadalajara} alt="Guadalajara skyline" className="rounded-3xl shadow-lg object-cover w-full h-80" />
                        <div className="absolute -bottom-4 -right-4 hidden md:block">
                            <img src={science} alt="Laboratorio" className="w-40 h-40 rounded-2xl object-cover shadow-xl border-4 border-white" />
                        </div>
                    </div>
                </div>
            </Section>

            {/* Productos */}
            <Section id="productos">
                <div className="mx-auto max-w-7xl">
                    <h2 className="text-3xl font-bold">Productos</h2>
                    <div className="mt-6 grid gap-8 md:grid-cols-2">
                        <div className="rounded-2xl border bg-white p-6 shadow">
                            <div className="flex items-center gap-3">
                                <img src={pastillas} alt="Pastillas.app" className="h-14 w-14 rounded-xl object-cover" />
                                <div>
                                    <h3 className="text-xl font-semibold">pastillas.app</h3>
                                    <p className="text-sm text-gray-600">Plataforma educativa y de recordatorios para medicamentos en México.</p>
                                </div>
                            </div>
                            <p className="mt-4 text-gray-800">
                                Fichas técnicas, alarmas de toma, guardado de recetas y verificación básica de interacciones, todo pensado para pacientes en México.
                            </p>
                            <div className="mt-4 flex gap-3">
                                <a href="https://pastillas.app" target="_blank" rel="noreferrer" className="rounded-xl bg-black text-white px-5 py-2.5 font-medium">Abrir pastillas.app</a>
                            </div>
                        </div>
                        <div className="rounded-2xl border bg-white p-6 shadow">
                            <div className="flex items-center gap-3">
                                <img src={IMG.dental} alt="Proyecto dental" className="h-14 w-14 rounded-xl object-cover" />
                                <div>
                                    <h3 className="text-xl font-semibold">Pasta dental (en desarrollo)</h3>
                                    <p className="text-sm text-gray-600">Colaboración con Dental City (Zapopan/Guadalajara).</p>
                                </div>
                            </div>
                            <p className="mt-4 text-gray-800">
                                Desarrollo de dentífrico con enfoque en eficacia, seguridad y experiencia del usuario, apoyado por validación de estabilidad y compatibilidad de activos.
                            </p>
                            <div className="mt-4 flex gap-3">
                                <a href="https://www.dentalcity.mx/" target="_blank" rel="noreferrer" className="rounded-xl border px-5 py-2.5 font-medium hover:bg-gray-50">Conocer a Dental City</a>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Projects / R&D */}
            <Section id="projects" className="bg-white">
                <div className="mx-auto max-w-7xl">
                    <h2 className="text-3xl font-bold">I+D y pipeline</h2>
                    <div className="mt-6 grid gap-6 md:grid-cols-3">
                        {[{
                            title: "Modelado molecular para cuidado bucal",
                            text: "Uso de QSAR/Docking para priorización de ingredientes, optimización de compatibilidad y predicción de desempeño.",
                        }, {
                            title: "Formulación de pasta dental",
                            text: "Exploración de sistemas fluorados, abrasivos controlados y perfiles sensoriales con pruebas de estabilidad ICH.",
                        }, {
                            title: "Plataformas de adherencia",
                            text: "Integración de recordatorios, educación y seguimiento básico para mejorar resultados en tratamientos.",
                        }].map((c, i) => (
                            <div key={i} className="rounded-2xl border p-6 shadow bg-gradient-to-br from-white to-slate-50">
                                <h3 className="text-lg font-semibold">{c.title}</h3>
                                <p className="mt-2 text-gray-700">{c.text}</p>
                                
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* Careers */}
            <Section id="careers">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-3xl font-bold">Bolsa de trabajo</h2>
                            <p className="mt-2 text-gray-700">Buscamos talento que combine ciencia, diseño y ejecución.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                className="rounded-xl border px-4 py-2 shadow-sm w-72"
                                placeholder="Buscar puesto (ej. químico)"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        {filteredJobs.map(job => (
                            <JobCard key={job.id} job={job} onApply={onApply} />
                        ))}
                    </div>
                    <div className="mt-8 text-sm text-gray-600">
                        ¿No ves un rol para ti? Escríbenos a <a className="underline" href="mailto:careers@argotelabs.mx">careers@argotelabs.mx</a>.
                    </div>
                </div>
            </Section>

            {/* Contact */}
            <Section id="contact" className="bg-white">
                <div className="mx-auto max-w-7xl grid gap-8 md:grid-cols-2">
                    <div>
                        <h2 className="text-3xl font-bold">Contacto</h2>
                        <p className="mt-3 text-gray-700">¿Tienes una propuesta, alianza o deseas distribuir nuestros productos?</p>
                        <form
                            className="mt-6 grid gap-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const data = new FormData(e.currentTarget);
                                const subject = `Contacto – ${data.get("name")}`;
                                const body = `Nombre: ${data.get("name")}\nEmpresa: ${data.get("company")}\nEmail: ${data.get("email")}\n\nMensaje:\n${data.get("message")}`;
                                window.location.href = `mailto:hola@argotelabs.mx?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                            }}
                        >
                            <input name="name" required placeholder="Nombre" className="rounded-xl border px-4 py-3 shadow-sm" />
                            <input name="company" placeholder="Empresa (opcional)" className="rounded-xl border px-4 py-3 shadow-sm" />
                            <input name="email" type="email" required placeholder="Email" className="rounded-xl border px-4 py-3 shadow-sm" />
                            <textarea name="message" required placeholder="Mensaje" rows={5} className="rounded-xl border px-4 py-3 shadow-sm" />
                            <button className="rounded-xl bg-black text-white px-5 py-3 font-medium shadow hover:opacity-90">Enviar</button>
                        </form>
                    </div>
                    <div>
                        <div className="rounded-3xl overflow-hidden shadow">
                            <img src={ubicacion} alt="ubicacion" className="h-72 w-full object-cover" />
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                            <div className="rounded-2xl bg-white p-4 shadow">
                                <div className="font-semibold">Base</div>
                                <div className="text-gray-700">Guadalajara, Jalisco, México</div>
                            </div>
                            <div className="rounded-2xl bg-white p-4 shadow">
                                <div className="font-semibold">Socio clínico</div>
                                <div className="text-gray-700">Dental City (Zapopan)</div>
                                <a className="underline text-sm" href="https://www.dentalcity.mx/" target="_blank" rel="noreferrer">Sitio oficial</a>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Footer */}
            <footer className="border-t">
                <div className="mx-auto max-w-7xl p-6 text-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="opacity-80">© {new Date().getFullYear()} Argote Labs · Guadalajara, Jal.</div>
                    <div className="flex flex-wrap gap-4">
                        <a href="#mission" className="hover:opacity-80">Misión</a>
                        <a href="#productos" className="hover:opacity-80">Producto</a>
                        <a href="#projects" className="hover:opacity-80">I+D</a>
                        <a href="#careers" className="hover:opacity-80">Empleos</a>
                        <a href="#contact" className="hover:opacity-80">Contacto</a>
                    </div>
                </div>
            </footer>
        </div>
    );

  

}
