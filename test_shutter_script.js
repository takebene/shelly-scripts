// Test script for Shelly i4 shutter control without physical devices
// This simulates the Shelly environment and allows testing the logic

// Mock Shelly API for testing
let mockCoverStates = {
  "192.XXX.XXX.XXX": "stopped", // Shelly 1 state
  "192.XXX.XXX.XXY": "stopped", // Shelly 2 state
};

// Mock Shelly object
let Shelly = {
  call: function (method, data, callback, userCallback) {
    console.log(`Mock Shelly.call: ${method} to ${data.url}`);

    // Extract IP from URL
    let ip = data.url.match(/http:\/\/([^\/]+)\//)[1];

    // Simulate different RPC responses
    if (data.url.includes("Cover.GetStatus")) {
      let mockResult = {
        code: 200,
        message: "OK",
        body: JSON.stringify({
          state: mockCoverStates[ip],
          current_pos: mockCoverStates[ip] === "open" ? 100 : 0,
          target_pos: mockCoverStates[ip] === "open" ? 100 : 0,
        }),
      };
      callback(mockResult, 0, "", userCallback);
    } else if (data.url.includes("Cover.Open")) {
      mockCoverStates[ip] = "opening";
      setTimeout(() => {
        mockCoverStates[ip] = "open";
        console.log(`Cover ${ip} is now open`);
      }, 2000); // Simulate 2 seconds to open

      let mockResult = {
        code: 200,
        message: "OK",
        body: JSON.stringify({ success: true }),
      };
      callback(mockResult, 0, "", userCallback);
    } else if (data.url.includes("Cover.Close")) {
      mockCoverStates[ip] = "closing";
      setTimeout(() => {
        mockCoverStates[ip] = "closed";
        console.log(`Cover ${ip} is now closed`);
      }, 2000); // Simulate 2 seconds to close

      let mockResult = {
        code: 200,
        message: "OK",
        body: JSON.stringify({ success: true }),
      };
      callback(mockResult, 0, "", userCallback);
    } else if (data.url.includes("Cover.Stop")) {
      mockCoverStates[ip] = "stopped";
      console.log(`Cover ${ip} stopped`);

      let mockResult = {
        code: 200,
        message: "OK",
        body: JSON.stringify({ success: true }),
      };
      callback(mockResult, 0, "", userCallback);
    }
  },

  addEventHandler: function (handler) {
    console.log("Event handler registered");
    this.eventHandler = handler;
  },

  // Method to simulate input events for testing
  simulateInput: function (inputComponent, eventType) {
    console.log(`\n=== Simulating ${eventType} on ${inputComponent} ===`);
    let statusEvent = {
      info: {
        component: inputComponent,
        event: eventType,
      },
    };
    this.eventHandler(statusEvent);
  },
};

// Mock Timer for delays
let Timer = {
  set: function (delay, repeat, callback) {
    setTimeout(callback, delay);
  },
};

// Mock print function
function print(message) {
  console.log("[PRINT] " + message);
}

// Update CONFIG for testing
let CONFIG = {
  ip1: "192.XXX.XXX.XXX", // First Shelly cover device
  ip2: "192.XXX.XXX.XXY", // Second Shelly cover device (different IP for testing)
};

// Include the main script logic here (copy from rpc_shutter_switch.js)
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

    if (
      (currentState === "closing" && action === "close") ||
      (currentState === "opening" && action === "open")
    ) {
      print("Cover is already moving in requested direction, stopping it");
      targetShelly.call("Cover.Stop", { id: 0 }, nullCallback());
      return;
    }

    if (
      (currentState === "opening" && action === "close") ||
      (currentState === "closing" && action === "open")
    ) {
      print("Cover is moving in opposite direction, stopping and reversing");
      targetShelly.call("Cover.Stop", { id: 0 }, function () {
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

// Test scenarios
console.log("\n🧪 Starting Shelly i4 Shutter Control Tests");
console.log("============================================\n");

// Test 1: Basic open/close
setTimeout(() => {
  console.log("\n📋 Test 1: Basic open command for Shelly 1");
  Shelly.simulateInput("input:0", "single_push"); // Open Shelly 1
}, 1000);

setTimeout(() => {
  console.log(
    "\n📋 Test 2: Close command while opening (should stop and reverse)"
  );
  Shelly.simulateInput("input:1", "single_push"); // Close Shelly 1 while opening
}, 2500);

setTimeout(() => {
  console.log("\n📋 Test 3: Same close command while closing (should stop)");
  Shelly.simulateInput("input:1", "single_push"); // Close again while closing (should stop)
}, 4000);

setTimeout(() => {
  console.log("\n📋 Test 4: Long push (should stop)");
  Shelly.simulateInput("input:1", "long_push"); // Long push should stop
}, 5500);

setTimeout(() => {
  console.log("\n📋 Test 5: Control Shelly 2");
  Shelly.simulateInput("input:2", "single_push"); // Open Shelly 2
}, 7000);

setTimeout(() => {
  console.log("\n📋 Current mock states:");
  console.log("Shelly 1:", mockCoverStates["192.XXX.XXX.XXX"]);
  console.log("Shelly 2:", mockCoverStates["192.XXX.XXX.XXY"]);
  console.log("\n🎉 Tests completed!");
}, 10000);
