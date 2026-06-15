const GOPAY_SANDBOX_URL = "https://gw.sandbox.gopay.com/api";
const GOPAY_PRODUCTION_URL = "https://gate.gopay.cz/api";

export class GoPay {
  private clientId: string;
  private clientSecret: string;
  private sandbox: boolean;
  private baseUrl: string;
  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor(clientId: string, clientSecret: string, sandbox = false) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.sandbox = sandbox;
    this.baseUrl = sandbox ? GOPAY_SANDBOX_URL : GOPAY_PRODUCTION_URL;
  }

  async getToken(scope = "payment-all"): Promise<string> {
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      return this.tokenCache.token;
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const response = await fetch(`${this.baseUrl}/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: `grant_type=client_credentials&scope=${scope}`,
    });

    const data = await response.json() as any;

    if (!response.ok || !data.access_token) {
      const msg = data?.errors?.[0]?.message || data?.error || JSON.stringify(data);
      return `StatusCode:${response.status} ${msg}`;
    }

    const expiresIn = (data.expires_in || 1800) * 1000;
    this.tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + expiresIn - 60000,
    };
    return data.access_token;
  }

  async createPayment(data: Record<string, unknown>): Promise<Record<string, any>> {
    const token = await this.getToken();
    if (token.startsWith("StatusCode:")) {
      return { error: token };
    }

    const response = await fetch(`${this.baseUrl}/payments/payment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json() as any;
    return result;
  }

  async getStatus(id: string | number): Promise<Record<string, any>> {
    const token = await this.getToken();
    if (token.startsWith("StatusCode:")) {
      return { error: token };
    }

    const response = await fetch(`${this.baseUrl}/payments/payment/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const result = await response.json() as any;
    return result;
  }

  async refundPayment(id: string | number, amount: number): Promise<Record<string, any>> {
    const token = await this.getToken();
    if (token.startsWith("StatusCode:")) {
      return { error: token };
    }

    const response = await fetch(`${this.baseUrl}/payments/payment/${id}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: `amount=${amount}`,
    });

    const result = await response.json() as any;
    return result;
  }
}
