import { Consumo, ElementoHasConsumo, Cliente, Elemento, Mora, Dano, Rol } from '../models/index.js';
import { ajustarHora, formatFecha } from './auth/adminsesionController.js';
import { createRecord } from './historialController.js';

const obtenerHoraActual = () => ajustarHora(new Date());

// CREAR CONSUMO
const createConsumption = async (req, res) => {
    try {
        const { area } = req.user;  // Extraemos el área y el adminId de req.user
        const { documento, continuar } = req.body;

        const cliente = await Cliente.findOne({ where: { documento } });

        if (!cliente) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }

        const mora = await Mora.findOne({ where: { clientes_documento: cliente.documento, areas_idarea: area } });

        // Si el cliente está en mora y el frontend no ha enviado "continuar", muestra advertencia
        if (mora && !continuar) {
            return res.status(200).json({ advertencia: 'El cliente está en MORA', continuar: true });
        }
        // Si el cliente está en mora pero el frontend ha enviado "continuar", sigue el proceso

        const dano = await Dano.findOne({ where: { clientes_documento: cliente.documento, areas_idarea: area } });
        if (dano && !continuar) {
            return res.status(200).json({ advertencia: 'El cliente tiene un DAÑO', continuar: true });
        }

        const consumo = await Consumo.create({
            clientes_documento: cliente.documento,
            areas_idarea: area,
        });
        
        const idconsumo = consumo.idconsumo;
        return res.status(200).json({idconsumo})
    } catch (error) {
        return res.status(500).json({mensaje: 'Error al crear el consumo, por favor volver a intentar'})
    }
};    
 
// AGREGAR ELEMENTOS AL CONSUMO
const addElements = async (req, res) => {
    try {

        const { idconsumo } = req.params;
        const { elementos } = req.body;
        const { area, id: adminId } = req.user;

        const consumo = await Consumo.findOne({ where: { idconsumo } });
        const cliente = await Cliente.findOne({ where: {documento: consumo.clientes_documento}});

        if (!consumo) {
            return res.status(404).json({ mensaje: 'Consumo no encontrado' });
        }

        for (let elemento of elementos) {
            const { idelemento, cantidad, observaciones } = elemento;

            if (!observaciones || observaciones == '') {
                return res.status(400).json({mensaje: 'Las observaciones son obligatorias para consumir un elemento'});
            }

            if (cantidad <= 0) {
                return res.status(400).json({ mensaje: `La cantidad no puede ser 0 ni menor que éste`});
            }

            const elementoEncontrado = await Elemento.findOne({ where: { idelemento , areas_idarea: area, tipo: 'consumible'}});
            if (!elementoEncontrado) {
                return res.status(404).json({ mensaje: `Elemento con el ID ${idelemento} no encontrado en el inventario` });
            }

            const dispoTotal = elementoEncontrado.disponibles - elementoEncontrado.minimo;

            const elementoDisponible = await Elemento.findOne({ where: { idelemento, estado: 'disponible', areas_idarea: area }});

            if(!elementoDisponible) {
                return res.status(400).json({ mensaje: `El elemento con el id ${idelemento} se encuentra agotado`})
            }

            if (dispoTotal < cantidad) {
                return res.status(400).json({ mensaje: `No hay suficientes elementos del ID ${idelemento} para hacer el consumo, revise mínimos en el inventario` });
            }

            await ElementoHasConsumo.create({
                elementos_idelemento: idelemento,
                consumos_idconsumo: idconsumo,
                cantidad,
                observaciones,
                fecha: obtenerHoraActual(),
                administradores_documento: adminId
            });

            await Elemento.update(
                {
                    disponibles: elementoEncontrado.disponibles - cantidad,
                    cantidad: elementoEncontrado.cantidad - cantidad,
                    estado: elementoEncontrado.disponibles - cantidad <= elementoEncontrado.minimo ? 'agotado' : 'disponible'
                },
                { where: { idelemento } }
            );
            createRecord(area, 'consumo', consumo.idconsumo, adminId, consumo.clientes_documento, cliente.nombre, idelemento, elementoEncontrado.descripcion, cantidad, observaciones, 'consumo', 'CONSUMIR ELEMENTO DESDE CONSUMO');
        }
        return res.status(201).json({ mensaje: 'Elementos agregados al consumo con éxito' });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al agregar elementos al consumo, por favor vuelva a intentarlo '});
    }
};

