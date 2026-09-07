# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: the sales representative (営業担当).** Creates and chases quotations all day. Their
situation is repetitive and deadline-shaped: draft a quotation from a customer conversation, get the
line items and tax right, send the PDF, then remember to follow up before it expires. They work in
Japanese, in yen, and they are usually mid-task rather than exploring.

**Secondary: the sales manager.** Reads rather than writes. Wants to know what is coming: how much
is in flight, what closed, and what next quarter looks like. The dashboard and forecast exist for
this person.

## Product Purpose

QuoteCast turns quotation admin into a planning instrument. It handles the operational job —
compose a quotation with line items and grouped sections, calculate subtotals and 10% consumption
tax, render a print-ready 見積書 PDF, track status through its lifecycle — and then uses the
accumulated history to forecast future quotation volume and value.

Success is a rep who never loses a quotation to an expiry date, and a manager who can answer "what
does next quarter look like?" with a number and an honest confidence range rather than a guess.

## Positioning

The forecasting engine is the part a neighbouring app could not truthfully copy. It is not a moving
average with a trend line: it holds a pool of forecasting models (simple exponential smoothing,
damped trend ETS, the Theta method, a random walk, and their combination), estimates each model's
smoothing parameters by minimising one-step error, and then picks the model **per series** by
rolling-origin cross-validation. Confidence shown to the user is derived from each model's forecast
variance, so it is a real prediction interval rather than a decaying constant.

The product claim that follows: every forecast number can be explained — which model produced it,
how it scored against a naive benchmark, and how wide the uncertainty is.

## Operating Context

- Japanese B2B sales. Currency is JPY, tax is 10% consumption tax, documents are 見積書.
- Quotations carry: quotation number, customer name, project name, person in charge, issue date,
  expiry date, remarks, and line items organised into orderable groups.
- Status lifecycle: 下書き (draft) → 送付済み (sent) → 受注 (won) / 失注 (lost), plus 期限切れ (expired).
- The PDF is the deliverable that leaves the building; it is previewed in-browser before sending.
- Forecasting operates on monthly aggregates, looking back up to 24 months and up to 12 months ahead.
- The app is bilingual: Japanese is the default interface language, with an English toggle.

## Capabilities and Constraints

**Confirmed capabilities:** quotation CRUD with line items, item categories, drag-to-reorder groups,
in-browser PDF render and preview, quotation list filtering by status and date, dashboard with
monthly amount/volume trends and summary figures, monthly demand forecast with prediction intervals
and trend analysis.

**Constraints:**
- Forecast history is capped at 24 months by the API, which rules out reliable 12-month seasonality
  (a seasonal profile needs three full cycles); seasonality is deliberately not modelled.
- The forecasting library must stay free of database and framework dependencies — it takes numbers
  and returns predictions, which is what keeps it fully testable.
- The frontend API client is generated from the backend OpenAPI schema and is never hand-edited.
- No authentication or multi-tenancy; this is a single-team tool.

## Brand Commitments

- Product name: **QuoteCast** (クオートキャスト). The name pairs the quotation job with the
  forecasting mechanism, and both halves should stay legible in the interface.
- Japanese is the primary interface language; English is a first-class toggle, not an afterthought.
- Licensed MIT and published publicly as a portfolio piece, so the code and the interface are both
  read by people evaluating the author's judgement.
- **Standing visual preference: the contemporary B2B SaaS convention, played straight.** The user
  chose this over a dealt alternative visual direction. It is a commitment, not a fallback: no
  irony, no smuggled quirk. The craft bar is the **Stripe Dashboard** — tabular figures, precise
  number formatting, dense tables that stay readable, restrained colour reserved for state, and
  charts that show uncertainty honestly.

## Evidence on Hand

- `backend/seed_local.py` generates roughly 12 months of realistic quotation history — this is the
  only data the app ships with.
- `backend/scripts/benchmark_forecast.py` produces reproducible accuracy figures (MASE against
  naive, mean and drift baselines across five demand patterns). The numbers in the README come from
  this script and are real.
- There are **no** real customers, testimonials, case studies, usage statistics, or press. Future
  work must not invent any. Any name appearing in the UI is seeded sample data.

## Product Principles

1. **Every number is explainable.** If the interface shows a forecast, it can also show which model
   produced it and how uncertain it is. Nothing is presented with more confidence than it earned.
2. **The rep is mid-task, not exploring.** Common actions stay reachable without hunting; the list
   is dense and scannable rather than spacious and decorative.
3. **Uncertainty is shown, not hidden.** Prediction intervals and honest weak spots are part of the
   design, not a footnote.
4. **Japanese-first, English-equal.** Layouts must survive both languages without breaking; neither
   language reads like a translation of the other.
5. **The document is the deliverable.** The PDF is what the customer sees, so its fidelity and
   preview quality outrank interface flourish.

## Accessibility & Inclusion

No formal standard has been set by the user. Baseline requirement recorded for future work: the
interface must remain usable at 200% zoom and in both light and dark themes, colour must never be
the sole carrier of status meaning (the status lifecycle currently relies on colour alone), and
every interactive control must be keyboard reachable with a visible focus state.
