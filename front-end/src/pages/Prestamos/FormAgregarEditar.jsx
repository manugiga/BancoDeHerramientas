import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { useParams, useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import useSearchElements from "../../hooks/useSearchElements";
import usePostData from "../../hooks/usePostData.jsx";
import axiosInstance from "../../helpers/axiosConfig.js";
import '../../assets/formAgregarEditarStyles.css'; 
import { radioGroupClasses } from "@mui/material";

export const FormAgregarEditarPrestamo = () => {
    const navigate = useNavigate();
    const { idprestamo } = useParams();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);
    const [documento, setDocumento] = useState('');
    const [nombre, setNombre] = useState('');
    const [grupo, setGrupo] = useState('');

    const toggleEstado = (item, estadoDeseado) => {
        return item.estado === estadoDeseado ? { ...item, estado: 'actual' } : { ...item, estado: estadoDeseado };
    };

    const handleReturnAll = () => {
        setSelectedItems((prevItems) =>
            prevItems.map((item) =>
                item.fecha_entregaFormato // Solo para los elementos con fecha de entrega
                    ? { ...item, cantidadd: item.cantidad, estado: 'finalizado' } // Actualiza `cantidadd` con el valor de `cantidad`
                    : item
            )
        );
    };

    const handleMoraAll = () => {
        setSelectedItems((prevItems) =>
            prevItems.map((item) =>
                item.fecha_entregaFormato // Solo para los elementos con fecha de entrega
                    ? toggleEstado(item, 'mora')
                    : item
            )
        );
    };

    const handleDanoAll = () => {
        setSelectedItems((prevItems) =>
            prevItems.map((item) =>
                item.fecha_entregaFormato
                    ? toggleEstado(item, 'dano')
                    : item
            )
        );
    };

    const handleConsumoAll = () => {
        setSelectedItems((prevItems) =>
            prevItems.map((item) =>
                item.fecha_entregaFormato && item.tipo == 'consumible'// Solo para los elementos con fecha de entrega
                    ? toggleEstado(item, 'consumo')
                    : item
            )
        );
    };

    // const handleCederAll = () => {
    //     Swal.fire({
    //         title: 'Ceder todos los elementos',
    //         input: 'text',
    //         inputPlaceholder: 'Documento de la persona a ceder elementos',
    //         showCancelButton: true,
    //         confirmButtonText: 'Ceder',
    //         confirmButtonColor: '#007BFF',
    //         cancelButtonText: 'Cancelar',
    //         cancelButtonColor: '#81d4fa',
    //         preConfirm: (cedido) => {
    //             if (!cedido) {
    //                 Swal.showValidationMessage('Debe ingresar un documento.');
    //             }
    //             return cedido;
    //         }
    //     }).then((result) => {
    //         if (result.isConfirmed) {
    //             const cedidoDocumento = result.value;
    
    //             setSelectedItems((prevItems) =>
    //                 prevItems.map((item) =>
    //                     item.fecha_entregaFormato
    //                         ? { ...item, manualStatus: 'cedido', estado: 'cedido', cedido: cedidoDocumento }
    //                         : item
    //                 )
    //             );
    //         }
    //     });
    // };
    
    useEffect(() => {
        const fetchExistingLoan = async () => {
            try {
                const response = await axiosInstance.get(`${import.meta.env.VITE_API_URL}/prestamos/${idprestamo}/elementos`, { documento: idprestamo });
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
                    cedido: 0,
                    cantidadCedida: 0,
                    dispoTotal : elemento.disponibles - elemento.minimo
                })));
            } catch (error) {
                console.error('Error al obtener el préstamo existente:', error);
            }
        };
    
        fetchExistingLoan();
    }, [idprestamo]);

    const { data: searchResults = [], error: searchError, loading: searchLoading } = useSearchElements(searchTerm);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleAddItem = (item) => {
        setSelectedItems((prevItems) => {
            // Verifica si el elemento ya existe en la lista
            const itemExists = prevItems.find((selectedItem) => selectedItem.idelemento === item.idelemento);
    
            if (itemExists) {
                // Si el elemento ya está en la lista, incrementa la cantidad actual en 1
                return prevItems.map((selectedItem) =>
                    selectedItem.idelemento === item.idelemento
                        ? { ...selectedItem, cantidad: parseInt(selectedItem.cantidad, 10) + 1 }
                        : selectedItem
                );
            }
    
            // Si el elemento no está en la lista, lo agrega con cantidad 1
            return [
                ...prevItems,
                { ...item, cantidad: 1, cantidadd: 0, observaciones: "", checked: false }
            ];
        });
    };
      
    const handleQuantityChange = (idelemento, quantity) => {
        setSelectedItems((prevItems) => {
            const updatedItems = prevItems.map((item) =>
                item.idelemento === idelemento
                    ? { ...item, cantidad: quantity }
                    : item
            );
            updateLoanStatus(updatedItems);
            return updatedItems;
        });
    };

    const handleQuantityDevChange = (idelemento, quantity) => {
        setSelectedItems((prevItems) => {
            const updatedItems = prevItems.map((item) =>
                item.idelemento === idelemento
                    ? { ...item, cantidadd: quantity}
                    : item
            );
            updateLoanStatus(updatedItems);
            return updatedItems;
        });
    };

    const handleObservationsChange = (idelemento, observations) => {
        setSelectedItems((prevItems) =>
            prevItems.map((item) =>
                item.idelemento === idelemento
                    ? { ...item, observaciones: observations }
                    : item
            )
        );
    };

    const updateLoanStatus = (items) => {
        setSelectedItems((prevItems) =>
            prevItems.map((item) => {
                const updatedItem = items.find((updated) => updated.idelemento === item.idelemento);
                if (updatedItem) {
                    if (updatedItem.manualStatus) {
                        return { ...updatedItem, estado: updatedItem.manualStatus };
                    }
                    if (updatedItem.cantidad == updatedItem.cantidadd) {
                        return { ...updatedItem, estado: 'finalizado' };
                    } else {
                        return { ...updatedItem, estado: 'actual' };
                    }
                }
                return item;
            })
        );
    };

    const handleManualStatusChange = (idelemento, status) => {
        if (status === 'cedido') {
            Swal.fire({
                title: 'Ceder elemento',
                html: `
                    <input type="number" id="cedido" class="swal2-input" placeholder="Documento de la persona a ceder">
                    <input type="number" id="cantidadCedida" class="swal2-input" placeholder="Cantidad a ceder" min="1">
                `,
                showCancelButton: true,
                confirmButtonText: 'Ceder',
                confirmButtonColor: '#007BFF',
                cancelButtonText: 'Cancelar',
                cancelButtonColor: '#81d4fa',
                preConfirm: () => {
                    const cedido = document.getElementById('cedido').value;
                    const cantidadCedida = document.getElementById('cantidadCedida').value;
                    if (!cedido) {
                        Swal.showValidationMessage('Debe ingresar un documento');
                    } else if (!cantidadCedida || cantidadCedida <= 0) {
                        Swal.showValidationMessage('Debe ingresar una cantidad válida');
                    }
                    return { cedido, cantidadCedida };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const { cedido, cantidadCedida } = result.value;
    
                    setSelectedItems((prevItems) =>
                        prevItems.map((item) =>
                            item.idelemento === idelemento
                                ? { ...item, manualStatus: status, estado: status, cedido: cedido, cantidadCedida: cantidadCedida }
                                : item
                        )
                    );
                }
            });
        } else {
            // Si no es "cedido", actualizamos normalmente el estado
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

    const elementos = selectedItems.map(({ idelemento, cantidad, cantidadd, observaciones, estado, cedido, cantidadCedida }) => ({
        idelemento,
        cantidad,
        cantidadd,
        observaciones,
        estado,
        cedido, 
        cantidadCedida
    }));

    const handleSave = usePostData(`prestamos/addElements/${idprestamo}`, () => {}, { elementos }, {},'/inicio');

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            if (searchResults.length > 0) {
                handleAddItem(searchResults[0]); // Agregar el primer elemento de la búsqueda
            }
        }
    };        
    
    return (
        <div className="form-container">
            <h1 className="text-center my-2 mb-8 text-xl font-bold">Préstamo Activo de {documento} (Nombre: {nombre} --- Grupo: {grupo})</h1>
            <div className="container">
                <div className="search-results-container">
                    <label htmlFor="search" className="block text-neutral-500">
                        Busca el elemento que deseas agregar al préstamo
                    </label>
                    <input
                        type="text"
                        id="search"
                        name="search"
                        placeholder="Nombre o ID del elemento"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onKeyDown={handleKeyPress}
                        className="input-field"
                    />
                    {searchLoading && <p>Cargando...</p>}
                    {searchError && <p>Error: {searchError}</p>}
                    <div className="search-results">
                        {Array.isArray(searchResults) && searchResults.map((item) => (
                            <div
                                key={item.idelemento}
                                className="search-result-item"
                                onClick={() => handleAddItem(item)}
                            >
                                <span className="search-result-text">{item.descripcion}</span><span>Ubicación: {item.ubicacion}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="table-container max-h-[210px] overflow-y-auto overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Descripción</th>
                                <th>Dispo</th>
                                <th>Cantidad P</th>
                                <th>Fecha</th>
                                <th>Observaciones</th>
                                <th>Cantidad E</th>
                                <th>Estado</th>
                                <th>Enviar</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedItems.map((item) => (
                                <tr key={item.idelemento}>
                                    <td>{item.idelemento}</td>
                                    <td>{item.descripcion}</td>
                                    <td>{item.fecha_entregaFormato ? item.dispoTotal : item.disponibles - item.minimo}</td>
                                    <td>
                                    <input className="input"
                                            type="number"
                                            value={item.cantidad}
                                            onChange={(e) =>
                                                handleQuantityChange(item.idelemento, e.target.value)
                                            }
                                            min="1"
                                        />               
                                    </td>
                                    <td>{item.fecha_entregaFormato}</td>
                                    <td>
                                        <textarea className="input"
                                            type="text"
                                            value={item.observaciones}
                                            onChange={(e) =>
                                                handleObservationsChange(item.idelemento, e.target.value)
                                            }
                                        />
                                    </td>
                                    <td>
                                    <input className="input"
                                            type="number"
                                            value={item.cantidadd}
                                            onChange={(e) =>
                                                handleQuantityDevChange(item.idelemento, e.target.value)
                                            }
                                            disabled={item.estado == 'disponible'} 
                                            min="1"
                                        />               
                                    </td>
                                    <td>{item.fecha_entregaFormato && item.cedido != 0  && item.estado == 'cedido' ? item.cantidadCedida + ' ' + item.estado +' a  '+ item.cedido : item.fecha_entregaFormato ? item.estado : ''}</td>
                                    <td>
                                    <select
                                            value={item.manualStatus || item.estado} // Default to automatic status if no manual status
                                            onChange={(e) => handleManualStatusChange(item.idelemento, e.target.value)}
                                            disabled={item.fecha_entregaFormato ? false : true || item.estado == 'finalizado'} // Disable if no date
                                            className="input"
                                        >
                                            <option></option>
                                            <option value="mora">mora</option>
                                            <option value="dano">daño</option>
                                            <option value="cedido">ceder</option>
                                            <option disabled={item.tipo == 'devolutivo'} value="consumo">consumo</option>
                                    </select> 
                                    </td>
                                    <td>
                                        <button 
                                            type="button"
                                            className="delete-button"
                                            onClick={() =>
                                                setSelectedItems((prevItems) =>
                                                    prevItems.filter((i) => i.idelemento !== item.idelemento)
                                                )
                                            }
                                            style={{margin: '5px'}}
                                            disabled={item.estado == 'finalizado'} 
                                        >
                                            <IoClose/>
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
                        onClick={handleReturnAll} // Cambiar la función
                    >
                        Devolver Todo 
                    </button>
                    <button
                        type="button"
                        className="consume-button"
                        onClick={handleMoraAll} // Cambiar la función
                    >
                        Todo a Mora 
                    </button>
                    <button
                        type="button"
                        className="consume-button"
                        onClick={handleDanoAll} // Cambiar la función
                    >
                        Todo a Daño 
                    </button>
                    <button
                        type="button"
                        className="consume-button"
                        onClick={handleConsumoAll} // Cambiar la función
                    >
                        Consumir Todo
                    </button>
                    <button
                        type="button"
                        className="consume-button"
                        onClick={()=>navigate("inicio")}
                    >
                        Cancelar 
                    </button>
                    {/* <button
                        type="button"
                        className="consume-button"
                        onClick={handleCederAll} // Cambiar la función
                        disabled={selectedItems.length<1}
                    >
                        Ceder Todo
                    </button> */}
                </div>
            </div>
        </div>
    );
};