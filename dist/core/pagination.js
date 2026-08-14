/** Cursor pagination. Pages are async-iterable across page boundaries. */
export class Page {
    items;
    nextCursor;
    fetchPage;
    constructor(items, nextCursor, fetchPage) {
        this.items = items;
        this.nextCursor = nextCursor;
        this.fetchPage = fetchPage;
    }
    hasNextPage() {
        return this.nextCursor !== undefined && this.nextCursor !== '';
    }
    async getNextPage() {
        if (!this.hasNextPage())
            return null;
        return this.fetchPage(this.nextCursor);
    }
    /** Iterate every item on every page, fetching lazily. */
    async *[Symbol.asyncIterator]() {
        let page = this;
        while (page) {
            for (const item of page.items)
                yield item;
            page = await page.getNextPage();
        }
    }
}
//# sourceMappingURL=pagination.js.map