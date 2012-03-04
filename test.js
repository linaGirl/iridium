
	require( "./" )( "iridium test", 1 );




	var MyClass = new Class( {
		$id: "MyClass"  	// used for logging
		, Extends: Events 

		, name: "sven"


		, constructor: function( options ){
			log.info( "myclass is executing its constructor", this ); // the "this" argument is used for logging 
			log.debug( "my name is", this.name, this );

			this.name = "michael"
			log.highlight( "now my name is", this.name, this );
		}


		, sayHello: function( to ){
			log.info( "hi", to, this );

			this.emit( "hello", to );
		}
	} );


	var myClassInstance = new MyClass( { 
		name: "john"
		, on: {
			hello: function( to ){
				log.warn( "myClassInstance had to say hello to", to );
			}.bind( this ) 
		}
	} );

	myClassInstance.sayHello( "ramon" );


	var net = iridium( "net" );


	new net.Connection();