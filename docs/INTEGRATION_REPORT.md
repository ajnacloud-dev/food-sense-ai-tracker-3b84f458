# Integration Report: Food Sense AI & Ibex DB 🤝

This document outlines how the **Food Sense AI Tracker** application integrates with the **Ibex DB Lambda** (S3 ACID Database).

## 1. Architecture Overview

- **Frontend (UI)**: React app using `axios` to query the Backend API.
    - Uses a `QueryBuilder` (in `lib/api.ts`) mimicking Supabase syntax.
    - Does NOT call Ibex DB directly; proxies all requests through the Backend API.
- **Backend API**: Python Lambda (FastAPI-style routing in `router.py`).
    - Acts as an abstraction layer / proxy.
    - Uses `IbexClient` (`lib/ibex_client.py`) to communicate with the Database.
- **Database**: Ibex DB Lambda (S3 + Iceberg + DuckDB).
    - The `IbexClient` sends HTTP requests to the deployed Ibex Lambda URL.

## 2. Integration Points

### A. Data Flow
1.  **UI Request**: UI calls `GET /v1/food_entries`.
2.  **Backend Route**: `router.py` matches `/v1/{table}` to `handlers/data_fixed.py`.
3.  **Handler Logic**: `list_data` maps `food_entries` -> `app_food_entries_v2` (internal table name).
4.  **Db Client**: `IbexClient.query()` constructs a payload:
    ```json
    {
      "operation": "QUERY",
      "table": "app_food_entries_v2",
      "filters": [...]
    }
    ```
5.  **Ibex Lambda**: Receives POST, executes DuckDB query on S3 Iceberg data, returns results.

### B. Table Mapping
The backend explicitly maps generic table names to specific versioned tables in `handlers/data_fixed.py` to prevent breaking changes:
*   `users` -> `app_users_v2`
*   `food_entries` -> `app_food_entries_v2`
*   Others -> `app_{table_name}`

### C. Configuration
The connection is established in `backend/src/app.py`.
*   **Env Vars**: `IBEX_API_URL`, `IBEX_API_KEY`.
*   **Multi-tenancy**: `TenantManager` allows dynamic switching of Tenant IDs / Namespaces based on request headers.

## 3. Findings & Recommendations

*   **Robustness**: The integration is well-structured. The Backend API acts as a smart layer, handling table versioning and sanitization (`NaN` -> `null`) before the UI sees data.
*   **Performance**: Since every data request involves a hop (UI -> Backend -> Ibex -> S3), latency is additive. Keeping the Backend and Ibex Lambda in the same AWS Region is critical.
*   **Authentication**: The UI passes a Bearer token. The Backend should verify this (Cognito/Amplify) before making calls to Ibex (which uses an API Key).

## 4. Status
✅ **Integration is Valid**. The code correctly instantiates the client and routes requests to the custom database service.
