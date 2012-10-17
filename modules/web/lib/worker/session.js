

	var Class 		= iridium( "class" )
		, Events 	= iridium( "events" )
		, log 		= iridium( "log" );



	module.exports = new Class( {
		inherits: Events

		// data, not persistet
		, __data: {}

		// users, persistet
		, __users: {}

		// sessionid, persistet
		, __sessionId: null

		// the sesisons internal id, long living
		, __uniqueId: null

		// active user
		, __activeUser: null


		, get id(){
			return this.__sessionId;
		}

		, get uniqueId(){
			return this.__uniqueId;
		}


		, init: function( options ){
			this.__sessionId = options.sessionId;
		}


		// destroy the session, all data attached to it is lost forever!
		, destroy: function( callback ){
			this.emit( "destroy", this, callback );
		}

		// renew id ( use on auth change! ), no information gets lost
		, renew: function( callback ){
			this.emit( "renew", this, callback );
		}



		// get user associated with the session
		, getUser: function( id ){
			return this.__users[ id ] || null;
		}

		// get users associated with the session
		, getUsers: function(){
			return this.__users;
		}

		// has a specific user?
		, hasUser: function( id ){
			return !!this.__users[ id ]
		}

		// add a user
		, addUser: function( id, user, callback ){
			this.__users[ id ] = user;
			this.emit( "userAdd", this, user, callback );
		}

		// remove user
		, removeUser: function( id, callback ){
			if ( this.__users[ id ] ) {
				this.emit( "userRemove", this, this.__users[ id ], callback );
				if ( this.__activeUser === id ) this.__activeUser = null;
				delete this.__users[ id ];
			} else if ( callback ) callback( null, null );
		}

		// get the currently actib euser
		, getActiveUser: function(){
			return ( this.__activeUser && this.__users[ this.__activeUser ] ) ? this.__users[ this.__activeUser ] : null;
		}

		// define which is the active user
		, setActiveUser: function( id, callback ){
			if ( this.__users[ id ] ){
				this.__activeUser = id;
				this.emit( "activeUserChange", this, id, callback );
			} else if ( callback ) callback( new Error( "user is not on this session!") );
		}
	} );