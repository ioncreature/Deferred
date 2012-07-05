/**
 * @author Marenin Alex
 * June 2012
 */

function isFn( a ){
	return typeof a === 'function';
}

module( 'Deferred creation' );

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
	}, 1 );
});


test( 'Deferred.when tests', function(){
	ok( true, 'skip' );
});
