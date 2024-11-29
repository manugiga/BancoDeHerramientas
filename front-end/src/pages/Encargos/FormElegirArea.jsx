import { useState } from "react";
import { Select } from "../../components/forms/elements/select";
import useGetData from "../../hooks/useGetData.jsx";
import axiosInstance from "../../helpers/axiosConfig";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const FormElegirArea = () => {
    const navigate = useNavigate();
    const initialData = { areas_idarea: "", fecha_reclamo: "", contacto: "" };
    const [inputs, setInputs] = useState(initialData);

    const urls = ["areas"];
    const { data } = useGetData(urls);
    const areas = data.areas || [];

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setInputs({ ...inputs, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones básicas
        if (!inputs.areas_idarea || !inputs.fecha_reclamo) {
            Swal.fire({
                icon: "error",
                title: "Campos incompletos",
                text: "Por favor, completa todos los campos.",
                confirmButtonColor: "#FC3F3F",
            });
            return;
        }

        try {
            const response = await axiosInstance.post("/encargos", inputs);
            const responseData = response.data;

            // Mostrar éxito y redirigir
            Swal.fire({
                title: "¡Registro exitoso!",
                text: "Tu encargo ha sido registrado correctamente.",
                icon: "success",
                confirmButtonColor: "#6fc390",
                timer: 2000,
            }).then(() => {
                    navigate(`/encargos/elementos/${responseData.areas_idarea}/${responseData.idencargo}`, { replace: true });
            });
        } catch (error) {
            const mensaje = error.response?.data?.mensaje || "Error al registrar el encargo.";
            Swal.fire({
                icon: "error",
                title: "Error",
                text: mensaje,
                confirmButtonColor: "#FC3F3F",
            });
            console.error("Error al registrar el encargo:", error);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col items-center border shadow-lg p-8 rounded-lg"
            style={{
                maxWidth: "400px",
                minWidth: "340px",
                margin: "50px auto",
                backgroundColor: "white",
            }}
        >
            <h1 className="text-2xl font-bold mb-6 text-black">Registrar Encargo</h1>
            <label className="w-full text-left font-medium mb-1">Área/Lugar</label>
            <Select
                name="areas_idarea"
                value={inputs.areas_idarea}
                onChange={handleInputChange}
                options={areas.map((area) => ({ value: area.idarea, label: area.nombre }))}
            />
            <label className="w-full text-left font-medium mb-1">Fecha Reclamo:</label>
            <input
                type="datetime-local"
                name="fecha_reclamo"
                value={inputs.fecha_reclamo}
                onChange={handleInputChange}
                className="w-full p-3 mb-4 border rounded-lg"
                placeholder="Fecha de Reclamo"
            />

            <label className="w-full text-left font-medium mb-1">Contacto:</label>
            <input
                type="text"
                name="contacto"
                value={inputs.contacto}
                onChange={handleInputChange}
                className="w-full p-3 mb-4 border rounded-lg"
                placeholder="Contacto"
            />

            <button
                type="submit"
                className="w-full bg-black hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition duration-300 ease-in-out"
            >
                Registrar Encargo
            </button>
        </form>
    );
};

export { FormElegirArea };