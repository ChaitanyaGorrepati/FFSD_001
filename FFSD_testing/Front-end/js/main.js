/**
 * main.js — Place at: js/main.js
 * Seeds localStorage with mock cases AND users on first load.
 */

import { initCases, initUsers } from "./index.js";

initCases();
initUsers();

console.log("[CivicTrack] App initialised.");