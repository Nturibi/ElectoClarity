
class UserLogin {
    constructor(obj) {
      this.onLoginChanged = this.onLoginChanged.bind(this);
      this._onLogout = this._onLogout.bind(this);
      this._updateMenu = this._updateMenu.bind(this);
      this._onLogout2 = this._onLogout2.bind(this);
      this._getLoggedIn = this._getLoggedIn.bind(this);
      this._onProceed = this._onProceed.bind(this);
      // this.googleSignInUser = this.googleSignInUser.bind(this);
      this.signInComplete = this.signInComplete.bind(this);
      this.initLoginScreen = this.initLoginScreen.bind(this);
      this.initLoginScreen();
      this.email;
      this.fullName;
      this.obj = obj;
      this.isNewThread = this.obj.isNewThread;
    //  console.log("Is new thread is: "+ this.isNewThread);
    }
    async initLoginScreen(){
      //hide the  results
      const elems = document.querySelectorAll(".pg");
 		 for (let elem of elems){
 			 elem.classList.add("inactive");
 		 }
     document.querySelector("#loginPage").classList.remove("inactive");
     //buttons
       document.querySelector('#lgout').addEventListener('click', this._onLogout);
       document.querySelector('#logout2').addEventListener('click', this._onLogout2);
       document.querySelector("#contG").addEventListener('click', this._onProceed);
      await this._getLoggedIn();
      const result = await LoginUtils.getSignedInUser();
      await this._updateMenu();
    }
    async _onProceed(){
      //check if they have an account. If they do, then, take the thread id and pass it to
      //that threads page
      // console.log("the email is: "+this.email);
      const response = await fetch('getifuser?email='+this.email, {method: 'GET'});
      const isUser = (await response.json()).isUser;
      // console.log("The response is: "+isUser);
      //if false, prompt  them to create an account. Otherwise,take them direct to that ridegroup
      console.log("Value of isUser: "+isUser);
      this.obj.email = this.email;
      this.obj.fullName = this.fullName;
      // let passOnObj = {email : this.email, fullName: this.fullName};
      document.dispatchEvent(new CustomEvent('login-cmp', {detail: this.obj}));
    }

    async _getLoggedIn() {
      // //** remove this
      // return;
      // //upto here
      await LoginUtils.initialize();
      await this._setupLoginLogout();
      await this._updateMenu();
    }
    async _onLogout2(){
      document.querySelector("#nonStan").classList.add("inactive");
      await this._onLogout();
    }

    async _setupLoginLogout() {
      // //remove this
      // return;
      // //upto here
      await LoginUtils.initialize();
      const auth2 =  gapi.auth2.getAuthInstance();
      auth2.isSignedIn.listen(this.onLoginChanged);
    }

    async _loadOptions() {
      await LoginUtils.initialize();
      const user = await LoginUtils.getSignedInUser();
    }


    async onLoginChanged(isLoggedIn) {
      console.log("Login changed!");
      await this._updateMenu();
    }

     async _onLogout(){
      // console.log("LOggin out");
      await gapi.auth2.getAuthInstance().signOut();
      await this._updateMenu();

    }

    static async googleSignInUser(googleUser){
      await this._updateMenu();
    }
    async _updateMenu(){
      const result = await LoginUtils.getSignedInUser();
      if (result == null) return;
    //   if (result != null) {
    //   this.email = result.email
    //   this.fullName = result.fullName
    // };
      if (result != null && result.loggedIn) {
        this.email = result.email;
        this.fullName = result.fullName;
        const arr = result.email.split('@');
        if (arr[1] === 'stanford.edu') {
        document.querySelector('#signedin-name').textContent = result.fullName;
        document.querySelector('#signedin-email').textContent = result.email;
        document.querySelector('#no-user-signedin').classList.add("inactive");
        document.querySelector("#g1").classList.add('inactive');
        document.querySelector('#already-signedin').classList.remove("inactive");
        document.querySelector('#nonStan').classList.add("inactive");
      }else{
        document.querySelector("#nonStan").classList.remove("inactive");
        document.querySelector("#g1").classList.add('inactive');
      }
      const response = await fetch('getifuser?email='+this.email, {method: 'GET'});
      const isUser = (await response.json()).isUser;
      if (isUser){
        //trip
        document.querySelector("#cnt1").href = "#trip";

      }else{
        //sign up
        document.querySelector("#cnt1").href = "#signup";
      }
    } else{
       // console.log("not logged in!");
        document.querySelector('#no-user-signedin').classList.remove("inactive");
        document.querySelector("#g1").classList.remove('inactive');
        document.querySelector('#already-signedin').classList.add("inactive");
      }
    }

    async signInComplete(){

    }
  }
