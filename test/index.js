let chai = require('chai')
let chaiHttp = require('chai-http')
const expect = require('chai').expect

const config = require('config')

const port = process.env.PORT || config.server.port

chai.use(chaiHttp)
const url = 'http://localhost:' + port

describe('Index Page: ', () => {
  it('should show OK', (done) => {
    chai
      .request(url)
      .get('/')
      .end(function (err, res) {
        console.log(res.body)
        expect(res).to.have.status(200)
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.be.string('OK')
        done()
      })
  })
})
