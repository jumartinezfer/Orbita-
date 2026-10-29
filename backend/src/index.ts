import "dotenv/config";
import { createApp } from "./app.js";
import { createDb } from "./db.js";
import { env } from "./env.js";

const db = createDb();
const app = createApp(db);

app.listen(env.port, () => {
  console.log(`API escuchando en http://localhost:${env.port}`);
});
