import React, { useState, useEffect } from 'react';
import useGetData from '@/hooks/useGetData';
import Swal from 'sweetalert2';
import axiosInstance from '@/helpers/axiosConfig';
import ListComponent from '@/components/listas/ListComponent';

const ListaEncargosCliente = () => {
    const { data, loading, errorData } = useGetData(['encargos']);
    const [encargos, setEncargos] = useState([]);
    const [EncargosRechazados, setEncargosRechazados] = useState([]); console.log('hola',encargos)

    useEffect(() => {
        if (data?.encargos) {
            setEncargos(data.encargos.filter(encargo => encargo.estado === 'pendiente'));
            setEncargosRechazados(data.encargos.filter(encargo => encargo.estado === 'rechazado'));
        }
    }, [data]);

    if (loading) return <p>Cargando...</p>;
    if (errorData) return <p>Error: {errorData.message}</p>;

    const handleDelete = async (id, elemento) => {
        try {
            await axiosInstance.delete(`${import.meta.env.VITE_API_URL}/encargos/${id}`, { data: { elemento } });
            setEncargos(prevEncargos => {
                return prevEncargos.filter(encargo => 
                    !(encargo.encargos_idencargo === id && encargo.elementos_idelemento === elemento)
                );
            });
            setEncargosRechazados(prevEncargos => {
                return prevEncargos.filter(encargo => 
                    !(encargo.encargos_idencargo === id && encargo.elementos_idelemento === elemento)
                );
            });
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
            }).then(()=> {location.reload();})
        }
    };

    const renderRow = (encargo) => (
        <tr key={encargo.encargos_idencargo} className="border-b">
            <td className="px-4 py-2">{encargo.Elemento.descripcion}</td>
            <td className="px-4 py-2">{encargo.cantidad}</td>
            <td className="px-4 py-2">{encargo.observaciones}</td>
            <td className="px-4 py-2">{encargo.fecha_reclamo}</td>
            <td className="px-4 py-2">{encargo.area_nombre}</td>
            <td className="px-4 py-2"><button className="bg-black text-white px-2 py-1 rounded-md" onClick={() => handleDelete(encargo.encargos_idencargo, encargo.elementos_idelemento)}>Cancelar</button></td>
        </tr>
    );

    const renderRowAceptados = (encargo) => (
        <tr key={encargo.encargos_idencargo} className="border-b">
            <td className="px-4 py-2">{encargo.Elemento.descripcion}</td>
            <td className="px-4 py-2">{encargo.cantidad}</td>
            <td className="px-4 py-2">{encargo.observaciones}</td>
            <td className="px-4 py-2">{encargo.fecha_reclamo}</td>
            <td className="px-4 py-2">{encargo.area_nombre}</td>
        </tr>
    );

    const renderRowRechazados = (encargo) => (
        <tr key={encargo.encargos_idencargo} className="border-b">
            <td className="px-4 py-2">{encargo.Elemento.descripcion}</td>
            <td className="px-4 py-2">{encargo.cantidad}</td>
            <td className="px-4 py-2">{encargo.observaciones}</td>
            <td className="px-4 py-2">{encargo.area_nombre}</td>
            <td className="px-4 py-2"><button className="bg-black text-white px-2 py-1 rounded-md" onClick={() => handleDelete(encargo.encargos_idencargo, encargo.elementos_idelemento)}>Ok</button></td>
        </tr>
    );

    return (
        <div>
            <div>
                <ListComponent
                    data={encargos} 
                    columns={['Elemento', 'Cantidad', 'Observaciones', 'Fecha Reclamo', 'Lugar', '']}
                    renderRow={renderRow}
                    showSearch={false}  
                    title="Encargos Pendientes"
                />
            </div>
            <div>
                <ListComponent
                    data={data?.encargos.filter(encargo => encargo.estado === 'aceptado')}
                    columns={['Elemento', 'Cantidad', 'Observaciones', 'Fecha Reclamo', 'Lugar']}
                    renderRow={renderRowAceptados}
                    showSearch={false}  
                    title="Encargos Aceptados"
                />
            </div>
            <div>
                <ListComponent
                    data={EncargosRechazados}
                    columns={['Elemento', 'Cantidad', 'Observaciones', 'Lugar', '']}
                    renderRow={renderRowRechazados}
                    showSearch={false}   
                    title="Encargos Rechazados"
                />
            </div>
        </div>
    );  
};

export default ListaEncargosCliente;
