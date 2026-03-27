/**
 * main.js
 * Place at: js/main.js  (or root entry point)
 *
 * ✔  ONLY handles app initialization.
 * ✔  Does NOT modify any model / controller / route.
 *
 * Called once on app start to seed localStorage with mock cases if empty.
 */

import { initCases } from "./index.js";

// Seed localStorage on first load
initCases();

console.log("[CivicTrack] App initialised.");
