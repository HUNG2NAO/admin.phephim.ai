# One-time PHEPHIM.AI public site integration

The public website's `app/services/catalog.py` merges Neon published records with `app/data/movies.json`. If the admin app modified just `video_metadata`, `publish_records`, or `movies.json`, the Toolnet publisher could overwrite manual edits and static movies would not be represented consistently.

Instead use the new isolated `phe_admin.movie_overrides` table. In the **existing PHEPHIM.AI project only**, add the two helper functions shown in `catalog_overrides_snippet.py` to `app/services/catalog.py`.

1. In `catalog(include_drafts=False)`, change final `return merged` to `return apply_admin_movie_overrides(merged)`.
2. In `movie_for_slug`, before fallback SQL after `m = catalog(...).get(target_slug)` and `if m: return m`, check `if is_admin_movie_hidden(target_slug): return None`. This blocks hidden films from direct detail/watch URL fallback.
3. For the standalone fallback DB query (if used), apply the override to the returned single movie as well, not just catalog. Build a map `{slug: movie}`, run `apply_admin_movie_overrides`, then return the mapped value (or `None` if hidden). Repeat for `movie_sources` fallback.
4. Ensure sitemap/search/home/category consume `catalog` or `get_public_movies`, not a separate cached copy.
5. Test existing static movies and published/DRAFT entries. Verify replacing covers and hiding/unhiding works on the public site; ensure the Toolnet publisher's next job does not overwrite the overrides.
6. Make the site patch in a separate Git branch, test staging, then deploy safely. Do **not** edit Toolnet pipelines, source URLs, player, SRT, Telegram or files on a running job.

The helper uses the existing app's SQLAlchemy engine and is read-only. When the admin schema is missing, it returns the original catalog so the website can deploy safely before the migration.
