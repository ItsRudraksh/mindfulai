/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as chatConversations from "../chatConversations.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as globalMemory from "../globalMemory.js";
import type * as goals from "../goals.js";
import type * as http from "../http.js";
import type * as journalEntries from "../journalEntries.js";
import type * as messages from "../messages.js";
import type * as metrics from "../metrics.js";
import type * as moodEntries from "../moodEntries.js";
import type * as paymentTransactions from "../paymentTransactions.js";
import type * as sessionRatings from "../sessionRatings.js";
import type * as sessions from "../sessions.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  chatConversations: typeof chatConversations;
  crons: typeof crons;
  email: typeof email;
  globalMemory: typeof globalMemory;
  goals: typeof goals;
  http: typeof http;
  journalEntries: typeof journalEntries;
  messages: typeof messages;
  metrics: typeof metrics;
  moodEntries: typeof moodEntries;
  paymentTransactions: typeof paymentTransactions;
  sessionRatings: typeof sessionRatings;
  sessions: typeof sessions;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
