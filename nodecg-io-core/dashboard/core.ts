import { Result } from "nodecg-io-core";
import { DashboardApiRequest } from "../extension/dashboardApi";

/**
 * Calls a function on the dashboard api of nodecg-io-core using http.
 * Throws if the request is calling a non existing function or a invalid password is provided.
 * If the api responds with an error, it will be returned as a error result.
 *
 * @param msg the message to send to the dashboard api
 */
export async function callCoreApi<R>(msg: DashboardApiRequest): Promise<Result<R>> {
    const response = await fetch("/nodecg-io-core/", {
        method: "POST",
        body: JSON.stringify(msg),
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (response.status === 200) {
        return response.json();
    } else {
        throw new Error(`Unexpected response from API: ${response.status}`);
    }
}
