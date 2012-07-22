



	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" );


	var fs = require( "fs" );



	var File = module.exports = new Class( {
		$id: "fs.File"
		, inherits: Events


		, __path: null
		, __ready: false
		, __data: null


		, init: function( options ){
			this.__path = options.path;

			fs.exists( this.__path, function( exists ){
				if ( !exists ) {
					throw new Error( "Cannot load file, path [" + this.__path + "] does not exist!" );
				}
				else {
					fs.stat( this.__path, function( err, stats ){
						if ( err ) throw err;
						if ( stats.isDirectory() ) throw new Erorr( "Cannot load file, path [" + this.__path + "] is a directory!" );
						
						this.ino = stats.ino;

						this.__load( function(){
							this.__ready = true;
							this.emit( "load" );
						}.bind( this ) );						
					}.bind( this ) );
				}
			}.bind( this ) );

			this.on( "change", function( evt ){
				log.warn( evt + " " + this.ino + " " + this.__path);
			}.bind( this ) );
		}



		, reload: function( callback ){
			fs.stat( this.__path, function( err, stats ){
				if ( err ) throw err;
				if ( stats.isDirectory() ) throw new Erorr( "Cannot load file, path [" + this.__path + "] is a directory!" );
				
				// its the same file
				if ( stats.ino === this.ino ){
					this.__load( callback );
				}
				else {
					log.error( "replace " + this.ino + " " + this.__path );
					// its a new file, load it, replace it in side the memory fs
					var file, load = function(){
						file.off( "load", load );
						this.emit( "replaced", file );
						file.emit( "load" );
					}.bind( this );

					file = new File( {
						path: this.__path
						, on: {
							load: load
						}
					} );					
				}					
			}.bind( this ) );


			
		}



		, __load: function( callback ){

			fs.readFile( this.__path, function( err, file ){
				if ( err ) throw err;

				this.__data = file;
				callback();
			}.bind( this ) );
		}
	} );