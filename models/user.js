'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    verifyPassword = function(candidatePassword, callback) {
      // TODO: hash password
      callback(this.password == candidatePassword)
    };
    
    getTokenData = function() {
      return {
        id: this.id,
        email: this.email
      }
    }
  }
  User.init(
    {
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      email: {
        type: DataTypes.STRING,
        validate: {
          isEmail: true,
        },
        unique: true
      },
      password: DataTypes.STRING,
      token: {
        type: DataTypes.STRING,
        unique: true
      },
      authAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      lastAuthAttemptAt: {
        type: DataTypes.DATE,
        defaultValue: null
      },
      status: {
        type: DataTypes.STRING,
        isIn: {
          args: [['inactive', 'active', 'blocked']],
          msg: 'Must be Inactive, Active or Blocked',
        },
        defaultValue: "inactive"
      },
      role: {
        type: DataTypes.STRING,
        isIn: {
          args: [['user', 'admin']],
          msg: 'Must be User or Admin',
        },
      },
    },
    {
      sequelize,
      modelName: 'User',
    },
  )
  return User
}
