import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Select } from "../../components/forms/elements/select";
import useGetData from "../../hooks/useGetData.jsx";

const FormElegirArea = () => {
    const navigate = useNavigate();
    const initialData = { areas_idarea: "" };
    const [inputs, setInputs] = useState(initialData);
    const urls = ["areas"];
    const { data } = useGetData(urls);
    const areas = data.areas || [];

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setInputs({ ...inputs, [name]: value });
    };

    const onSubmit = (event) => {
        event.preventDefault(); // Evita el comportamiento por defecto del formulario
        const idarea = inputs.areas_idarea; // Accede al ID del área desde el estado

        if (idarea) {
            navigate(`/encargos/elementos/${idarea}`, { replace: true });
        } else {
            console.error("No se pudo seleccionar el área");
        }
    };

    return (
        <form onSubmit={onSubmit} className="flex flex-col items-center border shadow-lg p-8 rounded-lg" style={{ maxWidth: '400px', minWidth: '340px', margin: '50px auto', backgroundColor: '#F9F8F8f' }}>
            <h1 className="text-2xl font-bold mb-6 text-black">Elige el lugar del encargo</h1>
            
            <Select
                label=""
                name="areas_idarea"
                value={inputs.areas_idarea}
                onChange={handleInputChange}
                options={areas.map(area => ({ value: area.idarea, label: area.nombre }))}
            />

            <button
                type="submit"
                className="w-full bg-black hover:bg-black-700 text-white font-bold py-3 rounded-lg transition duration-300 ease-in-out"
            >
                Elegir
            </button>
        </form>
    );
};

export { FormElegirArea };
