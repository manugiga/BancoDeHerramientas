import { useState } from "react";
import { Input } from "../../components/forms/elements/input";
import { Button } from "../../components/forms/elements/button";
import { Forms } from "../../layout/Forms";
import { Select } from "../../components/forms/elements/select";
import { useNavigate } from 'react-router-dom';
import useGetData from "@/hooks/useGetData";
import useValidatedPostDataImage from "@/hooks/useValidatePostDataImage";
import {ImportarExcelCliente} from "../../components/forms/elements/importarExcel";

export const FormClientes = () => {
    const initialData = { documento: "", nombre: "", correo: "", contrasena: "", fechaInicio: "", fechaFin: "", observaciones: "", numero: ""};
    const [inputs, setInputs] = useState(initialData);
    const navigate = useNavigate();
    const urls = ["roles"];
    const { data } = useGetData(urls);
    const roles = data.roles || [];

    const handleFormReset = () => {
        setInputs(initialData);
    };

    const onSubmit = () => {
        handleFormReset();
    };

    // Convert inputs to FormData
    const formData = new FormData();
    Object.keys(inputs).forEach(key => {
        formData.append(key, inputs[key]);
    });

    const validations = {
        documento: { required: true, pattern: /^\d+$/ },
        nombre: { required: true },
        correo: { required: true }, 
        fechaInicio: { required: true },
        fechaFin: { required: true },
        observaciones: { required: true },
        contrasena: { required: true },
        numero: { required: true, pattern: /^\d+$/ }, // Validación numérica
        foto: { required: true },
    };

    const { handleSubmit, errors, handleChange } = useValidatedPostDataImage("clients", onSubmit, formData, validations, '/usuarios/formulario');
    
    const handleInputChange = (event) => {
        const { name, value, files } = event.target;
        const newValue = files ? files[0] : value;
        setInputs({ ...inputs, [name]: newValue });
        handleChange(event); // Ejecutar la validación en el cambio
    };

    const inputs1 = [
        { 
            id: 1, 
            type: 'number', 
            name: 'documento', 
            placeholder: 'Ingrese el documento del usuario', 
            value: inputs.documento, 
            required: true 
        },
        { 
            id: 2, 
            type: 'text', 
            name: 'nombre', 
            placeholder: 'Ingrese el nombre del usuario', 
            value: inputs.nombre, 
            required: true 
        },
        { 
            id: 3, 
            type: 'text', 
            name: 'correo', 
            placeholder: 'Ingrese el correo del usuario', 
            value: inputs.correo, 
            required: true 
        },
        { 
            id: 4, 
            type: 'date', 
            name: 'fechaInicio', 
            placeholder: 'Ingrese la fecha de inicio del usuario', 
            value: inputs.fechaInicio, 
            required: true 
        },
        { 
            id: 5, 
            type: 'date', 
            name: 'fechaFin', 
            placeholder: 'Ingrese la fecha de fin del usuario', 
            value: inputs.fechaFin, 
            required: true 
        },
        { 
            id: 6, 
            type: 'text', 
            name: 'observaciones', 
            placeholder: 'Ingrese las observaciones del usuario', 
            value: inputs.observaciones, 
            required: true 
        },
        { 
            id: 7, 
            type: 'password', 
            name: 'contrasena', 
            placeholder: 'Ingrese la contraseña del usuario', 
            value: inputs.contrasena, 
            required: true 
        },
        { 
            id: 8, 
            type: 'text', 
            name: 'numero', 
            placeholder: 'Ingrese el telefono del usuario', 
            value: inputs.numero, 
            required: true 
        },
        {
            id: 9,
            type: 'file',
            name: 'foto',
            placeholder: '',
            value: inputs.foto,
            required: true
        },
    ];


    return (
        <div>
        <Forms>
            <h1 className="text-center my-2 mb-8 text-xl font-bold">Formulario Clientes</h1>
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
                    label="grupo"
                    name="roles_idrol"
                    value={inputs.roles_idrol}
                    onChange={handleInputChange}
                    options={roles.map(rol => ({ value: rol.idrol, label: rol.descripcion }))}
                />
                <div className={inputs1.length % 2 === 0 ? "md:col-span-2" : "flex items-center justify-center mt-6"}>
                    <Button type={'submit'} name={'Enviar'} />
                </div>
            </form>
        </Forms>
        <ImportarExcelCliente/>
        </div>
    );
};
