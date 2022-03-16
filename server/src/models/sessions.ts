export default (sequelize, DataTypes) => {
  const sessions = sequelize.define('sessions', {
    token: { type: DataTypes.STRING, primaryKey: true }
  }, {
    timestamps: true,
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
  })

  sessions.associate = function (models) {
    models.sessions.belongsTo(models.users)
  }

  return sessions
}
