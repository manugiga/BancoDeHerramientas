import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/connection.js';
import Rol from './rolModel.js';

class Usuario extends Model {}

Usuario.init ({
    documento: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false 
    },
    nombreCompleto: {
        type: DataTypes.STRING(50),
        allowNull: false 
    },
    correo: {
        type: DataTypes.STRING(45),
        allowNull: false 
    },
    contrasena: {
        type: DataTypes.STRING(45),
        allowNull: true,
        validate: {
            len: {
              args: [6, 100],
              msg: 'Mínimo 6 caracteres'
            },
            is: {
              args: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/,
              msg: 'Mínimo 6 caracteres, mínimo 2 número, una letra y un caracter especial'
            }
        }
    },
    fechaInicio: {
        type: DataTypes.DATEONLY,
        allowNull: false 
    },
    fechaFin: {
        type: DataTypes.DATEONLY,
        allowNull: false 
    },
    observaciones: {
        type: DataTypes.STRING(45),
        allowNull: true 
    },
    roles_idrol: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: Rol,
          key: 'idrol',
          allowNull: false
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    }
},  {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios',
    timestamps: false
});

export default Usuario;