export default (sequelize, DataTypes) => {
  const dexsmartcontracts = sequelize.define('dexsmartcontracts', {
    id: { type: DataTypes.STRING(128), primaryKey: true },
    name: { type: DataTypes.STRING(50) },
    description: { type: DataTypes.STRING(300) },
    keywords: { type: DataTypes.TEXT },
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
    collate: 'utf8mb4_general_ci',
    indexes: [
      { type: 'FULLTEXT', name: 'keywords_idx', fields: ['keywords'] }
    ]
  })
  dexsmartcontracts.associate = function (models) {
    // models.dexsmartcontracts.belongsTo(models.dexes)
    models.dexsmartcontracts.belongsToMany(models.dextokens, { through: models.dexsmartcontractstokens })
  }
  return dexsmartcontracts
}
