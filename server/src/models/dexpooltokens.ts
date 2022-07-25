export default (sequelize, DataTypes) => {
  const dexpooltokens = sequelize.define('dexpooltokens', {
    // FKs
  }, {
    timestamps: true,
    paranoid: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })
  dexpooltokens.associate = (models) => {
    models.dexpooltokens.belongsTo(models.dexpools)
    models.dexpooltokens.belongsTo(models.dextokens)
  }
  return dexpooltokens
}
