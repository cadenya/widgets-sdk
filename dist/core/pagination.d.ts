/** Cursor pagination. Pages are async-iterable across page boundaries. */
export declare class Page<T> implements AsyncIterable<T> {
    readonly items: T[];
    readonly nextCursor: string | undefined;
    private readonly fetchPage;
    constructor(items: T[], nextCursor: string | undefined, fetchPage: (cursor: string) => Promise<Page<T>>);
    hasNextPage(): boolean;
    getNextPage(): Promise<Page<T> | null>;
    /** Iterate every item on every page, fetching lazily. */
    [Symbol.asyncIterator](): AsyncIterator<T>;
}
//# sourceMappingURL=pagination.d.ts.map