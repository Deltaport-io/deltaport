export default (sequelize, DataTypes) => {
  const dexpools = sequelize.define('dexpools', {
    id: { type: DataTypes.CHAR(43), primaryKey: true },
    volume: { type: DataTypes.INTEGER(11).UNSIGNED },
    txcount: { type: DataTypes.INTEGER(11).UNSIGNED },
    feetier: { type: DataTypes.INTEGER(11).UNSIGNED }
  }, {
    timestamps: false,
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })
  dexpools.associate = function (models) {
    models.dexpools.belongsTo(models.dexes)
    models.dexpools.belongsTo(models.dextokens, {as: 'token0', foreignKey:'token0Id'})
    models.dexpools.belongsTo(models.dextokens, {as: 'token1', foreignKey:'token1Id'})
  }
  return dexpools
}
