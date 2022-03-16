import * as uuid from 'short-uuid'

export default (sequelize, DataTypes) => {
  const jobs = sequelize.define('jobs', {
    id: { type: DataTypes.CHAR(22), defaultValue: () => uuid.generate(), primaryKey: true },
    exchange: { type: DataTypes.STRING },
    pair: { type: DataTypes.STRING },
    cron: { type: DataTypes.STRING }
  }, {
    timestamps: false,
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })
  return jobs
}
