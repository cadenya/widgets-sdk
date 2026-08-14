import { HttpClient, RequestOptions, APIPromise } from '../core/http.js';
import type { WidgetConfig } from '../types.js';
export declare class Config {
    private readonly _client;
    constructor(_client: HttpClient);
    /**
     * Get widget config
     *
     * @example
     * ```ts
     * const widgetConfig = await client.config.retrieveWidget();
     * ```
     */
    retrieveWidget(options?: RequestOptions): APIPromise<WidgetConfig>;
}
//# sourceMappingURL=config.d.ts.map