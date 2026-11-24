export type TriggerType = 'webhook' | 'cron' | 'db_event';
export type ActionType = 'send_email' | 'whatsapp_message' | 'slack_webhook' | 'discord_webhook' | 'http_post' | 'critical_alert';
export type ExecutionStatus = 'success' | 'failed' | 'ignored';

export interface Automation {
  id: string;
  userId: string;
  name: string;
  triggerType: TriggerType;
  filterCondition: Record<string, any>;
  actionType: ActionType;
  actionConfig: Record<string, any>;
  isActive: boolean;
  createdAt: string;
}

export interface ExecutionLog {
  id: string;
  automationId: string;
  userId: string;
  status: ExecutionStatus;
  payloadSummary: Record<string, any>;
  latencyMs: number;
  errorMessage?: string | null;
  createdAt: string;
}
