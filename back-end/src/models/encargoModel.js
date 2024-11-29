import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/connection.js';
import Cliente from './clienteModel.js';
import Area from './areaModel.js';

class Encargo extends Model {}

Encargo.init({
    idencargo: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    clientes_documento: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: Cliente,
          key: 'documento',
          allowNull: false
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    areas_idarea: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: Area,
          key: 'idarea',
          allowNull: false
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    fecha_pedido: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_reclamo: {
        type: DataTypes.DATE,
        allowNull: false
    },
    contacto: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
}, {
    sequelize,
    modelName: 'Encargo',
    tableName: 'encargos',
    timestamps: false
});

export default Encargo; 