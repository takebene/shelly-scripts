# Shelly i4 Shutter Control - Testing Guide

## Testing Without Physical Devices

This directory contains test scripts that simulate the Shelly environment, allowing you to test the shutter control logic without physical devices.

### 1. Automated Test Suite

Run the comprehensive test suite:

```bash
node test_shutter_script.js
```

**What it tests:**

- ✅ Basic open/close commands
- ✅ Stop behavior when pressing same direction twice
- ✅ Direction reversal when pressing opposite direction
- ✅ Long press stop functionality
- ✅ Multi-device control (Shelly 1 & 2)

### 2. Interactive Testing

For manual testing and experimentation:

```bash
node interactive_test.js
```

**Available commands:**

- `o1` - Open Shelly 1 (input:0)
- `c1` - Close Shelly 1 (input:1)
- `o2` - Open Shelly 2 (input:2)
- `c2` - Close Shelly 2 (input:3)
- `l1` - Long push Shelly 1
- `l2` - Long push Shelly 2
- `status` - Show current cover states
- `quit` - Exit

### 3. Test Scenarios to Validate

#### Scenario 1: Normal Operation

1. Press `o1` → Cover should start opening
2. Wait 3 seconds → Cover should be "open"
3. Press `c1` → Cover should start closing
4. Wait 3 seconds → Cover should be "closed"

#### Scenario 2: Stop on Repeat Press

1. Press `c1` → Cover starts closing
2. Immediately press `c1` again → Cover should stop
3. Check status → Should show "stopped"

#### Scenario 3: Direction Reversal

1. Press `o1` → Cover starts opening
2. Press `c1` while opening → Should stop, then start closing
3. Check behavior → Should reverse direction smoothly

#### Scenario 4: Long Press Stop

1. Press `c1` → Cover starts closing
2. Use `l1` → Should immediately stop
3. Verify → Cover stops regardless of current action

### 4. Mock vs Real Behavior

The test simulates:

- **Network delays**: 200ms response time
- **Motor movement**: 2 second open/close duration
- **State transitions**: opening → open, closing → closed
- **Error handling**: RPC errors and invalid responses

### 5. Debugging Tips

Watch for these log messages:

- `[PRINT]` - Script debug output
- `Mock Shelly.call` - Network simulation
- `Cover X is now Y` - State changes
- Input mappings and actions

### 6. Real Device Deployment

When ready to deploy to real devices:

1. Update `CONFIG.ip1` and `CONFIG.ip2` with actual IPs
2. Upload `rpc_shutter_switch.js` to Shelly i4
3. Test with one input at a time
4. Monitor Shelly logs for any issues

### 7. Common Issues & Solutions

**Issue**: Script doesn't respond to inputs
**Solution**: Check input mapping (input:0-3)

**Issue**: Covers don't stop on repeat press  
**Solution**: Verify the stop logic in `doExecute()`

**Issue**: Network timeouts
**Solution**: Check IP addresses and network connectivity
