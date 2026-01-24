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
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
    baseURL: `${API_URL}/v1`,

    headers: {
        'Content-Type': 'application/json',
    },
});

client.interceptors.request.use(async (config) => {
    const token = await getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
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
                // Write Operation
                // Note: Generic backend uses POST for both insert and upsert
                const response = await client.post(`/data/${this.table}`, this.payload);
                // Response format from backend: { status: "success", id: "..." }
                // We typically want to return the data we sent or null
                // If single insert, return object. If array, return array.
                // For compatibility, we might want to fetch it back if select() was called?
                // Let's just return what we sent for now combined with ID if present
                resultData = this.payload;
            } else if (this.isDelete) {
                // Mock Delete - not implemented in backend yet
                console.warn('DELETE not implemented in generic backend yet');
                resultData = null;
            } else {
                // Read Operation
                const response = await client.get(`/data/${this.table}`);
                let rows = response.data;
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
    from: (table: string) => new QueryBuilder(table),

    // Storage bucket shim (Base64 to DB)
    storage: {
        from: (bucket: string) => ({
            upload: async (path: string, file: File) => {
                try {
                    const base64Data = await compressImage(file);

                    // Store in 'images' table
                    // POST /v1/images -> data.create_data('images')
                    await client.post('/images', {
                        file_path: path,
                        mime_type: file.type,
                        data: base64Data,
                        size_bytes: file.size,
                        created_at: new Date().toISOString()
                    });

                    return { data: { path: path }, error: null };

                } catch (e: any) {
                    console.error('Storage Upload Error:', e);
                    return { data: null, error: { message: e.message } };
                }
            },
            getPublicUrl: (path: string) => {
                // Returns full URL: API_URL/v1/storage/{path}
                return { data: { publicUrl: `${API_URL}/v1/storage/${encodeURIComponent(path)}` } };
            }
        })
    },

    // Functions shim
    functions: {
        invoke: async (name: string, { body }: any) => {
            if (name === 'redeem-invitation') {
                return client.post('/auth/invitations/redeem', body);
            }
            if (name === 'async-analyze') {
                return client.post('/ai/analyze', body);
            }
            return { data: null, error: 'Function not found' };
        }
    },

    // Custom methods
    analyze: async (description: string, imageUrl?: string) => {
        return client.post('/analyze', { description, imageUrl });
    },

    post: (url: string, data: any) => client.post(url, data)
};
