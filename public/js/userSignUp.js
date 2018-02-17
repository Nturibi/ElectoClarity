
class UserSignUp {
    constructor(obj) {
      if (obj == null) return;
      this.initSignUp = this.initSignUp.bind(this);
      this.onSubmitSignUp = this.onSubmitSignUp.bind(this);
      this.obj = obj;
      this.initSignUp();

    }
    initSignUp(){
      const elems = document.querySelectorAll(".pg");
 		 for (let elem of elems){
 			 elem.classList.add("inactive");
 		 }
     document.querySelector("#signupPage").classList.remove("inactive");
     const submitElem = document.querySelector("#trip-ref");
     submitElem.addEventListener('click', this.onSubmitSignUp);
     // document.querySelector("#sbmSign").addEventListener("submit", this.onSubmitSignUp);
     console.log("The obj is: ");
     console.log(this.obj);
     console.log("The name is: "+this.obj.fullName);
     document.querySelector("#usrName").value = this.obj.fullName;
     document.querySelector("#usrEmail").value = this.obj.email;
     // document.querySelector("#trip-ref").addEventListener('click', this.onClickRef);
     const checkbox = document.querySelector("#terms");
     checkbox.addEventListener('click', function(event){
      if(checkbox.checked){
        submitElem.classList.remove("disabled");
        // document.querySelector("#trip-ref").addEventListener('click', this.onSubmitSignUp);
      } else{
        submitElem.classList.add("disabled");
        new SnackBar(true, "You need to agree to the terms");
      }
     }.bind(this));


    }
   
    async onSubmitSignUp(event){
      // event.preventDefault();
      // const checkBoxVal = document.querySelector("#terms").checked;
      // if (!checkBoxVal) return;
      //how to have an input only enter numbers/ mobile numbers only
      const phoneNumber = document.querySelector("#pNmbr").value;
      if (phoneNumber != null){
        this.obj.phoneNumber = phoneNumber;
      }else{
        this.obj.phoneNumber = "No number";
      }
      //need to save to database
      const message = {
        fullName : this.obj.fullName,
        email: this.obj.email,
        phoneNumber: this.obj.phoneNumber
      }
      const fetchOptions = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    };
      const resp = await fetch('/adduser', fetchOptions);
      const jsRes = await resp.json();
      console.log(jsRes);
      if (jsRes.isSaved){
        document.querySelector("#al-acc").classList.remove("inactive");
        document.querySelector("#toLogin").addEventListener('click', function(event){
        document.querySelector("#al-acc").classList.add("inactive");
        }.bind(this));
      }else{
          new SnackBar(true, "Successfully created an account!");
          document.dispatchEvent(new CustomEvent('signup-cmp', {detail:this.obj}));
      }
    }

}
