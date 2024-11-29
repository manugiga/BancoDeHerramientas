import { Op, Sequelize } from 'sequelize';
import { Encargo, ElementoHasEncargo, Cliente, Elemento, Area, PrestamoCorriente, ElementoHasPrestamoCorriente, Rol } from '../models/index.js';
import { ajustarHora, formatFecha } from './auth/adminsesionController.js';
import { createRecord } from './historialController.js';
import sequelize from '../db/connection.js';

const obtenerHoraActual = () => ajustarHora(new Date());

// INSTRUCTOR CREA EL ENCARGO
const createEncargo = async (req, res) => {
    try {
        const {id: clientes_documento } = req.user;
        const { fecha_reclamo, areas_idarea, contacto } = req.body;
        const clienteExists = await Cliente.findOne({where: {documento: clientes_documento}});
        // let encargo;
        if (!clienteExists) {
            return res.status(400).json({ mensaje: 'La persona no se encuentra registrada'})
        }

        if (!fecha_reclamo) {
            return res.status(400).json({ mensaje: 'Debes ingresar todos los datos'})
        }
        // esta constante debe ir después de la validación de arriba porque sino saldrá error de 'Invalid time value' al intentar ajustar la hora en caso de que no se haya indicado la fecha desde el front y sea undefined
        const fechaReclamo = ajustarHora(new Date(fecha_reclamo)); 

        const currentDate = new Date().toISOString().split('T')[0];
        if (fechaReclamo < currentDate) {
            return res.status(400).json({ mensaje: 'No puedes hacer un encargo para una fecha anterior a la actual' });
        }

        // Verificar si ya existe un encargo para el cliente en la misma fecha de reclamo
        const encargoExists = await Encargo.findOne({
            where: {
                clientes_documento,
                fecha_reclamo: fechaReclamo,
            }
        });

        if (encargoExists) {
            return res.status(400).json({ mensaje: 'Ya tienes un encargo registrado para esta fecha' });
        }

        const encargo = await Encargo.create({
            clientes_documento: clientes_documento,
            areas_idarea: areas_idarea,
            fecha_pedido: obtenerHoraActual(),
            fecha_reclamo: fechaReclamo,
            contacto: contacto
        });

        // if (encargoExists){
        //     encargo = encargoExists;
        // } else {
        //     encargo = encargoNuevo
        // }

        return res.status(200).json(encargo);
    } catch (error) {
        console.log(error)
        res.status(500).json({ mensaje: 'Error al crear el encargo, por favor vuelva a intentarlo'});
    }
};

// Agregar los elementos al encargo
const addElementsEncargo = async (req, res) => {
    const errors = []; // Lista para acumular errores
    const transaction = await sequelize.transaction(); // Crear una transacción
    try {
        const {id: clientes_documento } = req.user;
        const { idarea, idencargo, elementos } = req.body;
        // const { elementos } = req.body;
        const clienteExists = await Cliente.findOne({where: {documento: clientes_documento}, transaction});
        if (!clienteExists) {
            errors.push('La persona no se encuentra registrada');
        }

        const encargo = await Encargo.findOne({where: {idencargo: idencargo}, transaction});
        if (!encargo) {
            errors.push('Encargo no encontrado');
        }

        if (errors.length > 0) {
            await transaction.rollback(); // Deshacer la transacción
            return res.status(400).json({ errores: errors });
        }

        for (let elemento of elementos) {
            const { idelemento, cantidad, observaciones } = elemento;

            const elementoEncontrado = await Elemento.findOne({ where: { idelemento, areas_idarea: idarea }, transaction});
            if (!elementoEncontrado) {
                errors.push(`Elemento con ID ${idelemento} no encontrado en el inventario`);
                continue;
            }

            let dispoTotal = elementoEncontrado.cantidad - elementoEncontrado.minimo;       

            const existeEncargo = await ElementoHasEncargo.findOne({where: {elementos_idelemento: idelemento, estado: 'aceptado'}, transaction});
            if (existeEncargo) {
                const existeEncargoMismaFecha = await Encargo.findOne({where:{idencargo: existeEncargo.encargos_idencargo, fecha_reclamo: encargo.fecha_reclamo}, transaction});
                if (existeEncargoMismaFecha) {
                    dispoTotal = elementoEncontrado.cantidad - elementoEncontrado.minimo - existeEncargo.cantidad;
                } else {
                    dispoTotal = elementoEncontrado.cantidad - elementoEncontrado.minimo;
                }
            }

            if (cantidad <= 0) {
                errors.push(`La cantidad de préstamo para el elemento ${elementoEncontrado.descripcion} no puede ser 0 ni menor que éste`);
                continue;
            }

            if (dispoTotal < cantidad) {
                errors.push(`Del elemento ${elementoEncontrado.descripcion} queda un total máximo de ${dispoTotal} para encargar`);
                continue;
            }

            // const elementoYaEncargado = await ElementoHasEncargo.findOne({where: {encargos_idencargo: idencargo, elementos_idelemento: idelemento}});
            // if (elementoYaEncargado) {
            //     await ElementoHasEncargo.update({
            //         cantidad: elementoYaEncargado.cantidad + cantidad,
            //         observaciones: observaciones,
            //         estado: 'pendiente'
            //     }, {where: {elementos_idelemento: idelemento, encargos_idencargo: idencargo}});
            // } else {}
            await ElementoHasEncargo.create({
                elementos_idelemento: idelemento,
                encargos_idencargo: idencargo,
                cantidad,
                observaciones,
                estado: 'pendiente'
            }, { transaction });           
        }

        if (errors.length > 0) {
            await transaction.rollback(); // Deshacer la transacción si hay errores
            return res.status(400).json({ mensaje: errors });
        }

        await transaction.commit(); // Confirmar la transacción si no hay errores
        return res.status(200).json({ mensaje: 'Elementos encargados con éxito' });

    } catch (error) {
        await transaction.rollback(); // Deshacer la transacción en caso de excepción
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al cargar elementos al encargo, por favor vuelva a intentarlo' });
    }
};

