var Firebase = require("firebase");
var secrets = require("./secrets.json");
var _ = require('underscore');

var config = {
    serviceAccount: secrets.SERVICE_ACCOUNT_PATH,
    databaseURL: secrets.FIREBASE_URL
};

Firebase.initializeApp(config);
var ref = Firebase.database().ref("/accounts");
checkAccounts(ref);

function checkAccounts(accounts) {
  var activeQuery = ref.orderByChild('active').equalTo(true).on('value', function(snapshot) {
    setUnconfirmedInactive(snapshot.val(), snapshot.key());
  })
};

function setUnconfirmedInactive(accounts, key){
  var confirmationDate = getMonday(new Date());
  _.each(accounts, function(account) {
    if (account !== undefined && account.lastConfirmedAt < confirmationDate) {
      console.log(key);
    }
  });
}

function getMonday(date) {
  var d = new Date(date);
  var day = d.getDay(),
      diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
  var monday = new Date(d.setDate(diff));
  return monday.setHours(0,0,0,0);
}
