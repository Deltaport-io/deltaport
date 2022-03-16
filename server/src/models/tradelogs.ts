import * as uuid from 'short-uuid'

export default (sequelize, DataTypes) => {
  const tradelogs = sequelize.define('tradelogs', {
    id: { type: DataTypes.CHAR(22), defaultValue: () => uuid.generate(), primaryKey: true },
    type: { type: DataTypes.CHAR(10) },
    msg: { type:DataTypes.JSON },
    timestamp: { type:DataTypes.DATE(6), defaultValue: () => sequelize.literal('NOW(6)') }
  }, {
    timestamps: false,
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })
  tradelogs.associate = function (models) {
    models.tradelogs.belongsTo(models.tradesessions)
  }
  return tradelogs
}
