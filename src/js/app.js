(function () {
    "use strict";

    angular
        .module("app", ["http-auth-interceptor", "ngMockE2E", "ngRoute"])
        .controller("loginCtrl", LoginController)
        .controller("mainCtrl", MainController)
        .config(routeConfig)
        .run(runBlock);

    function LoginController($http, authService) {
        var vm = this;

        vm.login = login;

        function login() {
            $http.post("auth/login").then(function () {
                authService.loginConfirmed();
            });
        }
    }

    function MainController($scope) {
        var vm = this;

        vm.shouldShowLogin = false;
        vm.loggedIn = false;
        vm.logOut = logOut;

        $scope.$on("event:auth-loginRequired", function () {
            vm.shouldShowLogin = true;
            vm.loggedIn = false;
        });

        $scope.$on("event:auth-loginConfirmed", function () {
            vm.shouldShowLogin = false;
            vm.loggedIn = true;
        });

        function logOut() {
            vm.loggedIn = false;
        }
    }

    function routeConfig($routeProvider) {
        $routeProvider.when("/restricted", {
            templateUrl: "partials/restricted.html",
            resolve: {
                message: function ($q, $http) {
                    var getPromise = $http.get("api/protected");
                    var postPromise = $http.post("api/protected", { some: "data" });
                    return $q.all([getPromise, postPromise]).then(function (results) {
                        console.log(results);
                    });
                }
            }
        }).otherwise({
            templateUrl: "partials/default.html"
        });
    }

    function runBlock($httpBackend) {
        var authenticated = false;

        $httpBackend.whenPOST("auth/login").respond(function(method, url, data) {
            authenticated = true;
            return [200];
        });

        $httpBackend.whenPOST("api/public").respond(function(method, url, data) {
            return [200, "I have received and processed your data [" + data + "]."];
        });

        $httpBackend.whenGET("api/protected").respond(function(method, url, data) {
            console.log("GET request fired against protected. We are " + (authenticated ? "" : "not ") + "logged in");
            return authenticated ?
                [200, "Some confidential data"] :
                [401];
        });

        $httpBackend.whenPOST("api/protected").respond(function(method, url, data) {
            console.log("POST request fired against protected. We are " + (authenticated ? "" : "not ") + "logged in");
            return authenticated ?
                [200, "This is confidential [" + data + "]."] :
                [401];
        });

        $httpBackend.whenGET(/.*/).passThrough();
    }

})();