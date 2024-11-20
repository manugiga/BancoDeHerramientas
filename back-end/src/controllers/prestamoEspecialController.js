import { PrestamoEspecial, ElementoHasPrestamoEspecial, Cliente, Elemento, Mora, Dano, Rol } from '../models/index.js';
import { ajustarHora, formatFecha } from './auth/adminsesionController.js';
import { createRecord } from './historialController.js';
import { createMora } from './moraController.js';
import { createDano } from './danoController.js';
import { recordConsumption } from './consumoController.js';
import { Op, Sequelize } from 'sequelize';
import upload from '../middlewares/archivoPrestamoEspecialMiddleware.js';

const obtenerHoraActual = () => ajustarHora(new Date());

// PARA TRAER LOS ELEMENTOS QUE YA ESTABAN EN EL PRESTAMO ESPECIAL
const findLoanElements = async (req, res) => {
    const { idprestamo } = req.params;
    const { area } = req.user;

    try {
        const loanExisting = await PrestamoEspecial.findOne({ where: { idprestamo: idprestamo, estado: 'actual', areas_idarea: area} });
        const cliente = await Cliente.findOne({ where: {documento:loanExisting.clientes_documento}});
        const rol = cliente.roles_idrol;
        const descripcion = await Rol.findOne({where:{idrol: rol}})
        const nombre = cliente.nombre;
        const documento = cliente.documento;
        const grupo = descripcion.descripcion;
        if (loanExisting) {
            let idprestamo = loanExisting.idprestamo;
            const loanElements = await ElementoHasPrestamoEspecial.findAll({ where: { prestamosespeciales_idprestamo: idprestamo, estado: 'actual' }});

            const elementosEnPrestamo = loanElements.map(async loanElement => {
                const { elementos_idelemento, cantidad, observaciones, fecha_entrega, fecha_devolucion, estado } = loanElement;

                const fecha_entregaFormato = formatFecha(fecha_entrega, 5);
                const fecha_devolucionFormato = formatFecha(fecha_devolucion, 5);
                const elemento = await Elemento.findOne({ where: { idelemento: elementos_idelemento }});
                return { elemento, cantidad, observaciones, fecha_entregaFormato, fecha_devolucionFormato, estado };
            });

            const elementos = await Promise.all(elementosEnPrestamo);

            return res.status(200).json({ idprestamo, elementos, documento, nombre, grupo, loanExisting });
        } else {
            return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener elementos del préstamo:', error);
        return res.status(500).json({ mensaje: 'Error al obtener los elementos del préstamo, por favor vuelva a intentarlo' });
    }
};

// CREAR PRESTAMO ESPECIAL
const createPrestamoEspecial = async (req, res) => {
    try {
        upload.single('archivo')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ mensaje: 'Error desconocido con el archivo' });
            }
            // Parsear elementos desde JSON(Variables de solicitud)
            const elementos = JSON.parse(req.body.elementos);
            const { area, id: adminId } = req.user;
            const { clientes_documento, fecha_inicio, fecha_fin } = req.body;
            const archivo = req.file ? req.file.filename : null;

            if (!fecha_inicio || !fecha_fin || !clientes_documento || !archivo || !elementos) {
                return res.status(400).json({ mensaje: 'Todos los campos son obligatorios'})
            }

            //Verificación de Cliente y Archivo
            const clienteExists = await Cliente.findOne({where: {documento: clientes_documento}});
            if (!clienteExists || clientes_documento == '') {
                return res.status(400).json({ mensaje: 'La persona no se encuentra registrada'})
            }

            if (!fecha_inicio || !fecha_fin) {
                return res.status(400).json({mensaje: 'Las fechas son obligatorias'});
            }

            if (elementos.length<1) {
                return res.status(400).json({mensaje: 'No se han seleccionado los elementos'});
            }

            if (!archivo) {
                return res.status(400).json({mensaje: 'El archivo es obligatorio'});
            }

            if (fecha_inicio > fecha_fin) {
                return res.status(400).json({mensaje: 'La fecha de inicio no puede ser mayor que la fecha de fin'});
            }
            
            //Creación del Préstamo Especial
            const prestamoEspecial = await PrestamoEspecial.create({
                clientes_documento: clientes_documento,
                fecha_inicio: fecha_inicio,
                fecha_fin: fecha_fin,
                archivo: archivo,
                areas_idarea: area,
                estado: 'actual'
            });

            const idprestamo = prestamoEspecial.idprestamo;
            
            for (let elemento of elementos) {
                const { idelemento, cantidad, observaciones } = elemento;

                const elementoEncontrado = await Elemento.findOne({ where: { idelemento, areas_idarea: area }});
                if (!elementoEncontrado) {
                    return res.status(404).json({ mensaje: `Elemento con el ID ${idelemento} no encontrado en el inventario` });
                }
                const dispoTotal = elementoEncontrado.disponibles - elementoEncontrado.minimo;

                if (cantidad <= 0) {
                    return res.status(400).json({ mensaje: `La cantidad de préstamo no puede ser 0 ni menor que éste`});
                }
            
                const elementoDisponible = await Elemento.findOne({ where: { idelemento, estado: 'disponible', areas_idarea:area }});
                if (!elementoDisponible) {
                    return res.status(404).json({ mensaje: `Elemento con el ID ${idelemento} agotado` });
                }

                if (dispoTotal < cantidad) {
                    return res.status(400).json({ mensaje: `La cantidad solicitada del elemento con el ID ${idelemento} supera la disponibilidad de éste, revise mínimos en el inventario` });
                }

                await ElementoHasPrestamoEspecial.create({
                    elementos_idelemento: idelemento,
                    prestamosespeciales_idprestamo: prestamoEspecial.idprestamo,
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
                    { where: { idelemento } }
                );
                createRecord(area,'prestamoes', idprestamo, adminId, prestamoEspecial.clientes_documento, clienteExists.nombre, idelemento, elementoEncontrado.descripcion, cantidad, observaciones, 'actual', 'PRESTAMO ESPECIAL ELEMENTO'); 
            }
            
            //Este Actualiza el estado del Prestamo

            const elementosDelPrestamo = await ElementoHasPrestamoEspecial.findAll({ where: { prestamosespeciales_idprestamo: prestamoEspecial.idprestamo }});
            const estadosDeElementos = elementosDelPrestamo.map((elemento) => elemento.estado);
            if(!estadosDeElementos.includes('actual')) {
                await PrestamoEspecial.update(
                    { estado: 'finalizado'},
                    { where: {idprestamo}}
                );
                await PrestamoEspecial.destroy({
                    where: {
                        idprestamo: prestamoEspecial.idprestamo,
                        clientes_documento: prestamoEspecial.clientes_documento,
                        estado: 'finalizado'
                    }
                });
                // createRecord(area,'prestamo', idprestamo, adminId, prestamo.clientes_documento, null, null, null, 'finalizado', 'FINALIZAR PRESTAMO'); 
            }

            return res.status(200).json({ mensaje: 'Prestamo Especial creado con éxito' })
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ mensaje: 'Error al crear el préstamo especial, por favor vuelva a intentarlo'});
    }
};

