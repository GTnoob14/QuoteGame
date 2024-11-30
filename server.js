const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const { connect } = require('./db');
const { default: mongoose } = require('mongoose');

const CLIENT_ROOT = '/build/index.html';

app.use(express.static('build'));

app.use(bodyParser.json());


app.get('/', function(req, res) {
    console.log(__dirname + CLIENT_ROOT)
    return res.sendFile(CLIENT_ROOT, {root: __dirname })
});


/**
 * Body:
 * {
 *  "quote": String,
 *  "place": String
 * }
 */
app.post('/api/quotes', (req, res) => {
    const body = req.body;

    console.log(body)
    if (!body.quote || !body.placeTrue || !body.placeWrong || !body.gameId) {
        return res.status(400).json({
            error: "Missing required fields"
        })
    }

    mongoose.model('Game').findOne({ gameId: body.gameId }).then((game) => {
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }
        if (game.ended) {
            return res.status(400).json({ error: "Game has already ended" });
        }

        mongoose.model('Quote').create({
            quote: body.quote,
            placeTrue: body.placeTrue,
            placeWrong: body.placeWrong,
            gameId: body.gameId
        }).then((quote) => {
            console.log(quote)
            return res.status(200).json(quote);
        }).catch((error) => {
            return res.status(500).json({
                error: error.message
            })
        })
    }).catch((error) => {
        return res.status(500).json({
            error: error.message
        })
    })
})

app.get('/api/quotes/:gameId', (req, res) => {
    const gameId = req.params.gameId;
    console.log("test")

    mongoose.model('Quote').find({ gameId: gameId }).then((quotes) => {
        if (quotes.length === 0) {
            return res.status(404).json({ error: "No quotes found for this game ID" });
        }
        return res.status(200).json(quotes);
    }).catch((error) => {
        return res.status(500).json({
            error: error.message
        })
    })
})

app.get('/api/quotes', (req, res) => {
    mongoose.model('Quote').find().then((quotes) => {
        res.status(200).json(quotes);
    }).catch((error) => {
        res.status(500).json({
            error: error.message
        })
    })
})

app.get('/api/game', async (req, res) => {
    const gameId = req.query.id;

    if (!gameId) {
        return res.status(400).json({ error: "Missing game ID" });
    }

    try {
        const game = await mongoose.model('Game').findOne({ gameId: gameId });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }
        return res.status(200).json(game);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.post('/api/game/end', async (req, res) => {
    if (!req.body.password) {
        return res.status(400).json({ error: "Missing password" });
    }
    if (!req.body.gameId) {
        return res.status(400).json({ error: "Missing game ID" });
    }
    
    const gameId = req.body.gameId;
    const game = await mongoose.model('Game').findOne({ gameId: gameId });

    if (!game) {
        return res.status(404).json({ error: "Game not found" });
    }

    if (game.password !== req.body.password) {
        return res.status(401).json({ error: "Incorrect password" });
    }

    try {
        const game = await mongoose.model('Game').findOne({ gameId: gameId });

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        game.ended = true;
        await game.save();

        return res.status(200).json(game);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
})

app.post('/api/game', async (req, res) => {
    const password = req.body.password;
    const id = Math.random().toString(36).substr(2, 9);
    console.log(id);

    let game = await mongoose.model('Game').create({
        gameId: id,
        password: req.body.password,
        ended: false,
        currentQuote: 0,

    });
    
    return res.status(200).json(JSON.stringify(game));
})

app.get('/**', function(req, res) {
    return res.sendFile(CLIENT_ROOT, {root: __dirname })
});

connect();
app.listen(5000, () => {console.log('Server is running on port 5000')});
