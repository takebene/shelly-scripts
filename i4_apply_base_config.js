/**
 * Shelly i4 input configuration
 *
 * Configures only:
 * - Input 0..3 to type "button"
 */

let CONFIG = {
  inputIds: [0, 1, 2, 3],
  debug: false,
};

function logDebug(message) {
  if (CONFIG.debug) {
    print("DEBUG: " + message);
  }
}

function logInfo(message) {
  print("INFO: " + message);
}

function logError(message) {
  print("ERROR: " + message);
}

function callRpc(method, params, done) {
  Shelly.call(method, params, function (res, errCode, errMsg) {
    if (errCode !== 0) {
      logError(method + " failed: code=" + errCode + ", message=" + (errMsg || "unknown"));
      done(false, null);
      return;
    }

    logDebug(method + " succeeded");
    done(true, res);
  });
}

function setInputsToButton(index, restartNeeded, done) {
  if (index >= CONFIG.inputIds.length) {
    done(restartNeeded);
    return;
  }

  let inputId = CONFIG.inputIds[index];
  if (typeof inputId !== "number" || inputId < 0) {
    logError("Invalid input id at index " + index + ": " + JSON.stringify(inputId));
    setInputsToButton(index + 1, restartNeeded, done);
    return;
  }

  callRpc(
    "Input.SetConfig",
    {
      id: inputId,
      config: {
        type: "button",
      },
    },
    function (ok, res) {
      if (!ok) {
        done(restartNeeded);
        return;
      }

      let needsRestart = restartNeeded || !!(res && res.restart_required);
      setInputsToButton(index + 1, needsRestart, done);
    },
  );
}

function runSetup() {
  setInputsToButton(0, false, function (restartRequired) {
    logInfo("Setup finished. restart_required=" + (restartRequired ? "true" : "false"));
    if (restartRequired) {
      logInfo(
        "Optional: run RPC 'Shelly.Reboot' if configuration changes are not active yet.",
      );
    }
  });
}

runSetup();
