# Shelly Scripts

A collection of JavaScript scripts for Shelly IoT devices that enable remote control and automation through RPC (Remote Procedure Call) communication.

## Scripts

### 1. RPC Toggle Switch (`rpc_toggle_switch.js`)

**Purpose**: Listens to multiple local Shelly inputs and triggers remote Shelly devices using RPC calls.

**Features**:
- Multi-input support with individual remote device mapping
- Toggle functionality for remote switches
- Scalable configuration system
- Comprehensive logging

**Configuration**:
```javascript
let CONFIG = {
  inputs: [
    {
      input: 0, // Local Shelly input number (0, 1, 2, etc.)
      ip: "192.168.1.100", // IP address of remote Shelly device
    },
    {
      input: 1, // Different local input
      ip: "192.168.1.101", // Different remote device
    },
  ],
};
```

**Usage**: 
- When a configured local input changes to `true`, the script sends a toggle command to the corresponding remote Shelly device
- Simply add more entries to `CONFIG.inputs` to control additional devices

### 2. RPC Shutter Switch (`rpc_shutter_switch.js`)

**Purpose**: Controls remote Shelly shutter/cover devices via RPC calls with intelligent state management.

**Features**:
- Open/Close operations based on input triggers
- Position control (50% position on long press)
- State-aware operation (stops if already moving)
- Dual input support (input:0 and input:1)

**Configuration**:
```javascript
let CONFIG = {
  ip: "192.168.1.100", // IP address of remote Shelly cover device
};
```

**Usage**:
- **Single press** on input:0 → Open cover
- **Single press** on input:1 → Close cover  
- **Long press** on either input → Move to 50% position
- If cover is already moving, it will stop instead

## Setup Instructions

1. **Configure IP Addresses**: Update the `CONFIG` object in each script with your actual device IP addresses
2. **Upload to Shelly**: Use the Shelly Web UI or App to upload the desired script to your Shelly device
3. **Enable Script**: Activate the script in your Shelly device's script settings
4. **Test**: Trigger the configured inputs to verify remote devices respond correctly

## Requirements

- Shelly devices with scripting support (Gen2+ devices)
- Network connectivity between controlling and target devices
- Target devices must be accessible via HTTP on the configured IP addresses

## Network Considerations

- Ensure all devices are on the same network or have proper routing configured
- Verify that firewall settings allow HTTP communication between devices
- Test connectivity using ping or HTTP requests before deploying scripts

## Troubleshooting

- Check device logs for error messages
- Verify IP addresses are correct and devices are reachable
- Ensure target devices have RPC enabled
- Test with a single device configuration first before scaling up

## Contributing

Feel free to submit issues and enhancement requests. When contributing code, please maintain the existing code style and add appropriate documentation.