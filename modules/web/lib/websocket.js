

	var Class = iridium( "class" )
		, Events = iridium( "events" );


	var Websocket = module.exports = new Class( {
		Extends: Events


		, constructor: function( options ){
			this.__socket = options.socket;
		}
	} );