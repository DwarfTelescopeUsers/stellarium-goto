import { ConnectionContextType } from "@/types";

import {
  Dwarfii_Api,
  getDefaultParamsConfig,
  messageCameraTeleGetSystemWorkingState,
  messageCameraTeleOpenCamera,
  messageCameraWideOpenCamera,
  WebSocketHandler,
} from "dwarfii_api";
import {
  saveConnectionStatusDB,
  saveInitialConnectionTimeDB,
} from "@/db/db_utils";
import { telephotoCamera, wideangleCamera } from "@/lib/dwarf_utils";
import { getAllTelescopeISPSetting } from "@/lib/dwarf_utils";
import { saveImagingSessionDb, saveIPConnectDB } from "@/db/db_utils";
import { logger } from "@/lib/logger";

const getConfigData = async (IPDwarf: string | undefined) => {
  try {
    // Make the HTTP GET request to the specified URL
    let requestAddr;
    if (IPDwarf) {
      requestAddr = getDefaultParamsConfig(IPDwarf);
    }
    if (requestAddr) {
      const response = await fetch(requestAddr);

      // Check if the response has data
      if (response.data && response.data.data) {
        const { id, name } = response.data.data;

        console.log(`ID: ${id}`);
        console.log(`Name: ${name}`);

        return { id, name };
      } else {
        console.error("getConfigData : No data found in the response.");
        return null;
      }
    } else {
      console.error("Invalid request for getConfigData.");
      return null;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error getConfigData:", error.message);
    } else {
      console.error("Error getConfigData:", error);
    }
    return false;
  }
};

const getDwarfType = async (IPDwarf: string | undefined) => {
  let folderResponse;
  const dwarfIIUrl = `http://${IPDwarf}/sdcard/DWARF_II/Astronomy/`;
  const dwarf3Url = `http://${IPDwarf}/DWARF3/Astronomy/`;

  try {
    // First attempt to fetch Dwarf II
    folderResponse = await fetch(dwarfIIUrl);

    if (folderResponse.ok) {
      // Dwarf II found
      console.log("Detected device type: Dwarf II");
      return 1;
    } else {
      // If not OK, try Dwarf 3
      folderResponse = await fetch(dwarf3Url);
      if (folderResponse.ok) {
        // Dwarf 3 found
        console.log("Detected device type: Dwarf 3");
        return 2;
      } else {
        console.error(
          "Error fetching folder from both Dwarf II and Dwarf 3:",
          folderResponse.statusText
        );
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error checking dwarf info:", error.message);
    } else {
      console.error("Error checking dwarf info:", error);
    }
  }
  return false;
};

async function checkMediaMtxStreamWithUpdate(IPDwarf: string | undefined) {
  if ((await verifyMediaMtxStreamUrls(IPDwarf)) === false) {
    if (await editMediaMtxStreamD3(IPDwarf, "dwarf_wide"))
      if (await editMediaMtxStreamD3(IPDwarf, "dwarf_tele")) return true;
      else return false;
    else return false;
  } else {
    console.log("Streams are already OK");
  }
}

async function verifyMediaMtxStreamUrls(inputIP: string | undefined) {
  const url1 = `http://localhost:9997/v3/config/paths/get/dwarf_wide`;
  const url2 = `http://localhost:9997/v3/config/paths/get/dwarf_tele`;

  try {
    const response1 = await fetch(url1, {
      method: "GET",
    });

    if (!response1.ok) {
      throw new Error(`HTTP error! Status: ${response1.status}`);
    }

    const response2 = await fetch(url2, {
      method: "GET",
    });

    if (!response2.ok) {
      throw new Error(`HTTP error! Status: ${response2.status}`);
    }

    const result1 = await response1.json();
    console.log(result1);
    const result2 = await response2.json();
    console.log(result2);
    let result = true;

    try {
      const channelWideUrl = new URL(result1.source);
      result = result && channelWideUrl.hostname === inputIP;
    } catch (error) {
      console.error("Invalid URL format:", result1.source);
      return false;
    }
    try {
      const channelTeleUrl = new URL(result2.source);
      result = result && channelTeleUrl.hostname === inputIP;
    } catch (error) {
      console.error("Invalid URL format:", result2.source);
      return false;
    }

    if (result) {
      console.log(`The source in MediaMTX are well configured`);
      return true;
    } else {
      console.log(`Need to configure the source in MediaMTX`);
      return false;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error verifying stream info:", error.message);
    } else {
      console.error("Error verifying stream info:", error);
    }
    return false;
  }
}

const editMediaMtxStreamD3 = async (
  IPDwarf: string | undefined,
  name: string | undefined
) => {
  const url = `http://localhost:9997/v3/config/paths/replace/${name}`;
  let data;
  if (name == "dwarf_wide") {
    data = {
      source: `rtsp://${IPDwarf}:554/ch1/stream0`,
      sourceOnDemand: true,
      sourceOnDemandCloseAfter: "10s",
      record: false,
    };
  }
  if (name == "dwarf_tele") {
    data = {
      source: `rtsp://${IPDwarf}:554/ch0/stream0`,
      sourceOnDemand: true,
      sourceOnDemandCloseAfter: "10s",
      record: false,
    };
  }
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    console.log(data);
    console.log(JSON.stringify(data));
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Check the response structure
    if (response.status === 200) {
      console.log("editMediaMtxStreamD3 Success:");
      return true;
    } else {
      console.error("Failed:", response.status);
      return false;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error editing stream info:", error.message);
    } else {
      console.error("Error editing stream info:", error);
    }
    return false;
  }
};

