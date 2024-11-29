import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { useParams, useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import usePostData from "../../hooks/usePostData.jsx";
import axiosInstance from "../../helpers/axiosConfig.js";
import '../../assets/formAgregarEditarStyles.css'; 

export const Encargo = () => {
    const navigate = useNavigate();
    const { idencargo } = useParams();
    const [selectedItems, setSelectedItems] = useState([]);
    const [documento, setDocumento] = useState('');
    const [nombre, setNombre] = useState('');
    const [grupo, setGrupo] = useState('');

    useEffect(() => {
        const fetchExistingLoan = async () => {
            try {
                const response = await axiosInstance.get(`${import.meta.env.VITE_API_URL}/encargos/persona/${idencargo}`, { documento: idencargo });
                const { elementos, documento, nombre, grupo } = response.data;
                setDocumento(documento);
                setNombre(nombre);
                setGrupo(grupo);
                setSelectedItems(elementos.map(({ elemento, cantidad, observaciones, fecha_entregaFormato, fecha_devolucionFormato, estado }) => ({
                    idelemento: elemento.idelemento,
                    descripcion: elemento.descripcion,
                    cantidad,
                    cantidadd: 0,
                    observaciones,
                    fecha_entregaFormato,
                    fecha_devolucionFormato,
                    estado,
                    tipo: elemento.tipo,
                    reclamado: 0,
                    cantidadReclama: 0,
                    dispoTotal : elemento.disponibles - elemento.minimo
                })));
            } catch (error) {
                console.error('Error al obtener el préstamo existente:', error);
            }
        };
    
        fetchExistingLoan();
    }, [idencargo]);
      
    // const handleQuantityDevChange = (idelemento, quantity) => {
    //     setSelectedItems((prevItems) => {
    //         const updatedItems = prevItems.map((item) =>
    //             item.idelemento === idelemento
    //                 ? { ...item, cantidadd: quantity}
    //                 : item
    //         );
    //         updateLoanStatus(updatedItems);
    //         return updatedItems;
    //     });
    // };

    const handleObservationsChange = (idelemento, observations) => {
        setSelectedItems((prevItems) =>
            prevItems.map((item) =>
                item.idelemento === idelemento
                    ? { ...item, observaciones: observations }
                    : item
            )
        );
    };

    // const updateLoanStatus = (items) => {
    //     setSelectedItems((prevItems) =>
    //         prevItems.map((item) => {
    //             const updatedItem = items.find((updated) => updated.idelemento === item.idelemento);
    //             if (updatedItem) {
    //                 if (updatedItem.manualStatus) {
    //                     return { ...updatedItem, estado: updatedItem.manualStatus };
    //                 }
    //                 if (updatedItem.cantidad == updatedItem.cantidadd) {
    //                     return { ...updatedItem, estado: 'finalizado' };
    //                 } else {
    //                     return { ...updatedItem, estado: 'actual' };
    //                 }
    //             }
    //             return item;
    //         })
    //     );
    // };

    const handleManualStatusChange = (idelemento, status) => {
        if (status === 'reclamar') {
            Swal.fire({
                title: 'Reclamar elemento',
                html: `
                    <input type="number" id="reclamado" class="swal2-input" placeholder="Documento del que reclama">
                    <input type="number" id="cantidadReclama" class="swal2-input" placeholder="Cantidad que reclama" min="1">
                `,
                showCancelButton: true,
                confirmButtonText: 'Reclamar',
                confirmButtonColor: '#007BFF',
                cancelButtonText: 'Cancelar',
                cancelButtonColor: '#81d4fa',
                preConfirm: () => {
                    const reclamado = document.getElementById('reclamado').value;
                    const cantidadReclama = document.getElementById('cantidadReclama').value;
                    if (!reclamado) {
                        Swal.showValidationMessage('Debe ingresar un documento');
                    } else if (!cantidadReclama || cantidadReclama <= 0) {
                        Swal.showValidationMessage('Debe ingresar una cantidad válida');
                    }
                    return { reclamado, cantidadReclama };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const { reclamado, cantidadReclama } = result.value;
    
                    setSelectedItems((prevItems) =>
                        prevItems.map((item) =>
                            item.idelemento === idelemento
                                ? { ...item, manualStatus: status, estado: status, reclamado: reclamado, cantidadReclama: cantidadReclama }
                                : item
                        )
                    );
                }
            });
        } else {
            // Si no es "reclamado", actualizamos normalmente el estado
            setSelectedItems((prevItems) => {
                const updatedItems = prevItems.map((item) =>
                    item.idelemento === idelemento
                        ? { ...item, manualStatus: status, estado: status }
                        : item
                );
                return updatedItems;
            });
        }
    };    

    const elementos = selectedItems.map(({ idelemento, cantidad, observaciones, estado, reclamado, cantidadReclama }) => ({
        idelemento,
        cantidad,
        observaciones,
        estado,
        reclamado, 
        cantidadReclama
    }));

    const handleNoReclamo = usePostData(`encargos/noReclamo/${idencargo}`, () => {}, { }, {},'/encargos');
    const handleFinalizar = usePostData(`encargos/finalizar/${idencargo}`, () => {}, { }, {},'/encargos');
    const handleSave = usePostData(`encargos/reclamar/${idencargo}`, () => {}, { elementos }, {},'/encargos');

    return (
        <div className="form-container">
            <h1 className="text-center my-8 mb-8 text-xl font-bold">Encargo Activo de {documento} (Nombre: {nombre} --- Grupo: {grupo})</h1>
            <div className="container">
                <div className="table-container max-h-[450px] overflow-y-auto overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Descripción</th>
                                <th>Cantidad</th>
                                <th>Observaciones</th>
                                <th>Estado</th>
                                <th>Enviar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedItems.map((item) => (
                                <tr key={item.idelemento}>
                                    <td>{item.idelemento}</td>
                                    <td>{item.descripcion}</td>
                                    <td>
                                    <input className="input"
                                            type="number"
                                            value={item.cantidad}
                                        />               
                                    </td>
                                    <td>
                                        <textarea className="input"
                                            type="text"
                                            value={item.observaciones}
                                            onChange={(e) =>
                                                handleObservationsChange(item.idelemento, e.target.value)
                                            }
                                        />
                                    </td>
                                    <td>{item.reclamado != 0  && item.estado == 'reclamar' ? item.reclamado + ' reclama ' + item.cantidadReclama : ''}</td>
                                    <td>
                                    <button
                                            // value={item.manualStatus || item.estado} // Default to automatic status if no manual status
                                            onClick={(e) => handleManualStatusChange(item.idelemento, 'reclamar')}
                                            className="bg-black text-white px-2 py-1 rounded-md m-1"
                                    >
                                        Reclamar
                                    </button> 
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex justify-center">
                    <button
                        type="button"
                        className="consume-button"
                        onClick={handleSave} 
                    >
                        Guardar
                    </button>
                    <button
                        type="button"
                        className="consume-button"
                        onClick={handleNoReclamo} 
                    >
                        No reclamó 
                    </button>
                    <button
                        type="button"
                        className="consume-button"
                        onClick={handleFinalizar} 
                    >
                        Finalizar 
                    </button>
                    <button
                        type="button"
                        className="consume-button"
                        onClick={()=>navigate("/encargos")}
                    >
                        Volver 
                    </button>
                </div>
            </div>
        </div>
    );
};