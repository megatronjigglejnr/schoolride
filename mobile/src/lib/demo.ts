// Demo switches from app/app.js. Turn all of these off before any real user sees the app (CLAUDE.md).

/** Show a "Calling…" toast instead of dialling, so the demo never leaves the app. Real build: false. */
export const DEMO_CALLS = true;

/** Show the "(demo control)" buttons: "Simulate signal loss" and "Skip onboarding", plus the OTP code hint. */
export const DEMO_CONTROLS = true;

/** The one code onboarding accepts. */
export const OTP_CORRECT = '123456';

/** Simulated signal loss: one "minute" passes every this many milliseconds. */
export const SIGNAL_TICK_MS = 2000;
