/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as assistant from "../assistant.js";
import type * as books from "../books.js";
import type * as calendar from "../calendar.js";
import type * as clients from "../clients.js";
import type * as content from "../content.js";
import type * as goals from "../goals.js";
import type * as http from "../http.js";
import type * as llmUsage from "../llmUsage.js";
import type * as memories from "../memories.js";
import type * as office from "../office.js";
import type * as polymarketSignals from "../polymarketSignals.js";
import type * as polymarketTrader from "../polymarketTrader.js";
import type * as revenue from "../revenue.js";
import type * as seed from "../seed.js";
import type * as seedData from "../seedData.js";
import type * as settings from "../settings.js";
import type * as tasks from "../tasks.js";
import type * as team from "../team.js";
import type * as utils from "../utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  assistant: typeof assistant;
  books: typeof books;
  calendar: typeof calendar;
  clients: typeof clients;
  content: typeof content;
  goals: typeof goals;
  http: typeof http;
  llmUsage: typeof llmUsage;
  memories: typeof memories;
  office: typeof office;
  polymarketSignals: typeof polymarketSignals;
  polymarketTrader: typeof polymarketTrader;
  revenue: typeof revenue;
  seed: typeof seed;
  seedData: typeof seedData;
  settings: typeof settings;
  tasks: typeof tasks;
  team: typeof team;
  utils: typeof utils;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
