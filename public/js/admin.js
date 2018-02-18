////console.log("starting

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
function utoa(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

function atou(str) {
    return decodeURIComponent(escape(window.atob(str)));
}

function checkCardInserted() {
    const fetchOptions = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    };
    const endpoint = window.constants.hardwareAPI + window.constants.cardAPI;
    return fetch(endpoint+"/inserted", fetchOptions).then(a => {
    	return a.json();
	}).then(js => {
		this.selectedCard = null;
		let cards = js['cards'];
		for (let card in cards) {
			if (cards.hasOwnProperty(card)) {
				this.selectedCard = card;
				return true;
			}
		}
		return false;
	});
}
class AdminScreen {
	constructor(){
		console.log("Admin screen starting");
		this.pollForCard = this.pollForCard.bind(this);
		this.initHomePage = this.initHomePage.bind(this);
		this.onSubmitForm = this.onSubmitForm.bind(this);
		this.onSubmitUserData = this.onSubmitUserData.bind(this);
		this.onEnterAdminCard = this.onEnterAdminCard.bind(this)
		this.onClickViz = this.onClickViz.bind(this);
		this.cardPluckedOut = this.cardPluckedOut.bind(this);
		this.cardInserted = true;
		this.timeoutFunc;
		this.crdRemoveTm;
		this.cardOut = false;
		// this.initChart();
		document.querySelector("#myChart").style.display = "none"
		document.querySelector("#eViz").addEventListener("click", this.onClickViz)
		console.log("end cons var "+this.choc)
		this.initHomePage();

	}

	initHomePage(){
		console.log("test var "+this.choc)
		dates('option');
		months1('option');
		years('option', 1920, 2018)
		const yearHolders = document.querySelectorAll(".bear-years")
		for (let elem of yearHolders){
			elem.value = 2018;
		}
		const button = document.querySelector("#addCont")
		button.addEventListener("click", function(event){
			const newElem = document.createElement("input");
			const elem = document.querySelector("#contAdd");
			elem.insertBefore(newElem, button)
		})
		const goButton = document.querySelector("#goHolder1");
		if (goButton != null){
			goButton.addEventListener('click', this.onSubmitForm);
		}
		// const regUser =  document.querySelector("#regUser")
		// regUser.addEventListener("click", )
		this.pollForCard(this.onSubmitUserData)

	}
	pollForCard(handler){
		this.timeoutFunc = setTimeout(function () {
			//TODO  PETER check if card has been inserted and update the this.cardInserted
			checkCardInserted().then(b => {
				this.cardInserted = b;
			});
			const regUser =  document.querySelector("#regUser");
			if (!this.cardInserted){
				regUser.removeEventListener("click", handler);
			}else {
				regUser.addEventListener("click", handler);
			}
			this.pollForCard(handler);
		}.bind(this), 2000);

	}
	onSubmitUserData (event){
		window.clearTimeout(this.timeoutFunc);
		// console.log("Handler working")
		const fName = document.querySelector("input[name = 'fname']").value;
		const lName = document.querySelector("input[name = 'lname']").value;
		const day = document.querySelector("#db").value
		const month = document.querySelector("#mb").value
		const year = document.querySelector("#yb").value
		const gender = document.querySelector("input[name ='gender']:checked").value
		const zip = document.querySelector("input[name ='zip']").value
		let dat = new Date(year+"-"+month+"-"+day);

		document.querySelector("input[name = 'fname']").disabled  = true;
		document.querySelector("input[name = 'lname']").disabled  = true;
		document.querySelector("input[name ='gender']").disabled  = true;
		document.querySelector("input[name ='zip']").disabled  = true;
		document.querySelector("#db").disabled = true;
		document.querySelector("#mb").disabled = true;
		document.querySelector("#yb").disabled = true;
		document.querySelector("input[name ='password']").disabled  = true;


		const regUsr = document.querySelector("#regUser");
  		regUsr.removeEventListener("click", this.onSubmitUserData);
  		document.querySelector("#adminP").classList.remove("inactive");
  		regUsr.addEventListener("click", this.onEnterAdminCard);

		const endpoint = window.constants.hardwareAPI + window.constants.cardAPI;
		const extrendpoint = endpoint + "/extractKeys";
        const fetchOptions = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({"card": card})
        };
		var identity;
		var identityString;
		var pin64 = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="; // Default pin is 32 bytes of 0s
        const card = this.selectedCard; // Implement this somewhere.
		fetch(endpoint + "/erasecard", fetchOptions).then(result => {
			return fetch(endpoint+"/extractkeys", fetchOptions);
		}).then(result => {
			return result.json();
		}).then(keys => {
			// keys: pubkey and adminPubKey
			let pubkey = keys.pubkey;
			let adminPubKey = keys.adminPubKey;


			identity = {
				"name": fName,
				"name_alt": lName,
				"identifier": uuidv4(),
				"useKey": pubkey,
				"administrativeKey": adminPubKey,
				"faceprint": "none; fill in later",
				"sex": gender, // Will handle non-conforming cases if time permits,
				"zip": zip,
				"dd-mm-yy": `${day}-${month}-${year}`
            };
			identityString = JSON.stringify(identity);
			data = utoa(identityString);

			let reqBody = {
				"data": data,
				"pin": pin64,
				"adminPin": pin64,
				"card": card
			};
			fetchOptions.body = JSON.stringify(reqBody);
			return fetch(endpoint + "/sign", fetchOptions);
		}).then(signaturesObj => {
			return signaturesObj.json();
		}).then(signatures => {
			this.signatures = signatures;
			this.identity = identity;
		});

