

	var Class 		= iridium( "class" )
		, Events 	= iridium( "events" )
		, log 		= iridium( "log" );


	var FakeUser 	= require( "./fakeuser" );



	module.exports = new Class( {
		inherits: Events

		, __sessionId: "---not-a-session---"
		, __id: null
		, __activeUser: null
		, __isMaster: false
		, __ip: null
		, __useragent: null
		, __authenticated: false


		, get sessionId(){ return this.__sessionId; }
		, set sessionId(){ throw new Error( "you cannot set the sessionId!" ); }

		, get authenticated(){ return this.__authenticated; }
		, set authenticated(){ throw new Error( "you cannot change the authentication status on the session itself!" ); }


		, get id(){ return this.__id;  }
		, set id(){ throw new Error( "you cannot set the id!" ); }

		, get ip(){ return this.__ip;  }
		, set ip( ip ){ this.__ip = ip; }

		, get useragent(){ return this.__useragent;  }
		, set useragent( useragent ){ this.__useragent = useragent; }


		, handleMessage: function(){}

		, renew: function( callback ){
			callback();
		}

		, getUser: function(){
			return null;
		}

		, getUsers: function(){
			return {};
		}

		, hasUser: function(){
			return false;
		}

		, hasUsers: function(){
			return false;
		}

		, addUser: function( userId, callback ){
			callback( null, new FakeUser() );
		}

		, removeUser: function( userId, callback ){
			callback();
		}

		, getActiveUser: function(){
			return null;
		}

		, isMaster: function(){
			return false;
		}
		, toJSON: function(){
			return {
				  id: 			0
				, sessionId: 	this.sessionId
				, useragent: 	this.useragent
				, ip: 			this.ip
				, users: 		{}
			};
		}
	} );