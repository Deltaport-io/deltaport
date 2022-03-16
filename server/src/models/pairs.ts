import * as uuid from 'short-uuid'

export default (sequelize, DataTypes) => {
  const pairs = sequelize.define('pairs', {
    id: { type: DataTypes.CHAR(22), defaultValue: () => uuid.generate(), primaryKey: true },
    pair: { type: DataTypes.STRING },
    cid: { type: DataTypes.STRING },
    base: { type: DataTypes.STRING },
    quote: { type: DataTypes.STRING },
    baseId: { type: DataTypes.STRING },
    quoteId: { type: DataTypes.STRING },
    spot: { type: DataTypes.BOOLEAN }
  }, {
    timestamps: false,
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })
  pairs.associate = function (models) {
    models.pairs.belongsTo(models.accounts)
    models.pairs.belongsTo(models.users)
  }
  return pairs
}
