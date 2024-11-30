const { default: mongoose } = require('mongoose');

const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;

async function connect(){
    const mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();

    await mongoose.connect(uri, {dbName: 'test'});
    console.log('Connected to the database at ' + uri);

    const gameSchema = new mongoose.Schema({
        gameId: String,
        ended: Boolean,
        currentQuote: Number,
        password: String,
    });
    
    const quoteSchema = new mongoose.Schema({
        quote: String,
        placeTrue: String,
        placeWrong: String,
        gameId: { type: String, ref: 'Game' }
    });
    
    mongoose.model('Game', gameSchema);
    mongoose.model('Quote', quoteSchema);
}


module.exports = {
    connect
}