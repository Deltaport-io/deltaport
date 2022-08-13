import * as uuid from 'short-uuid'

export default (sequelize, DataTypes) => {
  const backtestgraphs = sequelize.define('backtestgraphs', {
    id: { type: DataTypes.CHAR(22), defaultValue: () => uuid.generate(), primaryKey: true },
    graph: { type: DataTypes.STRING },
    key: { type: DataTypes.STRING },
    timestamp: { type: DataTypes.DATE(6) },
    value: { type: DataTypes.STRING }
  }, {
    timestamps: false,
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })
  backtestgraphs.associate = function (models) {
    models.backtestgraphs.belongsTo(models.backtestsessions)
  }
  return backtestgraphs
}
