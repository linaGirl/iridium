


	var Class = iridium( "class" )
		, events = iridium( "events" );





	var Service = module.exports = new Class( {
		Extends: Events


		, constructor: function( options ){
			this.start = options.start.bind( this );
			this.stop = options.stop.bind( this );
		}


	} );