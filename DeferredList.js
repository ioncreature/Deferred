/**
 * @author Marenin Alex
 * July 2012
 *
 * This code is modified part of Dojo Toolkit (http://dojotoolkit.org/)
 * Original code available here: https://github.com/dojo/dojo/blob/master/DeferredList.js
 */

(function( global ){

	function createDeferredListClass( Deferred ){

		// module:
		//		dojo/DeferredList

		var DeferredList = function(/*Array*/ list, /*Boolean?*/ fireOnOneCallback, /*Boolean?*/ fireOnOneErrback, /*Boolean?*/ consumeErrors, /*Function?*/ canceller){
			var resultList = [];
			Deferred.call(this);
			var self = this;
			if(list.length === 0 && !fireOnOneCallback){
				this.resolve([0, []]);
			}
			var finished = 0;
			list.forEach( function(item, i){
				item.then(function(result){
					if(fireOnOneCallback){
						self.resolve([i, result]);
					}else{
						addResult(true, result);
					}
				},function(error){
					if(fireOnOneErrback){
						self.reject(error);
					}else{
						addResult(false, error);
					}
					if(consumeErrors){
						return null;
					}
					throw error;
				});
				function addResult(succeeded, result){
					resultList[i] = [succeeded, result];
					finished++;
					if(finished === list.length){
						self.resolve(resultList);
					}

				}
			});
		};
		DeferredList.prototype = new Deferred();

		DeferredList.prototype.gatherResults = function(deferredList){
			var d = new DeferredList(deferredList, false, true, false);
			d.addCallback(function(results){
				var ret = [];
				results.forEach(function(result){
					ret.push(result[1]);
				});
				return ret;
			});
			return d;
		};

		return DeferredList;
	}


	// Declare as AMD module if possible
	if ( typeof define == 'function' && define.amd )
		define( ['./Deferred'], function( Deferred ){
			return createDeferredListClass( Deferred );
		});
	else
		global.DeferredList = createDeferredListClass( Deferred );

})( this );
