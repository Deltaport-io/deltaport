import * as uuid from 'short-uuid'

export default (sequelize, DataTypes) => {
  const subtradesessions = sequelize.define('subtradesessions', {
    id: { type: DataTypes.CHAR(22), defaultValue: () => uuid.generate(), primaryKey: true },
    remoteId: { type: DataTypes.CHAR(22) }
  }, {
    timestamps: true,
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })
  subtradesessions.associate = function (models) {
    models.subtradesessions.belongsTo(models.tradesessions)
    models.subtradesessions.belongsTo(models.dexwallets)
  }
  return subtradesessions
}
