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
  console.log("componentStatus: " + JSON.stringify(statusEvent));
  remoteShelly.call("Cover.GetStatus", { id: 0 }, doExcecute());
}

Shelly.addStatusHandler(function (statusEvent) {
  if (statusEvent.component === "input:0" && statusEvent.delta.state == true) {
    componentStatus(statusEvent);
  }
});
function doExcecute() {
  return function (result, error_code, error_message, ud) {
    print(
      "get.status result: " + JSON.stringify(result),
      error_code,
      error_message
    );

    if (result.state == "open") {
      remoteShelly.call("Cover.Close", { id: 0 }, nullCallback());
    } else if (result.state == "closed") {
      remoteShelly.call("Cover.Open", { id: 0 }, nullCallback());
    } else if (result.state == "stopped") {
      result.last_direction == "open"
        ? remoteShelly.call("Cover.Close", { id: 0 }, nullCallback())
        : remoteShelly.call("Cover.Open", { id: 0 }, nullCallback());
    } else {
      remoteShelly.call("Cover.Stop", { id: 0 }, nullCallback());
    }
  };
}

function nullCallback() {
  return function () {};
}
