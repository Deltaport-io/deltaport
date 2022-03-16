import * as uuid from 'short-uuid'

export default (sequelize, DataTypes) => {
  const tradesessions = sequelize.define('tradesessions', {
    id: { type: DataTypes.CHAR(22), defaultValue: () => uuid.generate(), primaryKey: true },
    name: { type: DataTypes.STRING },
    started: { type: DataTypes.DATE(6) },
    ended: { type: DataTypes.DATE(6) },
    reason: { type: DataTypes.STRING },
    code: { type: DataTypes.TEXT }
  }, {
    timestamps: true,
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })
  tradesessions.associate = function (models) {
    models.tradesessions.hasMany(models.tradelogs, {onDelete: 'cascade', hooks: true})
    models.tradesessions.hasMany(models.tradeohlcs, {onDelete: 'cascade', hooks: true})
    models.tradesessions.belongsTo(models.users)
  }
  return tradesessions
}
