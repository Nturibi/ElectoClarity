
	class TripPage{
		constructor(tripData){
			console.log("INSIDE TRIP PAGE");
			this.initTrip = this.initTrip.bind(this);
			this.onSubmitTripData = this.onSubmitTripData.bind(this);
			this.updateItinerary = this.updateItinerary.bind(this);
			console.log("The data is: ");
			console.log(tripData);
			this.data = tripData;
			this.submitData = {};
			this.initTrip();
			// console.log("Inside trip page");
		}
		initTrip(){
			console.log("Initializing trip");
			const elems = document.querySelectorAll(".pg");
			for (let elem of elems){
				elem.classList.add("inactive");
			}
		 // console.log("Initializing the trip");
		 // console.log(this.data);
		 if (this.data.isNewThread){
		 	console.log("NEW TH");
		 	document.querySelector("#tripPage").classList.remove("inactive");
		 	document.querySelector("#exstTrp").classList.add("inactive")
		 	document.querySelector("#crName").value = this.data.fullName;
		 	document.querySelector("#crEmail").value = this.data.email;
		 	document.querySelector("#from-selector2").value = this.data.from;
		 	document.querySelector("#to-selector2").value = this.data.to;
		 	document.querySelector("#hh2").value = this.data.hour;
		 	document.querySelector("#mm2").value = this.data.min;
		 	document.querySelector("#ampm2").value = this.data.ampm;
		 	document.querySelector("#dd2").value = this.data.day;
		 	document.querySelector("#mt2").value = this.data.month;
		 	document.querySelector("#yy2").value = this.data.year;
		 	document.querySelector("#crNum").value = 3;
		 	document.querySelector("#goHolder1").addEventListener('click', this.onSubmitTripData);
		 }else{
		 	console.log("OLD TH");
		 	document.querySelector("#tripPage").classList.add("inactive");
		 	document.querySelector("#exstTrp").classList.remove("inactive");
		 	const containerElem = document.createElement('ul');
		 	document.querySelector("#riders").appendChild(containerElem);
		 	console.log("The array of ppl is: ");
		 	console.log(this.data.ppl);
		 	for (let person of this.data.ppl){
		 		const elem = document.createElement('li');
		 		elem.textContent = person;
		 		containerElem.appendChild(elem);
		 	}
		 	let fromHolder = document.querySelector("#from-selector3");
		 	let toHolder = document.querySelector("#to-selector3");

		 	/**TODO: change this to this.tripData once we get Data from server*/
		 	fromHolder.value = this.data.from;
		 	toHolder.value = this.data.to;
		 	fromHolder.disabled = true;
		 	toHolder.disabled = true;
		 	document.querySelector("#hh3").value = this.data.hour;
		 	document.querySelector("#mm3").value = this.data.min;
		 	document.querySelector("#ampm3").value = this.data.ampm;
		 	document.querySelector("#dd3").value = this.data.day;
		 	document.querySelector("#mt3").value = this.data.month;
		 	document.querySelector("#yy3").value = this.data.year;
		 	document.querySelector("#goHolder3").addEventListener('click', this.onSubmitTripData);


		 	// for (let elem of allCont ){
		 	// 	const cont = document.querySelector("#"+elem);
		 	// 	console.log("THe container is: ");
		 	// 	console.log(cont);
		 	// 	if (elem === "hh3"){
		 	// 		console.log("Setting the hour to: "+this.tripData.hour);
		 	// 		let option = document.createElement('option');
		 	// 		option.text = this.tripData.hour;
		 	// 		cont.add(option);
		 	// 		cont.value = this.tripData.hour;
		 	// 		// console.log("the options are: ");

		 	// 		for( let item of cont.options){
		 	// 			console.log("item");
		 	// 			console.log(item);
		 	// 		}
		 	// 	}else if (elem === "mm3"){
		 	// 		cont.value = this.tripData.min;
		 	// 	}else if (elem === "ampm3"){
		 	// 		cont.value = this.tripData.ampm;
		 	// 	}else if (elem === "dd3"){
		 	// 		cont.value = this.tripData.day;
		 	// 	}else if (elem === "mt3"){
		 	// 		cont.value = this.tripData.month;
		 	// 	}else if(elem === "yy3"){
		 	// 		cont.value = this.tripData.year;
		 	// 	}
		 	// 	// cont.disabled = true;
		 	// }

		 }
		 
		}

		getMonth(monthString){
			console.log("The month is: "+monthString);
			let monthStr = monthString.toLowerCase();
			if (monthStr === "january") return 0;
			if (monthStr === "february") return 1;
			if (monthStr === "march") return 2;
			if (monthStr === "april") return 3;
			if (monthStr === "may") return 4;
			if (monthStr === "june") return 5;
			if (monthStr === "july") return 6;
			if (monthStr === "august") return 7;
			if (monthStr === "september") return 8;
			if (monthStr === "october") return 9;
			if (monthStr === "november") return 10;
			if (monthStr === "december") return 11;
		}

		async onSubmitTripData(event){
			console.log("SUbmitting trip data!!");
			if (this.data.isNewThread){
				console.log("yes. This is a new thread");
				this.updateItinerary();
				this.submitData.creator = this.data.email;
				this.submitData.ppl =[];
				this.submitData.ppl.push(this.data.email);
				if (this.submitData.ampm.toLowerCase() === "pm"){
					if (parseInt(this.submitData.hour) !== 12){
						let num = parseInt(this.submitData.hour) + 12;
						this.submitData.hour = num;
					}
				}else if (this.submitData.ampm.toLowerCase() === "am"){
					if (parseInt(this.submitData.hour) === 12){
						this.submitData.hour = 0;
					}

				}
				let month = this.getMonth(this.submitData.month);
				let date =  new Date(parseInt(this.submitData.year), month, parseInt(this.submitData.day), parseInt(this.submitData.hour), parseInt(this.submitData.min),0,0);
				this.submitData.date = Date.parse(date);
				console.log("The date is: "+date);
				const fetchOptions = {
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(this.submitData)
				};

				const resp = await fetch('/posttripdata',fetchOptions);
				const jsRes = await resp.json();
			//update the return data
			this.data.hour = this.submitData.hour;
			this.data.min = this.submitData.min;
			this.data.month = this.submitData.month;
			this.data.day = this.submitData.day;
			this.data.ampm = this.submitData.ampm;
			if (jsRes.isSaved){
				this.data.isSaved = true;
				this.data.id = jsRes.id;
				// new SuccessPage(this.data.fullName.split(" ")[0],true);
				document.dispatchEvent(new CustomEvent('trip-cmp', {detail:this.data}));
			}else{
				new SnackBar(true, "Error Saving");
			}
		}else{
			const id = this.data.id;
			console.log("The id is: "+id);
			const resp = await fetch('/gettripdata?id='+id, {method: 'GET'});
			const jsRes = await resp.json();
			console.log("The jsres is: ");
			console.log(jsRes);
			if (jsRes.isFull){
				//TODO: change this to http://swivar.com/#/trip
				window.location.replace("http://localhost:3000/#/trip");
				new SnackBar(true, "This Ride Group just got filled");
			}else{
				// console.log("The current email is: "+this.data.email);
				jsRes.ppl.push(this.data.email);
				let num = parseInt(jsRes.numPeople);
				num++;
				if (num == parseInt(jsRes.total)){
					jsRes.isFull = true;
				}
				jsRes.num = num;
				console.log("ThE EMAIL IS:  "+ this.data.email);
				const message ={
					id: jsRes.id,
					email: this.data.email,
					ppl: jsRes.ppl,
					numPeople: num,
					isFull: jsRes.isFull
				};
				

				// jsRes._id = JSON.stringify(jsRes._id);
				const fetchOptions = {
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(message)
				};
				console.log("about to push");
				console.log(message);
				const resp2 = await fetch('/updatetripdata', fetchOptions);
				const jsRes2 = await resp2.json();
				if (jsRes2.isSaved){
					document.dispatchEvent(new CustomEvent('trip-cmp', {detail:this.data}));
				}else{
					new SnackBar(true, "Error Saving!");
				}
			}
		}
	}

	updateItinerary(){

		this.submitData.from = document.querySelector("#from-selector2").value;
		this.submitData.to = document.querySelector("#to-selector2").value;
		this.submitData.hour = document.querySelector("#hh2").value;
		this.submitData.min = document.querySelector("#mm2").value;
		this.submitData.ampm = document.querySelector("#ampm2").value;
		this.submitData.day = document.querySelector("#dd2").value;
		this.submitData.month = document.querySelector("#mt2").value.toLowerCase();
		this.submitData.year = document.querySelector("#yy2").value;
		this.submitData.total = document.querySelector("#crNum").value;
		this.submitData.numPeople = 1;
		this.submitData.isFull = false;
	}
}
