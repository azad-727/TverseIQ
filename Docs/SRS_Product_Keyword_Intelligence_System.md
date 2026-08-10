# Software Requirements Specification
## TverseIQ
### For Thalasi Knitfab — Marketplace SEO, Keyword, Pricing & Roadmap Engine

**Version:** 1.0
**Date:** August 2026
**Author:** Azad Singh

---

## 1. Purpose & Scope

TverseIQ is a marketplace intelligence system for Thalasi Knitfab's Amazon, Flipkart, Google Shopping, and own-website sales channels. It has four functional modules, built in a specific dependency order because Module 2 supplies verified data to the other three:

| # | Module | Depends on |
|---|--------|-----------|
| 2 | Keyword Segmentation Engine | Raw ad report data (built first) |
| 1 | SEO Engine | Module 2's proven keyword list |
| 3 | Price Advisor | Independent (image + market comparables) |
| 4 | Demand/Roadmap Engine | Module 2 (keyword maturity) + Module 3 (price band) |

**This document specifies Phase 0–2 in full detail** (the Keyword Engine backbone: mapping, parsing, attribution, dashboard) since that is the immediate build target, and gives Modules 1/3/4 in outline form for continuity.

---

## 2. Module 2 — Keyword Segmentation Engine (build target)

### 2.1 Functional Requirements

**FR-1: Campaign–Product Mapping**
- User creates a mapping: one campaign name → one or more products.
- A campaign can be later re-mapped (e.g., split into single-product campaigns without losing history).

**FR-2: Report Upload**
- User uploads a Search Term Report (CSV/XLSX) on a weekly or monthly cadence.
- System detects and stores the report's **period** (start/end date) and whether an ASIN/SKU column is present.

**FR-3: Attribution (3-case logic)**

| Case | Condition | Attribution | Confidence |
|------|-----------|--------------|------------|
| A | Campaign mapped to exactly 1 product | Confirmed | 1.0 |
| B | Campaign mapped to >1 product, report has ASIN/SKU column | Confirmed (via ASIN match) | 1.0 |
| C | Campaign mapped to >1 product, no ASIN/SKU column | Shared (all mapped products) | `1 / n_mapped_products` |

**FR-4: Cumulative, Non-Duplicating Aggregation**
- The same keyword (e.g. "oversized t shirt for men") will legitimately appear in *every* weekly report with new period data. This is **not** a duplicate — it must be **added** to the running total.
- A **true duplicate** (the same report period re-uploaded) must be detected and must **not** double-count.
- See Section 3 for the exact mechanism.

**FR-5: Dashboard**
- Views: Product-wise, Keyword-wise, Campaign-wise.
- Filters: attribution type, confidence threshold, date range, min cumulative orders, CVR range, ACOS ceiling, match type, campaign theme, consistency (converted in X of last N reports).
- Sort: highest orders, highest CVR, most consistent, most recent, lowest ACOS.
- Insight flag: auto-suggest keywords ready to "graduate" to a dedicated Manual Exact campaign once they cross a confidence + order threshold (configurable, default: confidence ≥ 0.8 AND cumulative orders ≥ 5).

---

## 3. Duplicate Handling & Cumulative Correctness (critical design)

This is the core correctness requirement, so it's specified precisely.

### 3.1 Two distinct problems, two distinct mechanisms

**Problem A — Accidental re-upload of the exact same report file/period.**
Must be a no-op, not a double-add.

**Problem B — The same keyword recurring across different (legitimate) periods.**
Must be additive, not overwritten and not skipped.

### 3.2 Mechanism

**Step 1 — File-level guard.**
On upload, compute `SHA256(file_bytes)`. Store in `ads_report_upload.file_hash` with a **UNIQUE** constraint. A byte-identical re-upload is rejected immediately, before any row processing — cheapest possible check, stops the problem before it reaches the database.

**Step 2 — Row-level natural key (handles same period uploaded from a re-exported/slightly different file).**
```sql
UNIQUE KEY uq_period_row (campaign_id, keyword, match_type, period_start, period_end)
```
On insert, use `INSERT ... ON DUPLICATE KEY UPDATE` (MySQL) so a re-processed identical period **replaces** that period's row rather than inserting a second one. This makes the raw table itself idempotent per period — you can safely re-upload a corrected file for the same week and it self-heals instead of drifting.

**Step 3 — Cumulative aggregation is period-triggered, not row-count-triggered.**
`ProductKeywordStats` is **never** built by summing all of `SearchTermRow` on every read (too slow at scale — see Section 4). Instead:

