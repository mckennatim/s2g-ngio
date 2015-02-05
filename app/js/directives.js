'use strict';

/* Directives */


var app = angular.module('stuffAppDirectives', []);




 app.directive('itemEscape', function () {
		'use strict';
		var ESCAPE_KEY = 27;
		return function (scope, elem, attrs) {
			elem.bind('keydown', function (event) {
				if (event.keyCode === ESCAPE_KEY) {
					scope.$apply(attrs.itemEscape);
				}
			});
		};
	});


app.directive('sbOnline', ['$rootScope', 'Users', function($rootScope, Users){
  return{
    restrict: 'E',
    //needs bootstrap
    template: '<span class="glyphicon glyphicon-signal" ng-show="online"></span><span class="glyphicon glyphicon-ban-circle" ng-show="!online"></span>',
    link: function(scope, element, attrs){
      Users.ckIfOnline().then(function(){
        //console.log($rootScope.online)
        scope.online = $rootScope.online;
      });
      $rootScope.$watch('online', function(newValue, oldValue){
          //console.log('watched')
          //console.log(newValue)
          if (newValue !== oldValue) {
              scope.online=newValue;
              console.log('$rootScope.online changed to: '+$rootScope.online )
              if(newValue){
                  
              }                
          }                       
      });            
    }
  }
}]);

app.directive('sbUser',['Users', '$state', function(Users, $state){
  return{
    restrict: 'E',
    scope: {}, //isolates scope
    templateUrl: "partials/sb-user.html",
    link: function(scope, element, attrs){
      scope.users = Users.al;
      scope.makeActive=function(name){
        Users.makeActive(name);
        $state.go('lists');
      };
      scope.goRegister =function(){
        $state.go('register');
      };
      scope.remove = function(user){
        alert('removing user ' + user);
        Users.LSdel(user);
      };
    }
  }
}])

app.directive('sbLists',['Users', '$state', function(Users, $state){
  return{
    restrict: 'E',
    scope: {}, //isolates scope
    templateUrl: "partials/sb-lists.html",
    link: function(scope, element, attrs) {
      scope.users = Users.al;
      scope.makeActive=function(name){
        Users.makeActive(name);
      }
      scope.makeDefListInfo =function(def){
        Users.makeDefListInfo(def);
        console.log('clicked shops')
        document.body.scrollTop = document.documentElement.scrollTop = 0;
        $state.go('list');
      }        
      scope.remove = function(list){
        console.log(list)
        alert('Are you sure you want to resign from this list?')
        Users.dBdelList(list.lid).then(function(data){
          if (data.message){
            $scope.message = data.message;
          }else {
            console.log(data)
          }
        })
      };
      scope.join = function(){
          console.log(scope.listsInput)
           if (scope.listsInput) {
              Users.dBjoin(scope.listsInput).then(function(data){
                  if (data.message){
                      scope.message = data.message;
                  }else {
                      scope.message= ''
                      console.log(data)
                  }
                  scope.listsInput = ''
              });                
          }
      };
      scope.add = function(){
          console.log(scope.listsInput)
           if (scope.listsInput) {
              Users.dBaddList(scope.listsInput).then(function(data){
                  if (data.message){
                      scope.message = data.message;
                  }else {
                      scope.message= ''
                      console.log(data)
                  }
                  scope.listsInput = ''
              });                
          }
      };
      scope.edit =function(list){
          scope.editedList=list;
          scope.originalItem = angular.extend({}, list);
      }; 
      scope.revertEdit = function(list){
          console.log('escaped into revertEdit')
          scope.editedList = null;
          scope.users[scope.users.activeUser].lists[scope.users[scope.users.activeUser].lists.indexOf(list)]=scope.originalItem;
      };
      scope.doneEditing = function(list){
          console.log('in doneEditing')
          scope.editedList = null;
          scope.users[scope.users.activeUser].lists[scope.users[scope.users.activeUser].lists.indexOf(list)]=list;
          Users.dBput(scope.users[scope.users.activeUser]);
      };                
    }  
  }
}])

