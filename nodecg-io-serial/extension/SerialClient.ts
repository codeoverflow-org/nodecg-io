import { success, error, Result, emptySuccess } from "nodecg-io-core";
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

export class SerialServiceClient extends SerialPort {
    private parser: SerialPort.parsers.Readline;
    constructor(
        path: string,
        protocol: Protocol,
        options?: SerialPort.OpenOptions,
        callback?: SerialPort.ErrorCallback,
    ) {
        super(path, options, callback);
        this.parser = this.pipe(new SerialPort.parsers.Readline(protocol));
    }

    static async createClient(config: SerialServiceConfig): Promise<Result<SerialServiceClient>> {
        const port = await SerialServiceClient.inferPort(config.device);
        if (!port.failed) {
            return await new Promise<Result<SerialServiceClient>>((resolve) => {
                const serialPort = new SerialServiceClient(port.result, config.protocol, config.connection, (e) => {
                    if (e) resolve(error(e.message));
                    else resolve(success(serialPort));
                });
            });
        } else {
            return error(port.errorMessage);
        }
    }

    static async inferPort(deviceInfo: DeviceInfo): Promise<Result<string>> {
        const result = [];
        const devices = await SerialPort.list();
        if (deviceInfo.port) {
            result.push(deviceInfo.port);
        } else {
            devices.forEach((element) => {
                if (deviceInfo.pnpId && element.pnpId && element.pnpId === deviceInfo.pnpId) {
                    result.push(element.path);
                } else if (
                    deviceInfo.manucaturer &&
                    deviceInfo.serialNumber &&
                    element.manufacturer === deviceInfo.manucaturer &&
                    element.serialNumber === deviceInfo.serialNumber
                ) {
                    result.push(element.path);
                }
            });
        }

        // Check if result isn't empty or ambiguous
        if (result[0] === undefined) {
            return error("No device matched the provided criteria!");
        } else if (result.length > 1) {
            return error("The provided criteria were ambiguous!");
        } else {
            return success(result[0]);
        }
    }

    async send(payload: string): Promise<Result<void>> {
        const err: Error | undefined | null = await new Promise((resolve) => {
            this.write(payload, (err) => {
                resolve(err);
            });
        });

        if (err) {
            return error(err.message);
        } else {
            return emptySuccess();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onData(callback: (data: any) => void): void {
        this.parser.on("data", callback);
    }

    removeAllParserListeners(): void {
        this.parser.removeAllListeners();
    }
}
