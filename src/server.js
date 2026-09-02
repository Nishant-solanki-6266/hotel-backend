import app from './app.js';
import { config } from './config/env.js';

const PORT = config.port || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Hotelogx Connect Backend listening on port ${PORT}`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Healthcheck: http://localhost:${PORT}/api/health`);
});
