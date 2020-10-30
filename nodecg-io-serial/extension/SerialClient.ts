import { ServiceClient } from "nodecg-io-core/extension/types";
import { success, error, Result } from "nodecg-io-core/extension/utils/result";
import SerialPort = require("serialport"); // This is neccesary, because serialport only likes require!

export interface DeviceInfo {
    port: string;
    manucaturer: string;
    serialNumber: string;
    pnpId: string;
}

interface Protocol {
    delimiter: string;
    encoding: "ascii" | "utf8" | "utf16le" | "ucs2" | "base64" | "binary" | "hex";
}

export interface SerialServiceConfig {
    device: DeviceInfo;
    connection: SerialPort.OpenOptions;
    protocol: Protocol;
}

export class SerialServiceClient implements ServiceClient<SerialPort> {
    private serialPort: SerialPort;
    private parser: SerialPort.parsers.Readline;
    constructor(settings: SerialServiceConfig) {
        SerialServiceClient.inferPort(settings.device).then((port) => {
            if (!port.failed) {
                this.serialPort = new SerialPort(port.result, settings.connection);
                this.parser = this.serialPort.pipe(new SerialPort.parsers.Readline(settings.protocol));
            }
        });
    }

    getNativeClient(): SerialPort {
        return this.serialPort;
    }

    static async inferPort(deviceInfo: DeviceInfo): Promise<Result<string>> {
        const result = [];
        const devices = await SerialPort.list();
        if ("port" in deviceInfo) {
            result.push(deviceInfo.port);
        } else {
            // hope this ignore is right.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            devices.forEach((element: any) => {
                if ("pnpId" in deviceInfo && "pnpId" in element && element.pnpId === deviceInfo["pnpId"]) {
                    result.push(element["path"]);
                } else if (
                    "manufacturer" in deviceInfo &&
                    "serialNumber" in deviceInfo &&
                    element.manufacturer === deviceInfo["manufacturer"] &&
                    element.serialNumber === deviceInfo["serialNumber"]
                ) {
                    result.push(element["path"]);
                }
            });
        }

        // Check if result isn't empty or ambiguous
        if (result.length < 1) {
            return error("No device matched the provided criteria.");
        } else if (result.length > 1) {
            return error("The provided criteria were abiguous.");
        } else {
            return success(result[0]);
        }
    }

    close(): void {
        this.serialPort.close();
    }

    send(payload: string): void {
        this.serialPort.write(payload, (err) => {
            if (err) {
                throw err;
            }
        });
    }

    onData(callback: (param: string) => string): void {
        this.parser.on("data", callback);
    }
}
