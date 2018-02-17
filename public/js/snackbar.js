
class SnackBar {
	constructor(show, message){
		this.initSnackBar(show, message);
		//console.log("Showing snack bar");
	}
	initSnackBar(show, message){
		let snackbar = document.querySelector("#snackbar");
		if (show){
			//console.log("The message is: "+message);
			snackbar.textContent = message;
			snackbar.classList.add("show");

			//snackbar.classList.remove("inactive");
			setTimeout(function(){
				snackbar.classList.add("inactive");
				snackbar.classList.remove("show");
			}, 3000);
		}
	}

}
