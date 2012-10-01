



	var Class 		= iridium( "class" )
		, log 		= iridium( "log" );


	var cluster 	= require( "cluster" );


	var Service 	= require( "./service" )
		, Master 	= require( "./master" );



	module.exports = new Class( {

		init: function( options ){
			this.__options = options;


			if ( cluster.isMaster ){
				this.__startMaster();
			}
			else {
				this.__startWorker();
			}
		}


		, __startMaster: function(){
			this.__master = new Master( this.__options );
		}



		, __startWorker: function(){

			this.__service = new Service( {
				options: this.__options
				, on: {
					load: function(){

						// expose classes
						this.schames 		= this.__service.schemas;
						this.resources 		= this.__service.resources;
						this.sessions 		= this.__service.sessions;
						this.rewriteEngine 	= this.__service.rewriteEngine;
						this.server 		= this.__service.server;
						this.controllers 	= this.__service.controllers;
						this.files	 		= this.__service.files;


						// load the users application
						if ( this.__options.Application ){
							this.__app = new this.__options.Application( { webservice: this } );
						}
						else if ( this.__options.application ){
							this.__app = new this.__options.application( { webservice: this } );
						}
						else if ( this.__options.app ){
							this.__app = new this.__options.app( { webservice: this } );
						}
						else if ( this.__options.App ){
							this.__app = new this.__options.App( { webservice: this } );
						}
					}.bind( this )


					, listening: function(){
						process.setgid( this.__options.gid );
						process.setuid( this.__options.uid );
						log.warn( "the proccess [" + process.pid + "] is now owned by [" + process.getuid() + ":" + process.getgid() + "] ( [" + this.__options.uid + ":" + this.__options.gid + "] ) ...", this );
					}.bind( this )
				}
			} );			
		}
	} );