import * as uuid from 'short-uuid'

export default (sequelize, DataTypes) => {
  const bots = sequelize.define('bots', {
    id: { type: DataTypes.CHAR(22), defaultValue: () => uuid.generate(), primaryKey: true },
    name: { type: DataTypes.STRING },
    code: { type: DataTypes.TEXT }
  }, {
    timestamps: true,
    paranoid: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })
  bots.associate = function (models) {
    models.bots.belongsTo(models.users);
  }
  return bots
}