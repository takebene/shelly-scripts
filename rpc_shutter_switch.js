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

  let action = statusEvent.component === "input:0" ? "open" : "close";
  remoteShelly.call("Cover.GetStatus", { id: 0 }, doExcecute(action));
}

Shelly.addEventHandler(function (statusEvent) {
  let result = statusEvent.info;
  if (
    (result.component === "input:0" && result.event === "single_push") ||
    (result.component === "input:1" && result.event === "single_push")
  ) {
    componentStatus(result);
  } else if (
    (result.component === "input:0" && result.event === "long_push") ||
    (result.component === "input:1" && result.event === "long_push")
  ) {
    remoteShelly.call("Cover.GoToPosition", { id: 0, pos: 50 }, nullCallback());
  }
});

function doExcecute(action) {
  return function (result, error_code, error_message, ud) {
    print("Current action: " + action)
    print(
      "get.status result: " + JSON.stringify(result),
      error_code,
      error_message
    );

    if (result.state === "opening" || result.state === "closing") {
      remoteShelly.call("Cover.Stop", { id: 0 }, nullCallback());
    } else if (result.state === "stopped") {
      if (action === "close") {
        remoteShelly.call("Cover.Close", { id: 0 }, nullCallback());
      } else if (action === "open") {
        remoteShelly.call("Cover.Open", { id: 0 }, nullCallback());
      } else {
        remoteShelly.call("Cover.Stop", { id: 0 }, nullCallback());
      }
    } else {
      if (action === "open" && result.state !== "open") {
        remoteShelly.call("Cover.Open", { id: 0 }, nullCallback());
      } else if (action === "close" && result.state !== "closed") {
        remoteShelly.call("Cover.Close", { id: 0 }, nullCallback());
      } else {
        remoteShelly.call("Cover.Stop", { id: 0 }, nullCallback());
      }
    }
  };
}

function nullCallback() {
  return function () {};
}
