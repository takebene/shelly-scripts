let CONFIG = {
  ip: "192.XXX.XXX.XXX",
};

let RemoteShelly = {
  _cb: function (result, error_code, error_message, callback) {
    let rpcResult = JSON.parse(result.body);
    let rpcCode = result.code;
    let rpcMessage = result.message;
    callback(rpcResult, rpcCode, rpcMessage);
  },
  composeEndpoint: function (method) {
    return "http://" + this.address + "/rpc/" + method;
  },
  call: function (rpc, data, callback) {
    let postData = {
      url: this.composeEndpoint(rpc),
      body: data,
    };
    Shelly.call("HTTP.POST", postData, RemoteShelly._cb, callback);
  },
  getInstance: function (address) {
    let rs = Object.create(this);
    // remove static method
    rs.getInstance = null;
    rs.address = address;
    return rs;
  },
};

let remoteShelly = RemoteShelly.getInstance(CONFIG.ip);

function componentStatus(statusEvent) {
  remoteShelly.call(
    "Switch.GetStatus",
    { id: 0 },
    function (result, error_code, error_message, ud) {
      print(
        "get.status result: " + JSON.stringify(result),
        error_code,
        error_message
      );
    }
  );
}

Shelly.addStatusHandler(function (statusEvent) {
  if (statusEvent.component === "input:0" && statusEvent.delta.state == true) {
    componentStatus(statusEvent);
  }
});
