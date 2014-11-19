angular.module("app").run(function($rootScope, $state) {
  $rootScope.$on('$stateChangeStart', function(e, to) {
    if (!to.data || !angular.isFunction(to.data.rule)) return;
    var result = to.data.rule(Meteor.user());

    if (result && result.to) {
      e.preventDefault();
      // Optionally set option.notify to false if you don't want 
      // to retrigger another $stateChangeStart event
      console.log(result);
      $state.go(result.to, result.params, {notify: false});
    }
  });

  // hack -- we need to wait for rootScope.currentUser to resolve before we deal with states
  // also, this isn't very smart routing -- if you log in --> go to dashboard, if you log out --> go to create
  $rootScope.$watch('currentUser', function(currentUser){
    if(currentUser) {
      $state.go('dashboard');
    } else {
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
        controllerAs: 'stakesctrl'
      })
      .state('create.notifications', {
        url: '/notifications',
        template: UiRouter.template('notifications.html'),
        controller: 'NotificationsCtrl',
        controllerAs: 'notificationsctrl'
      })
      .state('error', {
        url: '/404',
        template: "<div>404</div>",
      });

    $urlRouterProvider.otherwise("/404");
  }]);