// PARA OBTENER LOS PRESTAMOS ESPECIALES ACTIVOS
const getAllLoanElements = async (req, res) => {
    try {
        const { area, id: adminId } = req.user;
        const prestamosTodos = await PrestamoEspecial.findAll({
            include: [
                {
                    model: Cliente,  
                    attributes: ['nombre']
                }
            ],
            where: {
                areas_idarea: area
            }
        });
  
      return res.status(200).json(prestamosTodos); 
    } catch (error) {
      console.error('Error al obtener los préstamos:', error);
      return res.status(500).json({ error: 'Error al obtener los préstamos' });
    }
};  

// TODAS LAS ACCIONES EN EL PRESTAMO ESPECIAL
const addOrUpdate = async (req, res) => {
    try {
        const { idprestamo } = req.params;
        const elementos = JSON.parse(req.body.elementos);
        const { fecha_inicio, fecha_fin } = req.body;
        const { area, id: adminId } = req.user;
        const archivo = req.file ? req.file.filename : null;

        const prestamo = await PrestamoEspecial.findOne({ where: { idprestamo, areas_idarea: area }});

        if (!prestamo) {
            return res.status(404).json({ mensaje: 'Prestamo no encontrado' });
        }
        
        const cliente = await Cliente.findOne({ where: { documento: prestamo.clientes_documento } });
        if (!cliente) {
            return res.status(404).json({ mensaje: `Cliente con documento ${prestamo.clientes_documento} no encontrado` });
        }
        const clienteNombre = cliente.nombre;

        if ((fecha_inicio != prestamo.fecha_inicio || fecha_fin != prestamo.fecha_fin) && !archivo) {
            return res.status(404).json({ mensaje: 'Si las fechas del préstamo especial cambian debes ingresar el nuevo documento que lo certifique' });
        }

        if (archivo && fecha_inicio == prestamo.fecha_inicio && fecha_fin == prestamo.fecha_fin) {
            return res.status(404).json({ mensaje: 'Si las fechas del prestamo especial no han cambiado no debes registrar un archivo nuevo, si necesitas hacer algún cambio en los elementos debes registrar de nuevo el préstamo con las modificaciones que necesites y el nuevo archivo' });
        }

        if (archivo) {
            await PrestamoEspecial.update(
                {fecha_inicio: fecha_inicio, fecha_fin: fecha_fin, archivo: archivo},
                {where: {idprestamo:idprestamo}}
            )
        } else {
            await PrestamoEspecial.update(
                {fecha_inicio: fecha_inicio, fecha_fin: fecha_fin},
                {where: {idprestamo:idprestamo}}
            )
        }

        for (let elemento of elementos) {
            const { idelemento, cantidad, cantidadd, observaciones, estado } = elemento;

            const elementoEncontrado = await Elemento.findOne({ where: { idelemento, areas_idarea: area }});
            if (!elementoEncontrado) {
                return res.status(404).json({ mensaje: `Elemento con el ID ${idelemento} no encontrado en el inventario` });
            }
            const dispoTotal = elementoEncontrado.disponibles - elementoEncontrado.minimo;

            if (cantidad <= 0) {
                return res.status(400).json({ mensaje: `La cantidad de préstamo no puede ser 0 ni menor que éste`});
            } else if (cantidadd < 0 || cantidadd > cantidad) {
                return res.status(400).json({ mensaje: `La cantidad de devolución no puede ser menor a 0 ni mayor a la cantidad prestada`})
            }

            const elementoEnPrestamo = await ElementoHasPrestamoEspecial.findOne({
                where: {
                    elementos_idelemento: idelemento,
                    prestamosespeciales_idprestamo: idprestamo
                }
            });
            
            if (elementoEnPrestamo) {
                const cantidadNueva = cantidad - cantidadd;
                const diferencia = elementoEnPrestamo.cantidad - cantidadNueva; 
                const dispoTotalUpdate = dispoTotal + elementoEnPrestamo.cantidad;
                
                if((dispoTotalUpdate < cantidad) && (cantidad > elementoEnPrestamo.cantidad)) {
                    return res.status(400).json({ mensaje: `La cantidad solicitada del elemento con el id ${idelemento} supera la cantidad disponible de éste`}) 
                } 
                const elementoReq = elementos.find(e => e.idelemento === elementoEnPrestamo.dataValues.elementos_idelemento);
                const isSameCantidad = Number(elementoReq.cantidad) === Number(elementoEnPrestamo.dataValues.cantidad);
                
                if (isSameCantidad) {
                    if (estado == 'finalizado') {
                        if (elementoEnPrestamo.estado == 'actual') {
                            createRecord(area,'prestamoes', idprestamo, adminId, prestamo.clientes_documento, clienteNombre, elementoEnPrestamo.elementos_idelemento, elementoEncontrado.descripcion, cantidad, observaciones, 'finalizado', 'DEVOLVER ELEMENTO PE (total)');
                            await ElementoHasPrestamoEspecial.update(
                                { estado: 'finalizado', observaciones: observaciones, fecha_devolucion: obtenerHoraActual() },
                                { where: { elementos_idelemento: idelemento, prestamosespeciales_idprestamo: idprestamo } }
                            );
                            await Elemento.update(
                                { 
                                    disponibles: elementoEncontrado.disponibles + cantidad,
                                    estado: elementoEncontrado.disponibles + cantidad <= elementoEncontrado.minimo ? 'agotado' : 'disponible'
                                },
                                { where: { idelemento } }
                            );
                            await ElementoHasPrestamoEspecial.destroy({
                                where: {
                                    prestamosespeciales_idprestamo: idprestamo,
                                    elementos_idelemento: idelemento,
                                }
                            });
                        }
                    } else if (estado == 'mora') {
                        if (cantidadNueva != 0) {
                            const mora = await createMora(cantidadNueva, observaciones, idelemento, prestamo.clientes_documento, area);
                            createRecord(area, 'mora', mora.idmora, adminId, mora.clientes_documento, clienteNombre, mora.elementos_idelemento, elementoEncontrado.descripcion, mora.cantidad, mora.observaciones, 'mora', 'ENVIAR A MORA PE');
                            await Elemento.update(
                                {
                                    disponibles: elementoEncontrado.disponibles + diferencia,
                                    estado: elementoEncontrado.disponibles + diferencia <= elementoEncontrado.minimo ? 'agotado' : 'disponible'
                                },
                                { where: { idelemento } }
                            );
                            await ElementoHasPrestamoEspecial.destroy({
                                where: {
                                    prestamosespeciales_idprestamo: idprestamo,
                                    elementos_idelemento: idelemento,
                                }
                            });
                        } else {
                            return res.status(400).json({mensaje: 'No puedes reportar mora del elemento si lo vas a devolver completo'})
                        }
                    } else if (estado == 'dano') {
                        if (cantidadNueva != 0) {
                            const dano = await createDano(cantidadNueva, observaciones, idelemento, prestamo.clientes_documento, area);
                            createRecord(area, 'daño', dano.iddano, adminId, dano.clientes_documento, clienteNombre, dano.elementos_idelemento, elementoEncontrado.descripcion, dano.cantidad, dano.observaciones, 'daño', 'REPORTAR DAÑO PE');
                            await Elemento.update(
                                {
                                    disponibles: elementoEncontrado.disponibles + diferencia,
                                    estado: elementoEncontrado.disponibles + diferencia <= elementoEncontrado.minimo ? 'agotado' : 'disponible'
                                },
                                { where: { idelemento } }
                            );
                            await ElementoHasPrestamoEspecial.destroy({
                                where: {
                                    prestamosespeciales_idprestamo: idprestamo,
                                    elementos_idelemento: idelemento,
                                }
                            });
                        } else {
                            return res.status(400).json({mensaje: 'No puedes reportar daño del elemento si lo vas a devolver completo'})
                        }
                    } else if (estado == 'consumo') {
                        if (cantidadNueva != 0) {
                            if (!observaciones || observaciones == '') {
                                return res.status(400).json({mensaje: 'Las observaciones son obligatorias para consumir un elemento'});
                            }
                            const consumo = await recordConsumption(cantidadNueva, observaciones, idelemento, prestamo.clientes_documento, area, adminId, 'es');
                            await Elemento.update(
                                {
                                    cantidad: elementoEncontrado.cantidad - cantidadNueva,
                                    disponibles: elementoEncontrado.disponibles + diferencia,
                                    estado: elementoEncontrado.disponibles + diferencia <= elementoEncontrado.minimo ? 'agotado' : 'disponible'
                                },
                                { where: { idelemento } }
                            );
                            await ElementoHasPrestamoEspecial.destroy({
                                where: {
                                    prestamosespeciales_idprestamo: idprestamo,
                                    elementos_idelemento: idelemento,
                                }
                            });
                        } else {
                            return res.status(400).json({mensaje: 'No puedes consumir el elemento si lo vas a devolver completo'})
                        }
                    } else {
                        await ElementoHasPrestamoEspecial.update(
                            { cantidad: cantidadNueva, observaciones: observaciones },
                            { where: { elementos_idelemento: idelemento, prestamosespeciales_idprestamo: idprestamo } }
                        );
        
                        await Elemento.update(
                            {
                                disponibles: elementoEncontrado.disponibles + diferencia,
                                estado: elementoEncontrado.disponibles + diferencia <= elementoEncontrado.minimo ? 'agotado' : 'disponible'
                            },
                            { where: { idelemento }}
                        );
                        if (cantidadd != 0) {
                            createRecord(area,'prestamoes', idprestamo, adminId, prestamo.clientes_documento, clienteNombre, elementoEnPrestamo.elementos_idelemento, elementoEncontrado.descripcion, cantidadd, observaciones, 'actual', 'DEVOLVER ELEMENTO (parte) PE'); 
                        }
                    }
                }
            }
        }
        
        const elementosDelPrestamo = await ElementoHasPrestamoEspecial.findAll({ where: { prestamosespeciales_idprestamo: idprestamo }});
        const estadosDeElementos = elementosDelPrestamo.map((elemento) => elemento.estado);
        if(!estadosDeElementos.includes('actual')) {
            await PrestamoEspecial.update(
                { estado: 'finalizado'},
                { where: {idprestamo}}
            );
            await PrestamoEspecial.destroy({
                where: {
                    idprestamo: idprestamo,
                    clientes_documento: prestamo.clientes_documento,
                    estado: 'finalizado'
                }
            });
        }

        return res.status(200).json({ mensaje: 'Préstamo especial procesado con éxito' })

    } catch (error) {
        console.log(error)
        res.status(500).json({ mensaje: 'Error al realizar las acciones en el préstamo, por favor vuelva a intentarlo'});
    }
};

