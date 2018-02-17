

class LoginUtils{

  static async getSignedInUser() {
    // //*****remove this
    // let result ={};
    // result.fullName = "Ken Nturibi";
    // result.email = "knturibi@stanford.edu";
    // result.loggedIn = true;
    // return result;
    // //***upto here

    const auth2 = gapi.auth2.getAuthInstance();
    const loggedIn = auth2.isSignedIn.get();

    let result = {
      loggedIn: loggedIn
    };


    if (loggedIn) {
      const user = auth2.currentUser.get();
      const profile = user.getBasicProfile();
      const email = profile.getEmail();
      // console.log("about to get user");
      // const route = '/getifuser?email='+email;
      // const response = await fetch(route, {method:'GET'});
      // const jsResp = await response.json();

      result = {
        loggedIn: loggedIn,
        idToken: user.getAuthResponse().id_token,
        fullName: profile.getName(),
        firstName: profile.getGivenName(),
        lastName: profile.getFamilyName(),
        email: email
      };

    }
    return result;
  }

  static async initialize() {
    var _auth2

    var _onGoogleLoad = function () {
      gapi.load('auth2', function () {
        _auth2 = gapi.auth2.init({
          client_id: '624800274337-732fuha3p5lumoperjgggj14oq6i50d8.apps.googleusercontent.com',
          scope: 'profile',
          fetch_basic_profile: false
        })
        _enableGoogleButton()
      })
    }
    // console.log("About to initialize");

    // const CLIENT_ID = '624800274337-732fuha3p5lumoperjgggj14oq6i50d8.apps.googleusercontent.com';

    // await new Promise((resolve) => {
    //   gapi.load('client:auth2', () => {
    //     resolve();
    //   });
    // });
    // await gapi.client.init({ client_id: CLIENT_ID, scope: 'profile' });
  }
}
