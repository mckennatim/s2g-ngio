'use strict';

/* Controlrs */
var stuffAppControllers = angular.module('stuffAppControllers', []);

stuffAppControllers.controller('RootController', ['$window', '$scope', '$state', 'Users', 'Lists', function($window, $scope, $state, Users, Lists) {
    $scope.$state = $state;
    $scope.lists = Lists.lal;
    var onFocus = function(){
        console.log('lists focused')
        Users.ckIfOnline().then(function(status){
            if (status==200){
                console.log('in onFocus about to dBget and saveList ' +$scope.lists.activeList)
                Users.dBget().then(function(){});
                if ($scope.lists[$scope.lists.activeList]){
                    Lists.updList($scope.lists[$scope.lists.activeList]);
                }else{
                    console.log('no active list')
                }
            }
            console.log(status)
        });
    }
    $window.onfocus = onFocus;     
}]);

stuffAppControllers.controller('TimeCtrl', function ($scope) {
    $scope.timestamp=Date.now();
});


stuffAppControllers.controller('RegisterCtrl', ['$scope', '$http', 'AuthService', 'UserLS',  'TokenService', '$rootScope', 'Users', '$state', function ($scope, $http, AuthService, UserLS, TokenService, $rootScope, Users, $state) {
    if (TokenService.tokenExists()){
        var message = 'all set you are authorized and have token';
        $scope.state = Users.setRegState('Authenticated');
        $scope.message=Users.setRegMessage(message);
    } else {
         var message = 'you seem to be lacking a token';
        $scope.message=Users.setRegMessage(message);
    }
    console.log(Users.getRegMessage());
    $scope.dog = 'butler';
    $scope.nameValid =/^\s*\w*\s*$/
    $scope.user = Users.al[Users.al.activeUser] || Users.blankUser;//UserLS.getLastLiveUserRec()  || UserLS.blankUser;
    console.log($scope.user);
    $scope.state=Users.getRegState();
    if ($scope.state=='Enter apikey'){
        $scope.message = Users.setRegMessage('will give you token when we check your apikey');
    }
    console.log($scope.state);
    $scope.username=$scope.user.name || '';
    $scope.email=$scope.user.email || '';
    $scope.apikey=$scope.user.apikey || '';
    $scope.isuUser='';
    $scope.isMatch='';
    console.log('in register control')
    $scope.$watch('$rootScope.online', function(newValue, oldValue){
        console.log('watchin')
        if (newValue ==false){
            $scope.message = 'server or you are offline, try later';
            console.log('server or you are offline, try later')
        }
    })
    $scope.submit = function(){
        console.log($scope.username)
        $scope.user.name = $scope.username
        $scope.user.email = $scope.email
        $scope.user.apikey = $scope.apikey
        //$scope.user = {username: $scope.username, email: $scope.email, apikey: $scope.apikey, lists:[]}

        if ($scope.state=='Register'){
            console.log('new user to LS & db & get apikey sent')
            var response='';
            AuthService.isMatch($scope.username, $scope.email).then(function(data){
                console.log(data);
                response = data.message;
                if (['available', 'match'].indexOf(response)>-1){
                    console.log('response is either available or match')
                    UserLS.postUser($scope.user, 'Enter apikey');
                    $scope.state=UserLS.getRegState(); 
                    $scope.message =UserLS.setRegMessage(response + ', apikey sent');
                } else if(response=='conflict'){
                    console.log('response is conflict')
                    $scope.message = UserLS.setRegMessage( ' Either the user is registered with a different email or email is in use by another user. Try something else.');
                }
            },function(data){
                console.log(Object.keys(data))
                response = data;
            })
        } else if($scope.state == 'Enter apikey'){
            console.log('ok going to authenticate');
            auth($scope.apikey, $scope.username);
            
        } else if($scope.state == 'Get token'){
            console.log('ok getting token');
            auth($scope.apikey, $scope.username);
        }
    } 
    $scope.doesNameExist= function(){
        console.log($scope.username+' changed')
        $scope.state='Register'
        $scope.message = ' will check status...'
        AuthService.isUser($scope.username).then(function(data){
            console.log(data)
            var userls = UserLS.getUser($scope.username);
            if (userls){
                UserLS.setActiveUser($scope.username);
                console.log(userls)
                $scope.email=userls.email;
                $scope.apikey=userls.apikey;
                if (TokenService.tokenExists()){
                    var message = 'all set you are authorized and have token';
                    $scope.state = UserLS.setRegState('Authenticated');
                    $scope.message=UserLS.setRegMessage(message);
                } else if ($scope.apikey.length>10){
                    var message = 'you seem to be lacking a token';
                    $scope.state = UserLS.setRegState('Get token');
                    $scope.message=UserLS.setRegMessage(message);
                }
            }else {
                $scope.email = '';
                $scope.apikey ='';
                $scope.message=UserLS.setRegMessage(data.message + ' on server, good choice');
            }
        },function(data){
            console.log(data)
            $scope.message=UserLS.setRegMessage(data.message);
        });
        console.log('still alive')
    } 
    var auth= function(apikey, name){
        AuthService.auth(apikey, name).then(function(data){
            //console.log(data)
            if(Object.keys(data)[0]=='message'){
                response = data.message
                console.log(data)
                $scope.message = Users.setRegMessage(data.message);
                $scope.apikey = '';
            } else if (data.token.length>40){  
                //$scope.state=UserLS.getRegState(); 
                Users.makeActive(name);
                TokenService.setToken(name, data.token);
                Users.dBget().then(function(){
                    Users.makeActive(name);
                    Users.dBgetLists();
                    $scope.message = Users.setRegMessage('authenticated, token received');
                    $scope.state = Users.setRegState('Authenticated');
                    $scope.apikey = '';                      
                    $state.go('lists'); 
                });                                 
            }
        }, function(data){//if error
            console.log(data)
            $scope.message = UserLS.setRegMessage(data.message);
        });
    };    
}]);

