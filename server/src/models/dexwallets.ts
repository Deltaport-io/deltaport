import * as uuid from 'short-uuid'

export default (sequelize, DataTypes) => {
  const dexwallets = sequelize.define('dexwallets', {
    id: { type: DataTypes.CHAR(22), defaultValue: () => uuid.generate(), primaryKey: true },
    name: { type: DataTypes.STRING },
    seedphrase: { type: DataTypes.STRING },
    nodeurl: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    walletindex: { type: DataTypes.INTEGER },
    txviewer: { type: DataTypes.STRING }
  }, {
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    indexes: [
      {unique: true, fields: ['name']}
    ]
  })
  dexwallets.associate = function (models) {
    models.dexwallets.belongsTo(models.users);
  }
  return dexwallets
}
