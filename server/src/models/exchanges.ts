import * as uuid from 'short-uuid'

export default (sequelize, DataTypes) => {
  const exchanges = sequelize.define('exchanges', {
    id: { type: DataTypes.CHAR(22), defaultValue: () => uuid.generate(), primaryKey: true },
    type: { type: DataTypes.STRING },
    exchange: { type: DataTypes.STRING },
    name: { type: DataTypes.STRING },
    supported: { type: DataTypes.INTEGER },
    functions: { type: DataTypes.JSON },
    url: { type: DataTypes.STRING },
    logo: { type: DataTypes.STRING },
    countries: { type: DataTypes.JSON }
  }, {
    timestamps: true,
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    indexes: [
      { unique: true, fields: ['type', 'exchange']}
    ]
  })
  exchanges.associate = function (models) {
    models.exchanges.hasMany(models.accounts)
  }
  return exchanges
}
