let CONFIG = {
  ip: "192.168.1.100",
};


/**
 * RemoteShelly object for making RPC calls to remote Shelly devices
 */
let RemoteShelly = {
  /**
   * Internal callback handler for HTTP responses
   * @param {Object} result - HTTP response result
   * @param {number} error_code - Error code if any
   * @param {string} error_message - Error message if any  
   * @param {Function} callback - User callback function
   */
  _cb: function (result, error_code, error_message, callback) {
    let rpcResult = JSON.parse(result.body);
    let rpcCode = result.code;
    let rpcMessage = result.message;
    callback(rpcResult, rpcCode, rpcMessage);
  },
  /**
   * Compose RPC endpoint URL
   * @param {string} method - RPC method name
   * @returns {string} Complete endpoint URL
   */
  composeEndpoint: function (method) {
    return "http://" + this.address + "/rpc/" + method;
  },
  /**
   * Make an RPC call to the remote device
   * @param {string} rpc - RPC method name
   * @param {Object} data - Data to send with the request
   * @param {Function} callback - Callback function to handle response
   */
  call: function (rpc, data, callback) {
    let postData = {
      url: this.composeEndpoint(rpc),
      body: data,
    };
    Shelly.call("HTTP.POST", postData, RemoteShelly._cb, callback);
  },
  /**
   * Create a new RemoteShelly instance for a specific device
   * @param {string} address - IP address of the remote device
   * @returns {Object} RemoteShelly instance
   */
  getInstance: function (address) {
    let rs = Object.create(this);
    // remove static method
    rs.getInstance = null;
    rs.address = address;
    return rs;
  },
};

let remoteShelly = RemoteShelly.getInstance(CONFIG.ip);

/**
 * Handle component status events for shutter control
 * @param {Object} statusEvent - Status event from input component
 */
function componentStatus(statusEvent) {
  console.log("componentStatus: " + JSON.stringify(statusEvent));

  let action = statusEvent.component === "input:0" ? "open" : "close";
  remoteShelly.call("Cover.GetStatus", { id: 0 }, doExecute(action));
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

/**
 * Create execution callback for cover actions
 * @param {string} action - Action to perform ('open', 'close', or other)
 * @returns {Function} Callback function that handles cover status and executes action
 */
function doExecute(action) {
  return function (result, error_code, error_message, ud) {
    console.log("Current action: " + action);
    console.log(
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

/**
 * Create a null callback function for RPC calls that don't need response handling
 * @returns {Function} Empty callback function
 */
function nullCallback() {
  return function () {};
}