// PARA OBTENER LOS PRESTAMOS ESPECIALES ACTIVOS
const getAllLoanElementsTotal = async (req, res) => {
    try {
        const { area, id: adminId } = req.user;
        const prestamosTodos = await ElementoHasPrestamoEspecial.findAll({
            include: [
              {
                model: PrestamoEspecial,
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
  
      return res.status(200).json(prestamosTodos); 
    } catch (error) {
      console.error('Error al obtener los préstamos:', error);
      return res.status(500).json({ error: 'Error al obtener los préstamos' });
    }
};

// OBTENER LOS PRESTAMOS ESPECIALES A LOS QUE SE LES VENCE LA PÓLIZA EL DIA DESPUÉS
const prestamosesManana = async (tomorrow, area) => {
    const prestamos = await ElementoHasPrestamoEspecial.findAll({
        include: [
            {
                model: PrestamoEspecial,
                where: { 
                    areas_idarea: area,
                    [Op.and]: [
                        Sequelize.where(Sequelize.fn('DATE', Sequelize.col('fecha_fin')), tomorrow) // Compara solo la fecha
                    ]
                }
            }
        ]
    });
    return prestamos;
};

export { findLoanElements, createPrestamoEspecial, getAllLoanElements, addOrUpdate, getAllLoanElementsTotal, prestamosesManana };