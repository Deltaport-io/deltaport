export default (sequelize, DataTypes) => {
  const dexsmartcontractsabis = sequelize.define('dexsmartcontractsabis', {
    name: { type: DataTypes.STRING(150), primaryKey: true },
    abis: {
      type: DataTypes.JSON,
      get() {
        const rawData = this.getDataValue('abis');
        if (typeof rawData === "string") {
          return JSON.parse(rawData)
        } else {
          return rawData
        }
      }
    }
  }, {
    timestamps: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })
  dexsmartcontractsabis.associate = (models) => {
    models.dexsmartcontractsabis.hasMany(models.dexsmartcontracts)
  }
  return dexsmartcontractsabis
}
