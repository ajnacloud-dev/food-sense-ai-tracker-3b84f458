# Implementation Plan: Enhanced Receipt & Workout Analysis

## Goal
Expand the AI Analysis service to support **Receipts** (Item-level detail, dates, merchants) and **Workouts** (Exercises, Sets, Reps), enabling granular tracking and "purchase pattern" analysis.

## User Review Required
> [!IMPORTANT]
> **Database Tables**: This update requires `app_receipts`, `app_receipt_items`, `app_workouts`, and `app_workout_exercises` tables to exist in your Ibex Cloud database. I will include a script to create them based on the existing JSON schemas.

## Proposed Changes

### 1. New AI Prompts
Create specialized prompts in `backend/src/prompts/` to force structured JSON output from OpenAI.

#### [NEW] `backend/src/prompts/receipt_system.md`
- **Role**: Expert accountant/shopper.
- **Output Schema**:
  ```json
  {
    "merchant_name": "string",
    "purchase_date": "YYYY-MM-DD",
    "purchase_time": "HH:MM",
    "total_amount": number,
    "currency": "USD",
    "items": [
      { "name": "string", "quantity": number, "price": number, "category": "string" }
    ],
    "category": "Groceries|Dining|etc"
  }
  ```

#### [NEW] `backend/src/prompts/workout_system.md`
- **Role**: Expert fitness coach.
- **Output Schema**:
  ```json
  {
    "workout_type": "string",
    "start_time": "HH:MM", # inferred or current
    "duration_minutes": number,
    "exercises": [
      { "name": "string", "sets": number, "reps": number, "weight_lbs": number }
    ],
    "calories_burned_estimate": number
  }
  ```

### 2. Backend Logic Update

#### [MODIFY] `backend/src/lib/ai.py`
- Update `_get_prompt` to load `receipt` and `workout` prompts from the new files.
- Ensure `process_request` propagates the specific category.

#### [MODIFY] `backend/src/handlers/analyze_direct.py`
- Refactor the main handler to switch on `category`:
  - **If Food**: Existing logic (create `food_entry`).
  - **If Receipt**:
    1. Create `receipt` record (Parent).
    2. Iterate `items` and create `receipt_items` records (Children) linked by `receipt_id`.
    3. Calculate totals if missing.
  - **If Workout**:
    1. Create `workout` record.
    2. Create `workout_exercises` records.

### 3. Database Initialization
- Run a setup script to ensure the 4 new tables (`app_receipts`, `app_receipt_items`, `app_workouts`, `app_workout_exercises`) exist in Ibex with the correct schema fields.

## Verification Plan

### Automated Tests
- Create `backend/scripts/test_receipt_analysis.sh`:
  - Sends a sample Receipt Image (base64).
  - Verifies entry created in `app_receipts`.
  - Verifies items created in `app_receipt_items`.
- Create `backend/scripts/test_workout_analysis.sh`.

### Manual User Verification
- User can upload a Receipt image in the App (Receipts Tab, if UI supports it) or use Postman.
- User can verify "Item Level" data appears in the Database (via `debug_ibex.py` or future UI update).
