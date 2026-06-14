let CONFIG = {
  ips: ["XXX.XXX.XXX.XXX"],
};

let RemoteShelly = {
  _cb: function (result, error_code, error_message, callback) {
    if (error_code !== 0) {
      print("HTTP error: " + error_code + " - " + error_message);
      return;
    }

    let rpcResult = JSON.parse(result.body);
    callback(rpcResult, result.code, result.message);
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
    rs.getInstance = null;
    rs.address = address;
    return rs;
  },
};

let remoteShellys = CONFIG.ips.map(function (ip) {
  return RemoteShelly.getInstance(ip);
});

Shelly.addEventHandler(function (statusEvent) {
  print("Status Event: " + JSON.stringify(statusEvent));

  let result = statusEvent.info;

  if (!result) return;

  // Nur input:0 und input:1 behandeln
  if (result.component !== "input:0" && result.component !== "input:1") {
    return;
  }

  // input:0 = öffnen, input:1 = schließen
  let action = result.component === "input:0" ? "open" : "close";

  if (result.event === "single_push") {
    remoteShellys.forEach(function (remoteShelly) {
      remoteShelly.call(
        "Cover.GetStatus",
        { id: 0 },
        doExecute(action, remoteShelly),
      );
    });
  } else if (result.event === "long_push") {
    remoteShellys.forEach(function (remoteShelly) {
      remoteShelly.call(
        "Cover.GoToPosition",
        { id: 0, pos: 50 },
        nullCallback(),
      );
    });
  }
});

function doExecute(action, targetShelly) {
  return function (result, error_code, error_message) {
    print("Target Shelly: " + targetShelly.address);
    print("Action: " + action);
    print("Cover status: " + JSON.stringify(result));

    if (result.state === "opening" || result.state === "closing") {
      targetShelly.call("Cover.Stop", { id: 0 }, nullCallback());
      return;
    }

    if (action === "open") {
      if (result.state !== "open") {
        targetShelly.call("Cover.Open", { id: 0 }, nullCallback());
      }
    } else if (action === "close") {
      if (result.state !== "closed") {
        targetShelly.call("Cover.Close", { id: 0 }, nullCallback());
      }
    }
  };
}

function nullCallback() {
  return function () {};
}
