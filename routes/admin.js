const express = require('express')
const auth = require('../controllers/auth')

const routes = express.Router()

routes
  .route('/')
  .get(auth.verifyToken, function (req, res) {
    res.send({ message: 'OK' })
  })
  .post(auth.authenticate)

routes.get('/logout', auth.verifyToken, auth.logout)

module.exports = routes
