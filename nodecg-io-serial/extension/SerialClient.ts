import { ServiceClient } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import { ReadLine } from "readline";
import SerialPort = require("serialport"); // This is neccesary, because serialport only likes require!
// This is neccesary because serialport does not work with import...
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Readline = require("@serialport/parser-readline");

export interface DeviceInfo {
    port: string;
    manucaturer: string;
    serialNumber: string;
    pnpId: string;
}

interface Protocoll {
    delimiter: string;
    encoding: string;
}

export interface SerialServiceConfig {
    device: DeviceInfo;
    connection: SerialPort.OpenOptions;
    protocoll: Protocoll;
}

export class SerialServiceClient implements ServiceClient<SerialPort> {
    private serialPort: SerialPort;
    private parser: ReadLine;
    constructor(settings: SerialServiceConfig) {
        let port = "";
        SerialServiceClient.inferPort(settings.device).then((value) => {
            port = value;
        });
        this.serialPort = new SerialPort(port, settings.connection);
        this.parser = this.serialPort.pipe(new Readline(settings.protocoll));
    }

    getNativeClient(): SerialPort {
        return this.serialPort;
    }

    static async inferPort(deviceInfo: DeviceInfo): Promise<string> {
        const result = [];
        const devices = await SerialPort.list();
        if ("port" in deviceInfo) {
            result.push(deviceInfo.port);
        } else {
            // hope this ignore is right.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            devices.forEach((element: any) => {
                console.log("path" in element);
                if ("pnpId" in deviceInfo && "pnpId" in element && element.pnpId === deviceInfo["pnpId"]) {
                    console.log(element);
                    result.push(element.path);
                } else if (
                    "manufacturer" in deviceInfo &&
                    "serialNumber" in deviceInfo &&
                    element.manufacturer === deviceInfo["manufacturer"] &&
                    element.serialNumber === deviceInfo["serialNumber"]
                ) {
                    console.log(element);
                    result.push(element.path);
                }
            });
        }

        // Check if result isn't empty or ambiguous
        if (result.length < 1) {
            return "";
        } else if (result.length > 1) {
            return "";
        } else {
            return result[0];
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
