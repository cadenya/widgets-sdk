import { HttpClient, RequestOptions } from '../core/http.js';
import type { WidgetConfig } from '../types.js';
export declare class Config {
    private readonly _client;
    constructor(_client: HttpClient);
    /**
     * Get widget config
     */
    retrieveWidget(options?: RequestOptions): Promise<WidgetConfig>;
}
//# sourceMappingURL=config.d.ts.map