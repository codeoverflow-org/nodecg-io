import * as http from "http";
import { Server as HttpServer } from "http";
import { spawn } from "child_process";
import { onExit, readableToString } from "@rauschma/stringio";
import { AddressInfo } from "net";
import { buffer as readableToBuffer } from "get-stream";

/**
 * Represents an android device that is connected via ADB.
 */
export class Android {
    private readonly device: string;

    private server: HttpServer;
    private hostPort: number;
    private devicePort: number;

    private connected: boolean;
    private nextId = 0;
    private pending: Map<
        number,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [(data: any) => void, (err: any) => void, ((evt: any) => void) | undefined]
    > = new Map();

    public readonly packageManager: PackageManager;

    constructor(device: string) {
        this.device = device;
        this.connected = false;

        this.packageManager = new PackageManager(this);
    }

    /**
     * Connects to the device. This is called by nodecg-io-android and should not be called by a bundle.
     */
    async connect(): Promise<void> {
        if (this.connected) {
            throw "Already connected";
        }

        const packages = await this.rawAdb(["shell", "pm", "list", "packages"]);
        if (!packages.includes("io.github.noeppi_noeppi.nodecg_io_android")) {
            throw "The nodecg-io-android app is not installed on the device.";
        }

        this.server = http.createServer(async (req, res) => {
            if (req.method?.toUpperCase() == "POST" && "nodecg-io-message-id" in req.headers) {
                const idStr = req.headers["nodecg-io-message-id"];
                if (idStr !== undefined && (typeof idStr === "string" || idStr instanceof String)) {
                    const id = parseInt(idStr as string);
                    const promise = this.pending.get(id);
                    if (promise !== undefined) {
                        const resolve = promise[0];
                        const reject = promise[1];
                        const event = promise[2];
                        try {
                            const data = JSON.parse(await readableToString(req, "utf-8"));
                            console.log(data);
                            if (data.event) {
                                if (event !== undefined) {
                                    event(data);
                                }
                            } else {
                                resolve(data);
                            }
                        } catch (err) {
                            reject(err);
                        }
                    }
                }
            }
            res.writeHead(204);
            res.end();
        });
        this.server.listen(0);
        this.hostPort = (this.server.address() as AddressInfo).port;
        const devicePortStr = (await this.rawAdb(["reverse", "tcp:0", `tcp:${this.hostPort}`])).trim();
        this.devicePort = parseInt(devicePortStr);
        this.connected = true;
    }

    /**
     * Disconnects from the device. This is called by nodecg-io-android and should not be called by a bundle.
     */
    async disconnect(): Promise<void> {
        if (this.connected) {
            await this.rawRequest("cancel_all_subscriptions", {});
            this.connected = false;
            await this.rawAdb(["reverse", "--remove", `tcp:${this.devicePort}`]);
            this.server.close();
        }
    }

    /**
     * Pings the device. This will throw an error if the connection is lost.
     */
    async ping(): Promise<void> {
        await this.rawRequest("ping", {});
    }

    /**
     * Requests some special permissions. This should be called once on bundle
     * startup as it requires starting the activity.
     */
    async requestPermissions(...permissions: Permission[]): Promise<void> {
        const result = await this.rawRequest("request_permissions", {
            permissions: permissions,
        });
        if (!result.success) {
            throw result.errmsg;
        }
    }

    /**
     * Captures a screenshot and returns it as a buffer.
     */
    async screenshot(): Promise<Buffer> {
        return await this.rawAdbBinary(["shell", "screencap", "-p"]);
    }

    /**
     * Activates the display.
     */
    async wakeUp(): Promise<void> {
        await this.rawRequest("wake_up", {});
    }

    /**
     * Shows a toast (little notification that pops up at the bottom of the screen for a short while)
     */
    async toast(text: string): Promise<void> {
        await this.rawRequest("show_toast", {
            text: text,
        });
    }

    /**
     * Gets a volume stream for a given channel.
     */
    volume(channel: VolumeChannel): VolumeStream {
        return new VolumeStream(this, channel);
    }

    /**
     * Gets a sensor if it's present or undefined if it's not. If the required
     * permissions are not granted, the promise is rejected.
     */
    async getSensor(id: "gps"): Promise<GpsSensor | null>;
    async getSensor(id: "motion"): Promise<MotionSensor | null>;
    async getSensor(id: SensorId): Promise<unknown | null> {
        const result = await this.rawRequest("check_availability", {
            type: "sensor",
            value: id,
        });
        if (!result.available) {
            return undefined;
        }
        switch (id) {
            case "gps":
                return new GpsSensor(this);
            case "motion":
                return new MotionSensor(this);
        }
    }

