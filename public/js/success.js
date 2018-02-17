
class SuccessPage {
	constructor(name, isNew){
		this.initSuccess = this.initSuccess.bind(this);
		this.initSuccess(name, isNew);

	}
	initSuccess(name, isNew){
		const elems = document.querySelectorAll(".pg");
	 for (let elem of elems){
		 elem.classList.add("inactive");
	 }
		document.querySelector("#successPage").classList.remove("inactive");
		if (isNew){
			document.querySelector("#crRg").classList.remove("inactive");
			document.querySelector("#jRg").classList.add("inactive");
			document.querySelector("#nm1").textContent = name;
		}
	}

}
