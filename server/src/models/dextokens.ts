export default (sequelize, DataTypes) => {
  const dextokens = sequelize.define('dextokens', {
    id: { type: DataTypes.CHAR(64), primaryKey: true },
    address: { type: DataTypes.CHAR(43) },
    symbol: { type: DataTypes.STRING },
    name: { type: DataTypes.STRING },
    decimals: { type: DataTypes.INTEGER(11).UNSIGNED }
  }, {
    timestamps: false,
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })
  dextokens.associate = function (models) {
    // models.dextokens.belongsToMany(models.dexpools, { through: models.dexpooltokens })
    models.dextokens.belongsTo(models.dexchains)
    models.dextokens.belongsToMany(models.users, { through: models.usersdextokens })
  }
  return dextokens
}
