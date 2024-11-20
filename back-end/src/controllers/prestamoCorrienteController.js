import { PrestamoCorriente, ElementoHasPrestamoCorriente, Cliente, Elemento, Mora, Dano, Rol } from '../models/index.js';
import { ajustarHora, formatFecha } from './auth/adminsesionController.js';
import { createRecord } from './historialController.js';
import { createMora } from './moraController.js';
import { createDano } from './danoController.js';
import { recordConsumption } from './consumoController.js';
import sequelize from '../db/connection.js';

const obtenerHoraActual = () => ajustarHora(new Date());

// CEDER ELEMENTOS EN UN PRESTAMO A OTRA PERSONA
const cederElemento = async (area, adminId, idprestamo, idelemento, descripcion, documento, clienteNombre, cantidadCedido, observaciones, cedio) => {
    const cantidad = Number(cantidadCedido);
    const prestamo = await PrestamoCorriente.findOne({ where: { clientes_documento: documento }, });
    if (prestamo) {
        const elementoYaEnPrestamo = await ElementoHasPrestamoCorriente.findOne({where: {prestamoscorrientes_idprestamo: prestamo.idprestamo, elementos_idelemento: idelemento},});
        if (elementoYaEnPrestamo) {
            await ElementoHasPrestamoCorriente.update(
                {
                    cantidad: elementoYaEnPrestamo.cantidad + cantidad,
                    observaciones: observaciones
                },
                { where: { elementos_idelemento: idelemento, prestamoscorrientes_idprestamo: prestamo.idprestamo},}
            );
        } else {
            await ElementoHasPrestamoCorriente.create({
                elementos_idelemento: idelemento,
                prestamoscorrientes_idprestamo: prestamo.idprestamo,
                cantidad,
                observaciones,
                fecha_entrega: obtenerHoraActual(),
                estado: 'actual'
            });
        }
    } else {
        const prestamo = await PrestamoCorriente.create({
            clientes_documento: documento,
            estado: 'actual',
            areas_idarea: area
        });
        await ElementoHasPrestamoCorriente.create({
            elementos_idelemento: idelemento,
            prestamoscorrientes_idprestamo: prestamo.idprestamo,
            cantidad,
            observaciones,
            fecha_entrega: obtenerHoraActual(),
            estado: 'actual'
        });
    }
    createRecord(area,'prestamo', idprestamo, adminId, documento, clienteNombre, idelemento, descripcion, cantidad, observaciones, 'cedido', cedio+' CEDIÓ ELEMENTO A '+documento);
};

// CREAR UN PRESTAMO
const createLoan = async (req, res) => {
    try {
        const { area, id: adminId } = req.user;
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

        const loanExisting = await PrestamoCorriente.findOne({
            where: { clientes_documento: documento, estado: 'actual', areas_idarea: area }
        });

        if (loanExisting) {
            let idprestamo = loanExisting.idprestamo;
            return res.status(200).json({ idprestamo });
        }

        const prestamo = await PrestamoCorriente.create({
            clientes_documento: cliente.documento,
            estado: 'actual',
            areas_idarea: area
        });

        let idprestamo = prestamo.idprestamo;
        return res.status(200).json({ idprestamo, elementos: [] });

    } catch (error) {
        console.log(error);
        res.status(500).json({ mensaje: 'Error al crear préstamo: ', error });
    }
};

