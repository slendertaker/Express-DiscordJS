/**
 * Coding service by Sleepy4k <sarahpalastring@gmail.com>
 *
 * Reselling this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Written by:
 * Apri Pandu Wicaksono
 *
 * Link: https://github.com/sleepy4k
 *
 * March 12, 2023
 */
import { Bot } from "@server/bot";
import { Handler } from "@templates";
import { IEventFile } from "@interfaces";
import { readdir } from "node:fs/promises";
import CatchError from "@classes/CatchError";

export default new Handler({
  name: "event",

  run: async (client: Bot): Promise<void> => {
    try {
      const events = await readdir("./events");
      const filteredEvents = events.filter((file) => file.endsWith(".ts"));

      await Promise.all(filteredEvents.map(async (filteredEvent) => {
        const fileName = filteredEvent.split(".");
        const event: IEventFile = await import(`../events/${fileName[0]}.${fileName[1]}`)
          .then((event) => event.default)
          .catch((_err) => {
            return { name: null };
          });

        if (!event.name) client.logStatus(fileName[0], false, "Event");
        else {
          client.events.set(event.name, event);
          client.logStatus(`${fileName[0]} (${event.name})`, true, "Event");
          client.on(event.name, (...args) => event.run(client, ...args));
        }
      }));
    } catch (error: unknown) {
      new CatchError(error);
    }
  }
});
