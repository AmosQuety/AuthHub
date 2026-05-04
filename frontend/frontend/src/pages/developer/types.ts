export interface OAuthClient {
  clientId: string;
  name: string;
  isPublic: boolean;
  redirectUris: string[];
  tenantId: string | null;
  tenant?: any;
  createdAt: string;
}

export interface StatsData {
  totalLogins: number;
  chartData: { date: string; logins: number }[];
}

export interface CreatedClientData {
  clientId: string;
  clientSecret?: string;
  tenantId?: string;
  tenantSlug?: string;
}
