const express = require('express')
const response = require('../helpers/response')
const admin = require('./admin')

const routes = express.Router()

routes.use(response.setHeadersForCORS)

routes.get('/', (req, res) => {
  response.sendOk(res, {message: "OK"})
})

routes.use('/admin', admin)

routes.use(function (req, res) {
  response.sendNotFound(res)
})

module.exports = routes
