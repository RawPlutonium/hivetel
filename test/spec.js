const axios = require('axios');

describe("API Suite", function(){
    it("Receives post data with status OK", function(done){
        const joc = jasmine.objectContaining;
        
        const postData = {
            sessionId: '01239234',
            callerNumber: '0214389234',
        }

       axios.post('http://127.0.0.1:5000/eOrF1PGflYgVXrvCN4lK', postData)
        .then(status => {
            console.log(status.data);
            expect(status.data).toEqual(joc({status: 'OK'}));
            done();
        })
        
    })
})