
class VotePage {
	constructor(){
		this.nameOfElection = "Presidential Election";
		this.choice = "";
		this.cardLoaded = false;
		this.allContainers = [];
		this.initVoterPage = this.initVoterPage.bind(this);
		this.createContestantHolder = this.createContestantHolder.bind(this);
		this.onSubmitPressed  = this.onSubmitPressed.bind(this);
		this.pollForCard = this.pollForCard.bind(this);
		this.initVoterPage();

	

	}
	async initVoterPage(){
		console.log("got the contestants:")
		 ////programtically create a  thread
		 //get contestants
		const response = await fetch('/getcontestants?nameOfElection='+this.nameOfElection, {method: 'GET'});
		const jsRes = await response.json();
		const arr = jsRes.cont.contestants;
		for (let person of arr){
			this.createContestantHolder("", person)

		}
		//create submit button
	  const submitCont = document.createElement("div");
      const aTag = document.createElement("a");
      const gButton = document.createElement("button");
      gButton.classList.add("go");
      gButton.textContent = "Submit Vote";
      aTag.appendChild(gButton);
      submitCont.appendChild(aTag);
      document.querySelector("#votingPage").appendChild(submitCont)
      submitCont.addEventListener("click", this.onSubmitPressed);

      if (!this.cardLoaded){
      	this.pollForCard()
      }

      
   

		 
		}
	pollForCard(){
		 setTimeout(function(){ 
		 	new SnackBar(true, "Please connect your card to vote")
		 	this.pollForCard();
		  }.bind(this), 10000);

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
	onSubmitPressed(event){
		if (this.choice === ""){
			 new SnackBar(true, "Please Vote")
		}

		console.log("Submitted press")
		console.log("Voting for "+this.choice)

	}

	

}
