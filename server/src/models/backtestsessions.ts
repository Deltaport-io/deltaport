import * as uuid from 'short-uuid'

export default (sequelize, DataTypes) => {
  const backtestsessions = sequelize.define('backtestsessions', {
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
  backtestsessions.associate = function (models) {
    models.backtestsessions.hasMany(models.backtestlogs, {onDelete: 'cascade', hooks: true})
    models.backtestsessions.hasMany(models.backtestohlcs, {onDelete: 'cascade', hooks: true})
    models.backtestsessions.belongsTo(models.users)
  }
  return backtestsessions
}
