

	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" );



	module.exports = new Class( {
		inherits: Events

		, __id: null
		, __authenticated: false
		, __active: false

		, get id(){ return this.__id;  }
		, set id(x){ throw new Error( "you cannot set the id!" ); }

		, get authenticated(){ return this.__authenticated; }
		, get active(){ return this.__active; }


		, set: function( options, callback ){
			callback();
		}

		, setActive: function( callback ){
			callback();
		}

		, setAuthenticated: function( authState, callback ){
			callback();
		}

		, cleanup: function(){}


		, toJSON: function(){
			return {
				  id: 				0
				, authenticated: 	false
				, active: 			false
			};
		}
	} );