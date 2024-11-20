import { useState } from "react";
import usePostData from "../../hooks/usePostData";
import { Input } from "../../components/forms/elements/input";
import { Button } from "../../components/forms/elements/button";
import { Forms } from "../../layout/Forms";
import { useNavigate } from 'react-router-dom';
import useValidation from "@/hooks/useValidation"; // Importa el hook de validación

export const FormRoles = () => {
    const initialData = { descripcion: "" };
    const [inputs, setInputs] = useState(initialData);
    const navigate = useNavigate();
    const validations = {
        idrol: [
        ],
        descripcion: [
            {
                validate: value => value.trim() !== "",
                message: "La descripción del rol es obligatoria."
            }
        ]
    };

    const inputs1 = [
        { 
            id: 2, 
            type: 'text', 
            name: 'descripcion', 
            placeholder: 'Ingrese la descripcion del rol', 
            value: inputs.descripcion, 
            required: true 
        },
    ];

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setInputs({ ...inputs, [name]: value });
    };

    const handleFormReset = () => {
        setInputs(initialData);
    };

    const onSubmit = () => {
        handleFormReset();
    };

    const handleSubmit = usePostData("roles", onSubmit, inputs, validations, '/roles/formulario'); // Utiliza la función validateInputs
    
    return (
        <Forms>
            <h1 className="text-center my-2 mb-8 text-xl font-bold">Formulario Grupos</h1>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={handleSubmit}>
                {inputs1.map(input => (
                    <Input key={input.id} type={input.type} name={input.name} placeholder={input.placeholder} required={input.required} value={input.value} handleInputChange={handleInputChange} />
                ))}

                <div className={inputs1.length % 2 === 0 ? "md:col-span-2" : "flex items-center justify-center mt-6"}>
                    <Button type={'submit'} name={'Enviar'} />
                </div>
            </form>
        </Forms>
    );
};
