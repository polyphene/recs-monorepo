export const getPortEnv = (): string => {
  const env = process.env.PORT;
  if (env === undefined) {
    throw new Error('PORT environment variable is not set');
  }

  return env;
};

export const loadEnv = (): void => {
  getPortEnv();
};
