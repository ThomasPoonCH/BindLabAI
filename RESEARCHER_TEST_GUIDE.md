# BindLab: guide for 3–5 invited researchers

20 October 2026. Current assessment: **Ready for supervised demonstration only**.
The AI credentials must be corrected and live extraction accepted before an unsupervised beta.

## Invitation and consent

Invite researchers individually; do not publish an open beta link. The current site has no invitation-token access gate. Use a supervised local session or an access-controlled preview arranged by the owner. Do not deploy without the owner's approval.

Explain before testing: this is an early research-support prototype, not a validated laboratory safety or decision system. Independently check every number and instruction. Use only synthetic, public, or explicitly authorized materials; do not submit unpublished/confidential research. Google Gemini processes AI inputs. Records stay on the current browser/device; clearing storage, private mode, and device changes may remove them. No behavioral analytics are installed.

## A 20–30 minute session

1. Start from the homepage, open **Researcher dashboard**, then **New Reaction**.
2. Click **Load Synthetic Example**. Alpha and Beta are fictional compounds, not laboratory instructions. Alpha is 100 mg at 100 g/mol: 1 mmol. Beta is 1.5 equivalents at 150 g/mol: 1.5 mmol and 225 mg. A 0.100 M Alpha target corresponds to 10 mL final solution volume. Purity is unspecified; these are nominal amounts, not purity-corrected laboratory quantities.
3. Open **Field evidence and confirmation**. Check the source and confirm individual fields. Confirming Alpha mass must leave other fields unconfirmed. Enter an edit and verify its field status changes. Missing safety and downstream conditions remain unresolved; do not invent them.
4. Change **Starting mass or amount** to 200 mg. Independent answer: Alpha 2 mmol; Beta 3 mmol, 450 mg; final volume 20 mL. Review the calculation explanations.
5. **Save unfinished draft locally**, reload, and reopen it from My Experiments. Make a second record; verify both remain separate. Download a backup, import it, and observe that the copy needs renewed verification.
6. Export the preparation CSV. In Excel, use UTF-8, Delimited, Comma, and double-quote text qualifier if the import wizard appears. Check 450 mg for Beta. The eight columns separate source inputs from calculated rescaled values; blank means not established. No formulas are exported. Keep JSON backups securely: they include the original source text and notes.
7. On Calculators, reproduce 1 mL TFA per 2 L water, 2000 mL water, and 500 µL water. The entered B quantity/unit must remain intact. Check 10 µL sample + 990 µL diluent = 1000 µL, 100-fold dilution. These examples do not establish chemical compatibility or a validated analytical method.
8. When valid AI credentials and limiter settings are available, paste a synthetic procedure or upload one of `test/beta/synthetic-table.pdf` and `synthetic-scanned.pdf`. Explicitly authorize external AI processing. Check each amount, attribution, condition, source excerpt and uncertainty against the source. Apply only after reviewing; a draft is never execution-ready. Currently live generation returns an authentication error, so the facilitator should demonstrate failure recovery and the built-in fictional example instead of claiming a real extraction worked.
9. Open **Report a Problem / Give Feedback**. Choose a category and feature, describe the issue, and optionally give contact/role/usefulness. The approved local email fallback opens a draft addressed to the supplied BindLab contact; the researcher must send it. Download feedback if the mail client is unavailable. Server submission must not be described as delivered until the configured feedback store acknowledges it.

## Compare with the researcher's preferred workflow, including Excel

Use two equivalent fictional tasks with different names and quantities. Randomly assign half the participants to preferred-tools-first and half to BindLab-first, then swap tools. Allow each researcher to use their normal spreadsheet/template. Give equal source information, an independent answer key, equal review requirements and the same task endpoint: a checked, editable preparation sheet. Do not count time spent waiting for an unavailable AI service as a successful generation.

Task A is the Alpha/Beta example above, rescaled to 200 mg Alpha.
Task B uses fictional Gamma (MW 200 g/mol, initially 100 mg), Delta (MW 80 g/mol, 2 equivalents), and a 0.050 M Gamma target. Rescale Gamma to 200 mg: Gamma 1 mmol; Delta 2 mmol, 160 mg; final volume 20 mL. Purity is unspecified; no temperature, yield, purification or safety assessment is implied. Enter Task B manually in both tools while AI is unavailable. Once live extraction is accepted, use equivalent published/synthetic source text in both workflows and record service failures separately.

For each participant use a pseudonymous code and record:

| Metric | Preferred tools | BindLab |
| --- | --- | --- |
| Task/order and tool/template | | |
| Time from source receipt to checked export | | |
| Actions and corrections (count consistently) | | |
| Numerical/unit errors remaining at finish | | |
| Missing or incorrectly attributed source fields | | |
| Completed usable export? | | |
| Confidence, 1–5, before answer-key review | | |
| Would voluntarily use this again? Why? | | |

Record observations manually with consent; do not capture research contents or personal identity. The coordinator can ask participants to include these metrics voluntarily in feedback. Compare time and error counts per participant and summarize medians/ranges across the 3–5 sessions. Treat this sample as qualitative learning, not evidence of statistical superiority. Report Excel wins and unfinished BindLab tasks honestly.

## Stop criteria and follow-up

Stop if a unit is contradictory, an invented quantity looks confirmed, a save loses data, or a service failure is mistaken for success. Preserve a synthetic reproduction and export feedback. Do not run an actual experiment from the test sheet. Ask which part saved effort (extraction, missing-data review, rescaling, export), which added friction, and whether the researcher would return without prompting.
