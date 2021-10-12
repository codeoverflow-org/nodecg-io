import { NodeCG } from "nodecg-types/types/server";
import { GoogleApisServiceClient } from "nodecg-io-googleapis";
import { requireService } from "nodecg-io-core";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for Google Sheets started");

    const googleApis = requireService<GoogleApisServiceClient>(nodecg, "googleapis");

    googleApis?.onAvailable(async (client) => {
        const gsheets = client.sheets("v4");
        try {
            const data = await gsheets.spreadsheets.values.get(
                {
                    spreadsheetId: "<ID>", //Spreadsheet ID, URL is formatted https://docs.google.de/spreadsheets/d/<ID>/edit
                    range: "<tableSheetName>", //The sheet name, witch will used to get the data.
                },
                undefined,
            );
            data.data.values = data.data.values?.filter((e) => !(!e[0] || 0 === e[0].length)); // filter out rows when column A is a empty String
            nodecg.log.info(data.data);
        } catch (error) {
            nodecg.log.error("Could it be, that you haven't specified the spreadsheetId and the range?");
            nodecg.log.error(error);
        }
    });

    googleApis?.onUnavailable(() => nodecg.log.info("GSheets client has been unset."));
};
