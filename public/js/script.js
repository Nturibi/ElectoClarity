  var electoClarity = angular.module('electoClarity', ['ngRoute']);
  let firstTime = true;
  // const sg = new Singleton();


  electoClarity.factory('State', function(){
  // $http.get( init once per app );

  return {
    formData:{
        hour: 10,
        min: "00",
        ampm: "AM",
        day: 1,
        month: "January",
        year: 2018,
        from: "San Francisco International Airport (SFO)",
        to:"Stanford University",
        flexible:true
    },
    tripData: {},
};
});

    // configure our routes
    electoClarity.config(function($routeProvider) {
        $routeProvider

            // route for the home page
            .when('/', {
                templateUrl : 'pages/home.html',
                controller  : 'mainController'
            })

            // route for the about page
            .when('/vote', {
                templateUrl : 'pages/vote.html',
                controller  : 'resultController'
            })
            .when('/login', {
                templateUrl : 'pages/Glogin.html',
                controller  : 'loginController'
            })
            // route for the contact page
            .when('/signup', {
                templateUrl : 'pages/signup.html',
                controller  : 'signupController'
            })

            .when('/admin', {
                templateUrl : 'pages/election.html',
                controller  : 'adminController'
            })
            .when('/success', {
                templateUrl : 'pages/success.html',
                controller  : 'successController'
            });
        });

    // create the controller and inject Angular's $scope
    electoClarity.controller('mainController', function($scope, State) {
        // document.querySelector("#g1").classList.add('inactive');
        // create a message to display in our view
        // console.log("inside the main controller");
        // $scope.message = 'Everyone come and see how good I look!';
        $scope.formData = State.formData;
        $scope.$on('$viewContentLoaded', function(){
            // if (firstTime){
                new HomeScreen();
                // firstTime = false;
            // }
            
            let obj = State.formData;
            document.addEventListener('election-select', function(event){
            State.formData.electionId = event.detail.id;
             
         });
        }
        );

    });

    electoClarity.controller('resultController', function($scope, State) {
        // document.querySelector("#g1").classList.add('inactive');
        $scope.$on('$viewContentLoaded', function(){
            console.log(" results screen: ");
            new VotePage(State.formData.electionId)

        }
        );

    });

    electoClarity.controller('loginController', function($scope, State) {
      // document.querySelector("#g1").classList.remove('inactive');
      $scope.$on('$viewContentLoaded', function(){
        new UserLogin(State.formData);
        document.addEventListener('login-cmp', function(event){
            State.formData = event.detail; 
        });
    }
    );

  });

    electoClarity.controller('signupController', function($scope, State) {
       // document.querySelector("#g1").classList.add('inactive');
       $scope.$on('$viewContentLoaded', function(){
            console.log("INside the sign up page, form data is: ");
            console.log(State.formData);
            if (State.formData == null){
                new SnackBar(true, "An Error Occured.");
                return;
            }
            new  UserSignUp(State.formData);
            document.addEventListener('signup-cmp', function(event){
                State.formData = event.detail; 
            });
        }
        );  
   });

    electoClarity.controller('adminController', function($scope, State) {
        // document.querySelector("#g1").classList.add('inactive');
        $scope.$on('$viewContentLoaded', function(){
        // console.log("inside trip page!!!");
                new AdminScreen();
                document.addEventListener('trip-cmp', function(event){
                State.formData.from = event.detail.from; 
                State.formData.to = event.detail.to;
                State.formData.hour = event.detail.hour;
                State.formData.min = event.detail.min;
                State.formData.ampm = event.detail.ampm;
                State.formData.day = event.detail.day;
                State.formData.month = event.detail.month;
                State.formData.year = event.detail.year;
                State.formData.isSaved = event.detail.isSaved;
            });
        }
        );

    });

    electoClarity.controller('successController', function($scope, State) {
        // document.querySelector("")
        document.querySelector("#g1").classList.add('inactive');
        $scope.$on('$viewContentLoaded', function(){
            new SuccessPage(State.formData.fullName.split(" ")[0],true);
        });

    });



    function onSignIn(googleUser){
        // console.log("on sign in!");
        HomeScreen.googleSignInPress(googleUser);
    }
 