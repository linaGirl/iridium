

	

	var Class 			= iridium( "class" );


	module.exports = new Class( {

		__jobs: []

		, add: function( job ){
			this.__jobs.push( job );
			return this;
		}


		, __do: function( err ){
			if ( err ) this.__callback( err );
			else {
				if ( this.__jobs.length > 0 ){
					this.__jobs.shift()( this.__do.bind( this ) );
				}
				else {
					this.__callback();
				}
			}
		}


		, start: function( callback ){
			this.__callback = callback;
			this.__do();
		}
	} );

	