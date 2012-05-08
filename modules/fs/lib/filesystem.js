

	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" )
		, path = require( "path" )
		, fs = require( "fs" );





	var Filesystem = module.exports = new Class( {
		$id: "fs.Filesystem"

		, inherits: Events


		// the fs uri.  if uri starts with "net://" it will try to connect through the net system.
		// /path/to/my/files  x  or net://webserverFiles:/path/to/my/files
		, __uri: ""

		// if set, this fs acts as fs server for the remote fs facility through the net system
		, __serviceName: ""

		// if true the fs is a remote fs
		, __remoteFS: false

		// highlevel flags
		, __readable: true
		, __writeable: false


		, init: function( options ){
			if ( typeof options === "object" ){
				if ( typeof options.uri === "string" ){
					this.__uri = options.uri;
				} 
				else {
					throw new Error( "missing options.uri!" );
				}

				this.__serviceName = options.serviceName || "";
				this.__readable = typeof options.readable === "boolean" ? options.readable : 
				this.__writeable = typeof options.writeable === "boolean" ? options.writeable : this.__writeable;

				if ( this.__uri.indexOf( "iridium://" ) === 0 ){
					this.__remoteFS = true;

					// connect to remotefs
					this.__connect();
				}
			}
			else {
				throw new Error( "missing options!" );
			}
		}



		, isDirectory: function( path, callback ){
			fs.stat( path, function( err, stats ){
				if ( err ) return callback( err );
				callback( null, stats.isDirectory() );
			}.bind( this ) );
		}


		, isFile: function( path, callback ){
			fs.stat( path, function( err, stats ){
				if ( err ) return callback( err );
				callback( null, stats.isFile() );
			}.bind( this ) );
		}


		, exists: function( path, callback ){
			path.exists( path, callback );
		}


		, stat: function( path, callback ){
			fs.stat( path, callback );
		}


		, writeFile: function( path, content, callback ){
			fs.writeFile( path, content, callback );
		}

		, unlink: function( path, callback ){

		}


		, readFile: function( path, callback ){
			fs.readFile( path, callback );
		}


		, readDir: function( path, callback ){
			fs.readDir( path, callback );
		}



		// subscribe to the remote publisher socket
		, __subscribeToRemoteFileSystem: function( remoteOptions ){
			this.__remoteStream = new SubSocket( {
				on: {
					message: this.__handleRemoteMessage.bind( this )
				}
			} );
		}


		// message from the sub socket from the remote fs
		, __handleRemoteMessage: function( message ){
			if ( message && message.header && message.body ){
				switch ( message.body.action ){

					
					default:
						log.warn( "unknown action!" );
						log.dir( message );
				}
			}
			else {
				log.warn( "unknown message!", this );
				log.dir( message );
			}
		}



		// connect to the remote fs
		, __connect: function(){
			this.__remote = new RepSocket( {
				on: {
					message: function( message ){

						if ( message && message.header && message.body )
							switch ( message.action ){
								case "connect": // the server tells if we got the correct endpoint
									this.__subscribeToRemoteFileSystem( message.body );
									break;

								// theese are all ack / fail messages for the messages, the must redirected to the corresponding callback
								case "readDir":
								case "readFile":
								case "readDir":
								case "readDir":
								case "stat":
								case "unlink":
								case "writeFile":
									if ( this.__callbacks[ message.header.id ] ){
										this.__callbacks[ message.header.id ]( message.body );
									}
									else {
										log.warn( "no callback for message!", this );
										log.dir( message );
									}
									break;

								default:
									log.warn( "unknown message: ", this );
									log.dir( message );
							}
						}
						else {
							log.warn( "invlaid message format!" );
							log.dir( message );
						}
					}.bind( this )
				}
			} );
		}
	} );