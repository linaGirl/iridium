
	// this is the config file for the iridium service. dont alter!
	var path = require( "path" );



	module.exports = {
		directory: [
			"master.iridium.cc"					// the directory service's address
		]
		, services: {
			files: {
				iridium: {
					path: path.resolve( "./services/iridium/www" )
				}
			}
			, iridium: {
				domain: "iridium.cc"

				, key: ""							// encrypted, root needs to enter the passphrase for this key on application start
				, publicKey: ""						// encrypted, root needs to enter the passphrase for this key on application start
				, certificate: ""					// encrypted, root needs to enter the passphrase for this key on application start

				// require( "crypto" ).pbkdf2( "name of user in cert with role root issued with the keys above", "wo87gtw54ot7zseotzd7sie8tz7b9eo4t7z", 1000, 128, function( err, key){ console.dir( new Buffer( key ).toString( "hex" ) ); } );
				, root: "26c3a41c3ec389c2891c4122c290c2ac7a33c2a432c38bc2b9223c546573c3bb1bc39147c39b1bc29c3bc28dc2a2c3b0380bc28e66c2b22c0d4869633fc2bcc288042557c285c39b49c292c3864d3f39c28cc3874051c39624c3be57c3816f5ec2a2c28e28c2a44cc2bfc39571c3b45e3e766ac2993cc2a5c3b7c2a6c381c38f3fc29e1b3433c284c2a9c382c292c3aa38c28ec2bec2b53e3cc3bb344c5430c39036c3aac2bac2ba625273c39e0fc28ac2b437c280c29b07204708"
			}
		}
	}