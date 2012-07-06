/**
 * @author Marenin Alex
 * June 2012
 */


module( 'Deferred' );

test( 'Simple class creation', function(){
	ok( typeof Deferred == 'function', 'Deferred constrictor exists' );

	var d = new Deferred();

	ok( d, 'Deferred object is created' );
	ok( isFn(d.then), 'method .then exists' );
	ok( isFn(d.reject), 'method .reject exists' );
	ok( isFn(d.resolve), 'method .resolve exists' );
	ok( isFn(d.progress), 'method .progress exists' );
	ok( isFn(d.cancel), 'method .cancel exists' );
	ok( isFn(d.isRejected), 'method .isRejected exists' );
	ok( isFn(d.isResolved), 'method .isResolved exists' );
	ok( isFn(d.isFulfilled), 'method .isFulfilled exists' );
	ok( isFn(d.isCanceled), 'method .isCanceled exists' );

	function isFn( a ){
		return typeof a === 'function';
	}
});


test( 'Resolve test', function(){
	var d = new Deferred();

	stop();

	d.then( function( arg1, arg2 ){
		equal( arg1, 10, 'Resolve passes arguments' );
		start();
	});

	setTimeout( function(){
		ok( !d.isFulfilled(), 'not fulfilled' );

		d.resolve( 10 );

		ok( d.isResolved(), 'isResolved' );
		ok( !d.isRejected(), 'not rejected' );
		ok( d.isFulfilled(), 'isFulfilled' );
	}, 1 );
});


test( 'Reject test', function(){
	var d = new Deferred(),
		d2 = new Deferred();

	stop( 2 );

	d.then( null, function( error ){
		ok( error instanceof Error, 'Reject passes error' );
		start();
	});

	d2.then( null, function(){
		start();
	});

	setTimeout( function(){
		ok( !d.isFulfilled(), 'd not fulfilled' );
		ok( !d2.isFulfilled(), 'd2 not fulfilled' );
		d.reject( new Error() );
		d2.reject();
		ok( d.isRejected(),  'd isResolved' );
		ok(!d.isResolved(),  'd not resolved' );
		ok( d.isFulfilled(), 'd isFulfilled' );
		ok( d2.isRejected(),  'd2 isResolved' );
		ok( d2.isFulfilled(), 'd2 isFulfilled' );
	}, 1 );
});


test( 'Chaining', function(){
	var def = new Deferred(),
		counter = 0;

	stop( 3 );

	def
		.then( function( arg ){
			start();

			equal( ++counter, 1, 'First callback' );

			var def = new Deferred();
			setTimeout( function(){
				start();
				equal( ++counter, 2, 'Second callback' );

				def.resolve( arg + 1);
			}, 1 );

			return def;
		})
		.then( function( arg ){
			start();
			equal( arg, 11, 'Check for parameter passing in chained deferreds' );
			equal( ++counter, 3, 'Last, third callback' );
		});

	setTimeout( function(){
		def.resolve( 10 );
	}, 10 );
});


module( 'Deferred.when' );

test( 'Deferred.when sync', function(){

	expect( 2 );

	Deferred.when( 100 ).then( function( value ){
		equal( value, 100, 'Deferred.when passed right' );
	});

	Deferred.when( 200, function( value ){
		equal( value, 200, 'Deferred.when passed right' );
	});
});


test( 'Deferred.when async', function(){
	var def = new Deferred();

	stop( 2 );

	Deferred.when( def, function( val ){
		equal( val, 10 );
		start();
	});

	Deferred.when( def ).then( function( val ){
		equal( val, 10 );
		start();
	});

	setTimeout( function(){
		def.resolve( 10 );
	}, 10 );
});


module( 'DeferredList' );

test( 'Combining', function(){
	var def1 = new Deferred(),
		def2 = new Deferred(),
		defList = new DeferredList( [def1, def2] );

	stop();

	defList.then( function( result ){
		start();

		ok( def1.isResolved(), 'def1 is resolved' );
		ok( def2.isResolved(), 'def2 is resolved' );

		equal( this.gatherResults(this), [10, 20], 'check for gathered response' );
	});

	setTimeout( function(){
		def1.resolve( 10 );
	}, 5 );
	setTimeout( function(){
		def2.resolve( 20 );
	}, 10 );
});


test( 'Combining and rejecting', function(){
	var def1 = new Deferred(),
		def2 = new Deferred(),
		defList = new DeferredList( [def1, def2] );

	stop();

	defList.then( function(){
		start();

		ok( def1.isResolved(), 'def1 is resolved' );
		ok( def2.isRejected(), 'def2 is rejected' );
	});

	def1.resolve();
	def2.reject();
});


test( 'Waiting for first callback', function(){
	var def1 = new Deferred(),
		def2 = new Deferred(),
		defList = new DeferredList( [def1, def2], true );

	stop();

	defList.then( function( result ){
		start();
		equal( result[1], 10, 'check for return' );
	});

	def1.resolve( 10 );
});


test( 'Waiting for first errback', function(){
	var def1 = new Deferred(),
		def2 = new Deferred(),
		defList = new DeferredList( [def1, def2], true, true );

	stop();
	expect( 1 );

	defList.then(
		function(){
			ok( false, 'Test must go to reject callback' );
			start();
		},
		function(){
			ok( defList.isRejected(), 'Test goes to reject callback' );
			start();
		}
	);

	def1.reject();
});