export interface AppConfig {
  mysql: {
    enabled: boolean;
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  qcModule: {
    enabled: boolean;
  };
}

let config: AppConfig = {
  mysql: {
    enabled: false,
    host: '',
    port: 3306,
    user: '',
    password: '',
    database: '',
  },
  qcModule: {
    enabled: false,
  },
};

export function setConfig(newConfig: Partial<AppConfig>) {
  config = { ...config, ...newConfig };
}

export function getConfig(): AppConfig {
  return config;
}

export function isQCEnabled(): boolean {
  return config.qcModule.enabled && config.mysql.enabled;
}