- When a **new** period row is inserted (not an update to an existing period), fire an incremental update:
```sql
INSERT INTO product_keyword_stats
  (product_id, keyword, cumulative_orders, cumulative_spend, cumulative_sales,
   attribution_type, times_appeared, last_converted_date)
VALUES (?, ?, ?, ?, ?, ?, 1, ?)
ON DUPLICATE KEY UPDATE
  cumulative_orders = cumulative_orders + VALUES(cumulative_orders),
  cumulative_spend  = cumulative_spend  + VALUES(cumulative_spend),
  cumulative_sales  = cumulative_sales  + VALUES(cumulative_sales),
  times_appeared    = times_appeared + 1,
  last_converted_date = VALUES(last_converted_date);
```
- When an **existing** period row is *replaced* (Step 2's UPDATE branch), the delta (new − old) is applied to `product_keyword_stats` instead of the raw value — this is what prevents a corrected re-upload from inflating cumulative numbers.
- `cvr` and `confidence_score` are recomputed only for the touched `(product_id, keyword)` pairs after each upload batch — never a full-table recompute.

This gives O(rows in this upload) work per upload, regardless of how much history already exists — upload #200 is exactly as fast as upload #2.

---

## 4. Query Optimization Strategy

### 4.1 Indexing

| Table | Index | Purpose |
|-------|-------|---------|
| `product_keyword_stats` | `UNIQUE (product_id, keyword)` | Upsert target, primary lookup |
| `product_keyword_stats` | `(product_id, cumulative_orders DESC)` | "Highest converting keywords per product" — dashboard's most common query |
| `product_keyword_stats` | `(keyword, cumulative_orders DESC)` | Keyword-wise view |
| `product_keyword_stats` | `(confidence_score, attribution_type)` | Confidence/attribution filters |
| `search_term_row` | `UNIQUE (campaign_id, keyword, match_type, period_start, period_end)` | Dedup key (Section 3) |
| `search_term_row` | `(campaign_id, period_start)` | Upload-time lookups |
| `campaign_product_map` | `(campaign_id)`, `(product_id)` | Both directions of the mapping lookup |

### 4.2 Table growth control (the actual scaling risk)

The real long-term risk isn't `product_keyword_stats` (bounded — one row per unique product×keyword pair, grows slowly and predictably). It's `search_term_row` — raw report data, which grows every week forever.

- **Pre-aggregation is mandatory, not optional.** The dashboard must **never** query `search_term_row` directly for stats — it always reads from `product_keyword_stats`, which stays small (thousands of rows) even after years of weekly uploads (which would otherwise be millions of raw rows).
- **Partition `search_term_row` by month** (MySQL native `PARTITION BY RANGE` on `period_start`). Keeps upload-time inserts and any historical-audit queries fast without scanning irrelevant months.
- **Archive raw rows older than 12–18 months** to cold storage (or a compressed summary table) once they're fully folded into `product_keyword_stats` — the cumulative numbers don't need the raw rows to stay hot in the primary table.

### 4.3 Batch inserts (reuse your existing pattern)

Report uploads insert dozens-to-hundreds of rows at once. Insert as a single batched multi-row statement (same fix pattern already proven in T-verse's picklist import — batch `IN`-clause fetches instead of per-row round trips), not row-by-row. This is a straightforward extension of a pattern you've already implemented and benchmarked.

### 4.4 Read-path summary

```
Dashboard query
   → reads ONLY from product_keyword_stats (small, indexed, pre-aggregated)
   → never touches search_term_row directly

Upload processing
   → writes to search_term_row (idempotent per period, partitioned)
   → triggers incremental delta-upsert into product_keyword_stats
   → touches only the rows affected by this upload, nothing else
```

---

## 5. Data Model (DDL sketch)

```sql
CREATE TABLE product (
  product_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sku VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100)
);

CREATE TABLE campaign (
  campaign_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  campaign_name VARCHAR(255) UNIQUE NOT NULL,
  theme_tag VARCHAR(100)
);

CREATE TABLE campaign_product_map (
  campaign_id BIGINT NOT NULL REFERENCES campaign(campaign_id),
  product_id BIGINT NOT NULL REFERENCES product(product_id),
  mapped_date DATE NOT NULL,
  PRIMARY KEY (campaign_id, product_id)
);

CREATE TABLE ads_report_upload (
  upload_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  file_hash CHAR(64) UNIQUE NOT NULL,
  uploaded_at DATETIME NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  has_asin_column BOOLEAN NOT NULL
);

CREATE TABLE search_term_row (
  row_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  upload_id BIGINT NOT NULL REFERENCES ads_report_upload(upload_id),
  campaign_id BIGINT NOT NULL REFERENCES campaign(campaign_id),
  keyword VARCHAR(255) NOT NULL,
  match_type ENUM('BROAD','PHRASE','EXACT') NOT NULL,
  asin_sku VARCHAR(64) NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  orders INT DEFAULT 0,
  sales DECIMAL(10,2) DEFAULT 0,
  acos DECIMAL(5,2) NULL,
  UNIQUE KEY uq_period_row (campaign_id, keyword, match_type, period_start, period_end),
  INDEX idx_campaign_period (campaign_id, period_start)
) PARTITION BY RANGE (TO_DAYS(period_start)) (
  -- one partition per month, maintained via scheduled job
);

CREATE TABLE product_keyword_stats (
  product_id BIGINT NOT NULL REFERENCES product(product_id),
  keyword VARCHAR(255) NOT NULL,
  cumulative_orders INT DEFAULT 0,
  cumulative_spend DECIMAL(12,2) DEFAULT 0,
  cumulative_sales DECIMAL(12,2) DEFAULT 0,
  cvr DECIMAL(5,4) DEFAULT 0,
  attribution_type ENUM('confirmed','shared') NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 1.0,
  times_appeared INT DEFAULT 0,
  first_converted_date DATE,
  last_converted_date DATE,
  PRIMARY KEY (product_id, keyword),
  INDEX idx_product_orders (product_id, cumulative_orders DESC),
  INDEX idx_keyword_orders (keyword, cumulative_orders DESC),
  INDEX idx_confidence (confidence_score, attribution_type)
);
```

---

## 6. Non-Functional Requirements

- **Idempotency:** re-uploading any report (same or corrected) must never corrupt cumulative stats (Section 3).
- **Performance:** dashboard queries must return in <500ms regardless of how many historical uploads exist, by never scanning `search_term_row` at read time.
- **Auditability:** every `product_keyword_stats` number must be traceable back to the contributing `search_term_row` entries (via `upload_id` → `campaign_id` join) for manual verification.
- **Extensibility:** schema must not need breaking changes when Modules 1, 3, 4 are added — `product_keyword_stats` is designed to be *read* by the SEO Engine and Roadmap Engine without modification.

---

## 7. Tech Stack

- **Backend:** Java 25 / Spring Boot 3.4, MySQL (reusing T-verse's proven stack and batching patterns)
- **Frontend:** React (Vite) + Bootstrap 5, dark "Command Center" theme (consistent with T-verse)
- **Report parsing:** Apache POI (already used in T-verse for CSV/Excel ingestion)
- **Scheduled jobs:** Spring `@Scheduled` for monthly partition maintenance / archival

---

## 8. Modules 1, 3, 4 — Outline (future phases)

**Module 1 — SEO Engine:** Vision LLM extracts attributes from product images → title/bullet generation, with a lookup join against `product_keyword_stats` (confirmed, high-CVR keywords for that product) to ground generated copy instead of relying purely on image-guessed terms.

**Module 3 — Price Advisor:** Scraped competitor comparables (same category/attributes) → price distribution → position current price against it → suggested band. Independent data pipeline; output consumed by Module 4.

**Module 4 — Demand/Roadmap Engine:** Combines keyword maturity (from Module 2: count/consistency of confirmed keywords) + price positioning (Module 3) + BSR/demand tracking → phased launch roadmap with concrete next-actions per product.

---

## 9. Build Order

1. **Phase 0:** Schema + campaign-product mapping UI
2. **Phase 1:** Report parser + 3-case attribution + delta-upsert aggregation
3. **Phase 2:** Dashboard (all views, filters, sort, graduate-to-exact flag)
4. **Phase 3+:** Modules 1, 3, 4; RAG-grounded generation (deferred per prior decision)

---

## 10. Open Items / Assumptions

- Assumes Amazon Search Term Report export is available as CSV/XLSX with consistent column naming across periods — first real upload should be used to finalize the parser's column-mapping config.
- Assumes weekly/monthly upload cadence is manual (user-uploaded), not yet pulled automatically via SP-API — automatic ingestion is a natural Phase 3+ upgrade once the manual flow is proven.
- Partition maintenance (monthly partition creation) needs a scheduled job — not automatic in MySQL by default.
