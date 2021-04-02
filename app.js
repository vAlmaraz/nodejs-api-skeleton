const express = require('express')
const config = require('config')
const helmet = require('helmet')
const routes = require('./routes')

const app = express()

app.disable('x-powered-by')
app.use(helmet())

app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use('/', routes)

const port = process.env.PORT || config.server.port
app.listen(port)
console.log('API server started on port: ' + port)

module.exports = app