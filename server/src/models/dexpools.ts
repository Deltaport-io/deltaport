export default (sequelize, DataTypes) => {
  const dexpools = sequelize.define('dexpools', {
    id: { type: DataTypes.STRING(128), primaryKey: true },
    data: {
      type: DataTypes.JSON,
      get() {
        const rawData = this.getDataValue('data');
        if (typeof rawData === "string") {
          return JSON.parse(rawData)
        } else {
          return rawData
        }
      }
    }
  }, {
    timestamps: false,
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })
  dexpools.associate = function (models) {
    models.dexpools.belongsTo(models.dexes)
    models.dexpools.belongsToMany(models.dextokens, { through: models.dexpooltokens })
  }
  return dexpools
}
