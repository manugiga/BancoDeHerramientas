import { useState, useEffect, useRef } from 'react';
import useGetData from '../../hooks/useGetData';
import { TableCell, TableRow } from "@/components/ui/table";


const PrestamosActivos = () => {
  const [searchTerm, setSearchTerm] = useState(""); // Estado del término de búsqueda
  const [filteredPrestamos, setFilteredPrestamos] = useState([]); // Estado de préstamos filtrados
  const inputRef = useRef(null); // Referencia al input para enfocarlo
  const { data: prestamosData, error: prestamosError, loading: prestamosLoading } = useGetData(['prestamos/todosPrestamos']);

  // Enfocar el input cuando el componente se monta
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Actualizar los préstamos filtrados cuando prestamosData o searchTerm cambien
  useEffect(() => {
    if (prestamosData && prestamosData['prestamos/todosPrestamos']) {
      const prestamos = prestamosData['prestamos/todosPrestamos'].filter(prestamo => prestamo.estado === 'actual');
      
      if (searchTerm === "") {
        setFilteredPrestamos(prestamos); // Si no hay término de búsqueda, mostrar todos
      } else {
        // Filtrar préstamos por el término de búsqueda
        const prestamosFiltrados = prestamos.filter(prestamo => 
          prestamo.Elemento.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prestamo.elementos_idelemento.toString().includes(searchTerm) ||
          prestamo.PrestamoCorriente.Cliente.documento.toString().includes(searchTerm) ||
          prestamo.PrestamoCorriente.Cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredPrestamos(prestamosFiltrados);
      }
    }
  }, [prestamosData, searchTerm]); // Actualizar cuando cambien los datos o el término de búsqueda

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value); // Actualizar el término de búsqueda
  };

  if (prestamosLoading) return <p>Cargando...</p>;
  if (prestamosError) return <p>{prestamosError}</p>;

  return (
    <div style={{ textAlign: 'center' }}><br/>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '25px', fontWeight: 'bold', marginRight: '10px' }}>Elementos Prestados</h1>
        <input
          ref={inputRef}
          type="text"
          placeholder="Filtra por ID o descripción"
          value={searchTerm}
          onChange={handleSearchChange}
          style={{
            width: '250px',
            padding: '7px',
            border: '2px solid black',
            borderRadius: '5px',
          }}
        />
      </div>
      <div className="max-h-[400px] max-w-[1000px] overflow-y-auto overflow-x-auto">
        <table style={{ margin: '0 auto' }}>
          <thead>
            <tr>
              <th>Documento</th>
              <th>Nombre</th>
              <th>Grupo</th>
              <th>Codigo</th>
              <th>Descripcion</th>
              <th>Cantidad</th>
              <th>Fecha</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPrestamos.length > 0 ? (filteredPrestamos.map((prestamo) => (
              <tr key={prestamo.PrestamoCorriente.documento}>
                <td>{prestamo.PrestamoCorriente.Cliente.documento}</td>
                <td>{prestamo.PrestamoCorriente.Cliente.nombre}</td>
                <td>{prestamo.PrestamoCorriente.Cliente.roles_idrol}</td>
                <td>{prestamo.Elemento.idelemento}</td>
                <td>{prestamo.Elemento.descripcion}</td>
                <td>{prestamo.cantidad}</td>
                <td>{prestamo.fecha_entrega}</td>
                <td>{prestamo.observaciones}</td>
              </tr>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan="8">No hay préstamos</TableCell>
            </TableRow>
          )}
          </tbody>
        </table>
      </div>    
    </div>
  );
};

export default PrestamosActivos;