// ELIMINAR CONSUMO
const deleteConsumption = async (req,res) => {
    try {
        const deleted = await Consumo.destroy ({
            where: { idconsumo: req.params.idconsumo }
        });
        if(deleted) {
            res.status(201).json({ mensaje: 'Consumo eliminado correctamente'});
        } else {
            res.status(404).json({ mensaje: 'Consumo no encontrado'});
        }
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar el registro de Consumo' });
    }
};

// REGISTROS DE TABLA CONSUMOS, TODOS LOS CONSUMOS
const getAllConsumptions = async (req, res) => {
    try {
        const { area } = req.user;
        const consumos = await ElementoHasConsumo.findAll({
            include: [
              {
                model: Consumo,
                include: [
                  {
                    model: Cliente,  
                    attributes: ['documento', 'nombre', 'roles_idrol']
                  }
                ],
                attributes: ['idconsumo', 'clientes_documento']  
              },
              {
                model: Elemento,
                where: { areas_idarea: area },  
                attributes: ['idelemento', 'descripcion']
              }
            ],
            order: [['fecha', 'DESC']]
          });
        const consumoFormateado = consumos.map(consumo => {
            const fechaAccion = formatFecha(consumo.fecha, 5);
            return {
              ...consumo.dataValues,
              fecha: fechaAccion
            };
          });
      
          res.json(consumoFormateado); 
    } catch (error) {
        console.log(error)
        return res.status(500).json({ mensaje: 'Error al obtener el historial, por favor vuelva a intentarlo'})
    }
}

// REGISTRAR CONSUMO DESDE PRESTAMO
const recordConsumption = async (cantidad, observaciones, idelemento, documento, area, adminId, tipoPrestamo) => {
    const cliente = await Cliente.findOne({ where: {documento: documento}});
    const consumo = await Consumo.create({
        clientes_documento: documento,
        areas_idarea: area,
    });

    const elemento = await Elemento.findOne({where: { idelemento }});

    await ElementoHasConsumo.create({
        elementos_idelemento: idelemento,
        consumos_idconsumo: consumo.idconsumo,
        cantidad,
        observaciones,
        fecha: obtenerHoraActual(),
        administradores_documento: adminId
    });

    if (tipoPrestamo === 'co') {
        createRecord(area, 'consumo', consumo.idconsumo, adminId, documento, cliente.nombre, idelemento, elemento.descripcion, cantidad, observaciones, 'consumo', 'CONSUMIR ELEMENTO DESDE PRESTAMO');
    } else if ( tipoPrestamo === 'es') {
        createRecord(area, 'consumo', consumo.idconsumo, adminId, documento, cliente.nombre, idelemento, elemento.descripcion, cantidad, observaciones, 'consumo', 'CONSUMIR ELEMENTO DESDE PE');
    }
};

//Obtener datos del cliente para mostrar en el consumo
const clienteData = async (req, res) => { 
    try {
        const {idconsumo} = req.params;
        const consumo = await Consumo.findOne({ where: { idconsumo }});
        const cliente = await Cliente.findOne({ where: {documento:consumo.clientes_documento}});
        const rol = cliente.roles_idrol;
        const descripcion = await Rol.findOne({where:{idrol: rol}})
        const nombre = cliente.nombre;
        const documento = cliente.documento;
        const grupo = descripcion.descripcion;
        if (consumo) {
            return res.status(200).json({ documento, nombre, grupo });
        } else {
            return res.status(404).json({ mensaje: 'Consumo no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener el consumo:', error);
        return res.status(500).json({ mensaje: 'Error al obtener el consumo, por favor vuelva a intentarlo' });
    }
}


export { createConsumption, getAllConsumptions, addElements, deleteConsumption, recordConsumption, clienteData};