angular.module("app").run(function($rootScope, $state, $subscribe) {
  // subscribe to user data
  $subscribe.subscribe('userData');

  // avoid using stateChangeStart because you want to resolve things instead of using rules
  // resolving is better for promises
  // in this specific case, you want to wait for logging in to complete before checking for authorization
  $rootScope.$on('$stateChangeStart', function(e, to) {
    if (!to.data || !angular.isFunction(to.data.rule)) return;
  });

  // let the world know every time loggedIn changes
  $rootScope.$watch('loggedIn', function(loggedIn){
    $rootScope.$broadcast('loggedIn');
  });

  $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error){ 
    console.log(event);
    console.log(toState);
    console.log(toParams);
    console.log(fromState);
    console.log(fromParams);
    console.log(error);

    // first check for authorization error
    // if unauthorized and logged in, go to 401
    // else go to signup and redirect after login
      // note: if user logs in after redirect and is still unauthorized, redirect to 401 page
    if(error.status === 401){
      if($rootScope.currentUser){
        $state.go('unauthorized');
      }else{
        $state.go('create.signup', {redirect_uri: $state.href(toState.name, toParams)}); 
      }
    }else{
      switch(toState.name) {
      case 'create.signup':
        if($rootScope.currentUser){
          $state.go('dashboard');
        }else{
          $state.go('create.commit');
        }
        break;
      case 'create.stakes':
        $state.go('create.commit');
        break;
      case 'create.notifications':
        $state.go('create.stakes');
        break;
      default :
        $state.go('404');
      }
    }
  });

  // hacky -- we need to wait for rootScope.currentUser to resolve before we deal with states
  // right now --> if you login on home page, redirect to dashboard
  var userRequiredStates = ['create.notifications', 'dashboard'];
  $rootScope.$watch('currentUser', function(currentUser){
    if(currentUser) {

      if($state.current.name === 'create.commit'){
        $state.go('dashboard');
      }
    } else if(userRequiredStates.indexOf($state.current.name) !== -1) {
      $state.go('create.commit');
    }
  });
});

angular.module("app").config(['$urlRouterProvider', '$stateProvider', '$locationProvider',
  function($urlRouterProvider, $stateProvider, $locationProvider){

    $locationProvider.html5Mode(true);

    $urlRouterProvider.when('/', '/commit');

    $stateProvider
      .state('dashboard', {
        url: '/dashboard',
        template: UiRouter.template('dashboard.html'),
        controller: 'DashboardCtrl',
        controllerAs: 'dashboardctrl',
        resolve: {
          isAuthorized: function(authService){
            var response = authService.getLoginStatus();
            return response;
          }
        }
      })
      .state('charities', {
        url: '/charities',
        abstract: true,
        template: '<ui-view/>'
      })
      .state('charities.list', {
        url: '',
        template: UiRouter.template('charities-list.html'),
        controller: 'CharitiesListCtrl',
        controllerAs: 'charitieslistctrl',
        resolve: {
          isAuthorized: function(authService, adminRoles){
            return authService.getLoginStatus(adminRoles);
          }
        }
      })
      .state('charities.charity', {
        url: '/:charityId',
        template: UiRouter.template('charity.html'),
        controller: 'CharityCtrl',
        controllerAs: 'charityctrl',
        resolve: {
          isAuthorized: function(authService){
            return authService.getLoginStatus();
          },
          charity: function(authService, $subscribe, $stateParams, $q) {
            var defer = $q.defer();

            authService.getLoginStatus().then( function(){
              $subscribe.subscribe("my_charities").then(function(){
                var charity = Charities.find($stateParams.charityId).fetch();
                if(charity && charity.length === 1) {
                  defer.resolve();
                } else {
                  defer.reject({status: 401, description: 'unauthorized'});
                }
              });
            });

            return defer.promise;
          }
        }
      })
      .state('register', {
        url: '/register',
        template: UiRouter.template('register.html'),
        controller: 'RegisterCtrl',
        controllerAs: 'registerctrl',
        resolve: {
          isAuthorized: function(authService){
            return authService.getLoginStatus();
          }
        }
      })
      .state('create', {
        url: '',
        abstract: true,
        template: '<ui-view/>'
      })
      .state('create.commit', {
        url: '/commit?modify',
        template: UiRouter.template('commit.html'),
        controller: 'CommitCtrl',
        controllerAs: 'commitctrl'
      })
      .state('create.signup', {
        url: '/signup?redirect_uri&create_commitment',
        template: UiRouter.template('signup.html'),
        controller: 'SignupCtrl',
        controllerAs: 'signupctrl',
        resolve: {
          notLoggedIn: function($q, authService) {
            var defer = $q.defer();
            authService.getLoginStatus().then(function(currentUser){
              defer.reject({status: 400, description: 'user already logged in'});
            },
            function(error){
              defer.resolve();
            });
            return defer.promise;
          }
        }
      })
      .state('create.stakes', {
        url: '/stakes?create_commitment',
        template: UiRouter.template('stakes.html'),
        controller: 'StakesCtrl',
        controllerAs: 'stakesctrl',
        resolve: {
          isAuthorized: function(authService){
            return authService.getLoginStatus();
          },
          commitment: function($q, commitService) {
            var defer = $q.defer();

            var commitment = commitService.getCommitment();
            console.log(commitment);
            
            if(commitment && commitment._id) {
              defer.resolve(commitment);
            }
            else {
              defer.reject({status: 400, description: "commitment not properly configured"});
            }

            return defer.promise;
          },
          stakes: function(stakesService) {
            return stakesService.getStakes();
          }
        }
      })
      .state('create.notifications', {
        url: '/notifications',
        template: UiRouter.template('notifications.html'),
        controller: 'NotificationsCtrl',
        controllerAs: 'notificationsctrl',
        resolve: {
          isAuthorized: function(authService){
            return authService.getLoginStatus();
          },
          commitment: function($q, commitService) {
            var defer = $q.defer;
            var commitment = commitService.getCommitment();
            if(stakes) {
              defer.resolve(commitment);
            } else {
              defer.reject({status: 400, description: "missing commitment"});
            }
            return defer.promise;
          },
          stakes: function($q, stakesService){
            var defer = $q.defer;
            var stakes = stakesService.getStakes();
            if(stakes) {
              defer.resolve(stakes);
            } else {
              defer.reject({status: 400, description: "missing stakes"});
            }
            return defer.promise;
          },
          notifications: function(notificationsService) {
            return notificationsService.getNotificationSettings();
          }
        }
      })
      .state('unauthorized', {
        url: '/401',
        template: UiRouter.template('401.html'),
      })
      .state('404', {
        url: '/404',
        template: "<div>404</div>",
      });

    $urlRouterProvider.otherwise("/404");
  }]);
