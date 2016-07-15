var MyNXT = (function (MyNXT, $) {
  if (!verifyHostname() && !MyNXT.sdkConfig) throw 'MyNXT error: Missing sdkConfig object';

  MyNXT.apiUrl = 'https://wallet.mynxt.info';
  MyNXT.apiPath = '/api/0.1';
  MyNXT.blockexplorerUrl = 'https://mynxt.info/api/0.1/public/index.php';
  MyNXT.env = 'PROD';

  // private function to verify we are on the mynxt servers
  function verifyHostname () {
    return window.location.hostname.indexOf('mynxt.info') !== -1;
  }

  function appendAccountData (data) {
    var config = MyNXT.sdkConfig;
    if (!config.email || !config.password) throw 'MyNXT error: Missing email or password in sdkConfig';
    if(!data) data = {};

    data.email = config.email;
    data.password = config.password;

    return data;
  }

  MyNXT.getAccounts = function (callback) {
    var url = MyNXT.apiUrl + MyNXT.apiPath + '/user/account';
    var data = {};

    if (!verifyHostname()) data = appendAccountData(data);

    $.get(url, data, callback);
  };

  MyNXT.nrsRequest = function (requestType, data, callback) {
    if (!requestType) return;
    var url = MyNXT.apiUrl + MyNXT.apiPath + '/nxt?requestType=' + requestType;

    if ($.isFunction(data)) {
      callback = data;
      data = {};
    }

    if (!verifyHostname()) data = appendAccountData(data);

    if(data.requestType) delete data.requestType;

    $.post(url, data, callback);
  };

  MyNXT.queryExplorer = function (requestType, data, callback) {
    if (!requestType) return;
    var url = MyNXT.blockexplorerUrl + '/' + requestType;

    if ($.isFunction(data)) {
      callback = data;
      data = {};
    }

    $.get(url, data, callback);
  };

  MyNXT.sendTransaction = function (data, callback) {
    if(!verifyHostname()) {
      if(!data.requestType) return;

      MyNXT.nrsRequest(data.requestType, data, callback);
    }

    var messageId = Math.floor(Math.random() * 10000000);

    data.messageId = messageId;

    parent.postMessage(data, MyNXT.apiUrl);

    function listener (event) {
      if(event.origin !== MyNXT.apiUrl) return;

      if(event.data && event.data.messageId == messageId) {
        delete event.data.messageId;
        callback(event.data);
      }

      window.removeEventListener('message', listener, false);
    }

    window.addEventListener('message', listener, false);
  };

  return MyNXT;
}(MyNXT || {}, jQuery));