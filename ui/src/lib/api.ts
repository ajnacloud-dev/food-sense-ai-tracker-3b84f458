import axios from 'axios';


// Helper: Compress Image to avoid Lambda limits (6MB)
const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024; // Resize to max 1024px to keep size low
                const scaleSize = MAX_WIDTH / img.width;
                const width = scaleSize < 1 ? MAX_WIDTH : img.width;
                const height = scaleSize < 1 ? img.height * scaleSize : img.height;

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Export as JPEG with 0.7 quality
                // This usually results in < 500KB for typical photos
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                const base64 = dataUrl.split(',')[1];
                resolve(base64);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

// Environment variable for the API Gateway URL
// In development, use relative URLs to leverage Vite proxy
const API_URL = import.meta.env.VITE_API_URL || '';

import { fetchAuthSession } from 'aws-amplify/auth';

export const getAuthToken = async (): Promise<string | null> => {
    try {
        const session = await fetchAuthSession();
        return session.tokens?.accessToken?.toString() || localStorage.getItem('mock_token');
    } catch (e) {
        return localStorage.getItem('mock_token');
    }
};

const client = axios.create({
    baseURL: API_URL,

    headers: {
        'Content-Type': 'application/json',
    },
});

client.interceptors.request.use(async (config) => {
    const token = await getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Add tenant header for multi-tenant support
    // Use 'test' for local development, can be configured for different environments
    config.headers['X-Tenant-ID'] = import.meta.env.VITE_TENANT_ID || 'test';
    return config;
});

// --- Query Builder for Supabase Compatibility ---

class QueryBuilder<T = any> {
    private table: string;
    private filters: Array<(item: T) => boolean> = [];
    private sorters: Array<(a: T, b: T) => number> = [];
    private limitCount: number | null = null;
    private isSingle: boolean = false;
    private isInsert: boolean = false;
    private isUpdate: boolean = false;
    private isDelete: boolean = false;
    private payload: any = null;

    constructor(table: string) {
        this.table = table;
    }

    // --- Select / Actions ---

    select(columns = '*') {
        // We ignore columns for now and fetch everything
        return this;
    }

    insert(data: any) {
        this.isInsert = true;
        this.payload = data;
        return this;
    }

    update(data: any) {
        this.isUpdate = true;
        this.payload = data;
        return this;
    }

    // Note: Our generic backend treats POST as Upsert, so Update is Insert.
    // But we need to handle Delete separate if backend supports it (it currently doesn't, but let's mock)
    delete() {
        this.isDelete = true;
        return this;
    }

    // --- Filters ---

    eq(column: string, value: any) {
        this.filters.push((item: any) => item[column] === value);
        return this;
    }

    neq(column: string, value: any) {
        this.filters.push((item: any) => item[column] !== value);
        return this;
    }

    gt(column: string, value: any) {
        this.filters.push((item: any) => item[column] > value);
        return this;
    }

    gte(column: string, value: any) {
        this.filters.push((item: any) => item[column] >= value);
        return this;
    }

    lt(column: string, value: any) {
        this.filters.push((item: any) => item[column] < value);
        return this;
    }

    lte(column: string, value: any) {
        this.filters.push((item: any) => item[column] <= value);
        return this;
    }

    in(column: string, values: any[]) {
        this.filters.push((item: any) => values.includes(item[column]));
        return this;
    }

    not(column: string, operator: string, value: any) {
        if (operator === 'is' && value === null) {
            // not is null -> is not null
            this.filters.push((item: any) => item[column] !== null);
        }
        return this;
    }

    // --- Modifiers ---

    order(column: string, { ascending = true } = {}) {
        this.sorters.push((a: any, b: any) => {
            if (a[column] < b[column]) return ascending ? -1 : 1;
            if (a[column] > b[column]) return ascending ? 1 : -1;
            return 0;
        });
        return this;
    }

    limit(count: number) {
        this.limitCount = count;
        return this;
    }

    single() {
        this.isSingle = true;
        return this;
    }

    maybeSingle() {
        this.isSingle = false; // Treat as list but expecting 0 or 1
        this.limitCount = 1;
        return this;
    }

    // --- Execution (Thenable) ---