function updateAstroCamera(connectionCtx: ConnectionContextType, cmd) {
  if (
    cmd ==
      Dwarfii_Api.DwarfCMD.CMD_NOTIFY_STATE_CAPTURE_RAW_WIDE_LIVE_STACKING ||
    cmd ==
      Dwarfii_Api.DwarfCMD.CMD_NOTIFY_PROGRASS_CAPTURE_RAW_WIDE_LIVE_STACKING
  ) {
    saveImagingSessionDb("astroCamera", wideangleCamera.toString());
    connectionCtx.setImagingSession((prev) => {
      prev["astroCamera"] = wideangleCamera;
      return { ...prev };
    });
    connectionCtx.setCurrentAstroCamera(wideangleCamera);
  } else {
    saveImagingSessionDb("astroCamera", telephotoCamera.toString());
    connectionCtx.setImagingSession((prev) => {
      prev["astroCamera"] = telephotoCamera;
      return { ...prev };
    });
    connectionCtx.setCurrentAstroCamera(telephotoCamera);
  }
}

export async function connectionHandler(
  connectionCtx: ConnectionContextType,
  IPDwarf: string | undefined,
  forceIP: boolean,
  setConnecting: Function,
  setSlavemode: Function,
  setGoLive: Function,
  setErrorTxt: Function
) {
  if (IPDwarf === undefined) {
    return;
  }
  let getInfoCamera = true;
  let isStopRecording = false;

  console.log("socketIPDwarf: ", connectionCtx.socketIPDwarf); // Create WebSocketHandler if need
  const webSocketHandler = connectionCtx.socketIPDwarf
    ? connectionCtx.socketIPDwarf
    : new WebSocketHandler(IPDwarf);

  connectionCtx.setSocketIPDwarf(webSocketHandler);

  // Force IP
  if (forceIP) await webSocketHandler.setNewIpDwarf(IPDwarf);

  const customMessageHandler = async (txt_info, result_data) => {
    if (result_data.cmd == Dwarfii_Api.DwarfCMD.CMD_NOTIFY_SDCARD_INFO) {
      connectionCtx.setAvailableSizeDwarf(result_data.data.availableSize);
      connectionCtx.setTotalSizeDwarf(result_data.data.totalSize);
      connectionCtx.setConnectionStatus(true);
      connectionCtx.setInitialConnectionTime(Date.now());
      saveConnectionStatusDB(true);
      saveInitialConnectionTimeDB();
      saveIPConnectDB(IPDwarf);

      if (connectionCtx.typeIdDwarf) {
        // get the type of Dwarf from bluetooth or result_data
        // Update it for the next frames to be sent
        if (webSocketHandler.setDeviceIdDwarf(connectionCtx.typeIdDwarf)) {
          console.log(
            "The device id has been updated for the next frames to be sent"
          );
        } else {
          console.error("Error during update of the device id");
        }
        // Update Streams for D3
        if (connectionCtx.typeIdDwarf == 2)
          checkMediaMtxStreamWithUpdate(IPDwarf);
      } else {
        // get the type of Dwarf from http directory
        const dwarfType = await getDwarfType(IPDwarf);
        if (dwarfType) {
          console.log(
            `Device type detected: ${dwarfType === 1 ? "Dwarf II" : "Dwarf 3"}`
          );
          connectionCtx.typeIdDwarf = dwarfType;
          let name = "Dwarf";
          if (dwarfType == 1) name += " II";
          else name += `${dwarfType + 1}`;
          connectionCtx.setTypeNameDwarf(name);
          console.log(`Extracted Dwarf Data: ID=${dwarfType}, Name=${name}`);
          // Update it for the next frames to be sent
          if (webSocketHandler.setDeviceIdDwarf(dwarfType)) {
            console.log(
              "The device id has been updated for the next frames to be sent"
            );
          }
        } else if (connectionCtx.typeIdDwarf === undefined) {
          // Call the request to get config data on the Dwarf
          getConfigData(IPDwarf).then((result) => {
            if (result && result.id) {
              if (result.id) connectionCtx.setTypeIdDwarf(result.id);
              if (result.name) connectionCtx.setTypeNameDwarf(result.name);
              console.log(
                `Extracted JSON Dwarf Data: ID=${result.id}, Name=${result.name}`
              );
              // Update it for the next frames to be sent
              if (webSocketHandler.setDeviceIdDwarf(result.id)) {
                console.log(
                  "The device id has been updated for the next frames to be sent"
                );
              } else {
                console.error("Error during update of the device id");
              }
              // Update Streams for D3
              if (result.id == 2) checkMediaMtxStreamWithUpdate(IPDwarf);
            } else if (result_data.deviceId) {
              connectionCtx.setTypeIdDwarf(result_data.deviceId);
              // Construct Name from deviceId
              let name = "Dwarf";
              if (result_data.deviceId == 1) name += " II";
              else name += `${result_data.deviceId + 1}`;
              connectionCtx.setTypeNameDwarf(name);
              console.log(
                `Extracted CMD Dwarf Data: ID=${result_data.deviceId}, Name=${name}`
              );
              // Update it for the next frames to be sent
              if (webSocketHandler.setDeviceIdDwarf(result_data.deviceId)) {
                console.log(
                  "The device id has been updated for the next frames to be sent"
                );
              } else {
                console.error("Error during update of the device id");
              }
              // Update Streams for D3
              if (result_data.deviceId == 2)
                checkMediaMtxStreamWithUpdate(IPDwarf);
            }
          });
        }
      }
    } else if (
      result_data.cmd ==
      Dwarfii_Api.DwarfCMD.CMD_CAMERA_TELE_GET_SYSTEM_WORKING_STATE
    ) {
      if (result_data.data.code == Dwarfii_Api.DwarfErrorCode.OK) {
        connectionCtx.setConnectionStatus(true);
        if (getInfoCamera) {
          getAllTelescopeISPSetting(connectionCtx, webSocketHandler);
          getInfoCamera = false;
        }
      } else {
        connectionCtx.setConnectionStatus(true);
        if (result_data.data.errorPlainTxt)
          setErrorTxt(
            (prevError) => prevError + " " + result_data.data.errorPlainTxt
          );
        else if (result_data.data.errorTxt)
          setErrorTxt(
            (prevError) => prevError + " " + result_data.data.errorTxt
          );
        else if (result_data.data.code)
          setErrorTxt(
            (prevError) => prevError + " " + "Error: " + result_data.data.code
          );
        else setErrorTxt((prevError) => prevError + " " + "Error");
      }
    } else if (
      result_data.cmd == Dwarfii_Api.DwarfCMD.CMD_NOTIFY_WS_HOST_SLAVE_MODE
    ) {
      if (result_data.data.mode == 1) {
        console.log("WARNING SLAVE MODE");
        connectionCtx.setConnectionStatusSlave(true);
        setSlavemode(true);
      } else {
        console.log("OK : HOST MODE");
        connectionCtx.setConnectionStatusSlave(false);
        setSlavemode(false);
      }
    } else if (
      result_data.cmd ==
        Dwarfii_Api.DwarfCMD.CMD_NOTIFY_STATE_CAPTURE_RAW_LIVE_STACKING ||
      result_data.cmd ==
        Dwarfii_Api.DwarfCMD.CMD_NOTIFY_STATE_CAPTURE_RAW_WIDE_LIVE_STACKING
    ) {
      // update astroCamera
      updateAstroCamera(connectionCtx, result_data.cmd);
      if (
        result_data.data.state ==
        Dwarfii_Api.OperationState.OPERATION_STATE_STOPPED
      ) {
        isStopRecording = true;
        logger("Need Go LIVE", {}, connectionCtx);
        connectionCtx.setImagingSession((prev) => {
          prev["isRecording"] = false;
          return { ...prev };
        });
        connectionCtx.setImagingSession((prev) => {
          prev["endRecording"] = true;
          return { ...prev };
        });
        connectionCtx.setImagingSession((prev) => {
          prev["isGoLive"] = true;
          return { ...prev };
        });
        saveImagingSessionDb("isRecording", false.toString());
        saveImagingSessionDb("endRecording", true.toString());
        saveImagingSessionDb("isGoLive", true.toString());
        setGoLive(true);
      } else if (
        result_data.data.state ==
        Dwarfii_Api.OperationState.OPERATION_STATE_STOPPING
      ) {
        isStopRecording = true;
        connectionCtx.setImagingSession((prev) => {
          prev["isRecording"] = false;
          return { ...prev };
        });
        connectionCtx.setImagingSession((prev) => {
          prev["endRecording"] = true;
          return { ...prev };
        });
        saveImagingSessionDb("isRecording", false.toString());
        saveImagingSessionDb("endRecording", true.toString());
      } else if (
        result_data.data.state ==
        Dwarfii_Api.OperationState.OPERATION_STATE_RUNNING
      ) {
        isStopRecording = false;
        connectionCtx.setImagingSession((prev) => {
          prev["isRecording"] = true;
          return { ...prev };
        });
        connectionCtx.setImagingSession((prev) => {
          prev["endRecording"] = false;
          return { ...prev };
        });
        saveImagingSessionDb("isRecording", true.toString());
        saveImagingSessionDb("endRecording", false.toString());
      }
    } else if (
      result_data.cmd ==
        Dwarfii_Api.DwarfCMD.CMD_NOTIFY_PROGRASS_CAPTURE_RAW_LIVE_STACKING ||
      result_data.cmd ==
        Dwarfii_Api.DwarfCMD.CMD_NOTIFY_PROGRASS_CAPTURE_RAW_WIDE_LIVE_STACKING
    ) {
      // update astroCamera
      updateAstroCamera(connectionCtx, result_data.cmd);
      if (
        result_data.data.updateCountType == 0 ||
        result_data.data.updateCountType == 2
      ) {
        if (isStopRecording == false) {
          connectionCtx.setImagingSession((prev) => {
            prev["isRecording"] = true;
            return { ...prev };
          });
          connectionCtx.setImagingSession((prev) => {
            prev["endRecording"] = false;
            return { ...prev };
          });
          saveImagingSessionDb("isRecording", true.toString());
          saveImagingSessionDb("endRecording", false.toString());
        }
        connectionCtx.setImagingSession((prev) => {
          prev["imagesTaken"] = result_data.data.currentCount;
          return { ...prev };
        });
        saveImagingSessionDb(
          "imagesTaken",
          result_data.data.currentCount.toString()
        );
      }
      if (
        result_data.data.updateCountType == 1 ||
        result_data.data.updateCountType == 2
      ) {
        if (isStopRecording == false) {
          if (connectionCtx.imagingSession.endRecording) {
            connectionCtx.setImagingSession((prev) => {
              prev["isRecording"] = false;
              return { ...prev };
            });
          }
        }
        saveImagingSessionDb("isRecording", false.toString());
        if (connectionCtx.imagingSession.isStackedCountStart) {
          connectionCtx.setImagingSession((prev) => {
            prev["isStackedCountStart"] = true;
            return { ...prev };
          });
        }
        saveImagingSessionDb("isStackedCountStart", true.toString());
        connectionCtx.setImagingSession((prev) => {
          prev["imagesStacked"] = result_data.data.stackedCount;
          return { ...prev };
        });
        saveImagingSessionDb(
          "imagesStacked",
          result_data.data.stackedCount.toString()
        );
      }
    } else if (result_data.cmd == Dwarfii_Api.DwarfCMD.CMD_NOTIFY_ELE) {
      if (result_data.data.code == Dwarfii_Api.DwarfErrorCode.OK) {
        connectionCtx.setBatteryLevelDwarf(result_data.data.value);
      }
    } else if (result_data.cmd == Dwarfii_Api.DwarfCMD.CMD_NOTIFY_CHARGE) {
      if (result_data.data.code == Dwarfii_Api.DwarfErrorCode.OK) {
        connectionCtx.setBatteryStatusDwarf(result_data.data.value);
      }
    } else if (result_data.cmd == Dwarfii_Api.DwarfCMD.CMD_NOTIFY_RGB_STATE) {
      connectionCtx.setStatusRingLightsDwarf(result_data.data.state == 1);
    } else if (
      result_data.cmd == Dwarfii_Api.DwarfCMD.CMD_NOTIFY_POWER_IND_STATE
    ) {
      connectionCtx.setStatusPowerLightsDwarf(result_data.data.state == 1);
    } else if (result_data.cmd == Dwarfii_Api.DwarfCMD.CMD_NOTIFY_POWER_OFF) {
      setErrorTxt(` The ${connectionCtx.typeNameDwarf} is powering Off!`);
      console.error(`The ${connectionCtx.typeNameDwarf} is powering Off!`);
      setConnecting(false);
      connectionCtx.setConnectionStatus(false);
      saveConnectionStatusDB(false);
      // force stop webSocketHandler
      webSocketHandler.cleanup(true);
    } else {
      logger("", result_data, connectionCtx);
    }
    logger(txt_info, result_data, connectionCtx);
  };

  const customErrorHandler = () => {
    console.error("ConnectDwarf : Socket Close!");
    setConnecting(false);
    connectionCtx.setConnectionStatus(false);
    saveConnectionStatusDB(false);
  };

  const customStateHandler = (state) => {
    if (state != connectionCtx.connectionStatus) {
      connectionCtx.setConnectionStatus(state);
      saveConnectionStatusDB(state);
    }
  };

  webSocketHandler.closeTimerHandler = () => {
    setConnecting(false);
  };
  webSocketHandler.onStopTimerHandler = () => {
    setConnecting(false);
    saveConnectionStatusDB(false);
  };

  // close socket is request takes too long
  webSocketHandler.closeSocketTimer = setTimeout(() => {
    webSocketHandler.handleClose("");
    console.log(" -> Close Timer2.....");
    setConnecting(false);
    connectionCtx.setConnectionStatus(false);
    saveConnectionStatusDB(false);
  }, 5000);

  // function for connection and reconnection
  const customReconnectHandler = () => {
    startConnect();
  };

  function startConnect() {
    console.log("ConnectDwarf startConnect Function started");

    setSlavemode(false);
    setGoLive(false);
    connectionCtx.setConnectionStatusSlave(false);
    setConnecting(true);

    // Send Commands : cmdCameraTeleGetSystemWorkingState
    let WS_Packet = messageCameraTeleGetSystemWorkingState();
    let WS_Packet1 = messageCameraTeleOpenCamera();
    let WS_Packet2 = messageCameraWideOpenCamera();
    let txtInfoCommand = "Connection";

    webSocketHandler.prepare(
      [WS_Packet, WS_Packet1, WS_Packet2],
      txtInfoCommand,
      [
        "*", // Get All Data
        Dwarfii_Api.DwarfCMD.CMD_NOTIFY_SDCARD_INFO,
        Dwarfii_Api.DwarfCMD.CMD_NOTIFY_ELE,
        Dwarfii_Api.DwarfCMD.CMD_NOTIFY_CHARGE,
        Dwarfii_Api.DwarfCMD.CMD_CAMERA_TELE_GET_SYSTEM_WORKING_STATE,
        Dwarfii_Api.DwarfCMD.CMD_NOTIFY_WS_HOST_SLAVE_MODE,
        Dwarfii_Api.DwarfCMD.CMD_CAMERA_TELE_OPEN_CAMERA,
        Dwarfii_Api.DwarfCMD.CMD_CAMERA_WIDE_OPEN_CAMERA,
        Dwarfii_Api.DwarfCMD.CMD_NOTIFY_STATE_CAPTURE_RAW_LIVE_STACKING,
        Dwarfii_Api.DwarfCMD.CMD_NOTIFY_PROGRASS_CAPTURE_RAW_LIVE_STACKING,
        Dwarfii_Api.DwarfCMD.CMD_NOTIFY_STATE_CAPTURE_RAW_WIDE_LIVE_STACKING,
        Dwarfii_Api.DwarfCMD.CMD_NOTIFY_PROGRASS_CAPTURE_RAW_WIDE_LIVE_STACKING,
      ],
      customMessageHandler,
      customStateHandler,
      customErrorHandler,
      customReconnectHandler
    );
  }

  // Start Connection
  startConnect();

  if (!webSocketHandler.run()) {
    console.error(" Can't launch Web Socket Run Action!");
  }
}
