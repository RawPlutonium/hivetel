const axios = require('axios');

describe("API Suite", function(){
    it("Receives post data with status OK", function(done){
        const joc = jasmine.objectContaining;
        
        const postData = {
            name: "Test Data",
            value: 48
        }

       axios.post('http://127.0.0.1:3000/0900620000', postData)
        .then(status => {
            console.log(status);
            expect(status.data).toEqual(joc({status: 'OK', virtualPhone: '0900620000'}));
            done();
        })
        
    })
})