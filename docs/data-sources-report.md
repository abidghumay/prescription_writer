# Data Source Evaluation Report (Bangladesh Pharmaceuticals)

This report evaluates candidate datasets for the offline Bangladesh medicine database, ordered as specified in Section 5 of the Master Specification.

---

### 1. DGHS / DGDA FHIR Terminology Resource
- **Provider**: Directorate General of Health Services (DGHS) & Directorate General of Drug Administration (DGDA), Bangladesh.
- **Access & License**: Public government terminology resource (open for national health information exchange).
- **Completeness**:
  - Contains official DGDA registration numbers, registered brand names, generics, and licensed manufacturers.
  - *Missing/Deficiencies*: Strengths are frequently concatenated directly into the brand title (e.g., `"Napa 500mg Tablet"`), dosage forms lack uniform taxonomy, and indicative prices are absent.
- **Cleaning Strategy**: Regex tokenizer to parse strength and form out of brand strings into snapshot columns; standardize manufacturer naming.
- **Recommendation**: Excellent for verifying registration numbers (`dgda_reg_no`), but requires substantial text parsing for clean tabular use.

---

### 2. Mendeley Data: "Medicinal Products in Bangladesh" (University of Dhaka)
- **Provider**: Department of Clinical Pharmacy & Pharmacology, University of Dhaka.
- **License**: **CC BY 4.0** (Creative Commons Attribution — free to use, share, and adapt with citation).
- **Completeness**:
  - Covers ~18,000+ commercial pharmaceutical formulations in Bangladesh.
  - Separates Brand Name, Generic Name, Strength, Dosage Form, and Manufacturer Name cleanly.
  - *Missing/Deficiencies*: Does not include brands registered after the publication cutoff (~2022/2023). Prices are indicative at the time of study.
- **Cleaning Strategy**:
  - Normalize generic synonyms (e.g., merge `"Acetaminophen"` into `"Paracetamol"`).
  - Normalize dosage forms (e.g., unify `"Tab."`, `"Tablet"`, `"F.C. Tablet"` to standardized categories).
  - Deduplicate multi-strength brand records.
- **Recommendation**: **Strongest legitimate, open-licensed option.** 100% legal to bundle and ship offline in your father's desktop app.

---

### 3. Commercial Reference Portals (MedEx, DIMS)
- **Terms & Legal Risk**:
  - MedEx and DIMS terms of service strictly prohibit automated data harvesting, web scraping, and redistribution.
  - Scraping without written consent exposes the project to copyright/terms violations and IP risk.
- **Recommendation**: **Do NOT scrape.** If desired, reach out to MedEx founders for an official export permission for a single doctor non-commercial chamber license. Until then, use the Mendeley dataset as the base.

---

### 4. Doctor Custom Entries (`is_custom = 1`)
- **Status**: Implemented and active.
- The doctor can add any unlisted or newly launched brand directly within the app (via UI or inline typing). Custom entries are immediately indexed into FTS5 with an amber "Custom" badge.
