var Firebase = require("firebase");
var _ = require('underscore');
var secrets = require("./secrets.json");
var Sparkpost = require('sparkpost');

var config = {
    serviceAccount: secrets.SERVICE_ACCOUNT_PATH,
    databaseURL: secrets.FIREBASE_URL
};

var sparkpostClient = new Sparkpost(secrets.SPARKPOST_KEY)

Firebase.initializeApp(config);
var db = Firebase.database();
var ref = db.ref("/accounts");
ref.once("value", function(snapshot) {
   sendEmails(snapshot.val());
});


function getRecipient(account) {
  encodedEmail = encodeURIComponent(account.email);
  link = "https://currentlyraising.com/weekly-confirmation?email=" + encodedEmail;

  accountObject = {
    "address": {
      "email": account.email,
      "name": account.founder
    },
    "metadata": {
      "company": account.companyName,
      "link": link
    }
  }

  return accountObject;
}

function sendEmails(accounts) {
  recipients = []
  _.map(accounts, function(account) {
    if (account !== undefined && account.status === true) {
      recipient = getRecipient(account);
      recipients.push(recipient);
    }
  });

  sparkpostClient.transmissions.send({
    transmissionBody: {
      content: {
        from: 'team@currentlyraising.com',
        subject: 'Are you still currently raising?',
        template_id: 'weekly-confirmation'
      },
      recipients: recipients
    }
  }, function(err, res) {
    if (err) {
      console.log(err);
      // context.fail(new Error("Account invite email failed to send - #{err}"))
    } else {
      console.log('Weekly confirmations sent succesfully.');
    }
    // context.done(err, {email: event.email, link: event.invite_link})
  });
};
