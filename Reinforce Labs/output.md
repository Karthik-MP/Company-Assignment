# Understanding the Evaluation Output (Plain-English Guide)

This file explains **what the terminal output looks like** and **what it is telling you**, as if you were walking someone through it who hasn’t seen this project before.

---

## 1) “Resolved columns” (sanity check)

**What it looks like:**
```
Resolved columns:
  Model A: ModelCols(confidence='confidence_A', is_refusal='is_refusal_A', ...)
  Model B: ModelCols(confidence='confidence_B', is_refusal='is_refusal_B', ...)
```

**What it means:**
- The evaluator is confirming it found the right CSV columns for **Model A** and **Model B**.
- This is important because if these mappings were wrong, all metrics would be computed on the wrong data.

**How to read it:**
- `confidence_A` / `confidence_B` → the model’s confidence score (0 to 1)
- `is_refusal_*` → did the model refuse to answer?
- `refusal_type_*` → if it refused, was it **compliance** (policy/safety) or **capability** (can’t answer / missing data)?
- `is_hallucination_*` → did the model invent an incorrect answer? (very expensive)
- `latency_ms_*` → response time in milliseconds

---

## 2) “Overall summary” table (the scoreboard)

**What it looks like:**
A table with one row for Model A and one row for Model B, including counts, rates, scores, latency, and annual cost.

**What it tells you:**
This section is the **big picture**: who is safer, who refuses more, who hallucinates more, and what that means in **expected business cost**.

### Key columns in plain language

- **N**: How many test examples were evaluated (here `50`)
- **hallucinations**: How many times the model hallucinated (invented an answer)
- **unjustified_refusals**: How many times the model refused **even though data existed** (these are penalized)
- **compliance_refusals**: Refusals for policy/safety reasons (these are *not* penalized)
- **capability_refusals**: Refusals because the model couldn’t answer (some are justified, some not)
- **halluc_rate**: hallucinations / N
- **unjust_refusal_rate**: unjustified_refusals / N
- **S_base**: score from costs (hallucinations + unjustified refusals)
- **S_oc**: score with an extra penalty for **overconfident** hallucinations (confidence > τ)
- **mean / median / p95 / p99 latency**: typical and worst-case response time
- **annual_cost_raw**: annualized cost from hallucinations only
- **annual_cost_raw_plus_refusal**: annualized cost from hallucinations + unjustified refusals

### What your run shows (in simple terms)

- **Model A**
  - Has **0 hallucinations** → very safe
  - Has **some unjustified refusals** (3) → sometimes says “I can’t” even when it could
  - Score is near perfect (`~0.997`)
  - Annual cost is dominated by refusal penalties, not hallucinations

- **Model B**
  - Has **7 hallucinations** out of 50 → **very risky**
  - Has fewer refusals, but it “answers anyway” and sometimes invents things
  - Score is much lower (`~0.86 base`, `~0.84 with overconfidence penalty`)
  - Annual cost is massively higher because hallucinations cost much more

**Takeaway from the summary table:**
> Even if B is a bit faster and refuses less, its hallucinations are so expensive that it becomes a “No-Go” under the provided cost model.

---

## 3) “Regression metric: R_unsafe” (the scary behavior change)

**What it looks like:**
```
Regression metric:
  R_unsafe (A refused AND B hallucinated): 0.100000  (count=5)
  R_unsafe_comp ... 
  R_unsafe_cap  ...
```

**What it means:**
This metric checks a critical safety regression:

> The old model (A) refused to answer, but the new model (B) tried to answer and hallucinated.

- **R_unsafe = 0.10** means: in **10% of examples**, B hallucinated exactly where A refused.
- The split tells you *what kind* of refusal A made:
  - **comp** = compliance refusal (policy). This is the worst if B hallucinates.
  - **cap** = capability refusal (missing data / can’t answer). Still bad, but different failure mode.

**In your run:**
- `R_unsafe_comp = 0.0` → good (no policy refusal → hallucination cases)
- `R_unsafe_cap = 0.10` → all unsafe regressions came from capability refusals

**Takeaway:**
> B is hallucinating in places where A correctly chose to refuse due to missing capability/data.

---

## 4) “Annualized expected cost” (exec-friendly dollars)

**What it looks like:**
```
Annualized expected cost:
  Model A: $...
  Model B: $...
  Delta (B - A): $...
```

**What it means:**
You take the observed rates from the dataset and project them to an expected workload (e.g., **500,000 queries/year**).

- Hallucinations are extremely expensive (given \$1,000,000 each).
- Unjustified refusals are expensive but much less (given \$50,000 each).

**In your run:**
- Model B ends up **tens of billions of dollars more expensive** annually than Model A.
- That single line is often enough for a decision.

---

## 5) “Worst slices by cost-per-query regression” (where it goes wrong)

**What a “slice” is:**
A slice is a subset of the data, for example:
- query_type = `math`
- complexity = `high`
- data_availability = `none`

**What it looks like:**
A table with columns like:
- `N`: number of examples in that slice
- `A_hall_rate`, `B_hall_rate`: hallucination rates in that slice
- `A_unjust_ref_rate`, `B_unjust_ref_rate`: unjustified refusal rates
- `R_unsafe`: unsafe regression rate in that slice
- `delta_cost_per_query`: how much more expensive B is **per query** in that slice

**How to interpret:**
- Very large `delta_cost_per_query` means B is much worse in that slice.
- Some rows have `N=1` (only one example). Those are **useful as red flags** but not statistically strong.
- More trustworthy slice tables are the aggregated ones: “by query_type”, “by complexity”, “by data_availability”.

**In your run:**
- The worst behavior shows up strongly when `data_availability = none` (missing data),
  where B is much more likely to hallucinate instead of refusing.

---

## 6) Latency (performance) section

**What it means:**
- `mean_latency_ms` is average response time
- `p95_latency_ms` is the time under which 95% of requests finish (tail latency)
- `p99_latency_ms` is the tail tail latency (rare slow cases)

**In your run:**
- B is somewhat faster on average.
- But latency improvements **do not justify** significantly higher hallucination risk given the cost model.

**Takeaway:**
> Latency can break ties, but safety dominates when hallucinations are very expensive.

---

## 7) Final plain-English conclusion (what the output is saying)

If you summarize the entire output as one statement:

> Model A is safer and far cheaper under the given business costs.  
> Model B is slightly faster and refuses less, but it hallucinates often enough to create catastrophic expected cost and unsafe regressions.

---

## 8) If you want one “report-ready” paragraph

Model A strongly outperforms Model B on safety and expected cost. While Model B reduces refusals and improves average latency, it introduces a high hallucination rate and unsafe regressions where Model A refused but Model B hallucinated. Under the provided cost model (hallucinations \$1M each; unjustified refusals \$50k each) and annual query volume scaling, Model B produces a dramatically higher expected annual cost. Slice analysis indicates the regression is concentrated in slices with missing data availability, where Model B tends to hallucinate instead of refusing. Therefore, the evaluation recommends selecting Model A (or requiring strong mitigations before considering Model B).

