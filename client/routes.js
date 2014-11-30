angular.module("app").run(function($rootScope, $state) {
  $rootScope.$on('$stateChangeStart', function(e, to) {
    if (!to.data || !angular.isFunction(to.data.rule)) return;
    var result = to.data.rule(Meteor.user());

    if (result && result.to) {
      e.preventDefault();
      // Optionally set option.notify to false if you don't want 
      // to retrigger another $stateChangeStart event
      console.log("shit2");
      $state.go(result.to, result.params, {notify: false});
    }
  });

  // hacky -- we need to wait for rootScope.currentUser to resolve before we deal with states
  // right now --> if you login on home page, redirect to dashboard
  var userRequiredStates = ['create.stakes', 'create.notifications', 'dashboard'];
  $rootScope.$watch('currentUser', function(currentUser){
    if(currentUser) {
      if($state.current.name === 'create.commit'){
        $state.go('dashboard');
      }
    } else if(userRequiredStates.indexOf($state.current.name) !== -1) {
      console.log("shit");
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
        data: {
          rule: function(user) {
            return !user && {
              to: 'create.commit',
              params: null
            };
          }
        }
      })
      .state('charities', {
        url: '/charities',
        template: UiRouter.template('charities-list.html'),
        controller: 'CharitiesListCtrl',
        controllerAs: 'charitieslistctrl'
      })
      .state('charity', {
        url: '/charities/:charityId',
        template: UiRouter.template('charity.html'),
        controller: 'CharityCtrl',
        controllerAs: 'charityctrl'
      })
      .state('create', {
        url: '',
        abstract: true,
        template: '<ui-view/>'
      })
      .state('create.commit', {
        url: '/commit',
        template: UiRouter.template('commit.html'),
        controller: 'CommitCtrl',
        controllerAs: 'commitctrl'
      })
      .state('create.signup', {
        url: '/signup',
        template: UiRouter.template('signup.html'),
        controller: 'SignupCtrl',
        controllerAs: 'signupctrl'
      })
      .state('create.stakes', {
        url: '/stakes',
        template: UiRouter.template('stakes.html'),
        controller: 'StakesCtrl',
        controllerAs: 'stakesctrl',
        resolve: {
          commitmentString: function(commitService) {
            return commitService.getCommitmentString();
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
        data: {
          rule: function(user) {
            return !user && {
              to: 'create.commit',
              params: null
            };
          }
        },
        resolve: {
          commitment: function(commitService) {
            return commitService.getCommitment();
          },
          stakes: function(stakesService){
            return stakesService.getStakes();
          },
          notifications: function(notificationsService) {
            return notificationsService.getNotificationSettings();
          }
        }
      })
      .state('error', {
        url: '/404',
        template: "<div>404</div>",
      });

    $urlRouterProvider.otherwise("/404");
  }]);