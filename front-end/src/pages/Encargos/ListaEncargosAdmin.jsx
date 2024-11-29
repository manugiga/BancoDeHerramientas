import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import useGetData from '@/hooks/useGetData';
import Swal from 'sweetalert2';
import axiosInstance from '@/helpers/axiosConfig';
import ListComponent from '@/components/listas/ListComponent';

const ListaEncargosAdmin = () => {
    const { data, loading, errorData } = useGetData(['encargos/admin']);
    const { data: dataAceptados, loading: loadingAceptados, error: errorDataAceptados } = useGetData(['encargos/aceptados']);
    const [encargos, setEncargos] = useState([]);
    const [encargosAceptados, setEncargosAceptados] = useState([]);
    const [observaciones, setObservaciones] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        // Procesar encargos pendientes
        if (data['encargos/admin']) {
            const pendingEncargos = data['encargos/admin'].filter(encargo => encargo.estado === 'pendiente');
            setEncargos(pendingEncargos);

            // Inicializar observaciones
            const initialObservaciones = {};
            pendingEncargos.forEach(encargo => {
                const key = `${encargo.encargos_idencargo}_${encargo.elementos_idelemento}`;
                initialObservaciones[key] = encargo.observaciones || '';
            });
            setObservaciones(initialObservaciones);
        }

        // Procesar encargos aceptados
        if (dataAceptados['encargos/aceptados']) {
            setEncargosAceptados(dataAceptados['encargos/aceptados']);
        }
    }, [data, dataAceptados]);

    if (loading || loadingAceptados) return <p>Cargando...</p>;
    if (errorData || errorDataAceptados) return <p>Error: {errorData?.message || errorDataAceptados?.message}</p>;

    const handleAceptar = async (encargo) => {
        const { encargos_idencargo, elementos_idelemento } = encargo;
        const key = `${encargos_idencargo}_${elementos_idelemento}`;
        const observacion = observaciones[key];
    
        try {
            console.log("Intentando aceptar encargo:", encargo); 
            await axiosInstance.post(`${import.meta.env.VITE_API_URL}/encargos/aceptar/${encargos_idencargo}`, {
                elemento: elementos_idelemento,
                observaciones: observacion,
            });
    
            // Actualizar la lista de pendientes (remover el elemento aceptado)
            setEncargos((prev) => {
                console.log("Encargos antes de filtrar:", prev);
                const nuevosEncargos = prev.filter(
                    (e) =>
                        !(
                            e.encargos_idencargo === encargos_idencargo &&
                            e.elementos_idelemento === elementos_idelemento
                        )
                );
                console.log("Encargos después de filtrar:", nuevosEncargos);
                return nuevosEncargos;
            });
    
            // Agregar el encargo a la lista de aceptados si aún no está
            setEncargosAceptados((prev) => {
                const existe = prev.some((e) => e.idencargo === encargos_idencargo);
                console.log("Encargos aceptados antes de agregar:", prev);
                if (existe) return prev; // No agregar duplicados
                const nuevoEncargo = {
                    idencargo: encargos_idencargo,
                    clientes_documento: encargo.Encargo.clientes_documento,
                    Cliente: encargo.Encargo.Cliente,
                    fecha_pedido: encargo.fecha_pedido,
                    fecha_reclamo: encargo.fecha_reclamo,
                    contacto: encargo.Encargo.contacto,
                };
                return [...prev, nuevoEncargo];
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error al aceptar el encargo",
                text: error.response?.data?.mensaje || "Error inesperado",
                confirmButtonColor: "#FC3F3F",
            });
        }
    };    

    const handleCancelAceptar = async (idencargo) => {
        try {
            await axiosInstance.post(`${import.meta.env.VITE_API_URL}/encargos/cancel-aceptar/${idencargo}`, {});
            location.reload();
        } catch (error) {
            const mensaje = error.response?.data?.mensaje || "Error inesperado";
            Swal.fire({
                icon: "error",
                title: mensaje,
                text: "Por favor verifique los datos.",
                confirmButtonColor: '#FC3F3F',
                customClass: {
                    container: 'swal2-container',
                    popup: 'swal2-popup'
                }
            }).then(() => { location.reload(); });
        }
    };

    const handleReject = async (id, elemento) => {
        const key = `${id}_${elemento}`;
        const observacion = observaciones[key]; // Obtén la observación correspondiente
        try {
            await axiosInstance.post(`${import.meta.env.VITE_API_URL}/encargos/rechazar/${id}`, { elemento, observaciones: observacion });
            setEncargos(prevEncargos => prevEncargos.filter(encargo => !(encargo.encargos_idencargo === id && encargo.elementos_idelemento === elemento)));
        } catch (error) {
            const mensaje = error.response?.data?.mensaje || "Error inesperado";
            Swal.fire({
                icon: "error",
                title: mensaje,
                text: "Por favor verifique los datos.",
                confirmButtonColor: '#FC3F3F',
                customClass: {
                    container: 'swal2-container',
                    popup: 'swal2-popup'
                }
            }).then(() => { location.reload(); });
        }
    };

    const renderRow = (encargo) => (
        <tr key={`${encargo.encargos_idencargo}_${encargo.elementos_idelemento}`} className="border-b">
            <td className="px-4 py-2">{encargo.Encargo.clientes_documento}</td>
            <td className="px-4 py-2">{encargo.Encargo.Cliente.nombre}</td>
            <td className="px-4 py-2">{encargo.fecha_pedido}</td>
            <td className="px-4 py-2">{encargo.fecha_reclamo}</td>
            <td className="px-4 py-2">{encargo.Elemento.descripcion}</td>
            <td className="px-4 py-2">{encargo.cantidad}</td>
            <td className="px-4 py-2">
                <textarea 
                    type="text" 
                    value={observaciones[`${encargo.encargos_idencargo}_${encargo.elementos_idelemento}`] || ''} 
                    onChange={(e) => setObservaciones(prev => ({ ...prev, [`${encargo.encargos_idencargo}_${encargo.elementos_idelemento}`]: e.target.value }))}
                />
            </td>
            <td className="px-4 py-2">{encargo.Encargo.contacto}</td>
            <td className="px-4 py-2">
                <button className="bg-black text-white px-2 py-1 rounded-md" onClick={() => handleAceptar(encargo)}>
                    <FaCheck />
                </button>
                <button className="bg-black text-white px-2 py-1 rounded-md" onClick={() => handleReject(encargo.encargos_idencargo, encargo.elementos_idelemento)}>
                    <IoClose />
                </button>
            </td>
        </tr>
    );

    const renderRowAceptados = (encargo) => (
        <tr key={`${encargo.idencargo}_aceptado`} className="border-b">
            <td className="px-4 py-2">{encargo.clientes_documento}</td>
            <td className="px-4 py-2">{encargo.Cliente.nombre}</td>
            <td className="px-4 py-2">{encargo.fecha_pedido}</td>
            <td className="px-4 py-2">{encargo.fecha_reclamo}</td>
            <td className="px-4 py-2">{encargo.contacto}</td>
            <td className="px-4 py-2">
                <button className="bg-black text-white px-2 py-1 rounded-md m-1" onClick={() => navigate(`/encargos/persona/${encargo.idencargo}`, { replace: true })}>
                    Ver
                </button>
                <button className="bg-black text-white px-2 py-1 rounded-md m-1"  onClick={() => handleCancelAceptar(encargo.idencargo)}>
                    <IoClose />
                </button>
            </td>
        </tr>
    );

    return (
        <div>
            <ListComponent
                data={encargos}
                columns={['Documento', 'Nombre', 'Fecha Pedido', 'Fecha Reclamo', 'Elemento', 'Cantidad', 'Observaciones', 'Contacto', '']}
                renderRow={renderRow}
                title="Encargos Pendientes"
            />
            <ListComponent
                data={encargosAceptados}
                columns={['Documento', 'Nombre', 'Fecha Pedido', 'Fecha Reclamo', 'Contacto', '']}
                renderRow={renderRowAceptados}
                title="Encargos Aceptados"
            />
        </div>
    );
};

export default ListaEncargosAdmin;