// INSTRUCTOR PUEDE CANCELAR ENCARGO SI AÚN ESTABA PENDIENTE
const cancelEncargo = async (req, res) => {
    try {
        const { idencargo } = req.params;
        const { elemento } = req.body; 

        const encargo = await ElementoHasEncargo.findOne({ where: {encargos_idencargo: idencargo, elementos_idelemento: elemento}});  
        if (!encargo) {
            return res.status(400).json({ mensaje: 'El encargo que intenta cancelar no existe'});
        }
        if (encargo.estado == 'aceptado') {
            return res.status(400).json({ mensaje: 'El encargo ya fue aceptado por el banco de herramientas, no puedes cancelarlo, por favor recarga la página'})
        }
        await ElementoHasEncargo.destroy({ where: {encargos_idencargo: idencargo, elementos_idelemento: elemento}});
        const encargos = await ElementoHasEncargo.findAll({ where: {encargos_idencargo: idencargo}});
        if (encargos.length<1) {
            await Encargo.destroy({where: {idencargo: idencargo}});
        }

        res.status(200).json({mensaje: 'Encargo cancelado correctamente'})
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al cancelar el encargo, por favor vuleva a intentarlo' });
    }
};

// PARA OBTENER LOS ENCARGOS DEL INSTRUCTOR DESDE SU PERFIL
const getInstructorEncargos = async (req, res) => {
    try {
        const { id: clientes_documento } = req.user;
        const encargos = await ElementoHasEncargo.findAll({
            include: [
                {
                    model: Encargo,
                    attributes: ['areas_idarea', 'fecha_reclamo'],
                    where: { clientes_documento: clientes_documento },
                    include: [
                        {
                            model: Area, // Asegúrate de que el modelo Area esté importado
                            attributes: ['nombre'] // Cambia 'nombre' por el campo que necesitas
                        }
                    ]
                },
                {
                    model: Elemento,
                    attributes: ['descripcion']
                }
            ]
        });

        const encargosFormateados = encargos.map(encargo => {
            const fechaReclamo = formatFecha(encargo.Encargo.fecha_reclamo, 5); // Asegúrate de acceder a la fecha correctamente
            return {
                ...encargo.dataValues, // Cambia 'prestamo' por 'encargo'
                fecha_reclamo: fechaReclamo,
                area_nombre: encargo.Encargo.Area.nombre // Accediendo al nombre del área
            };
        });

        return res.status(200).json(encargosFormateados);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los encargos' });
    }
};

