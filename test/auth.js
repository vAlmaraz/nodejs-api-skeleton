let chai = require('chai')
let chaiHttp = require('chai-http')
const expect = require('chai').expect

const config = require('config')
const jwt = require('jsonwebtoken')
const { User } = require('../models/index')

const port = process.env.PORT || config.server.port

chai.use(chaiHttp)
const url = 'http://localhost:' + port

describe('Auth with non existing user fails: ', () => {
  it('should show success: false', (done) => {
    chai
      .request(url)
      .post('/admin')
      .send({ email: 'nonexistingemail@email.com', password: '1234' })
      .end(function (err, res) {
        expect(res).to.have.status(401)
        expect(res.body).to.have.property('success')
        expect(res.body).to.have.property('message')
        expect(res.body.success).to.be.false
        done()
      })
  })
})

describe('Auth with wrong token fails: ', () => {
  let userData = {
    email: 'email@email.com',
    password: '1234',
    status: 'active',
    role: 'user',
  }
  let user
  beforeEach(async function () {
    user = await User.create(userData)
  })
  afterEach(async function () {
    await user.destroy()
  })
  it('should show No token provided', (done) => {
    chai
      .request(url)
      .get('/admin')
      .end(function (err, res) {
        expect(res).to.have.status(401)
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.be.string('No token provided.')
        done()
      })
  })
  it('should show Failed to authenticate token', (done) => {
    chai
      .request(url)
      .get('/admin')
      .set('x-access-token', 'asdf')
      .end(function (err, res) {
        expect(res).to.have.status(401)
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.be.string('Failed to authenticate token.')
        done()
      })
  })
  it('should show User not found for a valid token but deleted user', (done) => {
    chai
      .request(url)
      .post('/admin')
      .send(userData)
      .end(async function (err, res) {
        await user.destroy()
        chai
          .request(url)
          .get('/admin')
          .set('x-access-token', res.body.token)
          .end(function (err2, res2) {
            expect(res2).to.have.status(401)
            expect(res2.body).to.have.property('message')
            expect(res2.body.message).to.be.string(
              'Failed to authenticate token.',
            )
            done()
          })
      })
  })
  it.skip('should show Failed to authenticate token for an expired token', (done) => {
    let defaultTokenExpire = config.key.tokenExpireInMinutes
    config.key.tokenExpireInMinutes = 0
    chai
      .request(url)
      .post('/admin')
      .send(userData)
      .end(function (err, res) {
        chai
          .request(url)
          .get('/admin')
          .set('x-access-token', res.body.token)
          .end(function (err2, res2) {
            expect(res2).to.have.status(401)
            expect(res2.body).to.have.property('message')
            expect(res2.body.message).to.be.string(
              'Failed to authenticate token.',
            )
            config.key.tokenExpireInMinutes = defaultTokenExpire
            done()
          })
      })
  })
})

describe('Auth with inactive user fails: ', () => {
  let userData = {
    email: 'email@email.com',
    password: '1234',
    status: 'inactive',
  }
  let user
  before(async function () {
    user = await User.create(userData)
  })
  after(async function () {
    await user.destroy()
  })
  it('should show success: false', (done) => {
    chai
      .request(url)
      .post('/admin')
      .send({ email: userData.email, password: userData.password })
      .end(function (err, res) {
        expect(res).to.have.status(401)
        expect(res.body).to.have.property('success')
        expect(res.body).to.have.property('message')
        expect(res.body.success).to.be.false
        done()
      })
  })
})

describe('Auth failed attempts blocks user: ', () => {
  let userData = {
    email: 'email@email.com',
    password: '1234',
    status: 'active',
  }
  let user
  before(async function () {
    user = await User.create(userData)
  })
  after(async function () {
    await user.destroy()
  })
  it('should show success: false', async () => {
    for (let i = 1; i <= 5; i++) {
      await chai
        .request(url)
        .post('/admin')
        .send({ email: userData.email, password: 'wrong pass' })
    }
    user = await User.findByPk(user.id)
    expect(user.authAttempts).to.be.greaterThan(4)
    expect(user.lastAuthAttemptAt).to.not.be.null
    chai
      .request(url)
      .post('/admin')
      .send({ email: userData.email, password: userData.password })
      .end(function (err, res) {
        expect(res).to.have.status(401)
        expect(res.body).to.have.property('success')
        expect(res.body).to.have.property('message')
        expect(res.body.success).to.be.false
      })
  })
})

describe('Auth with good user works: ', () => {
  let userData = {
    email: 'email@email.com',
    password: '1234',
    status: 'active',
  }
  let user
  before(async function () {
    user = await User.create(userData)
  })
  after(async function () {
    await user.destroy()
  })

  it('should authenticate', (done) => {
    chai
      .request(url)
      .post('/admin')
      .send(userData)
      .end(function (err, res) {
        expect(res).to.have.status(200)
        expect(res.body).to.have.property('success')
        expect(res.body).to.have.property('message')
        expect(res.body).to.have.property('token')
        expect(res.body.success).to.be.true
        expect(res.body.token).to.not.be.empty
        done()
      })
  })

  it('should verify token', (done) => {
    chai
      .request(url)
      .post('/admin')
      .send(userData)
      .end(function (err, res) {
        chai
          .request(url)
          .get('/admin')
          .set('x-access-token', res.body.token)
          .end(function (err2, res2) {
            expect(res2).to.have.status(200)
            expect(res2.body).to.have.property('message')
            expect(res2.body.message).to.be.string('OK')
            done()
          })
      })
  })
})
