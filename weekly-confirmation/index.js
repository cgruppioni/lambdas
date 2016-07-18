var Firebase = require("firebase");
var _ = require('underscore');
var secrets = require("./secrets.json");
var Sparkpost = require('sparkpost');
var sparkpostClient = new Sparkpost(secrets.SPARKPOST_KEY)

var config = {
    serviceAccount: secrets.SERVICE_ACCOUNT_PATH,
    databaseURL: secrets.FIREBASE_URL
};


exports.handler = function (event, context) {
  Firebase.initializeApp(config);
  var db = Firebase.database();
  var ref = db.ref("/accounts");
  ref.once("value", function(snapshot) {
    sendEmails(snapshot.val(), context);
  });
}

function getRecipient(account) {
  encodedEmail = encodeURIComponent(account.ceoEmail);
  link = "https://currentlyraising.com/weekly-confirmation?email=" + encodedEmail;

  accountObject = {
    "address": {
      "email": account.ceoEmail,
      "name": account.ceoNameFirst + ' ' + account.ceoNameLast
    },
    "metadata": {
      "company": account.companyName,
      "link": link,
      "name": account.ceoNameFirst + ' ' + account.ceoNameLast
    }
  }

  return accountObject;
}

function sendEmails(accounts, context) {
  var confirmationDate = getFriday();
  var recipients = []
  _.map(accounts, function(account) {
    if (account !== undefined && account.lastConfirmedAt < confirmationDate) {
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
    } else {
      console.log('Weekly confirmations sent succesfully.');
    }
    context.done(err, recipients.length);
  });
};

function getFriday() {
  var date = new Date();
  var monday = new Date(+date+(7-(date.getDay()+2)%7)*86400000);
  return monday.setHours(0,0,0,0);
}