// PARA OBTENER LOS ENCARGOS QUE HAYAN EN EL ÁREA DEL ADMIN, DESDE EL PERFIL DEL ADMIN
const getAdminEncargos = async (req, res) => {
    try {
        const { area } = req.user;
        const encargos = await ElementoHasEncargo.findAll({
            include: [
                {
                    model: Encargo,
                    attributes: ['areas_idarea', 'fecha_pedido', 'fecha_reclamo', 'contacto', 'clientes_documento'],
                    include:[{ model: Cliente, attributes:['nombre']}],
                    where: { areas_idarea: area }
                },
                {
                    model: Elemento,
                    attributes: ['descripcion']
                }
            ],
            where: {
                estado: {
                    [Op.ne]: 'rechazado'  // `Op.ne` significa "no igual"
                }
            }
        });

        const encargosFormateados = encargos.map(encargo => {
            const fechaReclamo = formatFecha(encargo.Encargo.fecha_reclamo, 5);
            const fechaPedido = formatFecha(encargo.Encargo.fecha_pedido, 5); 
            return {
                ...encargo.dataValues, 
                fecha_reclamo: fechaReclamo,
                fecha_pedido: fechaPedido
            };
        });

        return res.status(200).json(encargosFormateados);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los encargos' });
    }
};

// ADMIN NIEGA/RECHAZA EL ENCRARGO
const rejectEncargo = async (req, res) => {
    try {
        const { area, id: adminId } = req.user;
        const { idencargo } = req.params;
        const { elemento, observaciones } = req.body; 

        const elementoEncontrado = await Elemento.findOne({where: {idelemento: elemento}})
        const encargoEncargo = await Encargo.findOne({ where: {idencargo: idencargo}})
        const documento = encargoEncargo.clientes_documento;
        const cliente = await Cliente.findOne({where: {documento}})
        const encargo = await ElementoHasEncargo.findOne({ where: {encargos_idencargo: idencargo, elementos_idelemento: elemento}});  
        if (!encargo) {
            return res.status(400).json({ mensaje: 'El encargo que intenta rechazar no existe'});
        }
        if (encargo.estado == 'pendiente') {
            await ElementoHasEncargo.update({estado: 'rechazado', observaciones: observaciones}, {where: {encargos_idencargo: idencargo, elementos_idelemento: elemento}});
        }
        createRecord(area,'encargo', idencargo, adminId, documento, cliente.nombre, elemento, elementoEncontrado.descripcion, encargo.cantidad, observaciones, 'rechazado', 'RECHAZAR ENCARGO'); 

        res.status(200).json({mensaje: 'Encargo rechazado correctamente'})
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al rechazar el encargo, por favor vuleva a intentarlo' });
    }
};

