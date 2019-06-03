const _ = require('lodash');
const admin = require('firebase-admin');

var serviceAccount = require("/home/shaddy/.config/firebase/hivecube-0101-firebase-adminsdk-us7un-c468e992f9.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://hivecube-0101.firebaseio.com"
});

const db = admin.firestore();

function AccountManager(){
    this.initializedAccounts = {};
}


AccountManager.prototype.initializeAccount = function(accountId){
    // Request for data from 'registeredNumbers/${accountId}'
    if( !db ){
        return null;
    }

    return new Promise((resolve, reject) => {
        db.collection('accounts').doc(accountId).get().then(accountData => {
            // Configure user account 
            if( !accountData.exists ){
                return null;
            }
    
    
            this.configureAccount(accountData.data());
            resolve(accountData.data());
        }).catch(err => {
            console.log(err);
            reject(err);
        })
    })
   
    
}

AccountManager.prototype.getAccountData = function(accountId){

    const accountData = _.find(this.initializedAccounts, accountId);

    if( !accountData ){
        return this.initializeAccount(accountId);
    }

    return new Promise((resolve, reject) => {
        resolve(accountData);
    });
}

AccountManager.prototype.configureAccount = function(accountData){
    if( !accountData ){
        return null;
    }

    const accounts = _.merge( this.initializedAccounts, accountData);

    this.initializeAccount = accounts;
    return accountData;
}



const actionManager = new AccountManager();

module.exports = actionManager;