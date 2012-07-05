Deferred
========

Realization of deferred object by Dojo Toolkit, but without dependencies


Using:

var def = new Deferred();

def.then(
  function( arg ){
    console.log( 'this is resolve callback', arg );
  },
  function(){
    console.log( 'this is reject callback' );
  }
);

setTimeout( function(){
  cosnole.log( 'Resolving deferred object' );
  def.resolve( 'this is arguments' );
}, 100 );