	"use strict";


	// iridium main, require this in your project
	var   path 			= module.filename.substr( 0, module.filename.lastIndexOf( "/" ) + 1 )
		, modulePath 	= path + "modules/"
		, log 			= require( "./modules/core/lib/log" )
		, string 		= require( "./modules/util/lib/string" )
		, fs 			= require( "fs" );




	// the iridium module loader
	global.iridium = function( moduleName ){
		return require( modulePath + moduleName );
	}

	// path
	iridium.path = path;
	iridium.root = path.substr( 0, path.substr( 0, path.length - 1 ).lastIndexOf( "/" ) + 1 );
	iridium.app = {
		root: iridium( "util" ).argv.getCallingPath()
	};

	// load config
	if ( fs.existsSync( iridium.app.root + "config.js" ) ){
		iridium.app.config = require( iridium.app.root + "config.js" );
	}


	// print iridium intro
	module.exports = function( options ){	
		printLogo( options.product, options.version );
	};


	// trace uncaught exceptions
	process.on( "uncaughtException", function( err ){			
		log.error( "Uncaught Exception:", { $id: "iridium.index" } );
		log.trace( err );
		process.exit();
	} );


	var printLogo = function( productName, version ){
		var product;

		productName = productName || "noname";
		version 	= version ? version + "" : "0.0";
		if ( version.indexOf( "0" ) === -1 ) version = version += ".0";
		product = productName + "/" + version;

		console.log( new Buffer( fs.readFileSync( iridium.path + "logo.hex", "ascii" ), "hex" ).toString().replace( "{{product}}", string.pad( product, 25 ) ) );
	}