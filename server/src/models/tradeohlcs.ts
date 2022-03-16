import * as uuid from 'short-uuid'

export default (sequelize, DataTypes) => {
  const tradeohlcs = sequelize.define('tradeohlcs', {
    id: { type: DataTypes.CHAR(22), defaultValue: () => uuid.generate(), primaryKey: true },
    source: { type: DataTypes.STRING },
    timestamp: { type: DataTypes.DATE(6) },
    open: { type: DataTypes.DECIMAL(10, 4) },
    high: { type: DataTypes.DECIMAL(10, 4) },
    low: { type: DataTypes.DECIMAL(10, 4) },
    close: { type: DataTypes.DECIMAL(10, 4) },
    volume: { type: DataTypes.INTEGER(11).UNSIGNED }
  }, {
    timestamps: false,
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })
  tradeohlcs.associate = function (models) {
    models.tradeohlcs.belongsTo(models.tradesessions)
  }
  return tradeohlcs
}
