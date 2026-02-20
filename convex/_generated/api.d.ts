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
import type * as calendar from "../calendar.js";
import type * as content from "../content.js";
import type * as http from "../http.js";
import type * as llmUsage from "../llmUsage.js";
import type * as memories from "../memories.js";
import type * as office from "../office.js";
import type * as seed from "../seed.js";
import type * as seedData from "../seedData.js";
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
  calendar: typeof calendar;
  content: typeof content;
  http: typeof http;
  llmUsage: typeof llmUsage;
  memories: typeof memories;
  office: typeof office;
  seed: typeof seed;
  seedData: typeof seedData;
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
