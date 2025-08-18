// Simple in-memory Supabase client mock for tests

type QueryResult<T> = { data: T | null; error: any };

type TableMock = {
  select: (columns?: string) => TableMock;
  eq: (col: string, val: any) => TableMock;
  gt: (col: string, val: any) => TableMock;
  order: (col: string, opts?: any) => TableMock;
  single: () => Promise<QueryResult<any>>;
  insert: (obj: any) => TableMock;
  update: (obj: any) => TableMock;
  then: (onFulfilled: (value: any) => any, onRejected?: (reason: any) => any) => Promise<any>;
};

export class SupabaseClientMock {
  private tables: Record<string, any[]> = {};
  private lastTable: string | null = null;
  private filters: ((row: any) => boolean)[] = [];
  private selected: string[] | null = null;
  private ordering: { col: string; ascending: boolean } | null = null;

  setTable(name: string, rows: any[]) {
    this.tables[name] = rows;
  }

  from(name: string): any {
    this.lastTable = name;
    this.filters = [];
    this.selected = null;
    this.ordering = null;

    const api: any = {
      select: (columns?: string) => {
        if (!columns || columns.trim() === '*') {
          this.selected = null;
        } else {
          this.selected = columns.split(',').map((c) => c.trim());
        }
        return api;
      },
      eq: (col: string, val: any) => {
        this.filters.push((r) => r[col] === val);
        return api;
      },
      gt: (col: string, val: any) => {
        this.filters.push((r) => r[col] > val);
        return api;
      },
      order: (col: string, opts?: any) => {
        this.ordering = { col, ascending: opts?.ascending !== false };
        return api;
      },
      single: async () => {
        const res = await this.exec();
        if (Array.isArray(res.data) && res.data.length > 0) {
          return { data: res.data[0], error: res.error };
        }
        return { data: null, error: res.error };
      },
      insert: (obj: any) => {
        const row = Array.isArray(obj) ? obj[0] : obj;
        const id = Math.random().toString(36).substr(2, 9);
        const newRow = { ...row, id };
        (this.tables[this.lastTable!] = this.tables[this.lastTable!] || []).push(newRow);
        return {
          ...api,
          select: () => ({
            single: async () => ({ data: newRow, error: null }),
          }),
        };
      },
      update: (obj: any) => {
        const rows = this.filterRows();
        const updatedRows = rows.map((r) => ({ ...r, ...obj }));
        // Update in place
        updatedRows.forEach((updated, index) => {
          const originalIndex = this.tables[this.lastTable!].findIndex(
            (r) => r.id === rows[index].id,
          );
          if (originalIndex >= 0) {
            this.tables[this.lastTable!][originalIndex] = updated;
          }
        });
        return {
          ...api,
          select: () => ({
            single: async () => ({ data: updatedRows[0] || null, error: null }),
          }),
        };
      },
      then: async (onFulfilled: (value: any) => any, onRejected?: (reason: any) => any) => {
        try {
          const result = await this.exec();
          return onFulfilled(result);
        } catch (err) {
          if (onRejected) return onRejected(err);
          throw err;
        }
      },
    };

    return api;
  }

  private filterRows() {
    const rows = this.tables[this.lastTable!] || [];
    return this.filters.reduce((acc, f) => acc.filter(f), rows);
  }

  private async exec(): Promise<QueryResult<any>> {
    const rows = this.filterRows();
    let data: any = rows;

    if (this.ordering) {
      const { col, ascending } = this.ordering;
      data = [...data].sort((a, b) => (a[col] > b[col] ? 1 : -1) * (ascending ? 1 : -1));
    }

    if (this.selected) {
      data = data.map((r: any) => {
        const o: any = {};
        this.selected!.forEach((c) => (o[c] = r[c]));
        return o;
      });
    }

    return { data, error: null };
  }
}