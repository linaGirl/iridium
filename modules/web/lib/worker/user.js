

	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" )
		, util 			= iridium( "util" )
		, Waiter 		= util.Waiter
		, argv 			= util.argv
		, debug 		= argv.has( "trace-all" ) || argv.has( "trace-session" );



	module.exports = new Class( {
		inherits: Events

		// the sessions internal id, long living
		, __id: null
		, __authenticated: false
		, __active: false


		, get id(){ return this.__id;  }
		, set id(){ throw new Error( "you cannot set the id!" ); }

		, get authenticated(){ return this.__authenticated; }
		, get active(){ return this.__active; }


		, init: function( options ){
			this.__id 				= options.user.id;
			this.__authenticated 	= options.user.authenticated;
			this.__active 			= options.user.active;
			this.__iridium 			= options.iridium;
			this.__idSession 		= options.idSession;
			this.__session 			= options.session
		}


		, set: function( options, callback ){
			var waiter = new Waiter();

			if ( options.hasOwnProperty( "authenticated" ) ){
				waiter.add( function( cb ){
					this.setAuthenticated( options.authenticated, cb );
				}.bind( this ) );
			}
			if ( options.active ){
				waiter.add( function( cb ){
					this.setActive( cb );
				}.bind( this ) );
			}

			waiter.start( function( err ){
				if ( callback ) callback( err ); 
			}.bind( this ) );
		}


		, setActive: function( callback ){
			if ( debug ) log.debug( "activating user [" + this.id + "] ...", this );

			this.__iridium.session_user.findOne( { id_session: this.__idSession, id_user: this.id }, function( err, relation ){
				if ( err ) { if ( callback ) callback( err ); }
				else if ( !relation ) {
					this.emit( "remove", this );
					if ( callback ) callback( new Error( "relation is missing, cannot set active. removing user from session!" ) );
				}
				else {
					relation.active = true;
					relation.save( function( err ){
						if ( err && callback ) callback( err );
						else{
							this.emit( "activate", this );
							this.__active = true;							
							if ( callback ) callback();
						} 
					}.bind( this ) );
				}
			}.bind( this ) );
		}



		, setAuthenticated: function( authState, callback, noRenew ){
			if ( debug ) log.debug( "setting authstate [" + authState + "] on user [" + this.id + "] ...", this );

			if ( !!authState !== this.__authenticated ) {
				this.__iridium.session_user.findOne( { id_session: this.__idSession, id_user: this.id }, function( err, relation ){
					if ( err ) { if ( callback ) callback( err ); }
					else if ( !relation ) {
						this.emit( "remove", this );
						if ( callback ) callback( new Error( "relation is missing, cannot set authState. removing user from session!" ) );
					}
					else {
						relation.authenticated = !!authState;
						relation.save( function( err ){
							if ( err && callback ) callback( err );
							else{
								this.emit( "authchange", this, authState );
								this.__authenticated = authState;

								if ( !noRenew ){
									process.nextTick( function(){
										this.__session.renew( function( err ){
											if ( callback ) callback( err );
										}.bind( this ) );
									}.bind( this ) );
								}
							} 
						}.bind( this ) );
					}
				}.bind( this ) );
			}
			else callback();
		}



		, cleanup: function(){
			this.off();
			delete this.__iridium;
			delete this.__session;
		}


		, toJSON: function(){
			return {
				  id: 				this.id
				, authenticated: 	this.authenticated
				, active: 			this.active
			};
		}
	} );