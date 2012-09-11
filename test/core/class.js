
	var assert = require( "assert" )
		, Class = iridium( "class" )
		, log = iridium( "log" );




	assert.doesNotThrow( function(){
		
		var LifeForm = new Class( {
			$id: "class.LifeForm"

			, __type: ""
			, __types: 	[
				"water", "land", "air"
			]
			, __properties: {}

			, set type( type ){
				if ( this.__types.indexOf( type ) === -1 ) throw new Error( "type can be one ot the follwing: " + this.__types.join( ", " ) );
				this.__type = type;
			}
			, get type(){
				return this.__type;
			}
		} );



		var Human = new Class( {
			$id: "class.Human"
			, inherits: LifeForm

			, __friends: []

			, init: function( options ){
				this.type = "land";
				this.__properties.legCount = 4;
			}

			, addFriend: function( friend, addMeToFriend ){
				this.__friends.push( friend );
				if ( addMeToFriend !== false ) friend.addFriend( this, false );
			}
			, get friendCount(){
				return this.__friends.length;
			}
			, set friendCount(){
				throw new Error( "property friendCount is read only!" );
			}
		} );

		var Cat = new Class( {
			inherits: LifeForm

			, __ima: "cat"

			, init: function(){
				this.type = "water";
			}
		} );

		var Boy = new Class( {
			$id: "class.Boy"
			, inherits: Human

			, __name: ""

			, init: function( options ){
				this.__name = options.name;
			}

			, set name(){
				throw new Error( "you are not allowed to change the name of a boy!" );
			}
			, get name(){
				return this.__name;
			}
		} );



		var   sven 		= new Boy( { name: "Sven" } )
			, donat 	= new Boy( { name: "Donat" } )
			, michael 	= new Boy( { name: "Michael" } );

		assert.strictEqual( sven.name, "Sven" );
		assert.strictEqual( donat.name, "Donat" );
		assert.strictEqual( michael.name, "Michael" );

		assert.throws( function(){ sven.name = "Sandra"; } );

		sven.addFriend( donat, false );
		sven.addFriend( michael );
		donat.addFriend( michael );

		assert.strictEqual( sven.friendCount, 2 );
		assert.strictEqual( donat.friendCount, 1 );
		assert.strictEqual( michael.friendCount, 2 );

		var murli = new Cat();

		assert.strictEqual( murli.name, undefined );
		assert.strictEqual( michael.__ima, undefined );

	} );