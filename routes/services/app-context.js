function AppContext(){
    this.responseHeaders = {
        'apiKey': 'b08af78b3e5530d1d6a6835ccedc53b44c8f1834cbccbf2aab41157a8cb892ca',
        'Content-Type': 'application/json',
        'Accept': 'application/xml'
    }
}

AppContext.prototype.getResponseHeaders = function(){
    return this.responseHeaders;
}

const appContext = new AppContext();

module.exports = appContext;