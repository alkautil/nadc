import { Client } from "discord.js";
import { load_files } from "../functions/file_loader";
import Table from "cli-table";
import chalk from "chalk";

export type EventExecute = (...args: [...any: any[], client: Client]) => void;

export interface Event {
    ignore?: boolean;
    name: string;
    rest?: boolean;
    once?: boolean;
    friendlyName?: string;
    execute: EventExecute;
}

export interface EventFile {
    event: Event;
}

/**
 * Loads events in directory ".\/events\/\*\*\/*.ts"
 *
 * Must be called **after** defining client.events
 * @param client
 */
export async function load_events(client: Client) {
    const table = new Table({
        head: ["#", "Event Name", "Event", "Type", "Status"],
        colWidths: [4, 36, 20, 6, 11],
        chars: {
            mid: "",
            "left-mid": "",
            "mid-mid": "",
            "right-mid": "",
        },
    });

    await client.events.clear(); // deletes all item in client.events collection

    const files = await load_files("events");

    let validEvents = 0;
    let invalidEvents = 0;

    let i = 0;

    const cwd = process.cwd().replace(/\\/g, "/") + "/";

    for (const file of files) {
        i++;
        // process.stdout.write(
        //     chalk.green(`[HANDLER] Loading event files: `) +
        //         chalk.yellow(`${i}/${files.length}`) +
        //         "\r"
        // );
        console.log(
            chalk.green(`[HANDLER] Loading event files: `) +
                chalk.yellow(`${i.toString()}/${files.length}`) +
                chalk.green(` (${file.replace(cwd, "")})`)
        );
        const eventFile: EventFile = require(file);

        if (!eventFile.hasOwnProperty("event")) continue;

        const { event } = eventFile;

        // TODO: Check if imported file is commonjs, if not ignore. or just switch to es6 entirely

        if (event.ignore) continue;

        if (!event.name) {
            // check if file has property "name"
            table.push([
                i.toString(),
                event.friendlyName
                    ? event.friendlyName.length > 30
                        ? chalk.blue(event.friendlyName.slice(0, 30) + "...")
                        : chalk.blue(event.friendlyName)
                    : event.name
                    ? event.name
                    : file.split("/").pop() || "???",
                event.name,
                event.once ? chalk.yellow("ONCE") : "ON",
                client.config.cli.status_bad,
            ]);
            invalidEvents++;
            continue;
        }

        const execute = (...args: any[]) => event.execute(...args, client);
        client.events.set(event.name, execute);
        validEvents++;

        if (event.rest) {
            if (event.once) client.rest.once(event.name, execute); // rest, once
            else client.rest.on(event.name, execute); // rest, on
        } else if (!event.rest) {
            if (event.once) client.once(event.name, execute); // normal, once
            else client.on(event.name, execute); // normal on
        }

        table.push([
            i.toString(),
            event.friendlyName
                ? event.friendlyName.length > 30
                    ? chalk.blue(event.friendlyName.slice(0, 30) + "...")
                    : chalk.blue(event.friendlyName)
                : event.name
                ? event.name
                : file.split("/").pop() || "???",
            event.name,
            event.once ? chalk.yellow("ONCE") : "ON",
            client.config.cli.status_ok,
        ]);
    }
    console.log(table.toString());
}
