import { NodeCG } from "nodecg-types/types/server";
import type { Request, Response } from "express";
import * as crypto from "crypto";
import * as http from "http";
import { BundleManager } from "./bundleManager";
import { InstanceManager } from "./instanceManager";
import { ServiceManager } from "./serviceManager";
import { PersistenceManager } from "./persistenceManager";
import { success, Result, error, emptySuccess } from "./utils/result";
import { ObjectMap } from "./service";

export type DashboardApiRequest =
    | { type: string }
    | CreateServiceInstanceRequest
    | UpdateInstanceConfigRequest
    | DeleteServiceInstanceRequest
    | SetServiceDependencyRequest;

export interface AuthenticatedRequest {
    type: string;
    password: string;
}

export interface CreateServiceInstanceRequest extends AuthenticatedRequest {
    serviceType: string;
    instanceName: string;
}

export interface UpdateInstanceConfigRequest extends AuthenticatedRequest {
    instanceName: string;
    config: unknown;
}

export interface DeleteServiceInstanceRequest extends AuthenticatedRequest {
    instanceName: string;
}

export interface SetServiceDependencyRequest extends AuthenticatedRequest {
    bundleName: string;
    instanceName: string | undefined;
    serviceType: string;
}

export const dashboardApiPath = "/nodecg-io-core/";

export class DashboardApi {
    private readonly routes: ObjectMap<(r: unknown) => Promise<Result<unknown>>> = {
        createServiceInstance: this.createServiceInstance.bind(this),
        updateInstanceConfig: this.updateInstanceConfig.bind(this),
        deleteServiceInstance: this.deleteServiceInstance.bind(this),
        setServiceDependency: this.setServiceDependency.bind(this),
        isLoaded: this.isLoaded.bind(this),
        load: this.load.bind(this),
        getServices: this.getServices.bind(this),
        isFirstStartup: this.isFirstStartup.bind(this),
        getSessionValue: this.getSessionValue.bind(this),
    };

    // For all these routes the password will be checked before the request is handled.
    // If the password is invalid or the framework hasn't been loaded yet, the request will be rejected.
    private readonly authenticatedRoutes = [
        "createServiceInstance",
        "updateInstanceConfig",
        "deleteServiceInstance",
        "setServiceDependency",
    ];

    private sessionValue = crypto.randomBytes(16).toString("hex");

    constructor(
        private nodecg: NodeCG,
        private services: ServiceManager,
        private instances: InstanceManager,
        private bundles: BundleManager,
        private persist: PersistenceManager,
    ) {}

    private async createServiceInstance(msg: CreateServiceInstanceRequest) {
        return this.instances.createServiceInstance(msg.serviceType, msg.instanceName);
    }

    private async updateInstanceConfig(msg: UpdateInstanceConfigRequest) {
        const inst = this.instances.getServiceInstance(msg.instanceName);
        if (inst === undefined) {
            return error("Service instance doesn't exist.");
        } else {
            return await this.instances.updateInstanceConfig(msg.instanceName, msg.config);
        }
    }

    private async deleteServiceInstance(msg: DeleteServiceInstanceRequest) {
        return success(this.instances.deleteServiceInstance(msg.instanceName));
    }

    private async setServiceDependency(msg: SetServiceDependencyRequest) {
        if (msg.instanceName === undefined) {
            const success = this.bundles.unsetServiceDependency(msg.bundleName, msg.serviceType);
            if (success) {
                return emptySuccess();
            } else {
                return error("Service dependency couldn't be found.");
            }
        } else {
            const instance = this.instances.getServiceInstance(msg.instanceName);
            if (instance === undefined) {
                return error("Service instance couldn't be found.");
            } else {
                return this.bundles.setServiceDependency(msg.bundleName, msg.instanceName, instance);
            }
        }
    }

    private async isLoaded() {
        return success(this.persist.isLoaded());
    }

    private async load(req: AuthenticatedRequest) {
        return this.persist.load(req.password);
    }

    private async getServices() {
        return success(this.services.getServices());
    }

    private async isFirstStartup() {
        return success(this.persist.isFirstStartup());
    }

    private async getSessionValue() {
        return success(this.sessionValue);
    }

    private async handleRequest(req: Request, res: Response) {
        const message = req.body as { type: string };

        const handler = this.routes[message.type];
        if (handler === undefined) {
            res.status(404).json(error(`No route with type "${message.type}" found.`));
            return;
        }

        if (this.authenticatedRoutes.includes(message.type)) {
            const msg = req.body as AuthenticatedRequest;
            if (this.persist.checkPassword(msg.password) === false) {
                res.status(400).json(error("The password is invalid."));
            }
        }

        const result = await handler(message);
        res.json(result);
    }

    mountApi() {
        const app = this.nodecg.Router();
        this.nodecg.mount(app);

        app.post(dashboardApiPath, (req, res) => {
            this.handleRequest(req, res);
        });

        this.nodecg.Replicant("bundles", "nodecg").on("change", () => this.verifySuccessfulMount());

        this.nodecg.log.info("Succesfully mounted nodecg-io dashboard API.");
    }

    /**
     * A malicious bundle could try and mount a fake dashboard Api before nodecg-io-core and
     * get access to e.g. the nodecg-io configuration password.
     *
     * To circumvent this at least a bit, we generate a random session value and serve it using a route.
     * Once nodecg has loaded all bundles it will start its express server with all routes.
     *
     * To check if another bundle already registered a route on the same path, we call
     * the getSessionValue route. If the response is the same as the stored session value only we know
     * everything is fine.
     * If not, we know that another bundle has already mounted the dashboard api and we'll stop
     * nodecg to prevent any password leakage.
     *
     * Any bundle can still mess with nodecg-io by simply overwriting its source file,
     * this is just a little layer of protection so that not any bundle can get
     * the password with like three lines of code.
     */
    private async verifySuccessfulMount() {
        await new Promise((res) => setImmediate(res));

        const payload = JSON.stringify({
            type: "getSessionValue",
        });

        const httpOptions = {
            method: "POST",
            path: dashboardApiPath,
            hostname: "127.0.0.1",
            port: this.nodecg.config.port,
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload),
            },
        };

        const request = http.request(httpOptions, (resp) => {
            let responseBody = "";
            resp.on("data", (data) => (responseBody += data));

            resp.on("end", () => {
                const result: Result<string> = JSON.parse(responseBody);

                if (result.failed || result.result !== this.sessionValue) {
                    this.nodecg.log.error("Failed to verify dashboard API.");
                    process.exit(1);
                } else {
                    this.nodecg.log.debug("Dashboard API verified.");
                }
            });

            resp.on("error", (err) => {
                this.nodecg.log.error(`Failed to verify dashboard API: ${err}`);
                process.exit(1);
            });
        });

        request.write(payload);
        request.end();
    }
}
