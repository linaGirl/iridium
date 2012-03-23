


	var Filesystem = require( "./lib/filesystem" )
		RemoteFilesystem = require( "./lib/remoteFilesystem");




	module.exports = {


		// filesystem wrapper
		createFilesystem: function( options ){
			return new Filesystem( options );
		}



		// load a filesystem from another host
		, createRemoteFilesystem: function( filesystemId, options ){
			return new RemoteFilesystem( { id: filesystemId, options: options } );
		}
	};

