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
import "dotenv/config.js";

const bot = {
  name: process.env.BOT_NAME || "slendertaker",
  icon: process.env.BOT_ICON || "https://i.scdn.co/image/ab67616d00001e02af9492f3874593a0ecb971c8",
  token: process.env.BOT_TOKEN || "",
  prefix: process.env.BOT_PREFIX || "$",
  author: process.env.BOT_AUTHOR || "slendertaker",
  browser: process.env.BOT_BROWSER || "Discord iOS"
}

export default bot;
