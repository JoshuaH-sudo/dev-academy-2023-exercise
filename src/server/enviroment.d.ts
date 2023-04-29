declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      MONGO_URI?: string;
      MONGO_URI_FILE?: string;
      PORT?: string;
    }
  }
}

export {}