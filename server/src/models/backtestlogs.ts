import * as uuid from 'short-uuid'

export default (sequelize, DataTypes) => {
  const backtestlogs = sequelize.define('backtestlogs', {
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
  backtestlogs.associate = function (models) {
    models.backtestlogs.belongsTo(models.backtestsessions)
  }
  return backtestlogs
}
