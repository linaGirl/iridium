

	var Class 		= iridium( "class" )
		, Events 	= iridium( "events" )
		, log 		= iridium( "log" )
		, util  	= iridium( "util" )
		, argv 		= util.argv
		, debug 	= argv.has( "trace-all" ) || argv.has( "trace-session" )
		, Waiter 	= util.Waiter
		, Obj 		= util.Object;


	var User 		= require( "./user" );



	module.exports = new Class( {
		inherits: Events

		// users, persistet
		, __users: {}

		// sessionId, persistet
		, __sessionId: null

		// the sessions internal id, long living
		, __id: null

		// active user
		, __activeUser: null

		// is this the master instance? the session is distirbuted through n nodes, the one which sent data
		// is the master node, all which received data are slaves. only the master may write log entries.
		// all nodes may write users, activ users, authstate and so on to the db.
		, __isMaster: false

		// logger data
		, __ip: null
		, __useragent: null

		, __authenticated: false


		, get sessionId(){ return this.__sessionId; }
		, set sessionId(x){ throw new Error( "you cannot set the sessionId!" ); }

		, get authenticated(){ return this.__authenticated; }
		, set authenticated(x){ throw new Error( "you cannot change the authentication status on the session itself!" ); }


		, get id(){ return this.__id;  }
		, set id(x){ throw new Error( "you cannot set the id!" ); }

		, get ip(){ return this.__ip;  }
		, set ip( ip ){ this.__ip = ip; }

		, get useragent(){ return this.__useragent;  }
		, set useragent( useragent ){ this.__useragent = useragent; }


		, init: function( options ){
			this.__manager = options.manager;
			this.__iridium = options.iridium;

			// new sesion from local
			if ( options.dbSession ){
				this.__id 			= options.dbSession.id;
				this.__sessionId 	= options.dbSession.sessionId;
				this.__initFromDB();
			}

			// session from peer
			if ( options.networkSession ){
				this.__loadfromJSON( options.networkSession );
			}
		}


		// message from anopther node
		, handleMessage: function( action, data ){
			// switch to slave mode
			this.__isMaster = false;

			switch ( action ){
				case "renew":
					this.__sessionId = data.sessionId;
					break;

				case "authchange":
					this.__setUserAuthstate( data.userId, data.authenticated, true );
					break;

				case "activate":
					this.__setActiveUser( data.userId, true );
					break;

				case "removeUser":
					this.__removeUser( data.userId, true );
					break;

				case "addUser":
					this.__addUser( null, data.user, true );
					break;
			}
		}


		// renew id ( use on auth change! ), no information gets lost
		, renew: function( callback ){
			if ( debug ) log.info( "renewing session ...", this );
			var newSessionId = this.__manager.__createId();
				
			// can only renew exiting sessions
			this.__findInDB( this.__sessionId, function( err, session ){
				if ( err ) callback( err );
				else if ( !session ) callback( new Error( "session does not exist, cannot renew!" ) );
				else {
					// validate new id
					this.__findInDB( newSessionId, function( err, otherSession ){
						if ( err ) callback( err );
						else if ( otherSession ) this.renew( callback ); // sessionId is used already by another session ( should not happen at all! )
						else {
							// store new id
							session.sessionId = newSessionId;
							session.save( function( err ){
								if ( err ) callback( err );
								else {
									// tell the cache to change the key for this session
									this.emit( "renew", this, this.__sessionId, session.sessionId );
									// store local
									this.__sessionId = session.sessionId;
									// tell the other nodes about the new id
									this.__broadcast( this.__sessionId, "renew", { sessionId: session.sessionId } );

									// release
									callback();
								}
							}.bind( this ) );
						}
					}.bind( this ) );
				}
			}.bind( this ) );
		}

		// set authenticated = false for all users
		, invalidate: function( callback ){
			var keys = Object.keys( this.__users )
				, i = keys.length
				, waiter = new Waiter();

			while( i-- ){
				( function( index ){
					waiter.add( function( cb ){
						// diauthenticate all users, but dont renew the session for every user
						this.__users[ keys[ index ] ].setAuthenticated( false, cb, true );
					}.bind( this ) );
				}.bind( this ) )( i );
			}

			// renew the session
			waiter.add( this.renew.bind( this ) );

			// execute the stack
			waiter.start( callback );
		}

		// get user associated with the session
		, getUser: function( userId ){
			return this.__users[ userId ] || null;
		}

		// get users associated with the session
		, getUsers: function(){
			return this.__users;
		}

		// has a specific user?
		, hasUser: function( userId ){
			return !!this.__users[ userId ]
		}

		, hasUsers: function(){
			return Object.keys( this.__users ).length > 0;
		}

		// add a user
		, addUser: function( userId, callback ){
			this.__addDBUser( userId, function( err, DBUser ){
				if ( err ) { if ( callback ) callback( err ); }
				else if( !DBUser ) { if ( callback ) callback( new Error( "failed to add user!" ) ); } 
				else {
					if ( callback ) callback( null, this.__addUser( DBUser ) );
					else this.__addUser( DBUser );
				}
			}.bind( this ) );
		}

		// remove user
		, removeUser: function( userId, callback ){
			this.__removeDBUser( userId, function( err ){
				if ( err ) { if ( callback ) callback( err ); }
				else {
					this.__removeUser( userId );
					if ( callback ) callback();
				}
			}.bind( this ) );
		}

		// get the currently actib euser
		, getActiveUser: function(){
			return ( this.__activeUser && this.__users[ this.__activeUser ] ) ? this.__users[ this.__activeUser ] : null;
		}


		// is this the master sessions
		, isMaster: function(){
			return this.__isMaster;
		}

		// send data to all other nodes
		, __broadcast: function( sessionId, action ,data ){
			if ( debug ) log.debug( "sending message [" + action + "]: ", this ), log.dir( data );
			
			// become master
			this.__isMaster = true;

			process.send( {
				  t: "session" 		// topic
				, b: true			// broadcast flag
				, a: action 		// action -> string
				, d: data 			// data -> object
				, s: sessionId 		// sessionId
			} );
		}


		, __findInDB: function( sessionId, callback ){
			this.__iridium.session.findOne( { sessionId: sessionId }, callback );
		}


		, __initFromDB: function(){
			this.__iridium.session_user.find( { id_session: this.__id }, function( err, users ){
				if ( err ) this.emit( "load", err );
				else {
					if ( users ){
						users.forEach( function( user ){
							this.__addUser( user, null, true );
						}.bind( this ) );
					}

					// broadcast
					this.__broadcast( this.__sessionId, "cache", this.toJSON() );

					// we're ready
					this.emit( "load", null, this );
				}
			}.bind( this ) );
		}


		, __loadfromJSON: function( config ){
			this.__sessionId 	= config.sessionId;
			this.__id 			= config.id;
			this.__ip 			= config.ip;
			this.__useragent 	= config.useragent;

			var keys = Object.keys( config.users ), i = keys.length;
			while( i-- ) this.__addUser( null, config.users[ keys[ i ] ], true );

			// we're ready
			this.emit( "load", null, this );
		}



		, __setUserAuthstate: function( userId, newState, noBroadcast ){
			if ( this.__users[ userId ] ){	
				this.__users[ userId ].__authenticated = newState;

				if ( this.__activeUser === userId ){
					// set session authstate 
					this.__authenticated = !!newState;
				}
			}

			// tell the other nodes		
			if ( !noBroadcast ) this.__broadcast( this.__sessionId, "authchange", { userId: userId, authenticated: newState } );
		}



		, __setActiveUser: function( userId, noBroadcast ){
			if ( this.__activeUser !== userId ){
				if ( this.__users[ userId ] ){
					// tell the others
					if ( !noBroadcast ) this.__broadcast( this.__sessionId, "activate", { userId: userId } );

					// deactive other user
					if ( this.__activeUser && this.__activeUser !== userId ) this.__users[ this.__activeUser ].active = false;

					// store
					this.__activeUser = userId;
					this.__users[ userId ].__active = true;

					// the session inherits from the active user
					this.__authenticated = this.__users[ userId ].authenticated;
				}
			}
		}


		// bind to model
		, __addUser: function( DBUser, user, noBroadcast ){
			if ( user ) {
				DBUser = {
					id_user: 			user.id
					, active: 			user.active
					, authenticated: 	user.authenticated
				};
			} 

			if ( this.__users[ DBUser.id_user ] ) this.__removeUser( DBUser.id_user );

			this.__users[ DBUser.id_user ] = new User( {
				  user: {
				  	  id: 				DBUser.id_user
				  	, authenticated: 	DBUser.authenticated
				  	, active: 			DBUser.active
				}
				, idSession: this.id
				, iridium: this.__iridium
				, session: this
				, on: {
					authchange: function( user, newState ){
						this.__setUserAuthstate( user.id, newState );
					}.bind( this )

					, remove: function( user ){
						this.__removeUser( user.id );
					}.bind( this )

					, activate: function( user ){
						this.__setActiveUser( user.id );
					}.bind( this )
				}
			} );


			// inherit?
			if ( this.__users[ DBUser.id_user ].active ){
				this.__activeUser 		= this.__users[ DBUser.id_user ].id;
				this.__authenticated 	= this.__users[ DBUser.id_user ].authenticated;
			}

			if ( !noBroadcast ) this.__broadcast( this.__sessionId, "addUser", { user: this.__users[ DBUser.id_user ].toJSON() } );

			return this.__users[ DBUser.id_user ];
		}


		// add to db
		, __addDBUser: function( userId, callback ){
			this.__iridium.session_user.findOne( { id_user: userId, id_session: this.id }, function( err, relation ){
				if ( err ) { if ( callback ) callback( err ); }
				else {
					if ( relation ){ 
						if ( callback ) callback( null, relation );
					 }
					else {
						var user = new this.__iridium.session_user( {
							id_session: this.id
							, id_user: 	userId
						} ).save( function( err ){
							if ( err ) { if ( callback ) callback(); }
							else callback( null, user );
						}.bind( this ) );
					}
				}
			}.bind( this ) );	
		}


		// unbind from this model
		, __removeUser: function( userId, noBroadcast ){
			if ( this.__users[ userId ] ){
				if ( this.__activeUser === userId ) {
					this.__activeUser = null;
					this.__authenticated = false;
				}

				delete this.__users[ userId ];
			}

			if ( !noBroadcast ) this.__broadcast( this.__sessionId, "removeUser", { userId: userId } );
		}

		// delete from db
		, __removeDBUser: function( userId, callback ){
			this.__iridium.session_user.findOne( { id_user: userId, id_session: this.id }, function( err, relation ){
				if ( err ) { if ( callback ) callback( err ); }
				else {
					if ( relation ){
						relation.delete( function( err ){
							if ( err ) { if ( callback ) callback( err ); }
							else callback();
						}.bind( this ) );
					}
					else callback();
				}
			}.bind( this ) );	
		}




		, toJSON: function(){
			return {
				  id: 			this.id
				, sessionId: 	this.sessionId
				, useragent: 	this.useragent
				, ip: 			this.ip
				, users: 		Obj.map( this.__users, function( u ){ return u.toJSON() } )
			};
		}
	} );