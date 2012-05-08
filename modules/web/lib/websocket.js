

	var Class = iridium( "class" )
		, Events = iridium( "events" );


	var Websocket = module.exports = new Class( {
		inherits: Events


		, init: function( options ){
			this.__socket = options.socket;
		}
	} );