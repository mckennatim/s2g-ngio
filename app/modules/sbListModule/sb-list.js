var sbList = angular.module('sbList', []);

sbList.directive('sbList',[ '$state', '$filter', 'ioService', 'Stores', function( $state, $filter, ioService, Stores){
	return{
		restrict: 'E',
		scope: {
       		list: "=list",
       		upd: "&",
       		lid: "@"
       	}, //isolates scope
		templateUrl: "sbListModule/sb-list.html",
		link: function(scope, element, attrs) {
			var io = ioService.socket
			scope.stores=Stores;
			scope.sortBy = 'alpha'
			scope.showLoc=true;
			scope.showTags=true;
			io.emit('switchLid',scope.lid);
			var replace = function(item,oldProduct){
				if (scope.list){
					var idx = find(oldProduct);
					if(idx==-1){
						scope.list.items.push(item);					
					}else{
						rep4idx(idx, item);
					}					
				}else{
					console.log('there is no list on this machine')
				}

			}
			var del =function(item){
				if (scope.list){
					var idx = find(item.product);
					scope.list.items.splice(idx,1);
				}else{
					console.log('there is no list on this machine')
				}				
			}
			var ad = function(item){
				if (scope.list){
					scope.list.items.push(item);
				}else{
					console.log('there is no list on this machine')
				}				
			}			
			var find = function(product){
				return scope.list.items.map(function (el){return el.product}).indexOf(product)
			}
			var rep4idx = function(idx,item){
				scope.list.items[idx]=item
			}			
			io.on('itemChanged', function(data){
				console.log(data.action +  '; ' + data.oldProduct + ' with:');
				console.log(data.item);
				switch (data.action){
					case 'modify':
						//modify(data.item);
						replace(data.item, data.item.product)
						break;
					case 'add':
						ad(data.item);
						break;
					case 'delete':
						del(data.item);
						break;                                             
					case 'replace':
						replace(data.item, data.oldProduct)
						break;                                             
				}
				scope.$apply();
				scope.upd({message:'from remote'})
			})
			scope.ckDone = function(item){
				var message = {action:'modify', item:item}
				console.log(message.item)
				io.emit('message', message)
				scope.upd({message:'from local ckUpd'})
			}
			scope.remove= function(item){
				var message = {action:'delete', item:item}
				del(message.item)
				console.log(message.item)
				io.emit('message', message)
				scope.upd({message:'from local remove'})
			}; 
			scope.rubmit= function(item){
				var item;
				if (scope.query) {
					item={product: this.query, done:false};
					ad(item)				
					var message = {action:'add', item:item}
					console.log(message.item)
					io.emit('message', message)
					scope.upd({message:'from local ad'})
					scope.query = '';
				}				
			}  	
			scope.editBuffer={} 
			var editedItem ={}
			scope.editItem = function(item){
				console.log(item)
				scope.editedItem= item;
				scope.buffer = JSON.parse(JSON.stringify(item));
				console.log(scope.buffer)
			};
			scope.doneEditing = function(buffer){
				console.log('in doneEditing')  
				console.log(buffer)      
				var oldProduct =   scope.editedItem.product; 
				scope.editedItem.product = buffer.product.trim();
				if(buffer.loc){scope.editedItem.loc = buffer.loc.trim();}
				console.log(buffer.tags)
				if(buffer.tags && buffer.tags.length>0){scope.editedItem.tags = buffer.tags;}
				console.log(buffer.amt);
				if (buffer.amt){
					scope.editedItem.amt = {qty:0, unit:''}
					if(buffer.amt.qty){
						scope.editedItem.amt.qty = buffer.amt.qty.trim()
					};
					if(buffer.amt.unit){
						scope.editedItem.amt.unit = buffer.amt.unit.trim()
					};        
				}
				console.log(scope.editedItem)
				var message={action:'replace', item:scope.editedItem, oldProduct:oldProduct}
				console.log(message.item)
				io.emit('message', message)
				scope.upd({message:'from local doneEditng'})				
				scope.editedItem = null;
			};
			scope.revertEdit = function(item){
				console.log('escaped into revertEdit')
				scope.editedItem = null;
			}; 					
		}
	}
}])

sbList.service("ioService", function($q, $timeout) {  
	console.log('the ioservice has started')
	var port = 3000;    
	var socket = io.connect('10.0.1.25:' + port);
	console.log('connected in ioService')
	var service = {
		dog: 'fred',
		socket: socket,
		port: port
	}
	return service;
});

sbList.factory('Stores', function(){
    var st, reload;
    var reload = function(){
        localStorage.setItem('s2g_stores', JSON.stringify(stores));
        st = JSON.parse(localStorage.getItem('s2g_stores'))
    };
    st = JSON.parse(localStorage.getItem('s2g_stores'))  || reload();
    return{
        st:st,
        reset: function(){
            console.log(JSON.stringify(stores))
            localStorage.setItem('s2g_stores', JSON.stringify(stores));
        },
   }
})

sbList.controller('ListCtrl', ['$scope', '$state', 'TokenService', '$rootScope', 'Users', 'Lists', function ($scope, $state, TokenService, $rootScope, Users) {
    if (TokenService.tokenExists()){
        var online= $scope.online=$rootScope.online=false;
    } else{
         var message = 'you seem to be lacking a token';
        Users.setRegState('Get token');
        $state.go('register');
    };   
}]);