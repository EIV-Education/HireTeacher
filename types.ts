
export enum InputMode {
  TEXT = 'TEXT',
  FILE = 'FILE'
}

export interface UploadedFile {
  name: string;
  type: string;
  data: string; // Base64 string
}

export interface LarkConfig {
  webhookUrl: string;
  appId?: string;      // Cần cho file upload
  appSecret?: string;  // Cần cho file upload
  enabled: boolean;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  REVIEW = 'REVIEW',
  SENDING = 'SENDING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
