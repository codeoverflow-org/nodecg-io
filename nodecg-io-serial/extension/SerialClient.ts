import { ServiceClient } from "nodecg-io-core/extension/types";
import { success, error, Result, emptySuccess, Success } from "nodecg-io-core/extension/utils/result";
import * as SerialPort from "serialport"; // This is neccesary, because serialport only likes require!

export interface DeviceInfo {
    port: string;
    manucaturer: string;
    serialNumber: string;
    pnpId: string;
}

interface Protocol {
    delimiter: "\n\r" | "\n";
    encoding: "ascii" | "utf8" | "utf16le" | "ucs2" | "base64" | "binary" | "hex" | undefined;
}

export interface SerialServiceConfig {
    device: DeviceInfo;
    connection: SerialPort.OpenOptions;
    protocol: Protocol;
}

export class SerialServiceClient implements ServiceClient<SerialPort> {
    private serialPort: SerialPort;
    private parser: SerialPort.parsers.Readline;
    constructor(private readonly settings: SerialServiceConfig) {}

    async init(): Promise<Success<void> | Error> {
        const port = await SerialServiceClient.inferPort(this.settings.device);
        if (!port.failed) {
            this.serialPort = new SerialPort(port.result, this.settings.connection);
            this.parser = this.serialPort.pipe(new SerialPort.parsers.Readline(this.settings.protocol));
            return emptySuccess();
        } else {
            return Error(port.errorMessage);
        }
    }

    getNativeClient(): SerialPort {
        return this.serialPort;
    }

    static async inferPort(deviceInfo: DeviceInfo): Promise<Result<string>> {
        const result = [];
        const devices = await SerialPort.list();
        if (deviceInfo.port) {
            result.push(deviceInfo.port);
        } else {
            devices.forEach((element) => {
                if (deviceInfo.pnpId && "pnpId" in element && element.pnpId === deviceInfo.pnpId) {
                    result.push(element["path"]);
                } else if (
                    deviceInfo.manucaturer &&
                    deviceInfo.serialNumber &&
                    element.manufacturer === deviceInfo.manucaturer &&
                    element.serialNumber === deviceInfo.serialNumber
                ) {
                    result.push(element["path"]);
                }
            });
        }

        // Check if result isn't empty or ambiguous
        if (result.length < 1) {
            return error("No device matched the provided criteria.");
        } else if (result.length > 1) {
            return error("The provided criteria were ambiguous.");
        } else {
            return success(result[0]);
        }
    }

    close(): void {
        this.serialPort.close();
    }

    async send(payload: string): Promise<Result<string>> {
        const err: Error | undefined | null = await new Promise((resolve) => {
            this.serialPort.write(payload, (err) => {
                resolve(err);
            });
        });

        if (err) {
            return error(err.message);
        } else {
            return success("OK");
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onData(callback: (data: any) => void): void {
        this.parser.on("data", callback);
    }
}