// ADMIN RECLAMA EL ENCARGO
const reclaimEncargo = async (req, res) => {
    try {
        const { area, id: adminId } = req.user;
        const { idencargo } = req.params;
        const { elementos } = req.body; 

        const encargo = await Encargo.findOne({where: {idencargo: idencargo}});
        const documento = encargo.clientes_documento;
        const cliente = await Cliente.findOne({where: {documento}});

        for (let elemento of elementos) {
            const { idelemento, observaciones, estado, reclamado, cantidadReclama } = elemento;
            const cantidadReclamada = Number(cantidadReclama);
            const elementoEncargo = await ElementoHasEncargo.findOne({ where: {encargos_idencargo: idencargo, elementos_idelemento: idelemento}}); 
            const elementoEncontrado = await Elemento.findOne({where: {idelemento: idelemento}});
    
            if (!elementoEncargo) {
                return res.status(400).json({ mensaje: 'El encargo que intenta reclamar no existe'});
            }
            
            if (estado == 'reclamar') {
                if (elementoEncargo.estado == 'aceptado') {
                    const loanExisting = await PrestamoCorriente.findOne({
                        where: { clientes_documento: reclamado, estado: 'actual', areas_idarea: area }
                    });
                    const disponibles = elementoEncontrado.disponibles - elementoEncontrado.minimo;
        
                    if(loanExisting) {
                        const elementoEnPrestamo = await ElementoHasPrestamoCorriente.findOne({
                            where: {
                                elementos_idelemento: idelemento,
                                prestamoscorrientes_idprestamo: loanExisting.idprestamo
                            }
                        });
                        if (elementoEnPrestamo) {
                            const dispoTotal = elementoEnPrestamo.cantidad + disponibles;
                            if (elementoEnPrestamo.cantidad + Number(cantidadReclamada) > dispoTotal) {
                                return res.status(400).json({ mensaje: 'No se puede reclamar el elemento porque la cantidad supera los disponibles'})
                            }
                            await ElementoHasPrestamoCorriente.update(
                                { 
                                    cantidad: elementoEnPrestamo.cantidad + Number(cantidadReclamada), 
                                    observaciones: observaciones,
                                    fecha_entrega: obtenerHoraActual(),
                                },
                                { where: {elementos_idelemento: idelemento, prestamoscorrientes_idprestamo: loanExisting.idprestamo}}
                            );
                            await Elemento.update(
                                {
                                    disponibles: elementoEncontrado.disponibles - Number(cantidadReclamada),
                                    estado: elementoEncontrado.disponibles + Number(cantidadReclamada) <= elementoEncontrado.minimo ? 'agotado' : 'disponible'
                                },
                                { where: { idelemento: idelemento } }
                            ); 
                            // createRecord(area,'prestamo', idprestamo, adminId, prestamo.clientes_documento, elementoEnPrestamo.elementos_idelemento, elementoEncontrado.descripcion, cantidad, observaciones, 'actual', 'AGREGAR ELEMENTO DESDE ENCARGO'); 
                        } else {
                            if (cantidadReclamada > disponibles) {
                                return res.status(400).json({ mensaje: 'No se puede reclamar el elemento porque la cantidad supera los disponibles'});
                            }
                            await ElementoHasPrestamoCorriente.create({
                                elementos_idelemento: idelemento,
                                prestamoscorrientes_idprestamo: loanExisting.idprestamo,
                                cantidad: cantidadReclamada,
                                observaciones,
                                fecha_entrega: obtenerHoraActual(),
                                estado: 'actual'
                            });
                            await Elemento.update(
                                {
                                    disponibles: elementoEncontrado.disponibles - cantidadReclamada,
                                    estado: elementoEncontrado.disponibles + Number(cantidadReclamada) <= elementoEncontrado.minimo ? 'agotado' : 'disponible'
                                },
                                { where: { idelemento: idelemento } }
                            );
                        }
                    } else  {
                        if (cantidadReclamada > disponibles) {
                            return res.status(400).json({ mensaje: 'No se puede reclamar porque supera la cantidad disponible del elemento'})
                        }
                        const prestamo = await PrestamoCorriente.create({
                            clientes_documento: reclamado,
                            estado: 'actual',
                            areas_idarea: area
                        });
                        await ElementoHasPrestamoCorriente.create({
                            elementos_idelemento: idelemento,
                            prestamoscorrientes_idprestamo: prestamo.idprestamo,
                            cantidad: cantidadReclamada,
                            observaciones,
                            fecha_entrega: obtenerHoraActual(),
                            estado: 'actual'
                        });
                        await Elemento.update(
                            {
                                disponibles: elementoEncontrado.disponibles - cantidadReclamada,
                                estado: elementoEncontrado.disponibles + cantidadReclamada <= elementoEncontrado.minimo ? 'agotado' : 'disponible'
                            },
                            { where: { idelemento: idelemento } }
                        );
                    }
                    if (elementoEncargo.cantidad - cantidadReclamada == 0) {
                        await ElementoHasEncargo.destroy({ where: {encargos_idencargo: idencargo, elementos_idelemento: idelemento}});
                    } else {
                        await ElementoHasEncargo.update({cantidad: elementoEncargo.cantidad - cantidadReclamada}, {where: {encargos_idencargo: idencargo, elementos_idelemento: idelemento}});
                    }
                    const encargos = await ElementoHasEncargo.findAll({ where: {encargos_idencargo: idencargo}});
                    if (encargos.length<1) {
                        await Encargo.destroy({where: {idencargo: idencargo}});
                    }
                    
                    createRecord(area,'encargo', idencargo, adminId, reclamado, cliente.nombre, idelemento, elementoEncontrado.descripcion, cantidadReclamada, observaciones, 'actual', `${reclamado} RECLAMÓ ${cantidadReclamada} DE ${documento}`);
                } else {
                    return res.status(400).json({mensaje: 'No puedes reclamar un encargo que no ha sido aceptado'})
                }
            }     
        }
        
        return res.status(200).json({mensaje: 'Encargo aceptado correctamente'})
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al aceptar el encargo, por favor vuleva a intentarlo' });
    }
};

