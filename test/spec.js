const axios = require('axios');
const joc = jasmine.objectContaining;

describe("API Suite", function(){
    it("Receives post data with status OK", function(done){
        
        
        const postData = {
            sessionId: '01239234',
            callerNumber: '0214389234',
        }

       axios.post(' http://874fa028.ngrok.io/eOrF1PGflYgVXrvCN4lK', postData)
        .then(status => {
            console.log(status.data);
            expect(status.data).toEqual(joc({status: 'OK'}));
            done();
        })
        
    });

   
});
