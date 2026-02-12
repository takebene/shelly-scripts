/**
 * This script handles multiple Shelly inputs and triggers remote Shelly devices accordingly.
 * For each input specified in the CONFIG array, a corresponding status handler is registered.
 * When a configured source input is triggered with the specified event type,
 * the script toggles all configured target switches on remote Shelly devices.
 *
 * CONFIG:
 * - inputs: An array of input configurations, each containing:
 *   - sourceInput: The local Shelly input number (e.g., 0-3 for Shelly i4).
 *   - eventType: The event type to listen for ("single_push", "long_push", "double_push", etc.).
 *   - targets: An array of target configurations, each containing:
 *     - targetIp: The IP address of the remote Shelly device.
 *     - targetInput: The switch ID on the remote Shelly device to toggle.
 *
 * Example usage:
 * - When input:0 on the local Shelly i4 receives a "single_push" event,
 *   the script sends Switch.Toggle commands to all configured target devices.
 * - A single sourceInput can control multiple remote Shelly devices.
 *
 * Components:
 * - CONFIG: Contains the sourceInput-to-targets mapping with event types.
 * - RemoteShelly: A helper object for making RPC calls to remote Shelly devices.
 * - Shelly.addStatusHandler: Registers event handlers for input events.
 *
 * Key Functionality:
 * - Each sourceInput and eventType combination is monitored.
 * - When matching event occurs, calls "Switch.Toggle" for all targets.
 * - Supports multiple targets per sourceInput for synchronized control.
 *
 * Notes:
 * - This script uses Shelly's built-in HTTP.POST method.
 * - Calls http://<targetIp>/rpc/Switch.Toggle?id=<targetInput> for each target.
 * - Ensure that the correct IP addresses and input numbers are specified in CONFIG.
 * - The script is designed to scale; simply add more entries to CONFIG.inputs.
 */

let CONFIG = {
  inputs: [
    {
      sourceInput: 0, // Local Shelly input (e.g., i4 input 0-3)
      eventType: "single_push", // Event type: "single_push", "long_push", "double_push"
      targets: [
        {
          targetIp: "192.XXX.XXX.XXX", // Remote Shelly IP
          targetInput: 0, // Remote Switch ID
        },
        {
          targetIp: "192.XXX.XXX.XXX", // Remote Shelly IP
          targetInput: 0, // Remote Switch ID
        },
      ],
    },
    {
      sourceInput: 1, // Local Shelly input
      eventType: "long_push", // Event type
      targets: [
        {
          targetIp: "192.XXX.XXX.XXX", // Remote Shelly IP
          targetInput: 1, // Remote Switch ID
        },
      ],
    },
  ],
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
    rs.address = address;
    return rs;
  },
};

// Add a single status handler that checks all configured inputs
Shelly.addStatusHandler(function (statusEvent) {
  console.log("statusEvent: " + JSON.stringify(statusEvent));

  // Check if this is an input event with event info
  if (!statusEvent.info || !statusEvent.info.event) {
    return;
  }

  CONFIG.inputs.forEach(function (inputConfig) {
    let sourceInputComponent = "input:" + inputConfig.sourceInput;

    // Check if the event matches our configuration
    if (
      statusEvent.component === sourceInputComponent &&
      statusEvent.info.event === inputConfig.eventType
    ) {
      console.log(
        "Matched: sourceInput=" +
          inputConfig.sourceInput +
          ", eventType=" +
          inputConfig.eventType,
      );

      // Toggle all configured targets
      inputConfig.targets.forEach(function (target) {
        let remoteShelly = RemoteShelly.getInstance(target.targetIp);

        remoteShelly.call(
          "Switch.Toggle",
          { id: target.targetInput },
          function (result, error_code, error_message, ud) {
            console.log(
              "Switch.Toggle result (" +
                target.targetIp +
                " switch:" +
                target.targetInput +
                "): " +
                JSON.stringify(result),
              error_code,
              error_message,
            );
          },
        );
      });
    }
  });
});
