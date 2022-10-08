import * as uuid from 'short-uuid'

export default (sequelize, DataTypes) => {
  const followtrading = sequelize.define('followtrading', {
    id: { type: DataTypes.CHAR(22), defaultValue: () => uuid.generate(), primaryKey: true },
    name: { type: DataTypes.STRING },
    started: { type: DataTypes.DATE(6) },
    ended: { type: DataTypes.DATE(6) },
    reason: { type: DataTypes.STRING },
    remoteId: { type: DataTypes.STRING },
    // FK dexwallets
    mapping: {
      type: DataTypes.JSON,
      get() {
        const rawData = this.getDataValue('mapping')
        if (typeof rawData === "string") {
          return JSON.parse(rawData)
        } else {
          return rawData
        }
      }
    }
  }, {
    timestamps: true,
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })
  followtrading.associate = function (models) {
    models.followtrading.belongsTo(models.users)
    models.followtrading.belongsTo(models.dexwallets)
  }
  return followtrading
}
