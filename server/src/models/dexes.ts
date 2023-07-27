import * as uuid from 'short-uuid'

export default (sequelize, DataTypes) => {
  const dexes = sequelize.define('dexes', {
    id: { type: DataTypes.CHAR(22), defaultValue: () => uuid.generate(), primaryKey: true },
    name: { type: DataTypes.STRING }
  }, {
    timestamps: true,
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    indexes: [
      { unique: true, fields: ['name']}
    ]
  })
  dexes.associate = function (models) {
    // models.dexes.hasMany(models.dexpools)
  }
  return dexes
}
