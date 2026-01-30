# What evaluate.py Computes 

## Output Summary

### Overall Metrics (Model A and Model B)

- **hallucinations**, halluc_rate
- **unjustified_refusals**, unjust_refusal_rate
- **S_base** (no overconfidence penalty → λ=0)
- **S_oc** (overconfidence penalty enabled → your τ/p/λ)
- **mean_latency_ms** (if latency column exists)
- **annual_cost_raw_plus_refusal** at 500,000 queries/year (hallucinations + unjustified refusals)

### Regression Metrics

- **R_unsafe** = P(A refused AND B hallucinated)
- **R_unsafe_comp** and **R_unsafe_cap** splits
- Counts

### Slice Regression Tables

**Worst slices** (ranked by `delta_cost_per_query`, then `delta_hall_rate`):

- By `(query_type, complexity, data_availability)` (the interaction slice)
- By `query_type` only
- By `complexity` only
- By `data_availability` only

**Each slice table includes:**
- A/B hallucination rates
- A/B unjustified refusal rates
- A/B S_oc
- R_unsafe / R_unsafe_comp / R_unsafe_cap
- Cost regression per query

---

## How to Run It

### 1. Put these files in the same folder

- `evaluate.py`
- `scoring.py`
- Your dataset (CSV / JSONL / JSON)

### 2. Run

```bash
python evaluate.py --data YOUR_FILE.csv
```

**If you don't have pandas:**

```bash
pip install pandas
```

---

## Required Dataset Columns

### Common columns (must exist)

- `query_type`
- `complexity`
- `data_availability`

### Per-model columns (A and B)

These can be named with common patterns like:

- `confidence_A` / `confidence_B` or `A_confidence` / `B_confidence`
- `is_refusal_A` / `is_refusal_B`
- `refusal_type_A` / `refusal_type_B` (values: `compliance` or `capability`)
- `is_hallucination_A` / `is_hallucination_B`

**Optional:**
- `latency_ms_A` / `latency_ms_B`

---

## Tune the Overconfidence Penalty (τ/p/λ)

**Defaults** match what you wrote:

```python
tau=0.9, p=2.0, lam=1.0
```

**You can change them:**

```bash
python evaluate.py --data YOUR_FILE.csv --tau 0.9 --p 2 --lam 1
```
