declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: string | undefined;
      API_PORT: string | undefined;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
