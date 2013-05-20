


	var Class 			= iridium( "class" )
		, log 			= iridium( "log" );

	var RestResponder 	= require( "./restresponder" );


	module.exports = new Class( {
		inherits: RestResponder

		, hasResource: function(){
			return typeof this.resource === "object";
		}

		, getResource: function(){
			if ( !this.hasResource() ) throw new Error( "The colelction [" + this.__name + "] has no resource!" );
			return this.resource;
		}

		, hasCommonAction: function(){
			return typeof this.doCommon === "function";
		}

		, setProperty: function( property, value ){
			this.resource[ property ] = value;
		}
	} );