import { createApp } from "../src/app.js";
import { createDb } from "../src/db.js";

export function buildTestApp() {
  const db = createDb(":memory:");
  const app = createApp(db);
  return { app, db };
}

export const seededUser = {
  id: "u_123",
  email: "ana@orbita.test",
  password: "Orbita123!",
};