    /**
     * Sends a notification to the status bar of the device.
     * @param title The title of the notification
     * @param text The text to display
     * @param properties Additional properties for the notification
     * @param callback Optionally a callback function that is called when the user taps on the notification
     */
    async notify(
        title: string,
        text: string,
        properties: NotificationProperties,
        callback?: () => void,
    ): Promise<void> {
        await this.rawRequest(
            "notify",
            {
                title: title,
                text: text,
                properties: properties,
            },
            callback,
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async rawRequest(action: string, data: Record<string, unknown>, callback?: (evt: unknown) => void): Promise<any> {
        const id = this.nextId++;

        const requestData = JSON.stringify(data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: Promise<any> = new Promise((resolve, reject) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let eventFunc: ((evt: any) => void) | undefined;
            if (callback === undefined) {
                eventFunc = undefined;
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                eventFunc = (evt: any) => {
                    callback(evt.data);
                };
            }
            this.pending.set(id, [resolve, reject, eventFunc]);
            this.rawAdb([
                "shell",
                "am",
                "broadcast",
                "-a",
                "nodecg-io.actions.ACT",
                "-c",
                "android.intent.category.DEFAULT",
                "-n",
                "io.github.noeppi_noeppi.nodecg_io_android/io.github.noeppi_noeppi.nodecg_io_android.Receiver",
                "-e",
                "action",
                quote(action),
                "-e",
                "data",
                quote(requestData),
                "-e",
                "id",
                `${id}`,
                "-e",
                "port",
                `${this.devicePort}`,
            ]).then();
        });
        const json = await result;
        if (json.success) {
            return json.data;
        } else if ("data" in json && "error_msg" in json.data) {
            throw new Error(json.data.error_msg);
        } else {
            throw new Error("unknown");
        }
    }

    async rawAdb(command: string[]): Promise<string> {
        const childProcess = spawn("adb", ["-s", this.device].concat(command), {
            stdio: ["ignore", "pipe", process.stderr],
            env: process.env,
        });
        const output = await readableToString(childProcess.stdout, "utf-8");
        await onExit(childProcess);
        return output;
    }

    async rawAdbBinary(command: string[]): Promise<Buffer> {
        const childProcess = spawn("adb", ["-s", this.device].concat(command), {
            stdio: ["ignore", "pipe", process.stderr],
            env: process.env,
        });
        const output = await readableToBuffer(childProcess.stdout);
        await onExit(childProcess);
        return output;
    }

    async rawAdbExitCode(command: string[]): Promise<number> {
        const childProcess = spawn("adb", ["-s", this.device].concat(command), {
            stdio: ["ignore", "pipe", process.stderr],
            env: process.env,
        });
        await onExit(childProcess);
        if (childProcess.exitCode === null) {
            return 0;
        } else {
            return childProcess.exitCode;
        }
    }
}

/**
 * A special permission that has to be requested via requestPermissions() before using any
 * function that requires it.
 */
export type Permission = "gps";

/**
 * An id of a sensor that might be present on a device
 */
export type SensorId = "gps" | "motion";

/**
 * Used to control a volume channel on the device.
 */
export class VolumeStream {
    private readonly android: Android;
    public readonly channel: VolumeChannel;

    constructor(android: Android, channel: VolumeChannel) {
        this.android = android;
        this.channel = channel;
    }

    /**
     * Gets the volume of the channel in range from 0 to getMaxVolume()
     */
    async getVolume(): Promise<number> {
        const result = await this.android.rawRequest("get_volume", {
            channel: this.channel,
        });
        return result.volume;
    }

    /**
     * Gets the maximum volume of this channel
     */
    async getMaxVolume(): Promise<number> {
        const result = await this.android.rawRequest("get_max_volume", {
            channel: this.channel,
        });
        return result.volume;
    }

    /**
     * Sets the volume for this channel
     * @param volume The new volume
     * @param flags The flags to use when setting the volume
     */
    async setVolume(volume: number, flags: VolumeFlag[]): Promise<void> {
        await this.android.rawRequest("set_volume", {
            channel: this.channel,
            volume: volume,
            flags: flags,
        });
    }

    /**
     * Changes the volume. Can also be used to mute and unmute the channel.
     * @param adjustment The operation to perform
     * @param flags The flags to use when setting the volume
     */
    async adjustVolume(adjustment: VolumeAdjustment, flags: AdjustmentVolumeFlag[]): Promise<void> {
        await this.android.rawRequest("adjust_volume", {
            channel: this.channel,
            adjustment: adjustment,
            flags: flags,
        });
    }
}

/**
 * A volume channel that can be used to get a VolumeStream
 */
export type VolumeChannel =
    | "ring"
    | "accessibility"
    | "alarm"
    | "dtmf"
    | "music"
    | "notification"
    | "system"
    | "voice_call";

/**
 * An operation for adjustVolume().
 *
 * `same`: Does nothing to the volume. Can be used to show the volume UI when used with the `show_ui` flag.
 * `raise`: Raises the volume like when the volume up button was pressed
 * `lower`: Lowers the volume like when the volume down button was pressed
 * `mute`: Mutes the channel
 * `unmute`: Unmutes the channel
 * `toggle_mute`: Toggles the mute state of the channel
 */
export type VolumeAdjustment = "same" | "raise" | "lower" | "mute" | "unmute" | "toggle_mute";

/**
 * Flags to use when setting a volume
 *
 * `show_ui`: Make the volume UI show up
 * `play_sound`: Play a note after changing the volume
 * `silent`: Supresses any vibration and sound
 * `vibrate`: Causes a vibration when activating vibrate ringer mode
 */
export type VolumeFlag = "show_ui" | "play_sound" | "silent" | "vibrate";

/**
 * Flags to use when adjusting a volume
 *
 * See VolumeFlag.
 * `ringer_modes`: When the volume is at 0 and is lowered, with this flag set, vibrate and then mute is activated.
 */
export type AdjustmentVolumeFlag = VolumeFlag | "ringer_modes";

/**
 * Additional properties for a notification on the device
 */
export interface NotificationProperties {
    /**
     * How important the notification is. Like when playing a game not every notification shows up.
     */
    importance?: "default" | "min" | "low" | "high" | "max";
    /**
     * The mode of the notification.
     *
     * `public`: The notification can be fully seen on the lockscreen
     * `private`: The notification can be seen but is collapsed on the lockscreen (Default)
     * `secret`: The notification is hidden on the lockscreen
     */
    mode?: "public" | "private" | "secret";

    /**
     * Whether this notification should ignore 'Do not Disturb'
     */
    bypass_dnd?: boolean;

    /**
     * An icon for the notification encoded with base64. Default is the code overflow logo
     */
    icon?: string;

    /**
     * Whether this notification should be dismissed when the user presses it. (Default: true)
     */
    auto_hide?: boolean;
}

/**
 * The package manager is used to query information about installed packages
 */
export class PackageManager {
    private readonly android: Android;

    constructor(android: Android) {
        this.android = android;
    }

    /**
     * Gets all package identifiers installed.
     */
    async getInstalledPackages(): Promise<string[]> {
        const result = await this.android.rawRequest("get_packages", {});
        return result.packages;
    }

    /**
     * Gets a package by identifier. If the package is not installed, the promise is rejected.
     */
    async getPackage(id: string): Promise<Package> {
        await this.android.rawRequest("get_package", {
            package: id,
        });
        return new Package(this.android, id);
    }
}

/**
 * An installed package.
 */
export class Package {
    private readonly android: Android;
    public readonly id: string;

    constructor(android: Android, id: string) {
        this.android = android;
        this.id = id;
    }

    /**
     * Gets all activities defined by this package.
     */
    async getActivities(): Promise<Activity[]> {
        const result = await this.android.rawRequest("get_activities", {
            package: this.id,
        });
        const activities: Activity[] = [];
        (result.activities as string[]).forEach((a) => activities.push(new Activity(this.android, this, a)));
        return activities;
    }

    /**
     * Gets one activity by id.
     */
    async getActivity(activity: string): Promise<Activity> {
        await this.android.rawRequest("get_activity", {
            package: this.id,
            activity: activity,
        });
        return new Activity(this.android, this, activity);
    }

    /**
     * Gets the installed version of this package.
     */
    async getVersion(): Promise<string> {
        const result = await this.android.rawRequest("get_package_version", {
            package: this.id,
        });
        return result.version;
    }
}

/**
 * An activity. (The thing of a package that is launched when pressing an icon on the home screen.)
 */
export class Activity {
    private readonly android: Android;
    private readonly pkg: Package;
    public readonly id: string;

    constructor(android: Android, pkg: Package, id: string) {
        this.android = android;
        this.pkg = pkg;
        this.id = id;
    }

    /**
     * Starts the activity.
     */
    async start(): Promise<void> {
        await this.android.rawRequest("start_activity", {
            package: this.pkg.id,
            activity: this.id,
        });
    }
}

export class GpsSensor {
    private readonly android: Android;

    constructor(android: Android) {
        this.android = android;
    }

    /**
     * Checks whether GPS is activated.
     */
    async isActive(): Promise<boolean> {
        const result = await this.android.rawRequest("gps_active", {});
        return result.active;
    }

    /**
     * Gets the last known position or undefined if there's no last known position. The promise id rejected if
     * GPS is turned off. Use isActive() to check before.
     */
    async getLastKnownLocation(): Promise<LocationInfo | undefined> {
        const result = await this.android.rawRequest("gps_last_known_location", {});
        return result.location;
    }

    /**
     * Subscribes for location updates. If GPS is turned off, you will get no updates. Always cancel the
     * returned subscription if you don't need more updates.
     *
     * @param listener The function to be called when the location updates.
     * @param time The minimum time (in milliseconds) between two location updates sent. Set this as high as possible.
     * @param distance The minimum distance (in meters) between two location updates
     */
    async subscribeLocations(listener: (l: Location) => void, time = 5000, distance = 0): Promise<Subscription> {
        const result = await this.android.rawRequest(
            "gps_subscribe",
            {
                time: time,
                distance: distance,
            },
            listener,
        );
        return Subscription.fromResult(this.android, result);
    }
}

export type LocationInfo = {
    /**
     * The latitude in degrees
     */
    latitude: number;

    /**
     * The longitude in degrees
     */
    longitude: number;

    /**
     * The altitude in meters above the WGS 84 reference ellipsoid
     */
    altitude: number | undefined;

    /**
     * The speed in meters per second
     */
    speed: number | undefined;

    /**
     * The bearing in degrees
     * Bearing is the horizontal direction of travel of this device, and is not related to the
     * device orientation.
     */
    bearing: number | undefined;

    /**
     * The accuracy for latitude and longitude in meters
     */
    accuracyHorizontal: number | undefined;

    /**
     * The accuracy of the altitude in meters
     */
    accuracyVertical: number | undefined;

    /**
     * The speed accuracy in meters per second
     */
    accuracySpeed: number | undefined;

    /**
     * The bearing accuracy in degrees
     */
    accuracyBearing: number | undefined;
};

export class Subscription {
    private readonly android: Android;
    private readonly id: string;

    constructor(android: Android, id: string) {
        this.android = android;
        this.id = id;
    }

    async cancel(): Promise<void> {
        this.android.rawRequest("cancel_subscription", {
            subscription_id: this.id,
        });
    }

    static fromResult(android: Android, result: { subscription_id: string }): Subscription {
        return new Subscription(android, result.subscription_id);
    }
}

export class MotionSensor {
    private readonly android: Android;

    constructor(android: Android) {
        this.android = android;
    }

    /**
     * Gets the current motion of the device.
     */
    async motion(): Promise<Motion> {
        const result = await this.android.rawRequest("motion_current", {});
        return result.motion;
    }

    async subscribeMotion(
        part: "accelerometer",
        listener: (m: AccelerometerResult) => void,
        time: number,
    ): Promise<Subscription>;
    async subscribeMotion(
        part: "accelerometer_uncalibrated",
        listener: (m: AccelerometerUncalibratedResult) => void,
        time: number,
    ): Promise<Subscription>;
    async subscribeMotion(part: "gravity", listener: (m: GravityResult) => void, time: number): Promise<Subscription>;
    async subscribeMotion(
        part: "gyroscope",
        listener: (m: GyroscopeResult) => void,
        time: number,
    ): Promise<Subscription>;
    async subscribeMotion(
        part: "gyroscope_uncalibrated",
        listener: (m: GyroscopeUncalibratedResult) => void,
        time: number,
    ): Promise<Subscription>;
    async subscribeMotion(
        part: "linear_acceleration",
        listener: (m: LinearAccelerationResult) => void,
        time: number,
    ): Promise<Subscription>;
    async subscribeMotion(
        part: "rotation_vector",
        listener: (m: RotationVectorResult) => void,
        time: number,
    ): Promise<Subscription>;
    async subscribeMotion(part: MotionSensorPart, listener: (m: never) => void, time = 100): Promise<Subscription> {
        const result = await this.android.rawRequest(
            "motion_subscribe",
            {
                part: part,
                time: time,
            },
            listener,
        );
        return Subscription.fromResult(this.android, result);
    }
}

export type MotionSensorPart =
    | "accelerometer"
    | "accelerometer_uncalibrated"
    | "gravity"
    | "gyroscope"
    | "gyroscope_uncalibrated"
    | "linear_acceleration"
    | "rotation_vector";

export type AccelerometerResult = {
    /**
     * Acceleration force along the x axis (including gravity) in meters per second squared
     */
    x: number;
    /**
     * Acceleration force along the y axis (including gravity) in meters per second squared
     */
    y: number;
    /**
     * Acceleration force along the z axis (including gravity) in meters per second squared
     */
    z: number;
};

export type AccelerometerUncalibratedResult = {
    /**
     * Measured Acceleration force along the x axis (without bias compensation) in meters per second squared
     */
    rawX: number;
    /**
     * Measured Acceleration force along the y axis (without bias compensation) in meters per second squared
     */
    rawY: number;
    /**
     * Measured Acceleration force along the z axis (without bias compensation) in meters per second squared
     */
    rawZ: number;
    /**
     * Measured Acceleration force along the x axis (with bias compensation) in meters per second squared
     */
    bcX: number;
    /**
     * Measured Acceleration force along the y axis (with bias compensation) in meters per second squared
     */
    bcY: number;
    /**
     * Measured Acceleration force along the z axis (with bias compensation) in meters per second squared
     */
    bcZ: number;
};

export type GravityResult = {
    /**
     * Force of gravity along the x axis in meters per second squared
     */
    gravityX: number;
    /**
     * Force of gravity along the y axis in meters per second squared
     */
    gravityY: number;
    /**
     * Force of gravity along the z axis in meters per second squared
     */
    gravityZ: number;
};

export type GyroscopeResult = {
    /**
     * Rotation around the x axis in radians / second
     */
    rotX: number;
    /**
     * Rotation around the y axis in radians / second
     */
    rotY: number;
    /**
     * Rotation around the z axis in radians / second
     */
    rotZ: number;
};

export type GyroscopeUncalibratedResult = {
    /**
     * Rotation around the x axis (without drift compensation) in radians / second
     */
    rawRotX: number;
    /**
     * Rotation around the y axis (without drift compensation) in radians / second
     */
    rawRotY: number;
    /**
     * Rotation around the z axis (without drift compensation) in radians / second
     */
    rawRotZ: number;
    /**
     * Estimated drift around the x axis in radians / second
     */
    driftX: number;
    /**
     * Estimated drift around the y axis in radians / second
     */
    driftY: number;
    /**
     * Estimated drift around the z axis in radians / second
     */
    driftZ: number;
};

export type LinearAccelerationResult = {
    /**
     * Acceleration force along the x axis (without gravity) in meters per second squared
     */
    ngX: number;
    /**
     * Acceleration force along the y axis (without gravity) in meters per second squared
     */
    ngY: number;
    /**
     * Acceleration force along the z axis (without gravity) in meters per second squared
     */
    ngZ: number;
};

export type RotationVectorResult = {
    /**
     * Rotation vector component along the x axis (x * sin(θ/2)).
     */
    rotVecX: number;
    /**
     * Rotation vector component along the y axis (y * sin(θ/2)).
     */
    rotVecY: number;
    /**
     * Rotation vector component along the z axis (z * sin(θ/2)).
     */
    rotVecZ: number;
    /*
     * Scalar component of the rotation vector ((cos(θ/2)).
     */
    rotScalar: number | undefined;
};

export type Motion = AccelerometerResult &
    AccelerometerUncalibratedResult &
    GravityResult &
    GyroscopeResult &
    GyroscopeUncalibratedResult &
    LinearAccelerationResult &
    RotationVectorResult;

function quote(arg: string): string {
    return '"' + arg.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\$/g, "\\$") + '"';
}
