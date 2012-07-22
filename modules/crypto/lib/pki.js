

	var Class = iridium( "class" )
		, log = iridium( "log" );


	var spawn = require( "child_process" ).spawn;




	module.exports = new ( Class( {
		$id: "crypto.pki"


		, cert: function( options, callback ){
			var ca = options.ca;

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
						, "-outform"
						, "PEM"
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
								, "-outform"
								, "PEM"
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






		, p12: function( options, callback ){
			var parameters = [
				  "pkcs12"
				, "-export"
				, "-in"
				, "/dev/stdin"
			]
			, stdin = [ options.key.toString() + "\n"  + options.cert.toString()  ];
			console.log( "=====================", options.cert.toString().trim()  + "\n" + options.key.toString() );
			if ( options.keyPassphrase ){
				parameters.push( "-passin" );
				parameters.push( "pass:" + options.keyPassphrase );
			}

			if ( options.caCert ){
				parameters.push( "-certfile" );
				parameters.push( "/dev/stdin" );
				stdin.push( options.caCert );
			}

			this.__openssl( parameters, stdin, function( exitCode, stdout, stderr ){
				console.log( exitCode, stderr.toString(), stdout.toString() );
			}.bind( this ) );
		}






		, ca: function( options, callback ){
			var ca = {};

			this.__openssl( [
				  "genrsa"
				, "-des3"
				, "-passout"
				, "pass:" + options.passphrase
				, ( options.bits || "2048" )
			], null, function( exitCode, stdout, stderr ){
				if ( exitCode === 0 ){

					// store
					ca.key = stdout;

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
							ca.cert = stdout;
							ca.options = options;
							callback( null, ca );
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
						if ( stdin.length > 1 ){
							openssl.stdin.write( stdin.shift() );
						}
						else if( stdin.length > 0 ) {
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
			}.bind( this ) );


			openssl.stderr.on( "data", function( data ){				
				if ( data.length > 0 ) {
					var tbuf = new Buffer( stderr.length + data.length );
					stderr.copy( tbuf );
					data.copy( tbuf, stderr.length );
					stderr = tbuf;
				}
				var t = stderr.toString();

				if ( t.substr( t.length - "Signature ok".length - 1 ).indexOf ( "Signature ok" ) >= 0 ||  t.substr( t.length - "Getting CA Private Key".length - 1 ).indexOf ( "Getting CA Private Key" ) >= 0 ){
					writeToStdIn();
				};
			}.bind( this ) );


			openssl.on( "exit", function( code ){
				callback( code, stdout, stderr );
			}.bind( this ) );
		}
	} ) )();