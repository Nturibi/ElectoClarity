////console.log("starting 

class AdminScreen {
	constructor(){
		console.log("Admin screen starting");
		this.initHomePage = this.initHomePage.bind(this);
		this.onSubmitForm = this.onSubmitForm.bind(this);
		this.onSubmitUserData = this.onSubmitUserData.bind(this);
		this.onEnterAdminCard = this.onEnterAdminCard.bind(this)
		this.onClickViz = this.onClickViz.bind(this);
		this.choc = "test";
		
	
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
		const regUser =  document.querySelector("#regUser")
		regUser.addEventListener("click", this.onSubmitUserData)

	}
	onSubmitUserData (event){
		console.log("Handler working")
		const fName = document.querySelector("input[name = 'fname']").value;
		const lName = document.querySelector("input[name = 'lname']").value;
		const day = document.querySelector("#db").value
		const month = document.querySelector("#mb").value
		const year = document.querySelector("#yb").value
		const gender = document.querySelector("input[name ='gender']:checked").value
		const zip = document.querySelector("input[name ='zip']").value
		let dat = new Date(year+"-"+month+"-"+day);
		console.log("The date is: "+dat)
		console.log("Executing "+this.choc)



		document.querySelector("input[name = 'fname']").disabled  = true;
		document.querySelector("input[name = 'lname']").disabled  = true;
		document.querySelector("input[name ='gender']").disabled  = true;
		document.querySelector("input[name ='zip']").disabled  = true;
		document.querySelector("#db").disabled = true;
		document.querySelector("#mb").disabled = true;
		document.querySelector("#yb").disabled = true;
		document.querySelector("input[name ='password']").disabled  = true;

		const regUsr = document.querySelector("#regUser");
		// const new_element = regUsr.cloneNode(true);
  		// regUsr.parentNode.replaceChild(new_element, regUsr);
  		regUsr.removeEventListener("click", this.onSubmitUserData);
  		document.querySelector("#adminP").classList.remove("inactive");
  		regUsr.addEventListener("click", this.onEnterAdminCard);



		//TODO: api callss
		// 
	}
	onEnterAdminCard(){
		console.log("Admin card entered")
		document.querySelector("#adminP").classList.add("inactive");
		document.querySelector("#userP").classList.remove("inactive");
		const regUsr = document.querySelector("#regUser");
		regUsr.removeEventListener("click", this.onEnterAdminCard);
		regUsr.addEventListener("click", this.lastStep);
		regUsr.textContent = "Finish Registation";
	}
	lastStep(){
		//PETER
		console.log("Client card entered")
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
