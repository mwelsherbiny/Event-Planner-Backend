import app from "./app.js";
import { config } from "./config/config.js";
import { bootstrap } from "./shared/util/bootstrap.util.js";
import { RoleCache } from "./shared/util/cache.util.js";

const PORT = config.PORT;

await bootstrap();
app.listen(PORT, () => {
  console.log(`
 Server is running!
 Local: http://localhost:${PORT}
 Environment: ${config.NODE_ENV}
 API Health: http://localhost:${PORT}/api/health
  `);
});
