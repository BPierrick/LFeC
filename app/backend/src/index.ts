import { config } from "./config";
import { createApp } from "./app";

const app = createApp();

app.listen(config.port, () => {
  console.log(`✅ Serveur backend démarré sur http://localhost:${config.port}`);
});
