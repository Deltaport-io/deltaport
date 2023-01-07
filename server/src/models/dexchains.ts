export default (sequelize, DataTypes) => {
  const dexchains = sequelize.define('dexchains', {
    id: { type: DataTypes.INTEGER(11).UNSIGNED, primaryKey: true },
    name: { type: DataTypes.STRING },
    currency: { type: DataTypes.STRING },
    rpc: { type: DataTypes.STRING },
    txexplorer: { type: DataTypes.STRING },
    derivationPath: { type:DataTypes.STRING }
  }, {
    timestamps: true,
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })
  dexchains.associate = function (models) {
    // models.dexes.hasMany(models.dexpools)
  }
  return dexchains
}
