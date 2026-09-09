# How `prompts_eval_v1.csv` was created

Short overview of how we picked the 100 prompts in this folder.

## Steps

1. **Start from DevGPT** (snapshot `20240514`): PR and issue prompts only, English, working share links. Use each conversation’s **first** prompt.

2. **Hold some prompts out.** See [`reserved_ids.json`](reserved_ids.json) in this folder. Those DevGPT conversation IDs were used to build the coding guidebook and must not appear in this study set.

3. **Draw 180 candidates** with simple rules (keywords / code present) so we get a mix: construction, testing, design, and so on — not only the most common types. Fixed random seed: `20260908`.

4. **Spot-check 28** of those by hand (activity + keep/drop) to see if the rules were good enough.

5. **LLM assist (sampling only):** screen the 180 for “keep or drop” and a suggested activity.

6. **Human veto** on drops and uncertain cases (rescue some, drop some).

7. **Add a few more “requirements”-like prompts** — that type was rare after step 6.

8. **Freeze 100** into `prompts_eval_v1.csv` (ids `E001`–`E100`). Random seed for the final draw: `20262934`.  
   `prompts_eval_v1.meta.json` stores extra info (e.g. original DevGPT link). The coding tool only needs the CSV; `reserved_ids.json` is for transparency / replication of the hold-out.
