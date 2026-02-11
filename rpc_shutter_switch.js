let CONFIG = {
  ip1: "192.XXX.XXX.XXX",
  ip2: "192.XXX.XXX.XXX",
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

let remoteShelly1 = RemoteShelly.getInstance(CONFIG.ip1);
let remoteShelly2 = RemoteShelly.getInstance(CONFIG.ip2);

Shelly.addEventHandler(function (statusEvent) {
  print("Status Event: " + JSON.stringify(statusEvent));

  let result = statusEvent.info;
  let action =
    result.component === "input:0" || result.component === "input:2"
      ? "open"
      : "close";

  let targetShelly;

  if (result.component === "input:0" || result.component === "input:1") {
    targetShelly = remoteShelly1;
  } else if (result.component === "input:2" || result.component === "input:3") {
    targetShelly = remoteShelly2;
  } else {
    return;
  }

  if (result.event === "single_push") {
    targetShelly.call(
      "Cover.GetStatus",
      { id: 0 },
      doExcecute(action, targetShelly),
    );
  } else if (result.event === "long_push") {
    //targetShelly.call('Cover.GoToPosition', { id: 0, pos: 50 }, nullCallback());
    print("long_push");
  }
});

function doExcecute(action, targetShelly) {
  return function (result, error_code, error_message, ud) {
    console.log("Current action: " + action);
    console.log("Current targetShelly: " + targetShelly);
    console.log(
      "Cover status result: " + JSON.stringify(result),
      error_code,
      error_message,
    );

    if (result.state === "opening" || result.state === "closing") {
      targetShelly.call("Cover.Stop", { id: 0 }, nullCallback());
    } else if (result.state === "stopped") {
      if (action === "close") {
        targetShelly.call("Cover.Close", { id: 0 }, nullCallback());
      } else if (action === "open") {
        targetShelly.call("Cover.Open", { id: 0 }, nullCallback());
      } else {
        targetShelly.call("Cover.Stop", { id: 0 }, nullCallback());
      }
    } else {
      if (action === "open" && result.state !== "open") {
        targetShelly.call("Cover.Open", { id: 0 }, nullCallback());
      } else if (action === "close" && result.state !== "closed") {
        targetShelly.call("Cover.Close", { id: 0 }, nullCallback());
      } else {
        targetShelly.call("Cover.Stop", { id: 0 }, nullCallback());
      }
    }
  };
}

function nullCallback() {
  return function () {};
}
