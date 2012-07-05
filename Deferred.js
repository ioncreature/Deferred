/**
 * @author Marenin Alex
 * July 2012
 *
 * This code is modified part of Dojo Toolkit (http://dojotoolkit.org/)
 * Original code available here: https://github.com/dojo/dojo/blob/master/Deferred.js
 */

(function( global ){
	"use strict";

	var extend = function( ctor, proto ){
		for ( var k in proto ) if ( proto.hasOwnProperty(k) )
			ctor.prototype[k] = proto[k];
		return ctor;
	};


	// module:
	//		dojo/promise/Promise

	var Promise = (function(){
		function throwAbstract(){
			throw new TypeError("abstract");
		}

		return extend( function Promise(){}, {
			then: function(/*Function?*/ callback, /*Function?*/ errback, /*Function?*/ progback){
				throwAbstract();
			},

			cancel: function(reason){
				throwAbstract();
			},

			isResolved: function(){
				throwAbstract();
			},

			isRejected: function(){
				throwAbstract();
			},

			isFulfilled: function(){
				throwAbstract();
			},

			isCanceled: function(){
				throwAbstract();
			},

			always: function(/*Function?*/ callbackOrErrback){
				return this.then(callbackOrErrback, callbackOrErrback);
			},

			otherwise: function(/*Function?*/ errback){
				return this.then(null, errback);
			},

			trace: function(/* ... */){
				return this;
			},

			traceRejected: function(/* ... */){
				return this;
			},

			toString: function(){
				return "[object Promise]";
			}
		});
	})();


	// module:
	//		dojo/Deferred

	var Deferred = (function(){
		var PROGRESS = 0,
			RESOLVED = 1,
			REJECTED = 2;
		var FULFILLED_ERROR_MESSAGE = "This deferred has already been fulfilled.";

		var freezeObject = Object.freeze || function(){};

		var signalWaiting = function(waiting, type, result, rejection, deferred){

			for(var i = 0; i < waiting.length; i++){
				signalListener(waiting[i], type, result, rejection);
			}
		};

		var signalListener = function(listener, type, result, rejection){
			var func = listener[type];
			var deferred = listener.deferred;
			if(func){
				try{
					var newResult = func(result);
					if(newResult && typeof newResult.then === "function"){
						listener.cancel = newResult.cancel;
						newResult.then(
								// Only make resolvers if they're actually going to be used
								makeDeferredSignaler(deferred, RESOLVED),
								makeDeferredSignaler(deferred, REJECTED),
								makeDeferredSignaler(deferred, PROGRESS));
						return;
					}
					signalDeferred(deferred, RESOLVED, newResult);
				}catch(error){
					signalDeferred(deferred, REJECTED, error);
				}
			}else{
				signalDeferred(deferred, type, result);
			}

		};

		var makeDeferredSignaler = function(deferred, type){
			return function(value){
				signalDeferred(deferred, type, value);
			};
		};

		var signalDeferred = function(deferred, type, result){
			if(!deferred.isCanceled()){
				switch(type){
					case PROGRESS:
						deferred.progress(result);
						break;
					case RESOLVED:
						deferred.resolve(result);
						break;
					case REJECTED:
						deferred.reject(result);
						break;
				}
			}
		};

		var Deferred = function(/*Function?*/ canceler){
			// promise: dojo/promise/Promise
			//		The readonly promise that tells when this Deferred resolves
			var promise = this.promise = new Promise();

			var deferred = this;
			var fulfilled, result, rejection;
			var canceled = false;
			var waiting = [];


			this.isResolved = promise.isResolved = function(){
				return fulfilled === RESOLVED;
			};

			this.isRejected = promise.isRejected = function(){
				return fulfilled === REJECTED;
			};

			this.isFulfilled = promise.isFulfilled = function(){
				return !!fulfilled;
			};

			this.isCanceled = promise.isCanceled = function(){
				return canceled;
			};

			this.progress = function(update, /*Boolean?*/ strict){
				if(!fulfilled){
					signalWaiting(waiting, PROGRESS, update, null, deferred);
					return promise;
				}else if(strict === true){
					throw new Error(FULFILLED_ERROR_MESSAGE);
				}else{
					return promise;
				}
			};

			this.resolve = function(value, /*Boolean?*/ strict){
				if(!fulfilled){
					// Set fulfilled, store value. After signaling waiting listeners unset
					// waiting.
					signalWaiting(waiting, fulfilled = RESOLVED, result = value, null, deferred);
					waiting = null;
					return promise;
				}else if(strict === true){
					throw new Error(FULFILLED_ERROR_MESSAGE);
				}else{
					return promise;
				}
			};

			var reject = this.reject = function(error, /*Boolean?*/ strict){
				if(!fulfilled){
					signalWaiting(waiting, fulfilled = REJECTED, result = error, rejection, deferred);
					waiting = null;
					return promise;
				}else if(strict === true){
					throw new Error(FULFILLED_ERROR_MESSAGE);
				}else{
					return promise;
				}
			};

			this.then = promise.then = function(/*Function?*/ callback, /*Function?*/ errback, /*Function?*/ progback){
				var listener = [progback, callback, errback];
				listener.cancel = promise.cancel;
				listener.deferred = new Deferred(function(reason){
					return listener.cancel && listener.cancel(reason);
				});
				if(fulfilled && !waiting){
					signalListener(listener, fulfilled, result, rejection);
				}else{
					waiting.push(listener);
				}
				return listener.deferred.promise;
			};

			this.cancel = promise.cancel = function(reason, /*Boolean?*/ strict){
				if(!fulfilled){
					if(canceler){
						var returnedReason = canceler(reason);
						reason = typeof returnedReason === "undefined" ? reason : returnedReason;
					}
					canceled = true;
					if(!fulfilled){
						if(typeof reason === "undefined"){
							reason = new Error();
						}
						reject(reason);
						return reason;
					}else if(fulfilled === REJECTED && result === reason){
						return reason;
					}
				}else if(strict === true){
					throw new Error(FULFILLED_ERROR_MESSAGE);
				}
			};

			freezeObject(promise);
		};

		Deferred.prototype.toString = function(){
			return "[object Deferred]";
		};

		return Deferred;
	})();



	// module:
	//		dojo/when
	var when = (function(Deferred, Promise){
		"use strict";
		return function when(valueOrPromise, /*Function?*/ callback, /*Function?*/ errback, /*Function?*/ progback){
			// summary:
			//		Transparently applies callbacks to values and/or promises.
			// description:
			//		Accepts promises but also transparently handles non-promises. If no
			//		callbacks are provided returns a promise, regardless of the initial
			//		value. Foreign promises are converted.
			//		If callbacks are provided and the initial value is not a promise,
			//		the callback is executed immediately with no error handling. Returns
			//		a promise if the initial value is a promise, or the result of the
			//		callback otherwise.
			// returns: dojo/promise/Promise
			//
			// valueOrPromise:
			//		Either a regular value or a promise.
			// callback:
			//		Callback to be invoked when the promise is resolved, or a non-promise
			//		is received.
			// errback:
			//		Callback to be invoked when the promise is rejected.
			// progback:
			//		Callback to be invoked when the promise emits a progress update.
			var receivedPromise = valueOrPromise && typeof valueOrPromise.then === "function";
			var nativePromise = receivedPromise && valueOrPromise instanceof Promise;

			if(!receivedPromise){
				if(callback){
					return callback(valueOrPromise);
				}else{
					return new Deferred().resolve(valueOrPromise);
				}
			}else if(!nativePromise){
				var deferred = new Deferred(valueOrPromise.cancel);
				valueOrPromise.then(deferred.resolve, deferred.reject, deferred.progress);
				valueOrPromise = deferred.promise;
			}

			if(callback || errback || progback){
				return valueOrPromise.then(callback, errback, progback);
			}
			return valueOrPromise;
		};
	})();



	if ( typeof define == 'function' && define.amd )
		define( function(){
			return Deferred;
		});
	else
		global.Deferred = Deferred;


})( this );
