import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import useSearchElements from "../../hooks/useSearchElements";
import usePostDataFile from "@/hooks/usePostDataImage";
import '../../assets/formAgregarEditarStyles.css'; 

export const FormCrearTraspaso = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);
    const [archivo, setFile] = useState(null);
    const [documento, setNumber] = useState('');
    const formData = new FormData();

    const { data: searchResults = [], error: searchError, loading: searchLoading } = useSearchElements(searchTerm);
    const filteredResults = searchResults.filter((item) => item.tipo === 'devolutivo');

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleAddItem = (item) => {
        setSelectedItems((prevItems) => {
            const itemExists = prevItems.find((selectedItem) => selectedItem.idelemento === item.idelemento);
            const cantidadt = item.cantidad;
            if (itemExists) {
                return prevItems.map((selectedItem) =>
                    selectedItem.idelemento === item.idelemento
                        ? { ...selectedItem, cantidadt: cantidadt, cantidad: parseInt(selectedItem.cantidad, 10) + 1 }
                        : selectedItem 
                );
            }
            return [...prevItems, { ...item, cantidad: 1, observaciones: "", checked: false, cantidadt }];
        });
    };

    const handleQuantityChange = (idelemento, quantity) => {
        setSelectedItems((prevItems) =>
            prevItems.map((item) =>
                item.idelemento === idelemento
                    ? { ...item, cantidad: quantity }
                    : item
            )
        );
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

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleDocumentoChange = (e) => {
        setNumber(e.target.value);    
    };    

    const elementos = selectedItems.map(({ idelemento, cantidad, observaciones }) => ({
        idelemento,
        cantidad,
        observaciones,
    }));

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            if (filteredResults.length > 0) {
                handleAddItem(filteredResults[0]);
            }
        }
    };

    formData.append('elementos', JSON.stringify(elementos));
    if (archivo || documento) {
        const doc = parseFloat(documento);
        formData.append('archivo', archivo);
        formData.append('documento', doc);
    }

    const handleSave = usePostDataFile('bajas/traspasos', formData, '/traspasos/lista');

    return (
        <div className="form-container">
            <h1 className="text-center my-2 mb-8 text-xl font-bold">Registrar Traspaso</h1>
            <div className="container">
                <div className="search-results-container">
                    <label htmlFor="search" className="block text-neutral-500">
                        Busca el elemento al que deseas cambiar de cuentadante
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
                                <span className="search-result-text">{item.descripcion}</span><span>Ubicación: {item.ubicacion}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="table-container max-h-[210px] overflow-y-auto overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 ">
                        <thead>
                            <tr>
                                <th>Total</th>
                                <th>Código</th>
                                <th>Descripción</th>
                                <th>Cantidad</th>
                                <th>Observaciones</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedItems.map((item) => (
                                <tr key={item.idelemento}>
                                    <td>{item.cantidadt}</td>
                                    <td>{item.idelemento}</td>
                                    <td>{item.descripcion}</td>
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
                                            <IoClose/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            <tr><td colSpan="6"><label className="font-bold"> Ingrese los siguentes datos para hacer el traspaso</label></td></tr>
                            <tr>
                                <td colSpan="3">
                                    <input type="file" onChange={handleFileChange} required/>
                                </td>
                                <td colSpan="3">
                                    <label> Documento Cuentadante: </label>
                                    <input type="number" onChange={handleDocumentoChange} value={documento} required/>
                                </td>
                            </tr>
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
                        onClick={()=>navigate("inicio")}
                    >
                        Cancelar 
                    </button>
                </div>
            </div>
        </div>
    );
};
