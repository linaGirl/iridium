	"use strict";
	
	// server abstraction which implements connection pooling
	var Class = iridium( "class" )
		, Events = iridium( "events" );


	module.exports = new Class( {
		$id: "net.Server"

		, Extends: Events


		, constructor: function(){
		}
	} );