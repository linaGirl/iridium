

	

	var Class 			= iridium( "class" );


	module.exports = new Class( {

		__jobs: []
		, __finishedCount: 0
		, __callback: null

		, add: function( job, scope ){
			this.__jobs.push( job.bind( scope ) );
			return this;
		}


		, __complete: function(){
			this.__finishedCount++;
			if ( this.__finishedCount === this.__jobs.length ){
				if ( this.__callback ) this.__callback();
			}
		}


		, cancel: function( err ){
			if ( this.__callback ) {
				this.__callback( err );
				delete this.__callback;
			}
		}

		, start: function( callback ){
			var i = this.__jobs.length;

			this.__callback = callback;

			if ( i > 0 ){
				while( i-- ){
					this.__jobs[ i ]( this.__complete.bind( this ) );
				}
			}
			else {
				if ( callback ) callback();
			}
		}
	} );

	