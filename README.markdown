# iridium framwework 

the irdium framework is used to create distributed high performance applications for the web. it provides basic abstractions for several software layers so the programmer can focus on implementing the application itself. Beside this it provides some basic modules like a Class implementation, simpler Events abstration, an advanced logging facility and a stats data collector ( analyzer is a separate project depending on this framework ).

the complete framework code runs under the "strict mode".


# installing

	git clone https://github.com/eventemitter/iridium.git
	cd build
	bash build


# API

include the framwork. this provides the now glbally available modules Class, Events, log and zero ( which provides the statistics collector interface )
	
	// additionally prints the iridium start screen
    require( "/path/to/iridium/" )( "my app name", 1 );

    // load the framework quietly
    require( "/path/to/iridium/" );
 

## Class
	
	require( "/path/to/iridium/" );

	var Class = iridium( "class" )
		, log = iridium( "log" );

	var MyClass = new Class( {
		$id: "MyClass"  	// used for logging
		, inherits: Events 

		, name: "sven"


		, init: function( options ){
			log.info( "myclass is executing its constructor", this ); // the "this" argument is used for logging 
			log.debug( "my name is", this.name, this );

			this.name = "michael"
			log.highlight( "now my name is", this.name, this );
		}


		// smae function is provided by the Events class which is Extended by this class
		// if you want to be able to call the on method in the parent class this instance
		// of the function has to be a named function.
		, on: function on( event, listener, once ){
			// if calling a parent function parameter 0 must be the current scope, e.g. this
			on.parent( this, event, listener, once );
		}


		, sayHello: function( to ){
			log.info( "hi", to, this );

			this.emit( "hello", to );
		}
	} );


	var myClassInstance = new MyClass( { 
		name: "john"   
		, on: { 						// events in this object will automatically be added to 
			hello: function( to ){		// the class instance as soon the class is extending the Events class
				log.warn( "myClassInstance had to say hello to", to );
			}.bind( this ) 
		}
	} );

	myClassInstance.sayHello( "ramon" );



	// prints:
	// 04 18:31:21.922 >             MyClass@test.js:31 >>> myclass is executing its constructor 
	// 04 18:31:21.923 >             MyClass@test.js:31 >>> my name is sven 
	// 04 18:31:21.923 >             MyClass@test.js:31 >>> now my name is michael 
	// 04 18:31:21.923 >             MyClass@test.js:31 >>> hi ramon 
	// 04 18:31:21.923 >                              - >>> myClassInstance had to say hello to ramon 

	// |     |							|       |           
    // date  time			class id ( $id )   file:line where the class was instantiated



## Events
	
the events class provides a very simple interface to manage the events of a class.

### on

add an eventlistener to the class instance

	// add an event, if once is set to true the event will be removed after its fired once
    classInstance.on( eventName, listener, [once] );

    // same interface as on, but the once parameter is not needed but set always to true
    classInstance.once( eventName, listener );

### off

remove events
	
	classInstance.off( [eventName], [listener] );

	// remove all event listeners
	classInstance.off();

	// remove all "listen" event listeners
	classInstance.off( "listen" );

	// remove specific listener from "listen" event
	classInstance.off( "listen", fn );


### emit

emit events, passes arguments if available
	
	classInstance.emit( eventName, [arg], [arg], [...] );


## log

simple colorful logging

	
	log.debug( [item], [item], [...], [callingClass] );
	log.info( [item], [item], [...], [callingClass] );
	log.warn( [item], [item], [...], [callingClass] );
	log.error( [item], [item], [...], [callingClass] );
	log.highlight( [item], [item], [...], [callingClass] );

	log.dir( [item], [item], [...] );

	log.trace( err, [callingClass] );
