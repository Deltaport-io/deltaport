export default (sequelize, DataTypes) => {
  const dextokens = sequelize.define('dextokens', {
    id: { type: DataTypes.CHAR(43), primaryKey: true },
    symbol: { type: DataTypes.STRING },
    name: { type: DataTypes.STRING },
    decimals: { type: DataTypes.INTEGER(11).UNSIGNED },
    tracking: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    timestamps: false,
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })
  dextokens.associate = function (models) {
    // models.dextokens.belongsToMany(models.dexpools, { through: models.dexpooltokens })
  }
  return dextokens
}