// app.directive('sbList',['Users', 'Lists', 'Stores', '$state', '$filter', 'ioService', function(Users, Lists, Stores, $state, $filter, ioService){
//   return{
//     restrict: 'E',
//     scope: {}, //isolates scope
//     templateUrl: "partials/sb-list.html",
//     link: function(scope, element, attrs) {
//       //var io= ioService.socket;
//       //io.emit('switchLid', 'Jutebi');
//       // io.on('itemChanged', function(data){
//       //     console.log(JSON.stringify(data))
//       // })
//       scope.users = Users.al;
//       scope.lists = Lists.lal;
//       scope.stores=Stores;
//       scope.sortBy = 'alpha'
//       scope.showLoc=true;
//       scope.showTags=true;
//       scope.makeActive=function(name){
//           Users.makeActive(name);
//       };
//       scope.makeDefListInfo =function(def){
//           Users.makeDefListInfo(def);
//       };      
//       scope.ckDone = function(item){
//           console.log(item)
//           if (item.amt){
//               item.amt.qty="";
//           }
//           // io.emit('message', item) 
//           var message={action:'modify', item:item}
//           console.log(message)
//           Lists.saveList(message);
//       };
//       scope.remove= function(item){
//           console.log(item);
//           var idx = scope.lists[scope.lists.activeList].items.indexOf(item);
//           scope.lists[scope.lists.activeList].items.splice(idx,1);
//           var message={action:'delete', item:item}
//           console.log(message)
//           Lists.saveList(message);
//       };    
//       scope.rubmit = function(){
//           console.log(scope.lists.activeList)
//           var item;
//           if (scope.query) {
//               item={product: this.query, done:false};
//               console.log(item)
//               scope.lists[scope.lists.activeList].items.push(item);
//               scope.query = '';
//               var message={action:'add', item:item}
//               console.log(message)
//               Lists.saveList(message);
//            }
//       };    
//       scope.editBuffer={} 
//       scope.editItem = function(item){
//           console.log(item)
//           scope.editedItem= item;
//           scope.buffer = JSON.parse(JSON.stringify(item));
//           console.log(scope.buffer)
//       };
//       scope.doneEditing = function(buffer){
//           console.log('in doneEditing')  
//           console.log(buffer)         
//           scope.editedItem.product = buffer.product.trim();
//           if(buffer.loc){scope.editedItem.loc = buffer.loc.trim();}
//           console.log(buffer.tags)
//           if(buffer.tags && buffer.tags.length>0){scope.editedItem.tags = buffer.tags;}
//           console.log(buffer.amt);
//           if (buffer.amt){
//               scope.editedItem.amt = {qty:0, unit:''}
//               if(buffer.amt.qty){
//                   scope.editedItem.amt.qty = buffer.amt.qty.trim()
//               };
//               if(buffer.amt.unit){
//                   scope.editedItem.amt.unit = buffer.amt.unit.trim()
//               };        
//           }
//           if (!buffer.product) {
//               scope.remove($scope.editedItem);
//           } 
//           console.log(scope.editedItem)
//           var message={action:'replace', item:scope.editedItem}
//           console.log(message)
//           Lists.saveList(message);          
//           scope.editedItem = null;
//       };
//       scope.revertEdit = function(item){
//           console.log('escaped into revertEdit')
//           scope.editedItem = null;
//           //items[items.indexOf(item)] = $scope.originalItem;
//           //$scope.doneEditing($scope.originalItem);           
//       };                 
//       var orderBy = $filter('orderBy');
//       var filter = $filter('filter');  
//       scope.aisleOrder = function(item){
//           if(!item.loc){
//               return 0 
//           }else {
//               return scope.stores.st[store.id].aisles.indexOf(item.loc); 
//           }  
//       };              
//       scope.orderByStore= function(store){
//           scope.sortBy=store.name;
//           var aisleOrder = function(item){
//               if(!item.loc){
//                   return 0 
//               }else {
//                   //console.log(item.product + ' ' +item.loc)
//                   //console.log($scope.stores.st[store.id].aisles.indexOf(item.loc))
//                   return  scope.stores.st[store.id].aisles.indexOf(item.loc);
//               }  
//           };            
//           var items= scope.lists[scope.lists.activeList].items;
//           scope.lists[scope.lists.activeList].items = orderBy(items, aisleOrder);
//           var message={action:'doNothing', item:{product:'none', done:false}}
//           console.log(message)
//           Lists.saveList(message); 
//       };
//       scope.reverse = false;
//       scope.sort = function(){
//           scope.sortBy='alpha';
//           var items= scope.lists[scope.lists.activeList].items;
//           scope.lists[scope.lists.activeList].items = orderBy(items, "product", scope.reverse);
//           scope.reverse = !scope.reverse
//           var message={action:'doNothing', item:{product:'none', done:false}}
//           console.log(message)
//           Lists.saveList(message); 
//       };
//     } 
//   }
// }])

