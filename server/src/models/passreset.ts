export default (sequelize, DataTypes) => {
  const passreset = sequelize.define('passreset', {
    uid: { type: DataTypes.STRING, primaryKey: true }
  }, {
    timestamps: true,
    paranoid: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })

  passreset.associate = function (models) {
    models.passreset.belongsTo(models.users)
  }

  return passreset
}
