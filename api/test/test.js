let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();

chai.use(chaiHttp);
describe("User", () => {
    describe('/GET', () => {
        it('it should validate user if correct, return user info', (done) => {
            chai.request(server)
                .get('/v1/user/self')
                .set("Authorization", "Basic " + new Buffer("rishi@gmail.com:Rishi@1234").toString("base64"))
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    done();
                });
        });

        it('it should validate user if non correct, return unauthorized', (done) => {
            chai.request(server)
                .get('/v1/user/self')
                .set("Authorization", "Basic " + new Buffer("rishi@gmail.com:svsfv").toString("base64"))
                .end((err, res) => {
                    res.should.have.status(400);
                    done();
                });
        });
    });
});