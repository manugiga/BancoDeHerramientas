import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import useSearchElements from "../../hooks/useSearchElementsInstructor";
import usePostData from "../../hooks/usePostData";
import useDeleteData from "../../hooks/useDeleteData";
import axiosInstance from '../../helpers/axiosConfig.js';
import '../../assets/formAgregarEditarStyles.css'; 

export const FormCrearEncargo = () => {
    const navigate = useNavigate();
    const { idarea } = useParams();
    const { idencargo } = useParams();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);
    const { deleteData, data: deleted, isLoading, error } = useDeleteData(`encargos/eliminar/${idencargo}`, '/encargos/elegirarea');

    const { data: searchResults = [], error: searchError, loading: searchLoading } = useSearchElements(searchTerm);
    const filteredResults = searchResults.filter((item) => item.areas_idarea == idarea);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleAddItem = (item) => {
        setSelectedItems((prevItems) => {
            const itemExists = prevItems.find((selectedItem) => selectedItem.idelemento === item.idelemento);
            if (itemExists) {
                return prevItems.map((selectedItem) =>
                    selectedItem.idelemento === item.idelemento
                        ? { ...selectedItem, cantidad: parseInt(selectedItem.cantidad, 10) + 1, cantidadbd: item.cantidad }
                        : selectedItem
                );
            }
            return [...prevItems, { ...item, cantidad: 1, cantidadd: 0, observaciones: "", cantidadbd: item.cantidad, checked: false }];
        });
    };    

    const handleQuantityChange = (idelemento, quantity) => {
        setSelectedItems((prevItems) => 
            prevItems.map((item) =>
                item.idelemento === idelemento ? { ...item, cantidad: quantity } : item
            )
        );
    };

    const handleObservationsChange = (idelemento, observations) => {
        setSelectedItems((prevItems) =>
            prevItems.map((item) =>
                item.idelemento === idelemento ? { ...item, observaciones: observations } : item
            )
        );
    };

    const elementos = selectedItems.map(({ idelemento, cantidad, observaciones }) => ({
        idelemento,
        cantidad,
        observaciones
    }));

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            if (filteredResults.length > 0) {
                handleAddItem(filteredResults[0]);
            }
        }
    };

    const handleDelete = () => {
        deleteData();
    };
    const handleSave = usePostData(`encargos/elements`, () => {}, { elementos, idarea, idencargo }, {},`/encargos/lista`);

    return (
        <div className="form-container">
            <h1 className="text-center my-2 mb-8 text-xl font-bold">Formulario Encargo</h1>
            <div className="container">
                <div className="search-results-container">
                    <label htmlFor="search" className="block text-neutral-500">
                        Busca y selecciona los elementos que deseas agregar al encargo
                    </label>
                    <input
                        type="text"
                        id="search"
                        name="search"
                        placeholder="Nombre del elemento"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onKeyDown={handleKeyPress}
                        className="input-field"
                    />
                    {searchLoading && <p>Cargando...</p>}
                    {searchError && <p>Error: {searchError}</p>}
                    <div className="search-results">
                        {Array.isArray(filteredResults) && filteredResults.map((item) => (
                            <div
                                key={item.idelemento}
                                className="search-result-item"
                                onClick={() => handleAddItem(item)}
                            >
                                <span className="search-result-text">{item.descripcion}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="table-container overflow-y-auto overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 ">
                        <thead>
                            <tr style={{ color: 'black' }}>
                                <td colSpan="6" style={{ color: 'black' }}>
                                    <label className="font-bold">Indique las especificaciones de cada elemento</label>
                                </td>
                            </tr>
                            <tr>
                                <th>Elemento</th>
                                <th>Disponibles</th>
                                <th>Cantidad</th>
                                <th>Observaciones</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedItems.map((item) => (
                                <tr key={item.idelemento}>
                                    <td>{item.descripcion}</td>
                                    <td>{item.cantidadbd - item.minimo}</td>
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
                                    <td>
                                        <input className="input"
                                            type="text"
                                            value={item.observaciones}
                                            onChange={(e) =>
                                                handleObservationsChange(item.idelemento, e.target.value)
                                            }
                                        />
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
                                        >
                                            <IoClose />
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
                        onClick={handleDelete}
                    >
                        Cancelar                  
                    </button>
                </div>
            </div>
        </div>
    );
};