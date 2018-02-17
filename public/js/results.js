//console.log("starting up!!

class ResultsScreen {
	constructor(obj){
		console.log("inside the results ResultsScreen");
		this.initResultsScreen = this.initResultsScreen.bind(this);
		this.onClickThread = this.onClickThread.bind(this);
		this.onClickThread2 = this.onClickThread2.bind(this);
		this.getResults = this.getResults.bind(this);
		this.obj = obj;
		// console.log("onstart results");
		console.log(this.obj);
		this.initResultsScreen();
		// console.log("end results");
		// console.log(this.obj);
		//this.getResults(obj);
	}
	async getResults(){
		//fetch results from server
		if (this.obj.ampm.toLowerCase() === "pm"){
					if (parseInt(this.obj.hour) !== 12){
						let num = parseInt(this.obj.hour) + 12;
						this.obj.hour = num;
					}
				}else if (this.obj.ampm.toLowerCase() === "am"){
					if (parseInt(this.obj.hour) === 12){
						// let num = parseInt(this.data.hour) + 12;
						this.obj.hour = 0;
					}

				}
		let month = this.getMonth(this.obj.month);
		let date =  new Date(parseInt(this.obj.year), month, parseInt(this.obj.day), parseInt(this.obj.hour), parseInt(this.obj.min),0,0);
		const dateInt = Date.parse(date);
		console.log("the date sent is: "+ dateInt);
		const response = await fetch('/getresults?date='+dateInt, {method: 'GET'});
		const jsRes = await response.json();
		console.log("The results  are: ");
		// console.log(jsRes);
		console.log(jsRes.list);
		this.displayResults(jsRes);
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
	displayResults(jsRes){
		const list = jsRes;
		const holderElem = document.querySelector("#threads");
		if (list == null ) return;
			if (list.length === 0){
			document.querySelector("#no-res").classList.remove("inactive");
			return;
		}
		for (let item of list){
			console.log("THe item is: ");
			console.log(item);
			const containerElem = document.createElement('div');
			containerElem.classList.add("thread");
			const tag = document.createElement('a');
			tag.href = "#login";
			containerElem.textContent = item.from + " To: "+item.to + " at: "+item.hour+":"+item.min+" "+item.ampm ;
			tag.dataset.id = item.id;
			tag.appendChild(containerElem);
			holderElem.appendChild(tag);
			tag.addEventListener("click", this.onClickThread);
		}
		
	}

	 async initResultsScreen(){
		 //make hompage inactive
		 const elems = document.querySelectorAll(".pg");
		 for (let elem of elems){
			 elem.classList.add("inactive");
		 }
	 	document.querySelector("#resultsPage").classList.remove("inactive");
		document.querySelector("#newTh").addEventListener('click', this.onClickThread2);
		await this.getResults();
		//**The object is going to be modified when the user selects a particular thread.

	}


	async onClickThread(event){
		console.log("id clicked");
		const id = event.currentTarget.dataset.id;
		console.log("the id is: "+id);
		const response = await fetch('/gettripdata?id='+id, {method: 'GET'});
		let passOnObj = await response.json();
		passOnObj.isNewThread = false;
		//get id of the clicked trip. 
		//fetch its data
		//need just the names
		// let obj = {
		// 	id: "rideid",
		// 	ppl: ["Ken", "Victor"],
		// 	isNewThread: false
		// }
		document.dispatchEvent(new CustomEvent('result-cmp', {detail:passOnObj}));
    // //console.log("Passing:");
	}

	onClickThread2(event){
		this.obj.isNewThread = true;
		console.log("After results: ");
		console.log(this.obj);
		document.dispatchEvent(new CustomEvent('result-cmp', {detail:this.obj}));
	}
}
