

require( "./" )( "iridium test", 1 );


var fs = require( "fs" );
var rawData = fs.readFileSync( require( "path" ).resolve( "./data.txt" ) ).toString();

var lines = rawData.split( "\n" ).slice( 1 );
var i = lines.length;

while( i-- ){
	lines[ i ] = lines[ i ].split( "\t" );
}


fs.writeFileSync( require( "path" ).resolve( "./json.txt" ) , JSON.stringify( lines ) );
process.exit();

var search = { 
	"31": { count: 0 }
	, "32": { count: 0 }
	, "33": { count: 0 }
	, "34": { count: 0 }
	, "341": { count: 0 }
	, "354": { count: 0 }
	, "359": { count: 0 } 
};

var keys = Object.keys( search ), l = keys.length, ll = l;
var x = 20;


i = lines.length;
while( i-- ){
	l = ll;
	while( l-- ){
		if ( new RegExp( keys [ l ], "i" ).test( lines[ 12 ] ) ){
			search[ keys[ l ] ].count++;
		}
	}
	x--;
	if ( x === 0 ){
		log.dir( search );
		process.exit();
	}
}


log.dir( search );



