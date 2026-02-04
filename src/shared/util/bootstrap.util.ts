import { initializeCache } from "./cache.util.js";

export async function bootstrap() {
  console.log("Initializing application cache...");
  await initializeCache();
}
