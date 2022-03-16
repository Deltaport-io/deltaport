export default (sequelize, DataTypes) => {
  const dextokens = sequelize.define('dextokens', {
    id: { type: DataTypes.CHAR(43), primaryKey: true },
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
    models.dextokens.hasMany(models.dexpools, {as: 'token0', foreignKey:'token0Id'})
    models.dextokens.hasMany(models.dexpools, {as: 'token1', foreignKey:'token1Id'})
  }
  return dextokens
}
