const { User } = require('../models');

exports.listUsers = async () => {
  return User.findAll({ order: [['createdAt', 'DESC']] });
};

exports.createUser = async (data) => {
  if (!data.email || !data.name) throw new Error('name and email are required');
  const user = await User.create({ name: data.name, email: data.email, phone: data.phone });
  return user;
};

exports.getUserById = async (id) => {
  return User.findByPk(id);
};