stuffAppControllers.controller('IsregCtrl', function (TokenService, $state, Users, $scope) {
     if (TokenService.tokenExists()){
        $scope.frog = 'froggy'
        $scope.users = Users;
        $state.go('list');    
        console.log('token exists')
    } else{
        
        $scope.loadData=function(){
            Users.demo();
            console.log('loading demo data')
            
            $state.go('lists');
        }
        $scope.register=function(){
            console.log('in isReg.register')
            Users.setRegState('Get token');
            $state.go('register');
        }

    }    
});

stuffAppControllers.controller('ListsCtrl', ['$scope', '$state', 'TokenService', '$rootScope', '$window', 'Users', 'Lists', function ($scope, $state, TokenService, $rootScope, $window, Users, Lists) {//must be in same order
    if (TokenService.tokenExists()){
        /*------setup------*/
        console.log('in Lists ctrl');
        var online = $rootScope.online = false ;   
        $scope.lists = Lists.lal;
        $scope.users = Users.al;
        $scope.active = Users.al.activeUser;                            
    } else{
        Users.setRegState('Get token');
        $state.go('register');
    }
}]);

// stuffAppControllers.controller('ListCtrl', ['$scope', '$state', 'TokenService', '$rootScope', 'Users', function ($scope, $state, TokenService, $rootScope, Users) {
//     if (TokenService.tokenExists()){
//         var online= $scope.online=$rootScope.online=false;
//     } else{
//          var message = 'you seem to be lacking a token';
//         Users.setRegState('Get token');
//         $state.go('register');
//     };   
// }]);


stuffAppControllers.controller('UserCtrl', ['TokenService', '$rootScope',function(TokenService, $rootScope) {
    if (TokenService.tokenExists()){
         //directives take care of users
    } else {
         var message = 'you seem to be lacking a token';
         Users.setRegState('Get token');
        $state.go('register');
    }   
}]);

