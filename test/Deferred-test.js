/**
 * @author Marenin Alex
 * June 2012
 */

module( 'Deferred creation' );

test( 'Simple class creation', function(){
	ok( typeof Deferred == 'function', 'Deferred constrictor exists' );

	ok( def, 'Deferred object is created' );
	ok( def.then, 'method .then exists' );
	ok( def.reject, 'method .reject exists' );
	ok( def.resolve, 'method .resolve exists' );
	ok( def.progress, 'method .progress exists' );
	ok( def.cancel, 'method .cancel exists' );
	ok( def.isRejected, 'method .isRejected exists' );
	ok( def.isResolved, 'method .isResolved exists' );
	ok( def.isFulfilled, 'method .isFulfilled exists' );
	ok( def.isCanceled, 'method .isCanceled exists' );
});
