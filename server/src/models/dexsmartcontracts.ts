import * as uuid from 'short-uuid'

export default (sequelize, DataTypes) => {
  const dexsmartcontracts = sequelize.define('dexsmartcontracts', {
    id: { type: DataTypes.CHAR(22), defaultValue: () => uuid.generate(), primaryKey: true },
    address: { type: DataTypes.STRING(128) },
    name: { type: DataTypes.STRING(50) },
    description: { type: DataTypes.STRING(300) },
    keywords: { type: DataTypes.TEXT },
    data: { type: DataTypes.TEXT }
  }, {
    timestamps: false,
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    indexes: [
      { type: 'FULLTEXT', name: 'keywords_idx', fields: ['keywords'] }
    ]
  })
  dexsmartcontracts.associate = function (models) {
    models.dexsmartcontracts.belongsToMany(models.dextokens, { through: models.dexsmartcontractstokens })
    models.dexsmartcontracts.belongsTo(models.dexsmartcontractsabis)
    models.dexsmartcontracts.belongsTo(models.dexchains)
  }
  return dexsmartcontracts
}
