# iridium framwework

the irdium framework is used to create distributed high performance applications for the web. it provides basic abstractions for several software layers so the programmer can focus on implementing the application itself. Beside this it provides some basic modules like a Class implementation, simpler Events abstration, an advanced logging facility and a stats data collector ( analyzer is a separate project depending on this framework ).


# installing

git clone https://github.com/eventemitter/iridium.git
cd build
bash build


# API

include the framwork. this provides the now glbally available modules Class, Events, log and zero ( which provides the statistics collector interface )

    require( "iridium", "my app name", 1 );


## Class

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
		, on: { // events in this object will automatically added to the class instance as soon the class is extending the Events class
			hello: function( to ){
				log.warn( "myClassInstance had to say hello to", to );
			}.bind( this ) 
		}
	} );

	myClassInstance.sayHello( "ramon" );




## Events
