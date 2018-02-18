const bodyParser = require('body-parser');
const express = require('express');
let shortId = require('shortid');
const nodemailer = require('nodemailer');
const xor = require('bitwise-xor');
const secureRandom = require('secure-random');

// swivar

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const app = express();
const jsonParser = bodyParser.json();

app.use(express.static('public'));

let db = null;

let tripCollection = null;
let  profilesCollection = null;
// let miscCollection = null;

// let S3_BUCKET;
// let secretID ;
let ALERT_EMAIL = process.env.ALERT_EMAIL;
let ALERT_PASS = process.env.ALERT_PASS;



async function main() {
	const DATABASE_NAME = 'electo-db';

	const MONGO_URL = `mongodb://localhost:27017/${DATABASE_NAME}`;
	// The "process.env.MONGODB_URI" is needed to work with Heroku.
	db = await MongoClient.connect(process.env.MONGODB_URI || MONGO_URL);
	// The "process.env.PORT" is needed to work with Heroku.
	tripCollection = db.collection("trip");
	profilesCollection = db.collection("profiles");
	// miscCollection = db.collection("misc");
	electionCollection = db.collection("election");
	resultsCollection = db.collection("results");

	ALERT_EMAIL = process.env.ALERT_EMAIL;
	ALERT_PASS = process.env.ALERT_PASS;
	const port = process.env.PORT || 3000;
	await app.listen(port);
	console.log(`Server listening on port ${port}!`);
}
main();
async function onPostElection(req, res){
	const message = req.body;
	message.id = shortId.generate();
	const resp = await electionCollection.insertOne(message)
	const arr = message.contestants;
	console.log("about to log")
	let count = 0;
	for (let item of arr){
		const doc =  {
			electionId: message.id,
			candidate: item,
			votes: 0,
			contId: count
		};
		count++;
		await resultsCollection.insertOne(doc);
	}
	res.json({isSaved: true});
}
app.post('/postelection', jsonParser, onPostElection)

async function onGetContestants(req, res){
	// console.log("Gettin contestants")
	const idOfElection = req.query.id;
	const response = await electionCollection.findOne({id: idOfElection});
	res.json({cont : response});
}


app.get('/getelection', jsonParser, onGetContestants);

async function onGetElections(req, res){
	const cursor = await electionCollection.find();
	const list = await cursor.toArray();
	res.json({elections: list})
}
app.get('/getelections', jsonParser, onGetElections);

async function onPostVote(req, res){
	const message = req.body.vote.ballot;
	const signature = req.body.signature;
	const pad = req.body.vote.pad;
	
	const messageString = JSON.stringify(message);
	// Verify signature later...
	
	
	console.log("The elec id ("+ message.electionId+")");
	console.log("The choice S("+message.choice+")END");
	const query = {
		electionId: message.electionId,
		candidate: message.choice
	};
	console.log(query);
	const response = await resultsCollection.findOne(query);
	console.log(response);
	const votes  = response.votes;
	response.votes = votes + 1;
	console.log("The votes are: "+ response.votes);

	await resultsCollection.update(query, response);
	
	const messageBuffer = Buffer.from(messageString, 'utf8');
	const padBuffer = Buffer.from(pad, 'base64');
	let buff = xor(messageBuffer, padBuffer);
	
	res.json({voted: true, ballotPadded: buff.toString('base64'), signature: secureRandom.randomBuffer(32).toString('base64')});
}

app.post('/postvote', jsonParser, onPostVote)

async function onGetElectionData(req, res){
	const electionId = req.query.electId;
	const query ={
		electionId: electionId
	}
	const cursor = await  resultsCollection.find(query);
	const arr = await cursor.toArray();
	res.json({cont: arr})
}
app.get('/getElectionData', jsonParser, onGetElectionData);





function sendEmail(receipent,subject, message){
	const transporter = nodemailer.createTransport({
		service: 'Gmail',
		user: "",
		pass: "",
		// secure:true,
	});
	if (transporter == null || transporter === null){
		console.log("transporter is null");
	}
	console.log("The email is: "+ALERT_EMAIL+" and the password is: "+ALERT_PASS);
	const mailOptions = {
		from: 'swivaralerts@gmail.com',
		to: receipent,
		subject: subject,
		html: message
	};

	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});
}

