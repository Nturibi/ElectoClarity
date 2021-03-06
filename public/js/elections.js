////console.log("starting up!!
class ElectionScreen {
	constructor(id){
		console.log("id is : "+id);
		this.initHomePage();
	}
	initHomePage(){
		dates('option');
    months1('option');
		years('option', 1920, 2018);
		const yearHolders = document.querySelectorAll(".bear-years");
		for (let elem of yearHolders){
			elem.value = 2018;
		}
		const button = document.querySelector("#addCont");
		button.addEventListener("click", function(event){
			const newElem = document.createElement("input");
			const elem = document.querySelector("#contAdd");
			console.log(button);
			elem.insertBefore(newElem, button);
		})

		const goButton = document.querySelector("#goHolder1");
		if (goButton != null){
			goButton.addEventListener('click', this.onSubmitForm);
		}

		const regUser =  document.querySelector("#regUser");
		regUser.addEventListener("click", this.onSubmitUserData);
		this.pollForCard();

	}
	pollForCard(handler){
		setTimeout(function () {
			//TODO  PETER check if card has been inserted and update the this.cardInserted
			const regUser =  document.querySelector("#regUser");
			if (!this.cardInserted){
				regUser.removeEventListener("click", handler);
				this.pollForCard();
			}else {
				regUser.addEventListener("click", handler);
			}
		}.bind(this), 2000);
	onSubmitUserData (event){
		const fName = document.querySelector("input[name = 'fname']").value;
		const lName = document.querySelector("input[name = 'lname']").value;
		const day = document.querySelector("#db").value;
		const month = document.querySelector("#mb").value;
		const year = document.querySelector("#yb").value;
		const gender = document.querySelector("input[name ='gender']:checked").value;
		const zip = document.querySelector("input[name ='zip']").value;
		let dat = new Date(year+"-"+month+"-"+day);
		//TODO: api calls
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
		const  year = this.getSelectVal("#yy");
		console.log("The  dates "+day+" "+month+" "+year);
		const allContestants = [];
		const allContInputs = document.querySelectorAll("#contAdd input");
		for (let elem of allContInputs){
			if(elem.value !== ""){
				allContestants.push(elem.value);
			}

		}
		const publicKey = document.querySelector("#pKey").value;
		const nameOfElection = document.querySelector("#nameofelection").value;
		let dat = new Date(year+"-"+month+"-"+day);
		const message = {
			nameOfElection: nameOfElection,
			date : dat,
			key: publicKey,
			contestants: allContestants
        };
        console.log("The message to the server is ");
        console.log(message);
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
				elem.value = "";
			}
			document.querySelector("#nameofelection").value = "";
			document.querySelector("#pKey").value = "";
        }
	}
}
