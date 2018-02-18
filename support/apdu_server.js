const express = require('express');
const cardRouter = require('./card_router');
const bodyParser = require('body-parser');
const PORT = 8280;
const app = express();

app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use('/card', cardRouter);


app.listen(PORT, () => {console.log(`APDU Server listening on port ${PORT}...`)});