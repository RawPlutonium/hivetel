const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ObjectId = Schems.Types.ObjectId;

const options = {
    collection: 'accounts',
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
}

const accountSchema = Schema({
    accountName: String,
    languages: [String],
    agents: [
        {
            agentName: String,
            userId: ObjectId,
            phoneNumber: String,
            preferences: {
                languages: [String],
                services: [String]
            }
        }
    ],
    ivr: {
        serviceName: String,
        actions: {},
        children: {}
    }
}, options);

const Accounts = mongoose.model(accountSchema);

module.exports = Accounts;