stuffAppControllers.controller('TemplCtrl', ['$scope', 'TokenService', 'Users', function ($scope, TokenService, Users) {
    if (TokenService.tokenExists()){
        var message = 'all set you are authorized and have token';
        $scope.state = Users.setRegState('Authenticated');
        $scope.message=Users.setRegMessage(message);
    } else {
         var message = 'you seem to be lacking a token';
        $scope.message=Users.setRegMessage(message);
    }    
}]);
stuffAppControllers.controller('ShopsCtrl', ['$scope', 'Stores', 'Lists', '$rootScope',function ($scope, Stores, Lists, $rootScope) {
    $scope.dog = 'fritz';
    $rootScope.online=false;
    $scope.stores=Stores;
    $scope.lists=Lists;
    $scope.reset =function(){
        Stores.reset();
    }
}]);
stuffAppControllers.controller('ConfigCtrl', ['$scope', 'Lists', function ($scope, Lists) {
    $scope.dog = 'kazzy';
    var lal = Lists.lal;
    var items = lal[lal.activeList].items
    //console.log(Lists)
    var item = {"product":"Purple olives","done":false,"loc":"canned"}
    $scope.litem = items.map(function (el){
        return el.product
    })
    $scope.idx=$scope.litem.indexOf("green olives")
    console.log(items[items.map(function (el){return el.product}).indexOf('green olives')])
    items[items.map(function (el){return el.product}).indexOf('green olives')]=item
   Lists.saveList(item);
}]);
stuffAppControllers.controller('AdminCtrl', ['$scope', 'TokenService', 'Lists', 'Users', 'Stores', function ($scope, TokenService, Lists, Users, Stores) {
    $scope.users=Users;
    $scope.lists=Lists;
    $scope.username='';
    $scope.dog = 'piper';
    $scope.output = '';
    $scope.listAll = function(){
        console.log('in listall users')
        Users.LSget();
        console.log(JSON.stringify(Users.al))
        $scope.output=JSON.stringify(JSON.parse(localStorage.getItem('s2g_users')),undefined,2) || {};
        $scope.username='';
    }; 
    $scope.find = function(){
        $scope.output=JSON.stringify(Users.al[$scope.username],undefined,2);
    };  
    $scope.del = function(){
        $scope.output=Users.LSdel($scope.username);
        $scope.username='';
    };
    $scope.usernameT='';
    $scope.outputT= '';
    $scope.listAllT = function(){
        $scope.outputT=TokenService.getAll();
        $scope.usernameT='';
    }; 
    $scope.findT = function(){
        $scope.outputT=TokenService.getToken($scope.usernameT);
    };  
    $scope.delT = function(){
        $scope.outputT=TokenService.delUserToken($scope.usernameT);
        $scope.usernameT='';
    };
    $scope.userL='';
    $scope.outputL= '';
    $scope.listAllL = function(){
        $scope.outputL=JSON.stringify(JSON.parse(localStorage.getItem('s2g_clists')),undefined,2) || {};
        $scope.userL='';
    }; 
    $scope.findL = function(){
        $scope.outputL=JSON.stringify(JSON.parse(localStorage.getItem('s2g_clists'))[$scope.userL],undefined, 2);
    };  
    $scope.delL = function(){
        $scope.outputL=TokenService.delUserToken($scope.usernameT);
        $scope.userL='';
    };  
    $scope.store='';
    $scope.outputS= '';
    $scope.listAllS = function(){
        $scope.outputS=JSON.parse(localStorage.getItem('s2g_stores')) || {};
        $scope.store='';
    }; 
    $scope.findS = function(){
        $scope.outputS='';
    };  
    $scope.delL = function(){
        $scope.outputS='';
        $scope.userL='';
    };      
    $scope.reset= function(){
        Users.reset();
        Lists.reset();
        Stores.reset();
    }; 
    $scope.clear= function(){
        localStorage.clear()
    };
}]);     