

	var   Class 	= iridium( "class" )
		, Events 	= iridium( "events" )
		, log 		= iridium( "log" )
		, util 		= iridium( "util" )
		, Waiter 	= util.Waiter
		, cp 		= require( "child_process" )
		, fs 		= require( "fs" );



	module.exports = new Class( {
		inherits: Events

		, init: function( options ){
			this.__prefix = "/tmp/events-ch-" + ( Date.now() + "-" + Math.random() ).replace( /\./gi, "" );
			this.__paths = [];

			this.__files 	= options.files;

			this.__saveFiles( function( err ){
				this.__execute();
			}.bind( this ) );
		}



		, __saveFiles: function( callback ){
			var waiter = new Waiter(), i = 0;

			this.__files.forEach( function( file ){
				waiter.add( function( cb ){
					i++;
					( function( index ){
						fs.writeFile( this.__prefix + "-" + index + ".pdf", file, function( err ){
							if ( err ) log.trace( err );
							else this.__paths.push( this.__prefix + "-" + index + ".pdf" );
							cb();
						}.bind( this ) );						
					}.bind( this ) )( i );
				}.bind( this ) );				
			}.bind( this ) );

			waiter.start( callback );
		}


		, __execute: function(){
			var command = "pdftk " + this.__paths.join( " " ) + " cat output " + this.__prefix + "-combined.pdf";

			cp.exec( command, function( err, stdout, stderr ){
				if ( err ) this.emit( "complete", err );
				else {
					fs.readFile( this.__prefix + "-combined.pdf", function( err, data ){
						this.emit( "complete", err , data );

						// unlink combined
						fs.unlink( this.__prefix + "-combined.pdf" );
					}.bind( this ));
				}

				// unlink old files
				this.__paths.forEach( function( path ){
					fs.unlink( path );
				}.bind( this ) );
			}.bind( this ) );
		}
	} );