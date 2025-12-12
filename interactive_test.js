#!/usr/bin/env node

// Interactive test runner for Shelly i4 script
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Load the test script
require("./test_shutter_script.js");

console.log("\n🎮 Interactive Shelly i4 Test Console");
console.log("=====================================");
console.log("Commands:");
console.log("  o1 - Open Shelly 1 (input:0)");
console.log("  c1 - Close Shelly 1 (input:1)");
console.log("  o2 - Open Shelly 2 (input:2)");
console.log("  c2 - Close Shelly 2 (input:3)");
console.log("  l1 - Long push Shelly 1");
console.log("  l2 - Long push Shelly 2");
console.log("  status - Show current states");
console.log("  quit - Exit\n");

function promptUser() {
  rl.question("Enter command: ", (answer) => {
    switch (answer.toLowerCase()) {
      case "o1":
        Shelly.simulateInput("input:0", "single_push");
        break;
      case "c1":
        Shelly.simulateInput("input:1", "single_push");
        break;
      case "o2":
        Shelly.simulateInput("input:2", "single_push");
        break;
      case "c2":
        Shelly.simulateInput("input:3", "single_push");
        break;
      case "l1":
        Shelly.simulateInput("input:0", "long_push");
        break;
      case "l2":
        Shelly.simulateInput("input:2", "long_push");
        break;
      case "status":
        console.log("\n📊 Current States:");
        console.log(
          "Shelly 1 (192.XXX.XXX.XXX):",
          mockCoverStates["192.XXX.XXX.XXX"]
        );
        console.log(
          "Shelly 2 (192.XXX.XXX.XXY):",
          mockCoverStates["192.XXX.XXX.XXY"]
        );
        console.log("");
        break;
      case "quit":
      case "exit":
        console.log("Goodbye! 👋");
        rl.close();
        return;
      default:
        console.log("Unknown command. Try again.");
    }
    setTimeout(promptUser, 100); // Small delay for cleaner output
  });
}

promptUser();
