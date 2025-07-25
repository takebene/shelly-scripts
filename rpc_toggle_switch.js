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
      ip: "192.168.1.100", // Remote Shelly Device 1
    },
    {
      input: 1, // Shelly Input
      ip: "192.168.1.101", // Remote Shelly Device 2
    },
  ],
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
