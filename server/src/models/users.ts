export default (sequelize, DataTypes) => {
  const users = sequelize.define('users', {
    idusers: { type: DataTypes.INTEGER(11).UNSIGNED, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, unique: true },
    password: DataTypes.STRING
  }, {
    timestamps: true,
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
  })
  users.associate = function (models) {
    models.users.hasMany(models.sessions)
    models.users.hasMany(models.passreset)
    models.users.hasMany(models.bots)
    models.users.hasMany(models.accounts)
    models.users.hasMany(models.dexwallets)
  }
  return users
}
