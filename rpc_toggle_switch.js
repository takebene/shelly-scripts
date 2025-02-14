/**
 * This script handles multiple Shelly inputs and triggers remote Shelly devices accordingly.
 * For each input specified in the CONFIG array, a corresponding status handler is registered.
 * When a configured input is triggered, the script toggles the respective remote Shelly device's switch.
 *
 * CONFIG:
 * - inputs: An array of input configurations, each containing:
 *   - input: The local Shelly input number (e.g., 0 for input:0).
 *   - ip: The IP address of the remote Shelly device to control.
 *
 * Example usage:
 * - When input:0 on the local Shelly changes to true, the script sends a toggle command
 *   to the remote Shelly device defined by the corresponding IP address.
 *
 * Components:
 * - CONFIG: Contains the input-to-remote device mapping.
 * - RemoteShelly: A helper object for making RPC calls to remote Shelly devices.
 * - Shelly.addStatusHandler: Registers event handlers for each configured input.
 *
 * Key Functionality:
 * - Each input in CONFIG.inputs gets its own status handler.
 * - When the input matches the specified input number and state becomes true, a call to
 *   "switch.toggle" is sent to the remote Shelly device.
 *
 * Notes:
 * - This script uses Shelly's built-in HTTP.POST method.
 * - Ensure that the correct IP addresses and input numbers are specified in CONFIG.
 * - The script is designed to scale; simply add more entries to CONFIG.inputs to handle more devices.
 */

let CONFIG = {
  inputs: [
    {
      input: 0, // Shelly Input
      ip: "192.XXX.XXX.XXX", // Remote Shelly
    },
    {
      input: 0, // Shelly Input
      ip: "192.XXX.XXX.XXX", // Remote Shelly
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

  CONFIG.inputs.forEach(function (inputConfig) {
    let remoteShelly = RemoteShelly.getInstance(inputConfig.ip);
    let input = "input:" + inputConfig.input;

    if (statusEvent.component === input && statusEvent.delta.state == true) {
      remoteShelly.call(
        "switch.toggle",
        { id: 0 },
        function (result, error_code, error_message, ud) {
          console.log(
            "switch.toggle result (" +
              inputConfig.ip +
              "): " +
              JSON.stringify(result),
            error_code,
            error_message
          );
        }
      );
    }
  });
});
