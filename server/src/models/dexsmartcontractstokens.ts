export default (sequelize, DataTypes) => {
  const dexsmartcontractstokens = sequelize.define('dexsmartcontractstokens', {
    // FKs
  }, {
    timestamps: true,
    paranoid: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })
  dexsmartcontractstokens.associate = (models) => {
    models.dexsmartcontractstokens.belongsTo(models.dexsmartcontracts)
    models.dexsmartcontractstokens.belongsTo(models.dextokens)
  }
  return dexsmartcontractstokens
}
