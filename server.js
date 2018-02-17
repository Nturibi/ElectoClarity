const bodyParser = require('body-parser');
const express = require('express');
let shortId = require('shortid');
const nodemailer = require('nodemailer');

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

	ALERT_EMAIL = process.env.ALERT_EMAIL;
	ALERT_PASS = process.env.ALERT_PASS;
	const port = process.env.PORT || 3000;
	await app.listen(port);
	console.log(`Server listening on port ${port}!`);
}
main();
async function onPostElection(req, res){
	const message = req.body;
	const resp = await electionCollection.insertOne(message)
	res.json({isSaved: true});
}
app.post('/postelection', jsonParser, onPostElection)

async function onGetIfUser(req, res){
	const queryParams = req.query;
	const email = queryParams.email;
	const query = {email: email};
	 // await profilesCollection.deleteMany(query);
	const response = await profilesCollection.findOne(query);
	let isUser = false;
	if (response != null) isUser = true;
	res.json({isUser: isUser});
}
app.get('/getifuser', jsonParser, onGetIfUser);

async function onSaveProfile(req, res){
	const message =  req.body;
	let isSaved = false;
	const response = await profilesCollection.findOne({email : message.email});
	if (response != null){
		isSaved = true;
	}else{
		await profilesCollection.insertOne(message);
	}
	res.json({isSaved: isSaved});
}
app.post('/adduser', jsonParser, onSaveProfile);

function getTripId(){
	let id = shortId.generate();
	// console.log("The id is: "+id);
	return id;
}


function sendEmail(receipent,subject, message){
	const transporter = nodemailer.createTransport({
		service: 'Gmail',
		// secure:true,
		auth: {
			user: 'swivaralerts@gmail.com',
			pass: '502Swivar!!313'
		}
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

async function onSaveTripData(req, res){
	const body = req.body;
	let id = getTripId();
	body.id = id;
	const response = await tripCollection.insertOne(body);
	if (response != null){
		// console.log("The name is: "+body.fullName+"and the email "+body.email);
		const message = '<p> Hey '+body.creator.split(' ')[0]+', </p><p>You have successfully created a ride group</p>';
		sendEmail(body.creator, "Successfully Created Ride Group!",message);
		//console.log();
		let obj = {
			id: id,
			isSaved: true
		};
		res.json(obj);
	}else{
		res.json({isSaved: false});
	}
}
app.post('/posttripdata', jsonParser, onSaveTripData);

// async



async function onGetResults(req, res){
	const dateInt = parseInt(req.query.date);
	const lowerLimit = dateInt - 1800000;//equivalent to 30 mins
	const upperLimit = dateInt + 1800000;
	// console.log("The date int is: "+dateInt);
	// console.log("the lower: "+lowerLimit+ " the upper: "+u
	//get 30 mins above the time
	const cursor1 = await tripCollection.find({$and: [ {date: {$lt: upperLimit}},  {date: { $gte: lowerLimit}}, {isFull: false}]});
	const list = await cursor1.toArray();
	//debugging
	const cursorT = await tripCollection.find();
	const listT = await cursorT.toArray();
	for (let item of listT){
		if (item.date >= lowerLimit && item.date <= upperLimit){
			console.log("matches criteria!!!");
		}else{
			console.log("No match. Value is: "+ item.date);
		}
	}
	// for (let item of list){
	// 	console.log("find item");
	// }
	// if (list ==null){
	// 	console.log("Result is null");
	// }

	
	// let upperList = [];
	// if (cursor1 != null){
	// 	upperList = cursor1.toArray();
	// }
	//get 30mins before the time
	//think of using modulo
	// const cursor2 = await tripCollection.find({$and: [ {date: {$lt: dateInt}},  {date: { $gte: lowerLimitLimit}}]});
	// const cursor = await tripCollection.find();
	// let  list = await cursor.toArray();

	//you want to query for all results +/- 30 mins
	//your query should be of that date. 
	//should be +/- 30 mins
	res.json(list);
	
}

app.get('/getresults',jsonParser, onGetResults);


async function onGetTripData(req,res){
	const id = req.query.id;
	console.log("On getting the id is: "+id);
	const response = await tripCollection.findOne({id:id});
	res.json(response);
}

app.get('/gettripdata', jsonParser, onGetTripData);
// appp.gget

async function onUpdateTripData(req, res){
	const body = req.body;
	const params = {
		upsert : true
	};
	// console.log("The id is: "+ body.id);
	const response = await tripCollection.findOne({id: body.id});
	response.numPeople = body.numPeople;
	response.isFull = body.isFull;
	response.ppl = body.ppl;
	//optimization here, upsert doesn't work coz of double and single quotes diff
     await tripCollection.update({id:body.id}, response, params);
     const response2 = await tripCollection.findOne({id: body.id});

	if (response2 != null){
		console.log("The email to get the profile is: "+body.email);
		let rsp = await profilesCollection.findOne({email: body.email});
		let  allMembers = [];
		for (let item of response2.ppl){
			const prof = await profilesCollection.findOne({email: item});
			if (item !== body.email){
				allMembers.push (prof.fullName.split(' ')[0]);
				allMembers .push(", ");
			}else{
				console.log("The full name is: "+prof.fullName.split(' ')[0]);

				allMembers.push (prof.fullName);
				allMembers .push(", ");
				// console.log("No member found!!");
				// console.log("All members is now : "+allMembers);
			}
		}
		allMembers.join("");
		const message = '<p> Hey '+rsp.fullName.split(' ')[0]+', </p><p>You have successfully joined a ride group. You will be riding with'+allMembers+'</p>';
		sendEmail(body.email, "Successfully Created Ride Group!",message);

		res.json({isSaved: true});
	}else{
		res.json({isSaved: false});
	}
}
app.post('/updatetripdata', jsonParser, onUpdateTripData);










//Rides Collection
//collection matching rides to ppl
//each ride with a ride id
//ride id,
//array of ppl, max size of 3,
//time  that was set
//the creator,
//from and to destination


// aync function onSearchRiders(){
// 	//TODO: returns all the riders matching the post request
// 	//collection matching rides to ppl
// 	//each ride with a ride id
// 	//ride id,
// 	//array of ppl, max size of 3,
// 	//time  that was set
// 	//the creator,
// 	//from and to destination
// 	//
// }
// app.post('/searchThread', jsonParser, onSearchRiders);
// async function onCreateThread(){
// 	//TODO: creates a new thread and saves to db, and returns success

// }
// app.post('/createThread', jsonParser, onCreateThread);
// async function onDeleteThread(){
// 	//TODO: deletes an existing thread
// }
// async function onEditThread(){
// 	//TODO: edits an existing thread.
// }
// app.post('/editThread');

// async function onCreateProfile(){
// 	//TODO: save user's name and email on the db
// }
// app.post('/createProfile');

// async function onDeleteProfile(){


// }
// app.get('/deleteProfile');
