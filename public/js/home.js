////console.log("starting up!!
 let startedLogin = false;

class HomeScreen {
// 
	constructor(){
		// this.onSubmitForm = this.onSubmitForm.bind(this);
		this.createElectionHolder = this.createElectionHolder.bind(this)
		this.initializeHome();

		// this.initHomePage();
		// this.initRegister = this.initRegister.bind(this);
	}
	async initializeHome(){
		 const response = await fetch('/getelections', {method: 'GET'});
		 const jsRes = await response.json();

		 document.querySelector("#homepage").innerHTML = ''
		 console.log(jsRes)
		 for (let item of jsRes.elections){
		 	this.createElectionHolder(item.nameOfElection, item.date, item.id)
		 }
	}
	createElectionHolder(nameOfElection, date, id){
		const holder= document.createElement("div")
		holder.classList.add("elect")
		const par1 = document.createElement("p")
		par1.classList.add("hp")
		par1.textContent = nameOfElection
		const par2 = document.createElement("p")
		par2.classList.add("hp")
		par2.textContent= "Ends: "+ date.split("T")[0]
		holder.appendChild(par1)
		holder.appendChild(par2)
		holder.addEventListener("click", function(){
		this.onClickElection(id)
		}.bind(this));
		document.querySelector("#homepage").appendChild(holder)
	}

	onClickElection(id){
		console.log("The id is "+id);
		const obj = {id: id}
		document.dispatchEvent(new CustomEvent('election-select', {detail: obj}))
		window.location.href = "#/vote";
	}
	static async  googleSignInPress(googleUser){
		////console.log("google sign in!!")
		if (startedLogin){
			await UserLogin.googleSignInPress(googleUser);
		}
	}
}
