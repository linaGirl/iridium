

	var Class = iridium( "class" )
		, log = iridium( "log" );


	var spawn = require( "child_process" ).spawn;




	module.exports = Class( {
		$id: "crypto.pki"


		, __ca: {
			key: ""
			, cert: ""
		}



		, init: function( options ){
			if ( options.ca ){
				this.__ca = options.ca;
			}
		}






		, cert: function( options, callback ){
			var ca = options.ca || this.__ca;

			console.log( [
				  "genrsa"
				, ( options.bits || "1024" )
			].join( " " ) );

			console.log([
						  "req"
						, "-new"
						, "-key"
						, "/dev/stdin"
						, "-subj"
						, this.__subject( options )
					].join( " " ));

			console.log([
								  "x509"
								, "-req"
								, "-in"
								, "/dev/stdin"
								, "-CA"
								, "/dev/stdin"
								, "-CAkey"
								, "/dev/stdin"
								, "-CAcreateserial"
								, "-passin"
								, "pass:" + ca.options.passphrase
								, "-days"
								, ( options.days || 36500 )
							].join( " " ));


			this.__openssl( [
				  "genrsa"
				, ( options.bits || "1024" )
			], null, function( exitCode, stdout, stderr ){
				var key = stdout;
				if ( exitCode === 0 ){
					this.__openssl( [
						  "req"
						, "-new"
						, "-key"
						, "/dev/stdin"
						, "-subj"
						, this.__subject( options )
					], [ key ], function( exitCode, stdout, stderr ){
						if ( exitCode === 0 ){
							this.__openssl( [
								  "x509"
								, "-req"
								, "-in"
								, "/dev/stdin"
								, "-CA"
								, "/dev/stdin"
								, "-CAkey"
								, "/dev/stdin"
								, "-CAcreateserial"
								, "-passin"
								, "pass:" + ca.options.passphrase
								, "-pubkey"
								, "-days"
								, ( options.days || 36500 )
							], [ stdout, ca.cert, ca.key ], function( exitCode, stdout, stderr ){

								if ( exitCode === 0 ){
									callback( null, {
										ca: ca
										, key: key
										, cert: stdout
										, options: options
									} );
								}
								else {
									callback( new Error( "failed to create certificate: " + stderr ) );
								}
							}.bind( this ) );
						}
						else {
							callback( new Error( "failed to create certificate: " + stderr ) );
						}
					}.bind( this ) );
				}
				else {
					callback( new Error( "failed to create certificate: " + stderr ) );
				}
			}.bind( this ) );
		}





		, ca: function( options, callback ){
			this.__openssl( [
				  "genrsa"
				, "-des3"
				, "-passout"
				, "pass:" + options.passphrase
				, ( options.bits || "2048" )
			], null, function( exitCode, stdout, stderr ){
				if ( exitCode === 0 ){

					// store
					this.__ca.key = stdout;

					this.__openssl( [
						  "req"
						, "-new"
						, "-x509"
						, "-days"
						, ( options.days || 36500 )
						, "-passin"
						, "pass:" + options.passphrase
						, "-subj"
						, this.__subject( options )
						, "-key"
						, "/dev/stdin"
					], [ stdout ], function( exitCode, stdout, stderr ){

						if ( exitCode === 0 ){
							// store
							this.__ca.cert = stdout;
							this.__ca.options = options;
							callback( null, this.__ca );
						}
						else {
							callback( new Error( "failed to create ca: " + stderr ) );
						}
					}.bind( this ) );
				}
				else {
					callback( new Error( "failed to create ca: " + stderr ) );
				}
			}.bind( this ) );
		}




		, __subject: function( options ){
			return "/C=" + ( options.country || "" ) 
				+ "/ST=" + ( options.state || "" ) 
				+ "/L=" + ( options.location || "" ) 
				+ "/O=" + ( options.organization || "" ) 
				+ "/OU=" + ( options.unit || "" ) 
				+ "/CN=" + options.cn
				+ "/emailAddress=" + (options.email || "" );
		}




		, __openssl: function( parameters, stdin, callback ){
			var openssl = spawn( "openssl", parameters )
				, stdout = new Buffer( 0 ) , stderr = new Buffer( 0 );


			var writeToStdIn = function(){
				if ( Array.isArray( stdin ) ) {
					if ( stdin.length > 0 ){
						//log.warn( "WRITING >>>" );
						//console.log( stdin[ 0 ] );
						//log.warn( "<<<<" );
						if ( stdin.length > 1 ){
							openssl.stdin.write( stdin.shift() );
						}
						else {
							openssl.stdin.end( stdin.shift() );
						}
					}
				}
			};


			writeToStdIn();


			openssl.stdout.on( "data", function( data ){
				if ( data.length > 0 ) {
					var tbuf = new Buffer( stdout.length + data.length );
					stdout.copy( tbuf );
					data.copy( tbuf, stdout.length );
					stdout = tbuf;
				}
				//log.info( data.toString() );
			}.bind( this ) );


			openssl.stderr.on( "data", function( data ){
				
				
				if ( data.length > 0 ) {
					var tbuf = new Buffer( stderr.length + data.length );
					stderr.copy( tbuf );
					data.copy( tbuf, stderr.length );
					stderr = tbuf;
				}
				//log.error( data.toString() );
				var t = stderr.toString();

				if ( t.substr( t.length - "Signature ok".length - 1 ).indexOf ( "Signature ok" ) >= 0 ||  t.substr( t.length - "Getting CA Private Key".length - 1 ).indexOf ( "Getting CA Private Key" ) >= 0 ){
					writeToStdIn();
				}
			}.bind( this ) );


			openssl.on( "exit", function( code ){
				//log.warn( "exited with code " + code );
				callback( code, stdout, stderr );
			}.bind( this ) );


		}
	} );