// ACEPTAR EL ENCAGRGO 
const acceptEncargo = async (req, res) => {
    try {
        const { area, id: adminId } = req.user;
        const { idencargo } = req.params;
        const { elemento, observaciones } = req.body; 

        const elementoEncontrado = await Elemento.findOne({where: {idelemento: elemento}})
        const encargoEncargo = await Encargo.findOne({ where: {idencargo: idencargo}})
        const documento = encargoEncargo.clientes_documento;
        const cliente = await Cliente.findOne({where: {documento}})
        const encargo = await ElementoHasEncargo.findOne({ where: {encargos_idencargo: idencargo, elementos_idelemento: elemento}});  
        if (!encargo) {
            return res.status(400).json({ mensaje: 'El encargo que intenta aceptar no existe'});
        }
        // Obtener la fecha actual en formato 'YYYY-MM-DD'
        const currentDate = new Date().toISOString().split('T')[0];

        // Obtener la fecha del encargo (en formato 'YYYY-MM-DD')
        const encargoDate = encargoEncargo.fecha_reclamo.toISOString().split('T')[0];

        // Comparar las fechas (solo la parte de la fecha, sin la hora)
        if (encargoDate < currentDate) {
            return res.status(400).json({ mensaje: 'El encargo no puede ser aceptado, la fecha del encargo ya ha pasado' });
        }
        if (encargo.estado == 'pendiente') {
            await ElementoHasEncargo.update({estado: 'aceptado', observaciones: observaciones}, {where: {encargos_idencargo: idencargo, elementos_idelemento: elemento}});
        }
        createRecord(area,'encargo', idencargo, adminId, documento, cliente.nombre, elemento, elementoEncontrado.descripcion, encargo.cantidad, observaciones, 'aceptado', 'ACEPTAR ENCARGO'); 

        res.status(200).json({mensaje: 'Encargo aceptado correctamente'})
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al aceptar el encargo, por favor vuleva a intentarlo' });
    }
}

// CANCELAR EL ENCAGRGO QUE YA HABÍA ACEPTADO Y DEVOLVERLO A PENDIENTE
const cancelAceptar = async (req, res) => {
    try {
        const { area, id: adminId } = req.user;
        const { idencargo } = req.params;

        const encargoEncargo = await Encargo.findOne({ where: {idencargo: idencargo}})
        const documento = encargoEncargo.clientes_documento;
        const cliente = await Cliente.findOne({where: {documento}})
        const elementosEncargo = await ElementoHasEncargo.findAll({where: {encargos_idencargo: encargoEncargo.idencargo}});

        for (let encargo of elementosEncargo) {
            if (encargo.estado == 'aceptado') {
                await ElementoHasEncargo.update({estado: 'pendiente'}, {where: {encargos_idencargo: idencargo}});
            }
        }
        createRecord(area,'encargo', idencargo, adminId, documento, cliente.nombre, '', '', '', '', 'pendiente', 'CANCELAR ENCARGO ACEPTADO'); 

        res.status(200).json({mensaje: 'Encargo pasado a pendientes correctamente'})
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al pasar a pendiente el encargo, por favor vuleva a intentarlo' });
    }
}

// OBTENER LOS ENCARGOS QUE HAY PARA EL DÍA ACTUAL PARA QUE LE AVISE AL ADMIN AL INICIAR SESION
const encargosHoy = async (today, area) => {
    const encargos = await ElementoHasEncargo.findAll({
        include: [
            {
                model: Encargo,
                where: { 
                    areas_idarea: area,
                    [Op.and]: [
                        Sequelize.where(Sequelize.fn('DATE', Sequelize.col('fecha_reclamo')), today) // Compara solo la fecha
                    ]
                }
            }
        ],
        where: {
            estado: {
                [Op.ne]: 'rechazado'  // `Op.ne` significa "no igual"
            }
        }
    });
    return encargos;
}

// TRAER LO ENCARGOS ACEPTADOS POR PERSONA
const encargosAceptados = async (req, res) => {
    try {
        const { area } = req.user;

        // Consulta los encargos y sus elementos relacionados
        const encargos = await Encargo.findAll({
            where: { areas_idarea: area },
            include: [
                {
                    model: ElementoHasEncargo
                },
                {
                    model: Cliente,
                }
            ]
        }); 
        // Filtrar encargos que tienen al menos un elemento con estado "aceptado"
        const encargosFiltrados = encargos
        .filter(encargo =>
            encargo.ElementoHasEncargos && // Accede al nombre predeterminado
            encargo.ElementoHasEncargos.some(elemento => elemento.estado === 'aceptado')
        )
        .map(encargo => {
            const fechaReclamo = formatFecha(encargo.fecha_reclamo, 5);
            const fechaPedido = formatFecha(encargo.fecha_pedido, 5);
            return {
                ...encargo.dataValues,
                fecha_reclamo: fechaReclamo,
                fecha_pedido: fechaPedido,
            };
        });

        return res.status(200).json(encargosFiltrados);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los encargos' });
    }
};

