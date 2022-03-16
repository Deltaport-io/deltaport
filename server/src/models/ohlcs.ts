import * as uuid from 'short-uuid'

export default (sequelize, DataTypes) => {
  const ohlcs = sequelize.define('ohlcs', {
    id: { type: DataTypes.CHAR(22), defaultValue: () => uuid.generate(), primaryKey: true },
    timestamp: { type: DataTypes.DATE(6) },
    pair: { type: DataTypes.STRING },
    open: { type: DataTypes.DECIMAL(10, 4) },
    high: { type: DataTypes.DECIMAL(10, 4) },
    low: { type: DataTypes.DECIMAL(10, 4) },
    close: { type: DataTypes.DECIMAL(10, 4) },
    volume: { type: DataTypes.DECIMAL(10, 10) }
  }, {
    timestamps: false,
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })
  ohlcs.associate = function (models) {
    models.ohlcs.belongsTo(models.tradesessions)
  }
  return ohlcs
}
