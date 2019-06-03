function AppContext(){
    this.responseHeaders = {
        apiKey: '',
        'Content-Type': 'application/json',
        Accept: 'application/json'
    }
}

AppContext.prototype.getResponseHeaders = function(){
    return this.responseHeaders;
}

const appContext = new AppContext();

module.exports = appContext;