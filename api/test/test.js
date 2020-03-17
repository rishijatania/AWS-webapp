let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();

chai.use(chaiHttp);
describe("User", () => {
    describe('/POST', () => {
        it('it should create a user if correct data is sent, return user info', (done) => {
            chai.request(server)
                .post('/v1/user')
				.send({
					first_name: 'ABCD',
					last_name: 'snsnvsidvnisduisdbib',
					password: 'Rishi1234',
					email_address: 'rishi@gmail.com'	
				})
                .end((err, res) => {
                    res.should.have.status(201);
                    res.body.should.be.a('object');
                    done();
                });
        });
    });
	describe('/GET', () => {
        it('it should validate user if correct, return user info', (done) => {
            chai.request(server)
                .get('/v1/user/self')
                .auth('rishi@gmail.com','Rishi1234')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    done();
                });
        });

        it('it should validate user if non correct, return unauthorized', (done) => {
            chai.request(server)
                .get('/v1/user/self')
                .auth('rishi@gmail.com','svsfv')
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
    });
});