// PARA TRAER LOS ELEMENTOS QUE YA ESTABAN EN EL PRESTAMO
const findLoanElements = async (req, res) => {
    const { idprestamo } = req.params;
    const { area } = req.user;

    try {
        const loanExisting = await PrestamoCorriente.findOne({ where: { idprestamo: idprestamo, estado: 'actual', areas_idarea: area} });
        const cliente = await Cliente.findOne({ where: {documento:loanExisting.clientes_documento}});
        const rol = cliente.roles_idrol;
        const descripcion = await Rol.findOne({where:{idrol: rol}})
        const nombre = cliente.nombre;
        const documento = cliente.documento;
        const grupo = descripcion.descripcion;
        if (loanExisting) {
            let idprestamo = loanExisting.idprestamo;
            const loanElements = await ElementoHasPrestamoCorriente.findAll({ where: { prestamoscorrientes_idprestamo: idprestamo, estado: 'actual' }});

            const elementosEnPrestamo = loanElements.map(async loanElement => {
                const { elementos_idelemento, cantidad, observaciones, fecha_entrega, fecha_devolucion, estado } = loanElement;

                const fecha_entregaFormato = formatFecha(fecha_entrega, 5);
                const fecha_devolucionFormato = formatFecha(fecha_devolucion, 5);
                const elemento = await Elemento.findOne({ where: { idelemento: elementos_idelemento }});
                return { elemento, cantidad, observaciones, fecha_entregaFormato, fecha_devolucionFormato, estado };
            });

            const elementos = await Promise.all(elementosEnPrestamo);

            return res.status(200).json({ idprestamo, elementos, documento, nombre, grupo });
        } else {
            return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener elementos del préstamo:', error);
        return res.status(500).json({ mensaje: 'Error al obtener los elementos del préstamo, por favor vuelva a intentarlo' });
    }
};

// TODAS LAS ACCIONES EN EL FORMULARIO DEL PRESTAMO (ELEMENTOS)
const addOrUpdate = async (req, res) => {
    try {
        const { idprestamo } = req.params;
        const { elementos } = req.body;
        const { area, id: adminId } = req.user;

        const prestamo = await PrestamoCorriente.findOne({ where: { idprestamo, areas_idarea: area },});

        if (!prestamo) {
            return res.status(404).json({ mensaje: 'Prestamo no encontrado' });
        }
        
        const elementosExistentes = await ElementoHasPrestamoCorriente.findAll({
            where: { prestamoscorrientes_idprestamo: idprestamo },
        });

        const idsDelBody = elementos.map((elemento) => elemento.idelemento);

        const cliente = await Cliente.findOne({ where: { documento: prestamo.clientes_documento }, });
        if (!cliente) {
            return res.status(404).json({ mensaje: `Cliente con documento ${prestamo.clientes_documento} no encontrado` });
        }
        const clienteNombre = cliente.nombre;

        for (let elementoExistente of elementosExistentes) {
            if (!idsDelBody.includes(elementoExistente.elementos_idelemento)) {
                const cantidadEliminar = elementoExistente.cantidad;
                const elemento = await Elemento.findOne({ where: { idelemento: elementoExistente.elementos_idelemento }, });
                
                if (elementoExistente.estado == 'actual') {
                    await Elemento.update(
                        {
                            disponibles: elemento.disponibles + cantidadEliminar,
                            estado: elemento.disponibles + cantidadEliminar <= elemento.minimo ? 'agotado' : 'disponible'
                        },
                        { where: { idelemento: elementoExistente.elementos_idelemento }, }
                    );
    
                    await ElementoHasPrestamoCorriente.destroy({
                        where: {
                            prestamoscorrientes_idprestamo: idprestamo,
                            elementos_idelemento: elementoExistente.elementos_idelemento,
                        },
                    });
                    createRecord(area,'prestamo', idprestamo, adminId, prestamo.clientes_documento, clienteNombre, elemento.idelemento, elemento.descripcion, cantidadEliminar, elementoExistente.observaciones, 'finalizado', 'ELIMINAR ELEMENTO');
                }
            }
        }

        for (let elemento of elementos) {
            const { idelemento, cantidad, cantidadd, observaciones, estado, cedido, cantidadCedida } = elemento;
            const cantidadCedido = Number(cantidadCedida);

            const elementoEncontrado = await Elemento.findOne({ where: { idelemento, areas_idarea: area },});
            if (!elementoEncontrado) {
                return res.status(404).json({ mensaje: `Elemento con el ID ${idelemento} no encontrado en el inventario` });
            }
            const dispoTotal = elementoEncontrado.disponibles - elementoEncontrado.minimo;

            if (cantidad <= 0) {
                return res.status(400).json({ mensaje: `La cantidad de préstamo no puede ser 0 ni menor que éste`});
            } else if (cantidadd < 0 || cantidadd > cantidad) {
                return res.status(400).json({ mensaje: `La cantidad de devolución no puede ser menor a 0 ni mayor a la cantidad prestada`})
            }

            const elementoEnPrestamo = await ElementoHasPrestamoCorriente.findOne({
                where: {
                    elementos_idelemento: idelemento,
                    prestamoscorrientes_idprestamo: idprestamo
                },
            });
            
            if (elementoEnPrestamo) {
                const cantidadNueva = cantidad - cantidadd;
                const diferencia = elementoEnPrestamo.cantidad - cantidadNueva; 
                const dispoTotalUpdate = dispoTotal + elementoEnPrestamo.cantidad;
                
                if((dispoTotalUpdate < cantidad) && (cantidad > elementoEnPrestamo.cantidad)) {
                    return res.status(400).json({ mensaje: `La cantidad solicitada del elemento con el id ${idelemento} supera la cantidad disponible de éste`}) 
                } 
                const elementoReq = req.body.elementos.find(e => e.idelemento === elementoEnPrestamo.dataValues.elementos_idelemento);
                const isSameCantidad = Number(elementoReq.cantidad) === Number(elementoEnPrestamo.dataValues.cantidad);
                
                if (isSameCantidad) {
                    if (estado == 'finalizado') {
                        if (elementoEnPrestamo.estado == 'actual') {
                            await ElementoHasPrestamoCorriente.update(
                                { estado: 'finalizado', observaciones: observaciones, fecha_devolucion: obtenerHoraActual() },
                                { where: { elementos_idelemento: idelemento, prestamoscorrientes_idprestamo: idprestamo }, }
                            );
                            await Elemento.update(
                                { 
                                    disponibles: elementoEncontrado.disponibles + cantidad,
                                    estado: elementoEncontrado.disponibles + cantidad <= elementoEncontrado.minimo ? 'agotado' : 'disponible'
                                },
                                { where: { idelemento }, }
                            );
                            await ElementoHasPrestamoCorriente.destroy({
                                where: {
                                    prestamoscorrientes_idprestamo: idprestamo,
                                    elementos_idelemento: idelemento,
                                },
                            });
                            createRecord(area,'prestamo', idprestamo, adminId, prestamo.clientes_documento, clienteNombre, elementoEnPrestamo.elementos_idelemento, elementoEncontrado.descripcion, cantidad, observaciones, 'finalizado', 'DEVOLVER ELEMENTO (total)');
                        }
                    } else if (estado == 'mora') {
                        if (cantidadNueva != 0) {
                            const mora = await createMora(cantidadNueva, observaciones, idelemento, prestamo.clientes_documento, area);
                            await Elemento.update(
                                {
                                    disponibles: elementoEncontrado.disponibles + diferencia,
                                    estado: elementoEncontrado.disponibles + diferencia <= elementoEncontrado.minimo ? 'agotado' : 'disponible'
                                },
                                { where: { idelemento }, }
                            );
                            await ElementoHasPrestamoCorriente.destroy({
                                where: {
                                    prestamoscorrientes_idprestamo: idprestamo,
                                    elementos_idelemento: idelemento,
                                },
                            });
                            createRecord(area, 'mora', mora.idmora, adminId, mora.clientes_documento, clienteNombre, mora.elementos_idelemento, elementoEncontrado.descripcion, mora.cantidad, mora.observaciones, 'mora', 'ENVIAR A MORA');
                        } else {
                            return res.status(400).json({mensaje: 'No puedes reportar mora del elemento si lo vas a devolver completo'})
                        }
                    } else if (estado == 'dano') {
                        if (cantidadNueva != 0) {
                            const dano = await createDano(cantidadNueva, observaciones, idelemento, prestamo.clientes_documento, area);
                            await Elemento.update(
                                {
                                    disponibles: elementoEncontrado.disponibles + diferencia,
                                    estado: elementoEncontrado.disponibles + diferencia <= elementoEncontrado.minimo ? 'agotado' : 'disponible'
                                },
                                { where: { idelemento }, }
                            );
                            await ElementoHasPrestamoCorriente.destroy({
                                where: {
                                    prestamoscorrientes_idprestamo: idprestamo,
                                    elementos_idelemento: idelemento,
                                },
                            });
                            createRecord(area, 'daño', dano.iddano, adminId, dano.clientes_documento, clienteNombre, dano.elementos_idelemento, elementoEncontrado.descripcion, dano.cantidad, dano.observaciones, 'daño', 'REPORTAR DAÑO');
                        } else {
                            return res.status(400).json({mensaje: 'No puedes reportar daño del elemento si lo vas a devolver completo'})
                        }
                    } else if (estado == 'consumo') {
                        if (cantidadNueva != 0) {
                            if (!observaciones || observaciones == '') {
                                return res.status(400).json({mensaje: 'Las observaciones son obligatorias para consumir un elemento'});
                            }
                            const consumo = await recordConsumption(cantidadNueva, observaciones, idelemento, prestamo.clientes_documento, area, adminId, 'co');
                            await Elemento.update(
                                {
                                    cantidad: elementoEncontrado.cantidad - cantidadNueva,
                                    disponibles: elementoEncontrado.disponibles + diferencia,
                                    estado: elementoEncontrado.disponibles + diferencia <= elementoEncontrado.minimo ? 'agotado' : 'disponible'
                                },
                                { where: { idelemento }, }
                            );
                            await ElementoHasPrestamoCorriente.destroy({
                                where: {
                                    prestamoscorrientes_idprestamo: idprestamo,
                                    elementos_idelemento: idelemento,
                                },
                            });
                        } else {
                            return res.status(400).json({mensaje: 'No puedes consumir el elemento si lo vas a devolver completo'})
                        }
                    } else if (estado == 'cedido') {
                        if (cantidadNueva != 0) {
                            const persona = await Cliente.findOne({ where: {documento: cedido},});
                            if(!persona) {
                                return res.status(404).json({ mensaje: `El documento ${cedido}, al cual desea ceder elementos, no existe` });
                            } else if (cedido == prestamo.clientes_documento) {
                                return res.status(400).json({ mensaje: 'No puedes ceder elementos al cliente que actualmente los tiene'})
                            }
                            if (cantidadCedido > elementoEnPrestamo.cantidad || cantidadCedido + Number(cantidadd) > elementoEnPrestamo.cantidad) {
                                return res.status(400).json({ mensaje: 'No se puede ceder una cantidad mayor a la prestada'});
                            }
                            const cedidos = await cederElemento(area, adminId, idprestamo, idelemento, elementoEncontrado.descripcion, cedido, clienteNombre, cantidadCedido, observaciones, prestamo.clientes_documento);
                            await ElementoHasPrestamoCorriente.update(
                                { cantidad: elementoEnPrestamo.cantidad - cantidadCedido - cantidadd },
                                { where: {prestamoscorrientes_idprestamo: idprestamo, elementos_idelemento: idelemento },}
                            );
                            const elementoEnPrestamoDespuesCedido = await ElementoHasPrestamoCorriente.findOne({where: {prestamoscorrientes_idprestamo: idprestamo, elementos_idelemento: idelemento},});
                            if ( elementoEnPrestamoDespuesCedido.cantidad < 1) {
                                await ElementoHasPrestamoCorriente.destroy({ where: {prestamoscorrientes_idprestamo: elementoEnPrestamoDespuesCedido.prestamoscorrientes_idprestamo, elementos_idelemento: idelemento},})
                            }
                            await Elemento.update(
                                {
                                    disponibles: elementoEncontrado.disponibles + diferencia,
                                    estado: elementoEncontrado.disponibles + diferencia <= elementoEncontrado.minimo ? 'agotado' : 'disponible'
                                },
                                { where: { idelemento },}
                            );
                        } else {
                            return res.status(400).json({mensaje: 'No puedes ceder el elemento si lo vas a devolver completo'})
                        }
                    } else {
                        await ElementoHasPrestamoCorriente.update(
                            { cantidad: cantidadNueva, observaciones: observaciones },
                            { where: { elementos_idelemento: idelemento, prestamoscorrientes_idprestamo: idprestamo } ,}
                        );
        
                        await Elemento.update(
                            {
                                disponibles: elementoEncontrado.disponibles + diferencia,
                                estado: elementoEncontrado.disponibles + diferencia <= elementoEncontrado.minimo ? 'agotado' : 'disponible'
                            },
                            { where: { idelemento },}
                        );
                        if (cantidadd != 0) {
                            createRecord(area,'prestamo', idprestamo, adminId, prestamo.clientes_documento, clienteNombre, elementoEnPrestamo.elementos_idelemento, elementoEncontrado.descripcion, cantidadd, observaciones, 'actual', 'DEVOLVER ELEMENTO (parte)'); 
                        }
                    }
                } else {
                    if (estado == 'finalizado' || estado == 'mora' || estado == 'dano' || estado == 'consumo') {
                        return res.status(400).json({ mensaje: 'Actualizaste la cantidad, primero guarda cambios antes de cambiar el estado del préstamo' });
                    }
                    await ElementoHasPrestamoCorriente.update(
                        { cantidad: cantidadNueva, observaciones: observaciones },
                        { where: { elementos_idelemento: idelemento, prestamoscorrientes_idprestamo: idprestamo }, }
                    );
    
                    await Elemento.update(
                        {
                            disponibles: elementoEncontrado.disponibles + diferencia,
                            estado: elementoEncontrado.disponibles + diferencia <= elementoEncontrado.minimo ? 'agotado' : 'disponible'
                        },
                        { where: { idelemento }, }
                    ); 
                    createRecord(area,'prestamo', idprestamo, adminId, prestamo.clientes_documento, clienteNombre, elementoEnPrestamo.elementos_idelemento, elementoEncontrado.descripcion, cantidad, observaciones, 'actual', 'CAMBIAR CANTIDAD'); 
                }

            } else {
                const elementoDisponible = await Elemento.findOne({ where: { idelemento, estado: 'disponible', areas_idarea:area },});
                if (!elementoDisponible) {
                    return res.status(404).json({ mensaje: `Elemento con el ID ${idelemento} agotado` });
                }

                if (dispoTotal < cantidad) {
                    return res.status(400).json({ mensaje: `La cantidad solicitada del elemento con el ID ${idelemento} supera la disponibilidad de éste, revise mínimos en el inventario` });
                }

                await ElementoHasPrestamoCorriente.create({
                    elementos_idelemento: idelemento,
                    prestamoscorrientes_idprestamo: idprestamo,
                    cantidad,
                    observaciones,
                    fecha_entrega: obtenerHoraActual(),
                    estado: 'actual'
                });

                await Elemento.update(
                    {
                        disponibles: elementoEncontrado.disponibles - cantidad,
                        estado: elementoEncontrado.disponibles - cantidad <= elementoEncontrado.minimo ? 'agotado' : 'disponible'
                    },
                    { where: { idelemento }, }
                );
                createRecord(area,'prestamo', idprestamo, adminId, prestamo.clientes_documento, clienteNombre, idelemento, elementoEncontrado.descripcion, cantidad, observaciones, 'actual', 'PRESTAR ELEMENTO'); 
            }

        }
        
        const elementosDelPrestamo = await ElementoHasPrestamoCorriente.findAll({ where: { prestamoscorrientes_idprestamo: idprestamo },});
        const estadosDeElementos = elementosDelPrestamo.map((elemento) => elemento.estado);
        if(!estadosDeElementos.includes('actual')) {
            await PrestamoCorriente.update(
                { estado: 'finalizado'},
                { where: {idprestamo},}
            );
            await PrestamoCorriente.destroy({
                where: {
                    idprestamo: idprestamo,
                    clientes_documento: prestamo.clientes_documento,
                    estado: 'finalizado'
                },
            });
        }

        return res.status(200).json({ mensaje: 'Elementos agregados al prestamo y actualizados con éxito' })

    } catch (error) {
        console.log(error)
        res.status(500).json({ mensaje: 'Error al realizar las acciones en el préstamo, por favor vuelva a intentarlo'});
    }
};

// PARA OBTENER LOS PRESTAMOS ACTIVOS
const getAllLoanElements = async (req, res) => {
    try {
        const { area, id: adminId } = req.user;
        const prestamosTodos = await ElementoHasPrestamoCorriente.findAll({
        include: [
          {
            model: PrestamoCorriente,
            include: [
              {
                model: Cliente,  
                attributes: ['documento', 'roles_idrol', 'nombre']
              }
            ],
            attributes: ['idprestamo', 'clientes_documento']  
          },
          {
            model: Elemento,
            where: { areas_idarea: area },  
            attributes: ['idelemento', 'descripcion']
          }
        ]
      });

      const prestamosFormateados = prestamosTodos.map(prestamo => {
        const fechaEntrega = formatFecha(prestamo.fecha_entrega, 5);
        const fechaDevolucion = formatFecha(prestamo.fecha_devolucion, 5);
        return {
          ...prestamo.dataValues,
          fecha_entrega: fechaEntrega,
          fecha_devolucion: fechaDevolucion,
        };
      });
  
      return res.status(200).json(prestamosFormateados); 
    } catch (error) {
      console.error('Error al obtener los préstamos:', error);
      return res.status(500).json({ error: 'Error al obtener los préstamos' });
    }
};    

export { createLoan, findLoanElements, addOrUpdate, getAllLoanElements };