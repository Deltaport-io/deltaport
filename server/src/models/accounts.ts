import * as uuid from 'short-uuid'

export default (sequelize, DataTypes) => {
  const accounts = sequelize.define('accounts', {
    id: { type: DataTypes.CHAR(22), defaultValue: () => uuid.generate(), primaryKey: true },
    name: { type: DataTypes.STRING },
    key: { type: DataTypes.STRING },
    secret: { type: DataTypes.STRING },
    testnet: { type: DataTypes.BOOLEAN }
  }, {
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    indexes: [
      {unique: true, fields: ['name']}
    ]
  })
  accounts.associate = function (models) {
    models.accounts.belongsTo(models.users);
    models.accounts.belongsTo(models.exchanges);
    models.accounts.hasMany(models.pairs);
  }
  return accounts
}
