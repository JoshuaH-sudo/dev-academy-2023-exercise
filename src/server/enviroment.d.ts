declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      MONGO_URI: string;
      PORT?: string;
    }
  }
}

export {}