    async then(resolve: (result: { data: any, error: any }) => void, reject: (err: any) => void) {
        try {
            let resultData: any = null;
            let error: any = null;

            if (this.isInsert || this.isUpdate) {
                // Mock Write Operation - Store in localStorage
                const storageKey = `mock_table_${this.table}`;
                const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');

                // Add IDs and timestamps to the payload
                const dataToInsert = Array.isArray(this.payload) ? this.payload : [this.payload];
                const enrichedData = dataToInsert.map((item: any) => ({
                    ...item,
                    id: item.id || `mock-${Date.now()}-${Math.random()}`,
                    created_at: item.created_at || new Date().toISOString(),
                }));

                // Store the data
                const newData = [...existing, ...enrichedData];
                localStorage.setItem(storageKey, JSON.stringify(newData));

                // Return what we inserted
                resultData = Array.isArray(this.payload) ? enrichedData : enrichedData[0];
            } else if (this.isDelete) {
                // Mock Delete
                console.log('Mock delete operation');
                resultData = null;
            } else {
                // Mock Read Operation - Read from localStorage
                const storageKey = `mock_table_${this.table}`;
                let rows = JSON.parse(localStorage.getItem(storageKey) || '[]');
                if (!Array.isArray(rows)) rows = [];

                // Apply Filters
                for (const filter of this.filters) {
                    rows = rows.filter(filter);
                }

                // Apply Sorters
                for (const sorter of this.sorters) {
                    rows.sort(sorter);
                }

                // Apply Limit
                if (this.limitCount !== null) {
                    rows = rows.slice(0, this.limitCount);
                }

                // Handle Single
                if (this.isSingle) {
                    if (rows.length === 0) {
                        error = { message: 'Row not found', code: 'PGRST116', details: '', hint: '' };
                        resultData = null;
                    } else if (rows.length > 1) {
                        error = { message: 'Result contains more than one row', code: 'PGRST116', details: '', hint: '' };
                        resultData = null;
                    } else {
                        resultData = rows[0];
                    }
                } else {
                    resultData = rows;
                }
            }

            resolve({ data: resultData, error });
        } catch (err: any) {
            resolve({ data: null, error: err });
        }
    }
}

