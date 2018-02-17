////console.log("starting up!!
 let startedLogin = false;

class HomeScreen {

	constructor(){
		this.onSubmitForm = this.onSubmitForm.bind(this);
		this.initHomePage();
		// this.initRegister = this.initRegister.bind(this);

	}

	initHomePage(){

		dates('option');
    	months1('option');
		years('option', 2018, 2018);
		const button = document.querySelector("#addCont")
		button.addEventListener("click", function(event){
			const newElem = document.createElement("input");
			const elem = document.querySelector("#contAdd");
			console.log("Inserting before")
			console.log(button)
			elem.insertBefore(newElem, button)
		})
		const goButton = document.querySelector("#goHolder");
		if (goButton != null){
			goButton.addEventListener('click', this.onSubmitForm);
		}

		
	}


	getSelectVal(val){
		const stringVal = val;
		const select = document.querySelector(stringVal);
		return select.options[select.selectedIndex].value;
	}



	async onSubmitForm(event){
		// event.preventDefault();
		console.log("inside submission");
		const day = this.getSelectVal("#dd");
		const month = this.getSelectVal("#mt");
		const  year = this.getSelectVal("#yy")
		console.log("The  dates "+day+" "+month+" "+year)
		const allContestants = []
		const allContInputs = document.querySelectorAll("#contAdd input")
		for (let elem of allContInputs){
				allContestants.push(elem.value)
		}
		const publicKey = document.querySelector("#pKey").value
		const nameOfElection = document.querySelector("#nameofelection").value
		let dat = new Date(year+"-"+month+"-"+day);
		const message = {
		nameOfElection: nameOfElection,
        date : dat,
        key: publicKey,
        contestants: allContestants
      }
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







		// //console.log("The time is hour: "+hour+" min: "+min+" ampm: "+ampm);
		// //console.log("The date is: "+day+" month: "+month+" year: "+ year);
		// //console.log("coming from: "+fromLocation+" going to: "+toLocation);
		// //console.log("The flexible is: "+isFlexible);

		// let passOnObj = this.getPassOnObj(hour, min, ampm,day, month,year, fromLocation, toLocation, isFlexible);
		// console.log("The passOnObj is: ");
		// console.log(passOnObj);
		// document.dispatchEvent(new CustomEvent('form-submit', {detail:passOnObj}));
    // //console.log("Passing:");
    // //console.log(passOnObj);
		// const resultsPage = new ResultsScreen(passOnObj);
		// Singleton.setHomeData(passOnObj);

	}

	static async  googleSignInPress(googleUser){
		////console.log("google sign in!!")
		if (startedLogin){
			await UserLogin.googleSignInPress(googleUser);
		}
	}
}
