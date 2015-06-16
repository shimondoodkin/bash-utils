//
// 1. create service credencials
// 2. to create pem file do "openssl pkcs12 -in myuserfile-1234156.p12 -out myuserfile-1234156.pem -nodes" see https://github.com/extrabacon/google-oauth-jwt#creating-a-service-account-using-the-google-developers-console
// 3. in this folder do "npm install" to install googleapis dependency:
// run: 
// node driveupload.js

var google = require('googleapis');
var drive = google.drive('v2');
var fs = require('fs');

/**
 * The JWT authorization is ideal for performing server-to-server
 * communication without asking for user consent.
 *
 * Suggested reading for Admin SDK users using service accounts:
 * https://developers.google.com/admin-sdk/directory/v1/guides/delegation
 *
 * Note on the private_key.pem:
 * Node.js currently does not support direct access to the keys stored within
 * PKCS12 file (see issue comment
 * https://github.com/joyent/node/issues/4050#issuecomment-8816304)
 * so the private key must be extracted and converted to a passphrase-less
 * RSA key: openssl pkcs12 -in key.p12 -nodes -nocerts > key.pem
 *
 * See the defaultauth.js sample for an alternate way of fetching compute credentials.
 */
 
var authClient = new google.auth.JWT(
    '5646546546-45465465@developer.gserviceaccount.com',
    'myuserfile-1234156.pem', // SEE 1ST LINE 
    // Contents of private_key.pem if you want to load the pem file yourself
    // (do not use the path parameter above if using this param)
    false,
    // Scopes can be specified either as an array or as a single, space-delimited string
    ['https://www.googleapis.com/auth/drive'],
    // User to impersonate (leave empty if no impersonation needed)
    false);
	
var args = process.argv.slice(2);

if((args.length==1||args.length==2)&&args[0]=='list') // helps choose where to upload
{
	var fileparentid=args.length==2?args[1]:false;

	authClient.authorize(function(err, tokens) {
	  if (err) {
		console.log(err);
		return;
	  }

	  // Make an authorized request to list Drive files.
	  drive.files.list({ auth: authClient }, function(err, resp) {
		// handle err and response
		console.log(JSON.stringify(
		resp.items
		
		.filter(function(a){
			if(!fileparentid)return a.parents.length==0;
			return a.parents.filter(function(a){ return a.id==fileparentid}).length>0
		})
		
		//comment out this map to receive full objects
		.map(function(a){ 
			return {
			 title:a.title
			,mimeType:a.mimeType
			,id:a.id
			};
		})
		
		,null,2));
	  });

	});
}
else if(args.length==3||args.length==4)
{
	var filepath=args[0];
	var filename=args[1];
	var filemime=args[2];
	var fileparentid=args.length==4?args[3]:false;

	authClient.authorize(function(err, tokens) {
	    if (err) {
	   	 console.log(err);
	  	 return;
	    }
		drive.files.insert({
		  auth: authClient,
		  resource: 
		  {
			title: filename,
			mimeType: filemime,
			parents:  fileparentid? [ { id: fileparentid } ]:[]
		  }
		  ,
		  media: {
			mimeType: filemime,
			body: fs.createReadStream(filepath) // read streams are awesome!
		  }
		}, 
		function(err)
		{
		 console.log(err,'done');
		 //process.exit();
		});
	});
}
else
 console.log('usage example:\nnode driveupload.js list\nnode driveupload.js list 0123121parent_folder_id_000\nnode driveupload.js /path/to/file.jar file.jar application/java-archive\nnode driveupload.js /path/to/file.jar file.jar application/java-archive 0123121parent_folder_id_000\n');
