import React, { useState } from 'react';

const ListComponent = ({
    data, // Datos de la lista
    columns, // Definición de las columnas (etiquetas)
    renderRow, // Función para renderizar cada fila
    searchKeys = [], // Llaves para realizar la búsqueda
    title, // Título por defecto
    showSearch = true
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Filtrar los datos según el término de búsqueda
    const filteredData = searchKeys.length > 0
    ? data?.filter((item) =>
          searchKeys.some((key) => {
              if (key === 'Elemento.descripcion') {
                  return item.Elemento?.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
              }
              return item[key]?.toString().toLowerCase().includes(searchTerm.toLowerCase());
          })
      )
    : data

    return (
        <div className="p-2">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-black p-4 mb-4">{title}</h1>
                {/* Condicional para mostrar la barra de búsqueda */}
                {showSearch && (
                    <input
                        type="text"
                        className="border-2 border-black p-2 w-1/3 mb-4 rounded-md"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                )}
            </div>

            {/* Tabla genérica con scroll vertical y horizontal */}
            <div className="overflow-x-auto">
                <div className="max-h-[1000px] max-w-[2500px] overflow-y-auto overflow-x-auto">
                    <table className="min-w-full bg-white border border-black">
                        <thead>
                            <tr>
                                {columns.map((col, index) => (
                                    <th key={index} className="px-1 py-0 bg-black text-white">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData?.length > 0 ? (
                                filteredData.map(renderRow)
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="text-center py-4">
                                        No hay registros
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ListComponent;
