let CONFIG = {
  ip1: "192.XXX.XXX.XXX", // First Shelly cover device
  ip2: "192.XXX.XXX.XXX", // Second Shelly cover device
};

let RemoteShelly = {
  _cb: function (result, error_code, error_message, callback) {
    if (result && result.body) {
      try {
        let rpcResult = JSON.parse(result.body);
        let rpcCode = result.code;
        let rpcMessage = result.message;
        callback(rpcResult, rpcCode, rpcMessage);
      } catch (e) {
        print("Error parsing RPC response: " + e.message);
        callback(null, -1, "Parse error");
      }
    } else {
      print("Invalid RPC response");
      callback(null, -1, "Invalid response");
    }
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

  if (!statusEvent || !statusEvent.info) {
    print("Invalid status event");
    return;
  }

  let result = statusEvent.info;

  // Shelly i4 has 4 inputs (input:0 to input:3)
  // Input mapping:
  // input:0 -> Shelly 1 UP (open)
  // input:1 -> Shelly 1 DOWN (close)
  // input:2 -> Shelly 2 UP (open)
  // input:3 -> Shelly 2 DOWN (close)

  let action, targetShelly;

  switch (result.component) {
    case "input:0":
      action = "open";
      targetShelly = remoteShelly1;
      break;
    case "input:1":
      action = "close";
      targetShelly = remoteShelly1;
      break;
    case "input:2":
      action = "open";
      targetShelly = remoteShelly2;
      break;
    case "input:3":
      action = "close";
      targetShelly = remoteShelly2;
      break;
    default:
      print("Unknown input component: " + result.component);
      return;
  }

  print(
    "Input: " +
      result.component +
      ", Action: " +
      action +
      ", Event: " +
      result.event
  );

  if (result.event === "single_push") {
    targetShelly.call(
      "Cover.GetStatus",
      { id: 0 },
      doExecute(action, targetShelly)
    );
  } else if (result.event === "long_push") {
    // Long push stops the cover
    targetShelly.call("Cover.Stop", { id: 0 }, nullCallback());
    print("Long push detected - stopping cover");
  }
});

function doExecute(action, targetShelly) {
  return function (result, rpcCode, rpcMessage) {
    print("Current action: " + action);
    print("Cover status result: " + JSON.stringify(result));

    if (rpcCode !== 200) {
      print("RPC Error - Code: " + rpcCode + ", Message: " + rpcMessage);
      return;
    }

    if (!result || typeof result.state === "undefined") {
      print("Invalid cover status response");
      return;
    }

    let currentState = result.state;
    print("Cover current state: " + currentState);

    // If cover is already moving in the requested direction, stop it
    if (
      (currentState === "closing" && action === "close") ||
      (currentState === "opening" && action === "open")
    ) {
      print("Cover is already moving in requested direction, stopping it");
      targetShelly.call("Cover.Stop", { id: 0 }, nullCallback());
      return;
    }

    // If cover is moving in opposite direction, stop it first then execute action
    if (
      (currentState === "opening" && action === "close") ||
      (currentState === "closing" && action === "open")
    ) {
      print("Cover is moving in opposite direction, stopping and reversing");
      targetShelly.call("Cover.Stop", { id: 0 }, function () {
        // Wait a moment then execute the new action
        Timer.set(500, false, function () {
          if (action === "close") {
            targetShelly.call("Cover.Close", { id: 0 }, nullCallback());
          } else {
            targetShelly.call("Cover.Open", { id: 0 }, nullCallback());
          }
        });
      });
      return;
    }

    // Execute the requested action based on current state
    if (currentState === "stopped") {
      if (action === "close") {
        print("Closing cover");
        targetShelly.call("Cover.Close", { id: 0 }, nullCallback());
      } else if (action === "open") {
        print("Opening cover");
        targetShelly.call("Cover.Open", { id: 0 }, nullCallback());
      }
    } else if (currentState === "open" && action === "close") {
      print("Cover is open, closing it");
      targetShelly.call("Cover.Close", { id: 0 }, nullCallback());
    } else if (currentState === "closed" && action === "open") {
      print("Cover is closed, opening it");
      targetShelly.call("Cover.Open", { id: 0 }, nullCallback());
    } else {
      print("Cover already in desired state");
    }
  };
}

function nullCallback() {
  return function (result, rpcCode, rpcMessage) {
    if (rpcCode !== 200) {
      print(
        "Command execution error - Code: " +
          rpcCode +
          ", Message: " +
          rpcMessage
      );
    } else {
      print("Command executed successfully");
    }
  };
}
