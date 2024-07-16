import { Elemento } from '../models/index.js';
import { Sequelize } from 'sequelize';

// Obtener todos los elementos
const getAllElements = async (req, res) => {
    try {
        const elements = await Elemento.findAll();
        res.json(elements);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener un elemento por id
const getElementById = async (req, res) => {
    try {
        const element = await Elemento.findByPk(req.params.idelemento);
        if (element) {
            res.json(element);
        } else {
            res.status(404).json({ message: 'El elemento ingresado no existe' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener un elemento por su nombre
const getElementByName = async (req, res) => {
    try {
        const descripcion = req.params.descripcion.toLowerCase();
        console.log('Descripción buscada:', descripcion); // Log de la descripción buscada

        const elements = await Elemento.findAll({ 
            where: Sequelize.where(
                Sequelize.fn('LOWER', Sequelize.col('descripcion')),
                'LIKE',
                `%${descripcion}%`
            )
        });
        
        if (elements.length > 0) {
            res.json(elements);
        } else {
            res.status(404).json({ message: 'El elemento buscado no se encuentra' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear un nuevo elemento
const createElement = async (req, res) => {
    try {
        const elementExisting = await Elemento.findByPk(req.body.idelemento);

        if(!elementExisting) { 
            const element = await Elemento.create(req.body);
            res.status(201).json(element);
        } else {
            res.status(400).json({ message: 'El elemento ingresado ya existe' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Actualizar un elemento
const updateElement = async (req, res) => {
    try {
        const element = await Elemento.findByPk(req.params.idelemento);

        if (!element) {
            return res.status(404).json({ message: 'elemento no encontrado' });
        }

        const isSameData = Object.keys(req.body).every(key => element[key] === req.body[key]);

        if (isSameData) {
            return res.status(400).json({ message: 'No se ha hecho ningún cambio en el elemento' });
        }

        const [updated] = await Elemento.update(req.body, {
            where: { idelemento: req.params.idelemento }
        });

        if (updated) {
            const updatedElement = await Elemento.findByPk(req.params.idelemento);
            res.json(updatedElement);
        } else {
            res.status(404).json({ message: 'Error al actualizar el elemento' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Eliminar un elemento
const deleteElement = async (req, res) => {
    try {
        const deleted = await Elemento.destroy({
            where: { idelemento: req.params.idelemento }
        });
        if (deleted) {
            res.status(200).json({ message: 'Elemento eliminado correctamente' });
            // el 204 indica que el servidor ha recibido la solicitud con éxito, pero no devuelve ningún contenido.
        } else {
            res.status(404).json({ message: 'Elemento no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export { getAllElements, getElementById, getElementByName, createElement, updateElement, deleteElement };