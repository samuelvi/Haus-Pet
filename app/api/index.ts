import app from "./app";
import logger from "./infrastructure/logger/logger";

const port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.fatal(
    {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    },
    'Uncaught Exception - shutting down'
  );
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.fatal(
    {
      reason,
      promise,
    },
    'Unhandled Promise Rejection - shutting down'
  );
  process.exit(1);
});

app.listen(port, () => {
  logger.info(`Server listening on http://localhost:${port}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
