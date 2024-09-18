import React, { useState } from 'react';
import useGetData from '@/hooks/useGetData';
import ListComponent from '@/components/listas/ListComponent';

const HistorialMoras = () => {
    const { data } = useGetData(['historial']);
    const filteredData = data?.historial ? data.historial.filter(historial => historial.tipo_entidad === 'mora') : [];

    const columns = ['Código Mora', 'Documento', 'Nombre', 'Elemento', 'Descripcion', 'Cantidad', 'Observaciones', 'Estado', 'Acción', 'Fecha', 'Admin'];

    const renderRow = (historial) => (
        <tr key={historial.id_historial} className="border-b">
            <td className="px-4 py-2">{historial.entidad_id}</td>
            <td className="px-4 py-2">{historial.cliente_id}</td>
            <td className="px-4 py-2">{historial.cliente_nombre}</td>
            <td className="px-4 py-2">{historial.elemento_id}</td>
            <td className="px-4 py-2">{historial.elemento_nombre}</td>
            <td className="px-4 py-2">{historial.cantidad}</td>
            <td className="px-4 py-2">{historial.observaciones}</td>
            <td className="px-4 py-2">{historial.estado}</td>
            <td className="px-4 py-2">{historial.accion}</td>
            <td className="px-4 py-2">{historial.fecha_accion}</td>
            <td className="px-4 py-2">{historial.admin_id}</td>
        </tr>
    );

    return (
        <div>
            <ListComponent
                data={filteredData}
                columns={columns}
                renderRow={renderRow}
                searchKeys={['entidad_id', 'cliente_id', 'cliente_nombre', 'elemento_id', 'elemento_nombre', 'cantidad', 'observaciones', 'estado', 'accion', 'admin_id', 'fecha_accion']}
                title="Historial Moras"
            />
        </div>
    );
};

export default HistorialMoras;
