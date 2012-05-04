


	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" )
		, cluster = require( "cluster" )
		, os = require( "os" )
		, Files = require( "./files" );







	module.exports = new Class( {
		Extends: Events

		, __port: 80
		, __cpuCount: 1


		, contructor: function( options ) {
			if ( options.port ) this.__port = options.port;

			this.__files = options.files || { get: function(){ return false; }, has: function(){ return false; } };

			// num cpus
			this.__cpuCount = os.cpus().length;

			
			if ( cluster.isMaster() ){
				this.__startMaster();
			}
			else {
				this.__startSlave();
			}
		}



		, isMaster: function(){
			return cluster.isMaster();
		}

		, isWorker: function(){
			return cluster.isWorker();
		}




		, __startMaster: function(){
			var i = this.__cpuCount;

			cluster.on( "death", function( worker ){
				log.warn( "worker [" + worker.pid + "] died. respawning....", this );
				cluster.fork();
			}.bind( this ) );

			while( i-- ){
				cluster.fork();
			}
		}


		, __startWorker: function(){
			log.info( "worker online ....", this );
		}
	} );