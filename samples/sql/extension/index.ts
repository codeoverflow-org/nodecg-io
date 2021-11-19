import { NodeCG } from "nodecg-types/types/server";
import { requireService } from "nodecg-io-core";
import { SQLClient } from "nodecg-io-sql";

module.exports = function (nodecg: NodeCG) {
    nodecg.log.info("Sample bundle for the template service started.");

    const sql = requireService<SQLClient>(nodecg, "sql");

    sql?.onAvailable(async (sql) => {
        // In the following, we demonstrate some simple examples on how to use knex.js
        nodecg.log.info("SQL service available.");

        // Select the columns 'Id' and 'Content' from the table 'Test' (not typesafe)
        (await sql("Test").select("Id", "Content")).forEach((row) =>
            nodecg.log.info(`Received row with id: ${row.Id}`),
        );

        // Define an interface with the fields of the table for more type safety
        interface TestItem {
            Id: number;
            Content: string;
        }
        (await sql<TestItem>("Test")).forEach((row) => nodecg.log.info(`Received content: ${row.Content}`));

        // An example on how to use *where*
        (await sql<TestItem>("Test2").where("Id", 3)).forEach((row) =>
            nodecg.log.info(`Content of element with Id == 3: ${row.Content}`),
        );

        // An example on how to use *join*
        (
            await sql("Test")
                .leftJoin("Test2", "Test.Id", "Test2.Id")
                .select("Test.Content as Content1", "Test2.Content as Content2")
        ).forEach((match) => nodecg.log.info(`Matching elements: '${match.Content1}' and '${match.Content2}'`));

        // An example on how to use *insert* (we assume Id to be auto-incrementing and leave it empty)
        await sql<TestItem>("Test2").insert({ Content: `Some random content: ${Math.random()}` });

        // Way more examples can be found on knexjs.org
    });

    sql?.onUnavailable(() => {
        nodecg.log.info("SQL service unavailable.");
    });
};
