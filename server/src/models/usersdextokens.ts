export default (sequelize, DataTypes) => {
  const usersdextokens = sequelize.define('usersdextokens', {
    // FKs
  }, {
    timestamps: true,
    paranoid: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })
  usersdextokens.associate = (models) => {
    models.usersdextokens.belongsTo(models.users)
    models.usersdextokens.belongsTo(models.dextokens)
  }
  return usersdextokens
}
