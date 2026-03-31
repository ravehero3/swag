declare module "gopay-nodejs" {
  export class GoPay {
    constructor(clientId: string, secretId: string, sandbox?: boolean);
    getToken(scope?: string): Promise<string>;
    createPayment(data: Record<string, unknown>): Promise<Record<string, any>>;
    getStatus(id: string | number): Promise<Record<string, any>>;
    refundPayment(id: string | number, amount: number): Promise<Record<string, any>>;
  }
}