export const api = {
    from: (table: string) => {
        // Use real backend API with query builder interface
        const queryBuilder = {
            _table: table,
            _filters: [] as any[],
            _orderBy: null as any,
            _limitCount: null as number | null,

            select: function(columns = '*') {
                return this;
            },

            insert: async function(records: any) {
                try {
                    console.log(`Inserting into ${this._table}:`, records);
                    const response = await client.post(`/v1/${this._table}`, records);
                    return { data: response.data, error: null };
                } catch (error: any) {
                    console.error(`Error inserting into ${this._table}:`, error);
                    return { data: null, error: error.response?.data?.error || error };
                }
            },

            delete: async function() {
                try {
                    // Build the DELETE request URL with filters
                    const params = new URLSearchParams();

                    // Add filters to identify which records to delete
                    for (const filter of this._filters) {
                        if (filter.op === 'eq' && filter.column === 'id') {
                            // For delete by ID, use the REST pattern
                            const url = `/v1/${this._table}/${filter.value}`;
                            console.log(`Deleting from ${url}`);
                            const response = await client.delete(url);
                            return { data: response.data, error: null };
                        }
                    }

                    // If no ID filter, return error (for safety)
                    console.error('Delete requires an ID filter');
                    return { data: null, error: new Error('Delete requires an ID filter') };
                } catch (error: any) {
                    console.error(`Error deleting from ${this._table}:`, error);
                    return { data: null, error: error.response?.data?.error || error };
                }
            },

            update: async function(updates: any) {
                try {
                    // Find the ID from filters
                    for (const filter of this._filters) {
                        if (filter.op === 'eq' && filter.column === 'id') {
                            const url = `/v1/${this._table}/${filter.value}`;
                            console.log(`Updating ${url}:`, updates);
                            const response = await client.put(url, updates);
                            return { data: response.data, error: null };
                        }
                    }

                    console.error('Update requires an ID filter');
                    return { data: null, error: new Error('Update requires an ID filter') };
                } catch (error: any) {
                    console.error(`Error updating ${this._table}:`, error);
                    return { data: null, error: error.response?.data?.error || error };
                }
            },

            eq: function(column: string, value: any) {
                this._filters.push({ column, op: 'eq', value });
                return this;
            },

            order: function(column: string, options?: any) {
                this._orderBy = { column, ascending: options?.ascending ?? true };
                return this;
            },

            limit: function(count: number) {
                this._limitCount = count;
                return this;
            },

            single: async function() {
                const result = await this.execute();
                if (!result.data || result.data.length === 0) {
                    return { data: null, error: new Error('No rows found') };
                }
                return { data: result.data[0], error: null };
            },

            execute: async function() {
                try {
                    // Build query parameters - use simple format for backend
                    const params = new URLSearchParams();

                    // Add filters as simple key=value pairs
                    for (const filter of this._filters) {
                        // Backend expects simple params like user_id=123, not user_id=eq.123
                        if (filter.op === 'eq') {
                            params.append(filter.column, filter.value);
                        }
                        // For other operators, we might need custom handling or backend support
                    }

                    // Add ordering (if backend supports it)
                    if (this._orderBy) {
                        params.append('order_by', this._orderBy.column);
                        params.append('order_dir', this._orderBy.ascending ? 'asc' : 'desc');
                    }

                    // Add limit
                    if (this._limitCount !== null) {
                        params.append('limit', this._limitCount.toString());
                    }

                    const queryString = params.toString();
                    const url = `/v1/${this._table}${queryString ? `?${queryString}` : ''}`;

                    console.log(`Fetching from ${url}`);
                    const response = await client.get(url);
                    return { data: response.data, error: null };
                } catch (error: any) {
                    console.error(`Error fetching from ${this._table}:`, error);
                    // If route not found, return empty array instead of error for reads
                    if (error.response?.status === 404) {
                        console.log(`Table ${this._table} not found, returning empty result`);
                        return { data: [], error: null };
                    }
                    return { data: null, error: error.response?.data?.error || error };
                }
            },

            then: async function(resolve: any, reject: any) {
                try {
                    const result = await this.execute();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            }
        };

        return queryBuilder;
    },

    // Storage bucket shim - Return base64 directly for images
    storage: {
        from: (bucket: string) => ({
            upload: async (path: string, file: File) => {
                try {
                    const base64Data = await compressImage(file);

                    // Return base64 data URL directly - no need to upload separately
                    const dataUrl = `data:${file.type};base64,${base64Data}`;

                    console.log('Image converted to base64 for direct storage');
                    return { data: { path: dataUrl }, error: null };

                } catch (e: any) {
                    console.error('Image conversion error:', e);
                    return { data: null, error: { message: e.message } };
                }
            },
            getPublicUrl: (path: string) => {
                // If it's already a data URL, return as-is
                if (path && path.startsWith('data:')) {
                    return { data: { publicUrl: path } };
                }
                // Otherwise assume it's a stored path
                return { data: { publicUrl: `${API_URL}/v1/storage/${bucket}/${encodeURIComponent(path)}` } };
            }
        })
    },

    // Functions shim - Call real backend API
    functions: {
        invoke: async (name: string, { body }: any) => {
            try {
                console.log(`Calling backend function: ${name}`, body);

                // Map function names to backend endpoints
                let endpoint = '';
                if (name === 'async-analyze' || name === 'auto-classify-and-analyze') {
                    endpoint = '/v1/ai/analyze';
                } else if (name === 'app-version') {
                    // Return mock version for now since backend doesn't have this endpoint
                    return { data: { version: 'v1.0.0' }, error: null };
                } else if (name === 'redeem-invitation') {
                    endpoint = '/v1/auth/invitations/redeem';
                } else {
                    console.error(`Unknown function: ${name}`);
                    return { data: null, error: new Error(`Function ${name} not found`) };
                }

                // Call the real backend API
                const response = await client.post(endpoint, body);

                console.log(`Backend response for ${name}:`, response.data);
                return { data: response.data, error: null };
            } catch (error: any) {
                console.error(`Error calling backend function ${name}:`, error);
                return {
                    data: null,
                    error: error.response?.data?.error || error.message || error
                };
            }
        }
    },

    // Custom methods - Use real backend API
    analyze: async (description: string, imageUrl?: string) => {
        try {
            console.log('Calling backend analyze endpoint', { description, imageUrl });

            const response = await client.post('/analyze', {
                description,
                image_url: imageUrl
            });

            console.log('Backend analyze response:', response.data);
            return response;
        } catch (error: any) {
            console.error('Error calling backend analyze:', error);
            throw error;
        }
    },

    post: (url: string, data: any) => client.post(url, data),
    get: (url: string) => client.get(url),
    put: (url: string, data: any) => client.put(url, data),
    delete: (url: string) => client.delete(url)
};