			// this.pollForCard(this.onEnterAdminCard);
			this.cardPluckedOut(this.onEnterAdminCard);
		//TODO: api callss

		//
	}
	cardPluckedOut(handler){
		this.crdRemoveTm = setTimeout(function () {
			//TODO  PETER check if card has been removed and update this.cardOut
            checkCardInserted().then(b => {
                this.cardOut = !b;
            });
			if (this.cardOut){
				this.pollForCard(handler);
				window.clearTimeout(this.crdRemoveTm);
			}else{
				this.cardPluckedOut(handler);
			}
		}.bind(this), 2000);
	}




	onEnterAdminCard(){
		window.clearTimeout(this.timeoutFunc);
		//TODO PETER second insertion
		document.querySelector("#adminP").classList.add("inactive");
		document.querySelector("#userP").classList.remove("inactive");
		const regUsr = document.querySelector("#regUser");
		regUsr.removeEventListener("click", this.onEnterAdminCard);
		regUsr.textContent = "Finish Registation";

		// Assuming the admin card has been substituted in.
		let fetchOptions = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
			body: JSON.stringify({
				"identity": this.identity,
				"userSignature": this.signatures.signature,
				"adminSignature": this.signatures.adminSignature,
				"pin": window.constants.adminCardPIN, // In reality, this should be entered by the administrator
				"card": this.selectedCard,
			}),
		};
		fetch(endpoint+"/registervoter", fetchOptions).then(res => {
			return res.json();
		}).then(signedStuff => {
			this.identityString = signedStuff.identityString;
			this.identitySignature = signedStuff.signature;
		}).catch(e => {
			console.log(e);
		});
	}
	lastStep(){
		//PETER
		console.log("Client card entered");
		var resetPINObject = {
            "card": this.selectedCard,
            "adminPin": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
			"pin": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
			"newPin": this.newPrimaryPIN,
			"which": 0
		};
		let fetchOptions = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
			body: JSON.stringify({
				"signature": this.identitySignature,
				"identity": JSON.parse(this.identityString),
				"card": this.selectedCard,
				"pin": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" // Still default PIN
			})
		};
		fetch(endpoint+"/populatecard", fetchOptions).then(x => {
			fetchOptions.body = JSON.stringify(resetPINObject);
			return fetch(endpoint+"/resetpin", fetchOptions);
		}).then(s => {
			resetPINObject.which = 1;
			resetPINObject.pin = this.newPrimaryPIN;
			resetPINObject.newPin = this.newAdminPIN;
			fetchOptions.body = JSON.stringify(resetPINObject);
			return fetch(endpoint+"/resetpin", fetchOptions);
		}).then(s => {
            new SnackBar(true, "Saved User!");
		}).catch(exc => {
			console.log("error occurred populating card: "+exc);
		});
		this.cardPluckedOut(this.lastStep);
		// this.pollForCard(this.lastStep);
		// regUsr.addEventListener("click", );

	}
	lastStep(){
		const regUsr = document.querySelector("#regUser");
		regUsr.textContent = "Finish Registation";
		//TODO PETER last insertion
		console.log("The last step");
		document.querySelector("#userP").classList.add("inactive");

		new SnackBar(true, "Saved User!");

	}


	getSelectVal(val){
		const stringVal = val;
		const select = document.querySelector(stringVal);
		return select.options[select.selectedIndex].value;
	}



	async onSubmitForm(event){
		// event.preventDefault();
		const day = this.getSelectVal("#dd");
		const month = this.getSelectVal("#mt");
		const  year = this.getSelectVal("#yy")
		console.log("The  dates "+day+" "+month+" "+year)
		const allContestants = []
		const allContInputs = document.querySelectorAll("#contAdd input")
		for (let elem of allContInputs){
			if(elem.value !== ""){
				allContestants.push(elem.value)
			}

		}
		const publicKey = document.querySelector("#pKey").value
		const nameOfElection = document.querySelector("#nameofelection").value
		let dat = new Date(year+"-"+month+"-"+day);
		const message = {
			nameOfElection: nameOfElection,
			date : dat,
			key: publicKey,
			contestants: allContestants
		};
		console.log("The message to the server is ")
		console.log(message)
		const fetchOptions = {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(message)
		};
		const resp = await fetch('/postelection', fetchOptions);
		const jsRes = await resp.json();
		if (jsRes.isSaved){
			new SnackBar(true, "Saved Election!");
			for (let elem of allContInputs){
				elem.value = ""
			}
			document.querySelector("#nameofelection").value = "";
			document.querySelector("#pKey").value = "";
		}
	}
	async onClickViz(){
		const id = document.querySelector("input[name = 'eId']").value;
		if (id != null){
			const response = await fetch('/getElectionData?electId='+id, {method: 'GET'});
			const jsRes = await response.json();
			if (jsRes!= null){
				document.querySelector("#myChart").style.display= "flex"
				this.drawChart(jsRes)
			}

		}
	}
	drawChart(jsRes){
		console.log("jsRes is ")
		console.log(jsRes)
		// document.querySelector("#myChart").style.display = "none"
		// document.querySelector("#eViz").addEventListener("click", this.onClickViz)
		const id = 'ryzaIUIvG'
		// const response = await fetch('/getElectionData?electId='+id, {method: 'GET'});
		// const jsRes = await response.json();
		// console.log("The contestants data ")
		// console.log(jsRes)
		const labels =[]
		for (let item of jsRes.cont){
			labels.push(item.candidate)
		}
		const votes = []
		for (let item of jsRes.cont){
			votes.push(item.votes)
		}



		let ctx = document.getElementById("myChart").getContext('2d');

		let myChart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: labels,
				datasets: [{
					label: '# of Votes',
					data: votes,
					backgroundColor: [
					'rgba(255, 99, 132, 0.2)',
					'rgba(54, 162, 235, 0.2)',
					'rgba(255, 206, 86, 0.2)',
					'rgba(75, 192, 192, 0.2)',
					'rgba(153, 102, 255, 0.2)',
					'rgba(255, 159, 64, 0.2)'
					],
					borderColor: [
					'rgba(255,99,132,1)',
					'rgba(54, 162, 235, 1)',
					'rgba(255, 206, 86, 1)',
					'rgba(75, 192, 192, 1)',
					'rgba(153, 102, 255, 1)',
					'rgba(255, 159, 64, 1)'
					],
					borderWidth: 1
				}]
			},
			options: {
				scales: {
					yAxes: [{
						ticks: {
							beginAtZero:true
						}
					}]
				}
			}
		});



	}

	static async  googleSignInPress(googleUser){
		////console.log("google sign in!!")
		if (startedLogin){
			await UserLogin.googleSignInPress(googleUser);
		}
	}
}
