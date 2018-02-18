class VotePage {
	constructor(id){
		console.log("GOt the id "+id)
		this.id = id;
		this.nameOfElection = "Presidential Election";
		this.choice = "";
		this.cardLoaded = true;
		this.allContainers = [];
		this.gButton = null;
		this.initVoterPage = this.initVoterPage.bind(this);
		this.createContestantHolder = this.createContestantHolder.bind(this);
		this.onSubmitPressed  = this.onSubmitPressed.bind(this);
		this.pollForCard = this.pollForCard.bind(this);
		this.initVoterPage();
		this.selectedCard = null;

	}
	async initVoterPage(){
		const response = await fetch('/getelection?id='+this.id, {method: 'GET'});
		const jsRes = await response.json();
		console.log("jsres ")
		this.nameOfElection = jsRes.cont.nameOfElection
		console.log(jsRes)

		console.log(this.nameOfElection)
		const elem =  document.querySelector(".elec-name")
		if (elem != null){
			elem.textContent = this.nameOfElection

		}
		const arr = jsRes.cont.contestants;
		document.querySelector("#votingPage").innerHTML = ""
		for (let person of arr){
			this.createContestantHolder("",person)
		}
		//create submit button
		const submitCont = document.createElement("div");
		// const aTag = document.createElement("a");
		this.gButton = document.createElement("button");
		this.gButton.classList.add("go");
		this.gButton.textContent = "Submit Vote";
		submitCont.appendChild(this.gButton);
		document.querySelector("#votingPage").appendChild(submitCont);
		submitCont.addEventListener("click", this.onSubmitPressed);
		if (!this.cardLoaded){
			this.pollForCard()
		}

	}
	pollForCard() {
		if (!this.cardLoaded) {
			console.log("removing addEventListener");
			this.gButton.textContent = "Insert your card";
			let endpoint = window.constants.hardwareAPI + window.constants.cardAPI;

			let inserted = endpoint + "/inserted";

			// this.gButton.removeEventListener("click", this.onSubmitPressed)
			// this.gButton.addEventListener("click", this.noCardConnected)
			fetch(inserted, {method: 'GET'}).then(reply => {
				let thejson = reply.json();
				let cards = thejson['cards'];
				for (let card in cards) {
					if (cards.hasOwnProperty(card)) {
						// Card exists
						this.selectedCard = card;
						this.cardLoaded = true;
						break;
					}
				}
			}).catch(e => {
				console.log("Error polling for card: "+e);
			});
			setTimeout(function () {
				this.pollForCard();
			}.bind(this), 2000);
		} else {
			// this.gButton.removeEventListener("click", this.noCardConnected)
			this.gButton.textContent = "Submit vote";

			// this.gButton.addEventListener("click", this.onSubmitPressed)
		}
	}

	noCardConnected() {
		new SnackBar(true, "Please insert your voting card")
	}

	createContestantHolder(imagePath, name){
		const container = document.createElement("div")
		container.classList.add("picName")
		container.classList.add("votep")

		const imageDiv = document.createElement("div")
		const image = document.createElement("img")
		image.classList.add("pic")
		image.classList.add("marg")
		if (imagePath === "" || imagePath == null ){
			image.src = "../images/mickey.jpg"
		}else{
			image.src = imagePath
		}

		imageDiv.appendChild(image)

		const nameHolder = document.createElement("div")
		nameHolder.classList.add("cand-name")
		nameHolder.classList.add("marg")
		if ( name === "" || name == null ){
			nameHolder.textContent = "Peter Wang"
		}else{
			nameHolder.textContent = name
		}
		container.appendChild(imageDiv)
		container.appendChild(nameHolder)
		container.classList.add("margB")
		this.allContainers.push(container);
		container.addEventListener("click", function(event){
			this.choice = nameHolder.textContent;
			for (let elem of this.allContainers){
				elem.classList.remove("select")
			}
			container.classList.add("select");

		}.bind(this));
		document.querySelector("#votingPage").appendChild(container)

	}

	async onSubmitPressed(event){
		if(!this.cardLoaded){
			new SnackBar(true, "Please connect your card")
			return
		}
		if (this.choice === ""){
			new SnackBar(true, "Please Vote")
			return
		}
		const message = {
			electionId: this.id,
			choice: this.choice
		};
		let postObject = {};
		postObject.ballot = message;
		postObject.card = this.selectedCard;
		postObject.pin = "1111"; // TODO: FIX to Base64 string of 32 bytes

		const fetchOptions = {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(postObject)
		};
		let endpoint = window.constants.hardwareAPI + window.constants.cardAPI + "/submitballot";
		const resp = await
		fetch(endpoint, fetchOptions);
		const jsRes = await resp.json();
		console.log("After voting")
		console.log(jsRes)
		if (jsRes.voted){
			let obj = {
				voted: true
			}
			document.dispatchEvent(new CustomEvent('vote-cmp', {detail:obj}))
			window.location.href = "#/success";
		}

	}


}
