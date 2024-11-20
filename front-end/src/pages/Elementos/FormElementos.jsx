import { useState } from "react";
import { Input } from "../../components/forms/elements/input";
import { Button } from "../../components/forms/elements/button";
import { Forms } from "../../layout/Forms";
import { Select } from "../../components/forms/elements/select";
import { useNavigate } from 'react-router-dom';
import useGetData from "@/hooks/useGetData";
import useValidatedPostDataImage from "@/hooks/useValidatePostDataImage";
import { ImportarExcelElemento } from "@/components/forms/elements/importarExcel";

export const FormElementos = () => {
    const initialData = { descripcion: "", cantidad: "", disponibles: "", ubicacion: "", tipo: "", estado: "", areas_idarea: "", foto: "", observaciones: "", minimo: "" };
    const [inputs, setInputs] = useState(initialData);
    const navigate = useNavigate();
    const urls = ["areas"];
    const { data } = useGetData(urls);
    const areas = data.areas || [];

    const handleFormReset = () => {
        setInputs(initialData);
    };

    const onSubmit = () => {
        handleFormReset();
        navigate("/", { replace: true });
    };

    // Ahora que `onSubmit` ha sido definido, se puede usar en `useValidatedPostDataImage`
    const formData = new FormData();
    Object.keys(inputs).forEach(key => {
        formData.append(key, inputs[key]);
    });

    const validations = {
        descripcion: { required: true },
        cantidad: { required: true, pattern: /^\d+$/ }, // Validación numérica
        disponibles: { required: true, pattern: /^\d+$/ }, // Validación numérica
        ubicacion: { required: true },
        tipo: { required: true },
        estado: { required: true },
        foto: { required: true },
        observaciones: { required: true },
        minimo: { required: true, pattern: /^\d+$/ } // Validación numérica
    };

    const { handleSubmit, errors, handleChange } = useValidatedPostDataImage("elements", onSubmit, formData, validations, '/elementos/formulario');

    const handleInputChange = (event) => {
        const { name, value, files } = event.target;
        const newValue = files ? files[0] : value;
        setInputs({ ...inputs, [name]: newValue });
        handleChange(event); // Ejecutar la validación en el cambio
    };

    const inputs1 = [
        // { 
        //     id: 1, 
        //     type: 'number', 
        //     name: 'idelemento', 
        //     placeholder: 'Ingrese el id del elemento', 
        //     value: inputs.idelemento, 
        //     required: true 
        // },
        { 
            id: 2, 
            type: 'text', 
            name: 'descripcion', 
            placeholder: 'Ingrese la descripción del elemento', 
            value: inputs.descripcion, 
            required: true 
        },
        { 
            id: 3, 
            type: 'text', 
            name: 'cantidad', 
            placeholder: 'Ingrese la cantidad del elemento', 
            value: inputs.cantidad, 
            required: true 
        },
        { 
            id: 4, 
            type: 'text', 
            name: 'disponibles', 
            placeholder: 'Ingrese la disponibilidad de cada elemento', 
            value: inputs.disponibles, 
            required: true 
        },
        { 
            id: 5, 
            type: 'text', 
            name: 'ubicacion', 
            placeholder: 'Ingrese la ubicacion del elemento', 
            value: inputs.ubicacion, 
            required: true 
        },
        {
            id: 6,
            type: 'file',
            name: 'foto',
            placeholder: '',
            value: inputs.foto,
            required: true
        },
        {
            id: 7,
            type: 'text',
            name: 'observaciones',
            placeholder: 'Ingrese las observaciones necesarias',
            value: inputs.observaciones,
            required: true
        },
        {
            id: 8,
            type: 'text',
            name: 'minimo',
            placeholder: 'Ingrese el mínimo de elementos permitido',
            value: inputs.minimo,
            required: true
        },
    ];

    return (
        <div>
        <Forms>
            <h1 className="text-center my-2 mb-8 text-xl font-bold">Formulario Elementos</h1>
            <hr color="black" size="8"/><br></br>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto" onSubmit={handleSubmit}>
                {inputs1.map(input => (
                    <div key={input.id}>
                        <Input
                            type={input.type}
                            name={input.name}
                            placeholder={input.placeholder}
                            required={input.required}
                            value={input.type === 'file' ? undefined : input.value}
                            handleInputChange={handleInputChange}
                        />
                        {errors[input.name] && <p className="text-red-500">{errors[input.name]}</p>}
                    </div>
                ))}
                <Select
                    label="Tipo de elemento"
                    name="tipo"
                    value={inputs.tipo}
                    onChange={handleInputChange}
                    options={[
                        { value: "devolutivo", label: "Devolutivo" },
                        { value: "consumible", label: "Consumible" },
                    ]}                
                />
                <Select
                    label="Estado"
                    name="estado"
                    value={inputs.estado}
                    onChange={handleInputChange}
                    options={[
                        { value: "Disponible", label: "Disponible" },
                        { value: "Agotado", label: "Agotado" },
                    ]}                
                /><br></br>
                <div className={inputs1.length % 2 === 0 ? "md:col-span-2" : "flex items-center justify-center mt-4"}>
                    <Button type={'submit'} name={'Enviar'} />
                </div>
            </form>
        </Forms>
        <ImportarExcelElemento/>
        </div>
    );
};

