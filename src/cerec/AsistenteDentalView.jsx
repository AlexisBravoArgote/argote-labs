import DoctorView from "./DoctorView";

/** Portal igual al del doctor, pero al enviar trabajos debe elegir el doctor del listado CEREC. */
export default function AsistenteDentalView({ user, perfil }) {
    return <DoctorView user={user} perfil={perfil} esAsistenteDental />;
}
