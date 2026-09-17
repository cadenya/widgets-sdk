import { HttpClient, RequestOptions, APIPromise } from '../core/http.js';
import type { WidgetSessionCredentials } from '../types.js';
export interface SessionRenewWidgetParams {
    /**
     * Required workspace containing the authenticated session. Must match the
     *  session resolved from the bearer token; never authorizes access by itself.
     */
    workspaceId: string;
}
export declare class Session {
    private readonly _client;
    constructor(_client: HttpClient);
    /**
     * Renew a widget session token
     *
     * @example
     * ```ts
     * const widgetSessionCredentials = await client.session.renewWidget({ workspaceId: 'workspace_123' });
     * ```
     */
    renewWidget(params: SessionRenewWidgetParams, options?: RequestOptions): APIPromise<WidgetSessionCredentials>;
}
//# sourceMappingURL=session.d.ts.map