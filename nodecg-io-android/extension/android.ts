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
    public readonly contactManager: ContactManager;
    public readonly wifiManager: WifiManager;

    constructor(device: string) {
        this.device = device;
        this.connected = false;

        this.packageManager = new PackageManager(this);
        this.contactManager = new ContactManager(this);
        this.wifiManager = new WifiManager(this);
    }

    /**
     * Connects to the device. This is called by nodecg-io-android and should not be called by a bundle.
     */
    async connect(): Promise<void> {
        if (this.connected) {
            throw new Error("Already connected");
        }

        const packages = await this.rawAdb(["shell", "pm", "list", "packages"]);
        if (!packages.includes("io.github.noeppi_noeppi.nodecg_io_android")) {
            throw new Error("The nodecg-io-android app is not installed on the device.");
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
            throw new Error(result.errmsg);
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
     * Gets a sensor of the given type. If the required permissions are not granted
     * or the sensor is not present, the promise is rejected.
     */
    async getSensor(id: "gps"): Promise<GpsSensor>;
    async getSensor(id: "motion"): Promise<MotionSensor>;
    async getSensor(id: "magnetic"): Promise<MagneticSensor>;
    async getSensor(id: "light"): Promise<LightSensor>;
    async getSensor(id: SensorId): Promise<unknown> {
        const result = await this.rawRequest("check_availability", {
            type: "sensor",
            value: id,
        });
        if (!result.available) {
            throw new Error(`Sensor of type ${id} is not available on the device.`);
        }
        switch (id) {
            case "gps":
                return new GpsSensor(this);
            case "motion":
                return new MotionSensor(this);
            case "magnetic":
                return new MagneticSensor(this);
            case "light":
                return new LightSensor(this);
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

    /**
     * Gets the TelephonyManager for this device. If this device is not capable of telephony features,
     * the promise is rejected.
     */
    async getTelephonyManager(): Promise<TelephonyManager> {
        const result = await this.rawRequest("check_availability", {
            type: "system",
            value: "telephony",
        });
        if (!result.available) {
            throw new Error(`The device does not implement telephony features.`);
        }
        return new TelephonyManager(this);
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
export type Permission = "gps" | "phone" | "read_sms" | "send_sms" | "contacts";

/**
 * An id of a sensor that might be present on a device
 */
export type SensorId = "gps" | "motion" | "magnetic" | "light";

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
        await this.android.rawAdb([
            "shell",
            "am",
            "start",
            "-a",
            "android.intent.action.MAIN",
            "-c",
            "android.intent.category.LAUNCHER",
            "-n",
            quote(this.pkg.id + "/" + this.id),
        ]);
    }
}

/**
 * Allows access to the GPS sensor of the device. Requires the `gps` permission.
 */
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
    altitude?: number;

    /**
     * The speed in meters per second
     */
    speed?: number;

    /**
     * The bearing in degrees
     * Bearing is the horizontal direction of travel of this device, and is not related to the
     * device orientation.
     */
    bearing?: number;

    /**
     * The accuracy for latitude and longitude in meters
     */
    accuracyHorizontal?: number;

    /**
     * The accuracy of the altitude in meters
     */
    accuracyVertical?: number;

    /**
     * The speed accuracy in meters per second
     */
    accuracySpeed?: number;

    /**
     * The bearing accuracy in degrees
     */
    accuracyBearing?: number;
};

export class Subscription {
    private readonly android: Android;
    private readonly id: string;

    constructor(android: Android, id: string) {
        this.android = android;
        this.id = id;
    }

    async cancel(): Promise<void> {
        await this.android.rawRequest("cancel_subscription", {
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

    /**
     * Subscribes for motion sensor updates.
     * @param part The physical sensor to subscribe to
     * @param listener A listener function
     * @param time The time in milliseconds between two sensor updates
     */
    async subscribeMotion(
        part: "accelerometer",
        listener: (m: AccelerometerResult) => void,
        time?: number,
    ): Promise<Subscription>;
    async subscribeMotion(
        part: "accelerometer_uncalibrated",
        listener: (m: AccelerometerUncalibratedResult) => void,
        time?: number,
    ): Promise<Subscription>;
    async subscribeMotion(part: "gravity", listener: (m: GravityResult) => void, time?: number): Promise<Subscription>;
    async subscribeMotion(
        part: "gyroscope",
        listener: (m: GyroscopeResult) => void,
        time?: number,
    ): Promise<Subscription>;
    async subscribeMotion(
        part: "gyroscope_uncalibrated",
        listener: (m: GyroscopeUncalibratedResult) => void,
        time?: number,
    ): Promise<Subscription>;
    async subscribeMotion(
        part: "linear_acceleration",
        listener: (m: LinearAccelerationResult) => void,
        time?: number,
    ): Promise<Subscription>;
    async subscribeMotion(
        part: "rotation_vector",
        listener: (m: RotationVectorResult) => void,
        time?: number,
    ): Promise<Subscription>;
    async subscribeMotion(part: MotionSensorPart, listener: (m: never) => void, time?: number): Promise<Subscription> {
        const result = await this.android.rawRequest(
            "motion_subscribe",
            {
                part: part,
                time: time === undefined ? 100 : time,
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
    rotScalar?: number;
};

export type Motion = AccelerometerResult &
    AccelerometerUncalibratedResult &
    GravityResult &
    GyroscopeResult &
    GyroscopeUncalibratedResult &
    LinearAccelerationResult &
    RotationVectorResult;

export class MagneticSensor {
    private readonly android: Android;

    constructor(android: Android) {
        this.android = android;
    }

    /**
     * Gets the magnetic field.
     */
    async magneticField(): Promise<MagneticField> {
        const result = await this.android.rawRequest("magnetic_field", {});
        return result.magnetic_field;
    }
}

export type MagneticField = {
    /**
     * The ambient magnetic field on x axis in micro-Tesla
     */
    x: number;
    /**
     * The ambient magnetic field on y axis in micro-Tesla
     */
    y: number;
    /**
     * The ambient magnetic field on z axis in micro-Tesla
     */
    z: number;
};

export class LightSensor {
    private readonly android: Android;

    constructor(android: Android) {
        this.android = android;
    }

    /**
     * Gets the ambient light in lux.
     */
    async ambientLight(): Promise<number> {
        const result = await this.android.rawRequest("ambient_light", {});
        return result.light;
    }
}

export class TelephonyManager {
    private readonly android: Android;
    readonly smsManager: SmsManager;

    constructor(android: Android) {
        this.android = android;
        this.smsManager = new SmsManager(android);
    }

    /**
     * Gets a list of all Telephonies for this device. Requires the `phone` permission
     */
    async getTelephonies(): Promise<Array<Telephony>> {
        const result = await this.android.rawRequest("get_telephonies", {});
        const ids = result.telephonies as Array<number>;
        return ids.map((id) => new Telephony(this.android, id));
    }
}

/**
 * A mobile subscription on the device. I could not find concrete information on what is considered
 * a mobile subscription but but it's probably just one per UICC.
 */
export class Telephony implements SmsResolvable {
    private readonly android: Android;
    readonly id: number;

    readonly sms_provider = "telephony";
    readonly sms_resolve_data: Record<string, unknown>;

    constructor(android: Android, id: number) {
        this.android = android;
        this.id = id;
        this.sms_resolve_data = {
            telephony: id,
        };
    }

    async properties(): Promise<TelephonyProperties> {
        const result = await this.android.rawRequest("get_telephony_properties", {
            telephony: this.id,
        });
        return result.properties;
    }
}

export type TelephonyProperties = {
    /**
     * The slot index (starting at 0) where the SIM of that telephony is located. Might be undefined
     * for eUICCs or if not known.
     */
    simSlot?: number;

    /**
     * The name of that telephony
     */
    name: string;

    /**
     * The mobile country code for the telephony
     */
    countryCode?: string;

    /**
     * The mobile network code for the telephony
     */
    networkCode?: string;

    /**
     * The ISO country code for the telephony
     */
    countryISO?: string;

    /**
     * Whether the telephony is embedded (eUICC)
     */
    embedded: boolean;

    /**
     * The telephone number for this telephony. This is not always present and is cached by default.
     * It's not guaranteed to be correct.
     */
    number?: string;

    /**
     * The manufacturer code of the telephony
     */
    manufacturerCode?: string;
};

export class SmsManager {
    private readonly android: Android;

    constructor(android: Android) {
        this.android = android;
    }

    /**
     * Gets all SMS matching the given category and filter. This requires the `read_sms` permission.
     */
    async getSMS(category: SmsCategory, filter?: SmsResolvable): Promise<Array<Sms>> {
        return await this.getMessages(category, filter, "get_sms", (data) => new Sms(this.android, data));
    }

    /**
     * Gets all MMS matching the given category and filter. This requires the `read_sms` permission.
     */
    async getMMS(category: SmsCategory, filter?: SmsResolvable): Promise<Array<Mms>> {
        return await this.getMessages(category, filter, "get_mms", (data) => new Mms(this.android, data));
    }

    /**
     * Sends an SMS. If the text is too long to fit into a simple SMS, A multipart SMS is sent. This
     * required `phone` and `send_sms` permissions.
     *
     * @param telephony The telephony object to use.
     * @param address The adress to send the SMS to.
     * @param text The text of the sms.
     * @param sent This function will get called as soon as the SMS was sent or failed to send. If
     *             it got split up into a multipart SMS you may receive this event multiple times,
     *             once for each part.
     * @param delivered This function will get called as soon as the SMS was delivered. If it got split
     *                  up into a multipart SMS you may receive this event multiple times, once for each
     *                  part.
     */
    async sendSMS(
        telephony: Telephony,
        address: SmsReceiver,
        text: string,
        sent?: (result: SmsResult) => void,
        delivered?: () => void,
    ): Promise<void> {
        let addressStr: string;
        if (address instanceof Recipient) {
            addressStr = address.address;
        } else if (address instanceof Contact) {
            const phone_numbers = await address.getData("phone");
            if (phone_numbers.length <= 0) {
                throw new Error(
                    `Can't use contact as sms receiver: No phone number available for contact ${address.displayName}`,
                );
            }
            addressStr = phone_numbers[0].number;
        } else {
            addressStr = address;
        }
        await this.android.rawRequest(
            "send_sms",
            {
                telephony: telephony.id,
                address: addressStr,
                text: text,
            },
            (data) => {
                if ((data as { type: string }).type == "sent" && sent != undefined) {
                    sent((data as { code: SmsResult }).code);
                } else if ((data as { type: string }).type == "delivered" && delivered != undefined) {
                    delivered();
                }
            },
        );
    }

    private async getMessages<T>(
        category: SmsCategory,
        filter: SmsResolvable | undefined,
        method: string,
        factory: (data: Record<string, unknown>) => T,
    ): Promise<Array<T>> {
        const provider = filter == undefined ? "everything" : filter.sms_provider;
        const filter_data = filter == undefined ? {} : filter.sms_resolve_data;
        const result = await this.android.rawRequest(method, {
            sms_category: category,
            sms_filter: provider,
            sms_resolve_data: filter_data,
        });
        const sms_array = result.sms as Array<Record<string, unknown>>;
        return sms_array.map(factory);
    }
}

export type SmsCategory = "all" | "inbox" | "outbox" | "sent" | "draft";

export interface SmsResolvable {
    readonly sms_provider: string;
    readonly sms_resolve_data: Record<string, unknown>;
}

export type MessageType = "sms" | "mms";

export abstract class AbstractMessage {
    protected readonly android: Android;
    protected readonly id: number;
    private readonly thread_id: number;
    private readonly telephony_id: number;

    // eslint-disable-next-line
    protected constructor(android: Android, msg: Record<string, any>) {
        this.android = android;
        this.id = msg.id;
        this.thread_id = msg.thread_id;
        this.telephony_id = msg.telephony_id;
        this.subject = msg.subject;
        this.text = msg.text;
        this.received = msg.received == undefined ? undefined : new Date(msg.received);
        this.sent = msg.sent == undefined ? undefined : new Date(msg.sent);
        this.read = msg.read;
        this.seen = msg.seen;
    }

    /**
     * The type of this message.
     */
    abstract readonly messageType: MessageType;

    /**
     * The subject of the message
     */
    readonly subject?: string;

    /**
     * The text body of the message
     */
    readonly text?: string;

    /**
     * Date and time when the message was received. undefined if not received yet.
     */
    readonly received?: Date;

    /**
     * Date and time when the message was received. undefined if not sent yet. (For example in drafts)
     */
    readonly sent?: Date;

    /**
     * Whether the message was read by the user. This seems to be always false for incoming messages.
     */
    readonly read: boolean;

    /**
     * Whether the message was seen by the user. This seems to be always false for incoming messages.
     */
    readonly seen: boolean;

    /**
     * Gets the thread for this message. A thread is identified by the phone numbers participating in it.
     */
    async getThread(): Promise<MessageThread | undefined> {
        const result = await this.android.rawRequest("get_thread_for_message", {
            thread_id: this.thread_id,
        });
        if (result.available) {
            return new MessageThread(this.android, result.thread);
        } else {
            return undefined;
        }
    }

    /**
     * Gets the telephony object that was used to send or receive the message. This is an optional value.
     * This requires the `phone` permission
     */
    async getTelephony(): Promise<Telephony | undefined> {
        const result = await this.android.rawRequest("get_telephony_for_message", {
            telephony_id: this.telephony_id,
        });
        if (result.available) {
            return new Telephony(this.android, this.telephony_id);
        } else {
            return undefined;
        }
    }
}

export class Sms extends AbstractMessage {
    private readonly sender_id: number;

    // eslint-disable-next-line
    constructor(android: Android, msg: Record<string, any>) {
        super(android, msg);
        this.address = msg.address;
        this.sender_id = msg.sender_id;
    }

    readonly messageType: MessageType = "sms";

    /**
     * The name of the chat (person or group) in which the message was sent. Try to not use this value
     * but get this via the MessageThread as this might be missing and is not available for Mms. On some
     * devices you'll also only get this with the `contacts` permission.
     */
    readonly address?: string;

    /**
     * Sms always has a text. It's never undefined.
     */
    readonly text: string;

    /**
     * Gets the phone number who sent this sms. This is not always available. Try to get this via the
     * MessageThread instead.
     */
    async getSender(): Promise<Recipient | undefined> {
        const result = await this.android.rawRequest("get_sms_recipient", {
            sender_id: this.sender_id,
        });
        if (result.available) {
            return new Recipient(this.android, result.recipient);
        } else {
            return undefined;
        }
    }
}

export class Mms extends AbstractMessage {
    // eslint-disable-next-line
    constructor(android: Android, msg: Record<string, any>) {
        super(android, msg);
        this.textOnly = msg.textOnly;
        this.contentType = msg.contentType;
        this.contentLocation = msg.contentLocation;
        this.expiry = msg.expiry == undefined ? undefined : new Date(msg.expiry);
    }

    readonly messageType: MessageType = "mms";

    /**
     * Whether this is a text-only mms.
     */
    readonly textOnly: boolean;

    /**
     * The content type for the message
     */
    readonly contentType: string;

    /**
     * The content location for the message
     */
    readonly contentLocation?: string;

    /**
     * The expiry for the message.
     */
    readonly expiry?: Date;
}

/**
 * A thread is identified by the phone number participating in it. A thread may
 * contain SMS and MMS messages.
 */
export class MessageThread implements SmsResolvable {
    protected readonly android: Android;
    protected readonly id: number;
    readonly sms_provider = "thread";
    readonly sms_resolve_data: Record<string, unknown>;

    // eslint-disable-next-line
    constructor(android: Android, msg: Record<string, any>) {
        this.android = android;
        this.id = msg.id;
        this.sms_resolve_data = {
            thread_id: msg.id,
        };
    }

    /**
     * How many messages exist in that thread in total.
     */
    readonly messageCount: number;

    /**
     * Whether all messages in this thread have been read.
     */
    readonly allRead: number;

    /**
     * A snippet from the last message in this thread.
     */
    readonly snippet?: string;

    /**
     * Whether this is a broadcast thread.
     */
    readonly broadcast: boolean;

    /**
     * Whether this thread is archived.
     */
    readonly archived: boolean;

    /**
     * Gets all participants of this thread.
     */
    async getRecipients(): Promise<Array<Recipient>> {
        const result = await this.android.rawRequest("get_thread_recipients", {
            id: this.id,
        });
        const recipients: Array<Record<string, unknown>> = result.recipients;
        return recipients.map((data) => new Recipient(this.android, data));
    }
}

/**
 * Represents a phone number. In some cases there's no phone number given but
 * a name. (Often when the mobile provider sends sms)
 */
export class Recipient {
    private readonly android: Android;
    private readonly _id: number;

    /**
     * The phone number or name of this Recipient.
     */
    readonly address: string;

    // eslint-disable-next-line
    constructor(android: Android, msg: Record<string, any>) {
        this.android = android;
        this._id = msg.id;
        this.address = msg.address;
    }

    /**
     * Get the contact for this recipient. Multiple recipients may map to the same
     * contact as a contact can hold multiple phone numbers. Requires the `contacts`
     * permission. If the same phone number is stored in multiple contacts, the first
     * match is returned. However this is guaranteed to always return the same contact
     * even if more than one exists unless the contact database gets changed between calls.
     */
    async toContact(): Promise<Contact | undefined> {
        return await this.android.contactManager.findContact("phone", this.address);
    }
}

export type SmsReceiver = string | Recipient | Contact;

export type SmsResultSuccess = "success";
export type SmsResultFailure =
    | "error_generic_failure"
    | "error_radio_off"
    | "error_null_pdu"
    | "error_no_service"
    | "error_limit_exceeded"
    | "error_fdn_check_failure"
    | "error_short_code_not_allowed"
    | "error_short_code_never_allowed"
    | "radio_not_available"
    | "network_reject"
    | "invalid_arguments"
    | "invalid_state"
    | "no_memory"
    | "invalid_sms_format"
    | "system_error"
    | "modem_error"
    | "network_error"
    | "encoding_error"
    | "invalid_smsc_address"
    | "operation_not_allowed"
    | "internal_error"
    | "no_resources"
    | "cancelled"
    | "request_not_supported"
    | "no_bluetooth_service"
    | "invalid_bluetooth_address"
    | "bluetooth_disconnected"
    | "unexpected_event_stop_sending"
    | "sms_blocked_during_emergency"
    | "sms_send_retry_failed"
    | "remote_exception"
    | "no_default_sms_app"
    | "ril_radio_not_available"
    | "ril_sms_send_fail_retry"
    | "ril_network_reject"
    | "ril_invalid_state"
    | "ril_invalid_arguments"
    | "ril_no_memory"
    | "ril_request_rate_limited"
    | "ril_invalid_sms_format"
    | "ril_system_err"
    | "ril_encoding_err"
    | "ril_invalid_smsc_address"
    | "ril_modem_err"
    | "ril_network_err"
    | "ril_internal_err"
    | "ril_request_not_supported"
    | "ril_invalid_modem_state"
    | "ril_network_not_ready"
    | "ril_operation_not_allowed"
    | "ril_no_resources"
    | "ril_cancelled"
    | "ril_sim_absent";
export type SmsResultUnknown = "unknown";
export type SmsResult = SmsResultSuccess | SmsResultFailure | SmsResultUnknown;

export class ContactManager {
    static readonly PHONE: ContactDataAccount = ["com.android.localphone", "PHONE"];

    private readonly android: Android;

    constructor(android: Android) {
        this.android = android;
    }

    /**
     * Looks up a contact. If the same data is stored in multiple contacts, the first
     * match is returned. However this is guaranteed to always return the same contact
     * even if more than one exists unless the contact database gets changed between calls.
     * To find out what columns are searched for which ContactDataId, see the documentation
     * there.
     * This require the `contacts` permission.
     */
    async findContact(dataId: ContactDataId, value: string): Promise<Contact | undefined> {
        const result = await this.android.rawRequest("find_contact", {
            dataId: dataId,
            value: value,
        });
        const contactId: [number, string] = result.contact_id;
        if (contactId == undefined) {
            return undefined;
        } else {
            return new Contact(this.android, contactId[0], contactId[1]);
        }
    }

    /**
     * Looks up a contact. This will return all contacts, that have the given data stored.
     * They're not guaranteed to be returned in the same order between requests. To find out
     * what columns are searched for which ContactDataId, see the documentation there.
     * This require the `contacts` permission.
     */
    async findContacts(dataId: ContactDataId, value: string): Promise<Array<Contact>> {
        const result = await this.android.rawRequest("find_contacts", {
            dataId: dataId,
            value: value,
        });
        const contactIds: Array<[number, string]> = result.contact_ids;
        return contactIds.map((elem) => new Contact(this.android, elem[0], elem[1]));
    }

    /**
     * Gets all contacts on the phone. Requires the `contacts` permission.
     */
    async getAllContacts(): Promise<Array<Contact>> {
        const result = await this.android.rawRequest("get_all_contacts", {});
        const contactIds: Array<[number, string]> = result.contact_ids;
        return contactIds.map((elem) => new Contact(this.android, elem[0], elem[1]));
    }
}

export class Contact {
    private readonly android: Android;
    private readonly id: number;
    readonly displayName: string;

    constructor(android: Android, id: number, displayName: string) {
        this.android = android;
        this.id = id;
        this.displayName = displayName;
    }

    async getStatus(): Promise<ContactStatus> {
        const result = await this.android.rawRequest("contact_status", {
            id: this.id,
        });
        return result.status;
    }

    async getName(): Promise<ContactNameInfo> {
        const result = await this.getData("name");
        if (result == undefined) {
            return {
                display_name: "",
                style: "unset",
            };
        } else {
            return result;
        }
    }

    /**
     * Gets some data associated with this contact.
     * @param dataId The type of requested data.
     * @param account The ContactDataAccount to use. See documentation of ContactDataAccount for more info.
     *                In the special case where dataId = "name", account is ignored.
     */
    async getData(dataId: "name", account?: undefined): Promise<ContactNameInfo | undefined>;
    async getData(dataId: "phone", account?: ContactDataAccount): Promise<Array<ContactDataPhone>>;
    async getData(dataId: "email", account?: ContactDataAccount): Promise<Array<ContactDataEmail>>;
    async getData(dataId: "event", account?: ContactDataAccount): Promise<Array<ContactDataEvent>>;
    async getData(dataId: "nickname", account?: ContactDataAccount): Promise<Array<ContactDataNickname>>;
    async getData(dataId: "notes", account?: ContactDataAccount): Promise<ContactNotes | undefined>;
    async getData(dataId: "address", account?: ContactDataAccount): Promise<Array<ContactDataAddress>>;
    async getData(dataId: ContactDataId, account?: ContactDataAccount): Promise<unknown> {
        const acc = account == undefined ? ContactManager.PHONE : account;
        const result = await this.android.rawRequest("get_contact_data", {
            id: this.id,
            dataId: dataId,
            contact_account: acc,
        });
        // Return type from nodecg-io-android is always either an array (named data) that is always present but may
        // be empty or a value (also named data) that may be undefined. Type depends on ContactDataId
        return result.data;
    }
}

export type ContactPresence = "offline" | "invisible" | "away" | "idle" | "do_not_disturb" | "available";

export type ContactStatus = {
    /**
     * The status message of that contact
     */
    status?: string;
    /**
     * The time when the status message was set.
     */
    statusTime?: Date;
    /**
     * The presence of the contact.
     */
    presence: ContactPresence;
};

/**
 * An account for contact data. The default ist ContactManager#PHONE. Other apps may add their own.
 * For example WhatsApp adds `['com.whatsapp', 'WhatsApp']` for WhatsApp data.
 * The first string is the account type, the second string is the account name.
 */
export type ContactDataAccount = [string, string];

/**
 * A type of data that may be stored in a contact. When used to find contacts from database, the
 * following columns are searched:
 * 'name': display_name, given_name and family_name
 * 'phone': entered_number and number
 * 'email': address and display_name
 * 'event': date
 * 'nickname': name
 * 'notes': This data set ist not searchable. Searching for 'notes' will never find a contact
 * 'address': address, street, post_box, post_code, city
 */
export type ContactDataId = "name" | "phone" | "email" | "event" | "nickname" | "notes" | "address";

/**
 * Asian is used when it can nut be determined whether `chinese`, `japanese` or `korean` is correct.
 */
export type ContactNameStyle = "unset" | "western" | "asian" | "chinese" | "japanese" | "korean";

export type ContactNameInfo = {
    /**
     * The name that should be used to display the contact.
     */
    display_name: string;
    /**
     * The given name for the contact.
     */
    given_name?: string;
    /**
     * The family name for the contact.
     */
    family_name?: string;
    /**
     * The contact's honorific prefix, e.g. "Sir"
     */
    prefix?: string;
    /**
     * The contact's middle name
     */
    middle_name?: string;
    /**
     * The contact's honorific suffix, e.g. "Jr"
     */
    suffix?: string;
    /**
     * The style used for combining given/middle/family name into a full name.
     */
    style: ContactNameStyle;
};

export type PhoneNumberType =
    | "home"
    | "mobile"
    | "work"
    | "fax_work"
    | "fax_home"
    | "pager"
    | "other"
    | "callback"
    | "car"
    | "company_main"
    | "isdn"
    | "main"
    | "other_fax"
    | "radio"
    | "telex"
    | "tty_tdd"
    | "work_mobile"
    | "work_pager"
    | "assistant"
    | "mms";

/**
 * Represents one phone number
 */
export type ContactDataPhone = {
    /**
     * The phone number as the user entered it.
     */
    entered_number: string;

    /**
     * The phone number normalised. This should be used instead of entered_number in most cases.
     */
    number: string;

    /**
     * The type of the phone number.
     */
    type: PhoneNumberType;

    /**
     * A label for the type. Can be used to differentiate fields with 'other' type.
     */
    type_label?: string;
};

export type EmailType = "home" | "mobile" | "work" | "other";

/**
 * Represents one email address
 */
export type ContactDataEmail = {
    /**
     * The email address.
     */
    address: string;

    /**
     * The display name for this email address.
     */
    display_name: string;

    /**
     * The type of the email address.
     */
    type: EmailType;

    /**
     * A label for the type. Can be used to differentiate fields with 'other' type.
     */
    type_label?: string;
};

export type EventType = "birthday" | "anniversary" | "other";

/**
 * Represents one special event for a contact
 */
export type ContactDataEvent = {
    /**
     * The date of the event as the user entered it. This is not sored as a timestamp in the database
     * and you can expect any type of text here. So be careful when trying to get a Date object from this.
     */
    date: string;

    /**
     * The type of the event.
     */
    type: EventType;

    /**
     * A label for the type. Can be used to differentiate fields with 'other' type.
     */
    type_label?: string;
};

export type NicknameType = "default" | "other" | "maiden_name" | "short_name" | "initials";

/**
 * Represents one nickname for a contact
 */
export type ContactDataNickname = {
    /**
     * The nickname of the contact
     */
    name: string;

    /**
     * The type of the nickname.
     */
    type: NicknameType;

    /**
     * A label for the type. Can be used to differentiate fields with 'other' type.
     */
    type_label?: string;
};

/**
 * The notes for a contact.
 */
export type ContactNotes = {
    /**
     * The text in the notes
     */
    text: string;
};

export type AddressType = "home" | "work" | "other";

/**
 * Represents one nickname for a contact
 */
export type ContactDataAddress = {
    /**
     * The address in one string as he user entered it.
     */
    address: string;

    /**
     * The street, house number and floor number. On some device this may also just
     * contain the same value as `address` and all the other address related fields
     * are missing.
     */
    street?: string;

    /**
     * A post box for this address.
     */
    post_box?: string;

    /**
     * The neighbourhood of the address. This is used to differentiate multiple
     * streets with the same name in the same city.
     */
    neighbourhood?: string;

    /**
     * The city, village, town or borough for the address.
     */
    city?: string;

    /**
     * A state, province, county (in Ireland), Land (in Germany), departement (in France) etc.
     */
    region?: string;

    /**
     * Postal code. Usually country-wide, but sometimes specific to the city
     */
    post_code?: string;

    /**
     * The name or code of the country.
     */
    country?: string;

    /**
     * The type of the address.
     */
    type: AddressType;

    /**
     * A label for the type. Can be used to differentiate fields with 'other' type.
     */
    type_label?: string;
};

function quote(arg: string): string {
    return '"' + arg.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\$/g, "\\$") + '"';
}

export class WifiManager {
    private readonly android: Android;

    constructor(android: Android) {
        this.android = android;
    }

    /**
     * Retrieves information about what features this device supports.
     */
    async getInfo(): Promise<WifiInformation> {
        const result = await this.android.rawRequest("wifi_information", {});
        return result.info;
    }

    /**
     * Retrieves information about the current state of the device.
     * WifiState in itself has not may fields. Wrap it in a check for WifiState#connected to get access to
     * fields only available when connected.
     * Because it's technically possible to get location data from the available wlan networks and android does
     * not differentiate between accessing the current connection and scanning for WLAN networks, some of the
     * fields in WifiState may hold meaningless values if the `gps` permission is not granted.
     */
    async getState(): Promise<WifiState> {
        const result = await this.android.rawRequest("wifi_state", {});
        return result.state;
    }
}

export type WifiInformation = {
    /**
     * Whether this device supports the 5GHz Band
     */
    has5GHz: boolean;

    /**
     * Whether this device supports the 6GHz Band
     */
    has6GHz: boolean;

    /**
     * Whether this device supports Wi-Fi Direct
     */
    p2p: boolean;

    /**
     * Whether this device can act as station and access point at the same time (connecting to a
     * network and creating a hotspot)
     */
    sta_ap_concurrency: boolean;

    /**
     * Whether Tunnel Directed Link Setup is supported
     */
    tdls: boolean;

    /**
     * Whether Easy Connect (DPP) is supported.
     */
    easy_connect: boolean;

    /**
     * Whether Enhanced Open (OWE) is supported.
     */
    enhanced_open: boolean;

    /**
     * Whether WAPI is supported.
     */
    wapi: boolean;

    /**
     * Whether WPA3-Personal SAE is supported.
     */
    wpa3sae: boolean;

    /**
     * Whether WPA3-Enterprise Suite-B-192 is supported.
     */
    wpa3sb192: boolean;

    /**
     * Whether wifi standard IEEE 802.11a/b/g is supported.
     * This will be false for all devices running on Android 10 or lower even if it is supported.
     */
    ieee80211abg: boolean;

    /**
     * Whether wifi standard IEEE 802.11n is supported.
     * This will be false for all devices running on Android 10 or lower even if it is supported.
     */
    ieee80211n: boolean;

    /**
     * Whether wifi standard IEEE 802.11ac is supported.
     * This will be false for all devices running on Android 10 or lower even if it is supported.
     */
    ieee80211ac: boolean;

    /**
     * Whether wifi standard IEEE 802.11ax is supported.
     * This will be false for all devices running on Android 10 or lower even if it is supported.
     */
    ieee80211ax: boolean;
};

export type WifiStandard = "ieee80211abg" | "ieee80211n" | "ieee80211ac" | "ieee80211ax" | "unknown";
export type WifiDeviceState = "disabled" | "disabling" | "enabled" | "enabling" | "unknown";

export type WifiStateCommon = {
    /**
     * The state of the wifi device
     */
    device_state: WifiDeviceState;

    /**
     * Whether the device is connected
     */
    connected: boolean;
};

export type WifiStateDisconnected = {
    connected: false;
};

export type WifiStateConnected = {
    connected: true;

    /**
     * The SSID of the connected network.
     */
    ssid: string;

    /**
     * The BSSID of the connected network.
     */
    bssid: string;

    /**
     * Whether the SSID of the connected network is hidden.
     */
    hidden_ssid: boolean;

    /**
     * The ip address of this device in the network.
     */
    ip: string;

    /**
     * The frequency on which this network currently runs in MHz
     */
    frequency: number;

    /**
     * The current link speed in MB/s
     */
    link_speed?: number;

    /**
     * The maximum supported RX link speed for this connection in MB/s
     */
    max_rx?: number;

    /**
     * The maximum supported TX link speed for this connection in MB/s
     */
    max_tx?: number;

    /**
     * The MAC-Address used for this connection. THIS ADDRESS IS NOT NECESSARILY
     * THE ADDRESS OF THE DEVICE AS ANDROID ALLOWS USING RANDOM MAC ADDRESSES.
     */
    mac_address: number;

    /**
     * The current received signal strength indication in dBm
     */
    rssi: number;

    /**
     * The rssi aligned to a scale from 0 to 1.
     * Avoid using this as it's not very meaningful.
     */
    signal_level: number;
};

export type WifiState = WifiStateCommon & (WifiStateConnected | WifiStateDisconnected);
