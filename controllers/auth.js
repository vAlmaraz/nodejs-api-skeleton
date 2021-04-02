const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const config = require('config')
const response = require('../helpers/response')
const { User, Sequelize } = require('../models/index')
const Op = Sequelize.Op

const privateKey = config.key.privateKey
const tokenExpireInMinutes = config.key.tokenExpireInMinutes
const maxAuthAttempts = 5

async function generateTokenAndResetAuthAttempts(user) {
  let token
  if (config.key.auth === 'token') {
    token = jwt.sign(user.getTokenData(), privateKey, {
      expiresIn: tokenExpireInMinutes,
    })
  } else {
    token = crypto
      .createHash('sha256')
      .update(JSON.stringify(user.getTokenData()) + Date.now())
      .digest('base64')
    user.token = token
  }
  user.authAttempts = 0
  user.lastAuthAttemptAt = null
  await user.save()

  return token
}

async function validateToken(token, callback) {
  let success = false
  if (config.key.auth === 'token') {
    jwt.verify(token, privateKey, async function (err, decoded) {
      callback(err, decoded)
    })
  } else {
    let user = await User.findOne({ where: { token: token } })
    let err
    if (!user) err = true
    callback(err, user)
  }

  return success
}

async function invalidateToken(user) {
  if (config.key.auth === 'token') {
    // TODO: Install and use jwt-blacklist
  } else {
    user.token = null
    await user.save()
  }
}

exports.authenticate = async function (req, res) {
  let user = await User.findOne({
    where: {
      email: req.body.email,
      status: 'active',
      authAttempts: { [Op.lt]: maxAuthAttempts },
    },
  })

  if (!user) {
    console.log('Authentication failure: invalid email or no active')
    response.sendUnauthorized(res, 'Authentication failed.')
  } else if (user) {
    user.verifyPassword(req.body.password, async function (isMatch) {
      if (isMatch) {
        const token = await generateTokenAndResetAuthAttempts(user)

        res.json({
          success: true,
          message: 'Token created.',
          token: token,
        })
      } else {
        console.log('Authentication failure: invalid password')
        user.authAttempts++
        user.lastAuthAttemptAt = Date.now()
        await user.save()
        response.sendUnauthorized(res, 'Authentication failed.')
      }
    })
  }
}

exports.verifyToken = async function (req, res, next) {
  const token =
    req.body.token || req.query.token || req.headers['x-access-token']

  if (token) {
    validateToken(token, async function (err, decoded) {
      if (err) {
        console.log('Verification failure: invalid token ' + token)
        response.sendUnauthorized(res, 'Failed to authenticate token.')
      } else {
        let user = await User.findOne({
          where: {
            id: decoded.id,
            status: 'active',
            authAttempts: { [Op.lt]: maxAuthAttempts },
          },
        })
        if (!user) {
          console.log(
            'Verification failure: no user found ' + decoded.id + ' ' + token,
          )
          response.sendUnauthorized(res, 'Failed to authenticate token.')
        } else {
          req.currentUser = user
          next()
        }
      }
    })
  } else {
    response.sendUnauthorized(res, 'No token provided.')
  }
}

exports.logout = async function (req, res) {
  invalidateToken(req.currentUser)
  req.currentUser = null
  res.redirect('/')
}
