
	var assert = require( "assert" );

	// tests class, constructor, parent, extends, properties usgin scalar values, objects and arrays
	assert.doesNotThrow( function(){
		var cls = new Class( {
			$id: "cls"
			, name: "test"
			, arr: []
			, my: { name: { is: "unintresting" } } 

			, init: function( newName ){
				assert.strictEqual( this.name, "test" );
				this.name = newName;
				this.arr.push( newName );
			}

			, getName: function(){
				return this.name;
			}
		} );

		var instance = new cls( "michael" );
		assert.strictEqual( instance.name, "michael" );
		assert.strictEqual( typeof instance, "object" );

		var otherClass = new Class( {
			$id: "otherClass"

			, inherits: cls

			, init: function( anotherName ){
				assert.strictEqual( this.getName(), "test" );
				this.arr.push( anotherName );
				this.my.name.is = anotherName;
			}


			, getName: function getName(){
				return getName.parent( this );
			}
		} );


		var other = new otherClass( "sven" );
		assert.strictEqual( other.arr.length, 1 );

		var another = new otherClass( "gaia" );
		assert.strictEqual( another.arr.length, 1 );
		assert.deepEqual( another.arr, [ "gaia" ] );
		assert.strictEqual( another.my.name.is, "gaia" );
		assert.strictEqual( other.my.name.is, "sven" );

	} );
