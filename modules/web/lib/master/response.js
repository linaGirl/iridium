


	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" )
		, argv 			= iridium( "util" ).argv
		, debug 		= argv.has( "trace-all" ) || argv.has( "trace-session" );



	module.exports = new Class( {
		inherits: Events

		, __sourceId: null
		, __callId: null


		, init: function( options ){
			this.__sourceId 	= options.sourceId
			this.__callId 		= options.callId
		}


		, getSourceId: function(){
			return this.__sourceId;
		}


		, sendError: function( err ){
			this.emit( "message", this.__sourceId, { status: "error", callId: this.__callId, payload: { err: err.toString() } } );
			this.off();
		}

		, sendSuccess: function(){
			this.emit( "message", this.__sourceId, { status: "ok", callId: this.__callId, payload: {} } );
			this.off();
		}

		, sendSession: function( session ){
			this.emit( "message", this.__sourceId, { status: "ok", callId: this.__callId, payload: { session: session.toJSON() } } );
			this.off();
		}
	} );