// PARA TRAER LOS ELEMENTOS QUE YA ESTABAN EN EL PRESTAMO
const findEncargoElements = async (req, res) => {
    const { idencargo } = req.params;
    const { area } = req.user;

    try {
        const loanExisting = await Encargo.findOne({ where: { idencargo: idencargo, areas_idarea: area} });
        const cliente = await Cliente.findOne({ where: {documento:loanExisting.clientes_documento}});
        const rol = cliente.roles_idrol;
        const descripcion = await Rol.findOne({where:{idrol: rol}})
        const nombre = cliente.nombre;
        const documento = cliente.documento;
        const grupo = descripcion.descripcion;
        if (loanExisting) {
            let idencargo = loanExisting.idencargo;
            const loanElements = await ElementoHasEncargo.findAll({ where: { encargos_idencargo: idencargo, estado: 'aceptado' }});

            const elementosEnEncargo = loanElements.map(async loanElement => {
                const { elementos_idelemento, cantidad, observaciones } = loanElement;

                const elemento = await Elemento.findOne({ where: { idelemento: elementos_idelemento }});
                return { elemento, cantidad, observaciones };
            });

            const elementos = await Promise.all(elementosEnEncargo);

            return res.status(200).json({ idencargo, elementos, documento, nombre, grupo });
        } else {
            return res.status(404).json({ mensaje: 'Encargo no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener elementos del encargo:', error);
        return res.status(500).json({ mensaje: 'Error al obtener los elementos del encargo, por favor vuelva a intentarlo' });
    }
};

// ELIMINAR ENCARGO, El instrustor lo cancel cuando apenas va a agregar los elementos
const deleteEncargo = async (req,res) => {
    try {
        const deleted = await Encargo.destroy ({
            where: { idencargo: req.params.idencargo }
        });
        if(deleted) {
            res.status(201).json({ mensaje: 'Encargo eliminado correctamente'});
        } else {
            res.status(404).json({ mensaje: 'Encargo no encontrado'});
        }
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar el registro de Encargo' });
    }
};

// REGISTRSTRAR EN EL HISTORIAL CUANDO UN INSTRUCTOR NO RECLAMA UN ENCARGO
const noReclamarEncargo = async (req, res) => {
    try {
        const { area, id: adminId } = req.user;
        const idencargo = req.params.idencargo;
        const encargo = await Encargo.findOne({where: {idencargo: idencargo}});
        const cliente = await Cliente.findOne({where: {documento: encargo.clientes_documento}});
        await Encargo.destroy ({
            where: { idencargo: idencargo }
        });
        createRecord(area,'encargo', idencargo, adminId, encargo.clientes_documento, cliente.nombre, '', '', '', '', 'no reclamado', 'NO RECLAMÓ ENCARGO'); 
        return res.status(200).json({mensaje: 'Se ha guardado el historial de no reclamado correctamnete'})
    } catch (error) {
        console.log(error)
        res.status(500).json({ mensaje: 'Error al reportar el encargo como no reclamado' });
    }
}

// FINALIZAR UN ENCARGO (NO RECLAMARON TODOS LOS ELEMENTOS, YA NO NOS VAN A RECLAMAR, SE ELIMINA EL ENCARGO)
const finalizarEncargo = async (req, res) => {
    try {
        const { area, id: adminId } = req.user;
        const idencargo = req.params.idencargo;
        const encargo = await Encargo.findOne({where: {idencargo: idencargo}});
        const cliente = await Cliente.findOne({where: {documento: encargo.clientes_documento}});
        await Encargo.destroy ({
            where: { idencargo: idencargo }
        });
        createRecord(area,'encargo', idencargo, adminId, encargo.clientes_documento, cliente.nombre, '', '', '', '', 'finalizado', 'FINALIZAR ENCARGO'); 
        return res.status(200).json({mensaje: 'Se ha guardado el historial de no reclamado correctamnete'})
    } catch (error) {
        console.log(error)
        res.status(500).json({ mensaje: 'Error al reportar el encargo como no reclamado' });
    }
}

export { createEncargo, cancelEncargo, getInstructorEncargos, getAdminEncargos, rejectEncargo, acceptEncargo, reclaimEncargo, cancelAceptar, encargosHoy, addElementsEncargo, encargosAceptados, findEncargoElements, deleteEncargo, noReclamarEncargo, finalizarEncargo };