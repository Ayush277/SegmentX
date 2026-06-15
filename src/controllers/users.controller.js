const { User } = require('../models');
const UsersService = require('../services/users.service');

exports.list = async (req, res) => {
  try {
    const users = await UsersService.listUsers();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = req.body;
    const user = await UsersService.createUser(payload);
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Bad request' });
  }
};

exports.getById = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await UsersService.getUserById(id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
