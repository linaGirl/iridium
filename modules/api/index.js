



	module.exports = {
		  APNS: 	require( "./node_modules/apn" )
		, GCM: 		require( "./node_modules/gcm/lib/gcm" ).GCM
		, S3: 		require( "./node_modules/knox")
		, Mailer: 	require( "./node_modules/nodemailer" )
		//, AWSSum: 	require( "./dep/node-awssum")
	};