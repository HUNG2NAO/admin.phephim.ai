import { getPool, withTransaction } from "@/lib/db";
import { validateSlug } from "@/lib/validation";

type StaticMovie = { slug: string; title: string; poster?: string; backdrop?: string };
type SourceRow = {
  slug: string; title: string; poster: string | null; bvid: string | null;
  publish_status: string; episode_count: number | string | null;
};
type OverrideRow = {
  slug: string; title_override: string | null; poster_override: string | null;
  hidden: boolean; version: number | string; updated_at: Date | string | null;
};

export type Movie = {
  slug: string; title: string; originalTitle: string; poster: string;
  bvid: string | null; source: "NEON" | "STATIC";
  status: string; episodeCount: number; hidden: boolean;
  titleOverride: string | null; posterOverride: string | null;
  version: number; updatedAt: string | null;
};

const STATIC_CATALOG_URL = process.env.STATIC_CATALOG_URL || "https://raw.githubusercontent.com/LETAN-Media/phephim/main/app/data/movies.json";

async function loadStaticMovies(): Promise<StaticMovie[]> {
  try {
    const result = await fetch(STATIC_CATALOG_URL, { next: { revalidate: 300 }, signal: AbortSignal.timeout(5500) });
    if (!result.ok) throw new Error(`HTTP ${result.status}`);
    const parsed: unknown = await result.json();
    if (!Array.isArray(parsed)) throw new Error("Invalid static catalog");
    return parsed.filter((m): m is StaticMovie => !!m && typeof m === "object" && typeof m.slug === "string" && typeof m.title === "string");
  } catch (error) {
    console.warn("Static movie catalog unavailable", error instanceof Error ? error.message : "unknown");
    return [];
  }
}

export async function getAllMovies(): Promise<Movie[]> {
  const [dynamic, overrides, staticMovies] = await Promise.all([
    getPool().query<SourceRow>(`
      SELECT p.movie_slug AS slug,
             COALESCE(NULLIF(m.approved_title, ''), NULLIF(p.title, ''), p.movie_slug) AS title,
             COALESCE(NULLIF(v.thumbnail_url, ''),
               (SELECT j.checkpoints->>'thumbnail' FROM toolnet_auto.processing_jobs j
                WHERE j.bvid = p.bvid AND j.checkpoints->>'thumbnail' IS NOT NULL
                LIMIT 1), '') AS poster,
             p.bvid, p.status AS publish_status,
             (SELECT COUNT(*) FROM movie_episodes e WHERE e.movie_slug = p.movie_slug) AS episode_count
      FROM toolnet_auto.publish_records p
      LEFT JOIN toolnet_auto.bilibili_videos v ON v.bvid = p.bvid
      LEFT JOIN toolnet_auto.video_metadata m ON m.bvid = p.bvid
      WHERE p.movie_slug IS NOT NULL AND p.movie_slug NOT IN ('', 'null', 'undefined', 'phim')
        AND p.status IN ('PUBLISHED', 'DRAFT')
      ORDER BY p.published_at DESC NULLS LAST, p.id DESC
      LIMIT 20000
    `),
    getPool().query<OverrideRow>(`SELECT slug, title_override, poster_override, hidden, version, updated_at FROM phe_admin.movie_overrides`),
    loadStaticMovies(),
  ]);

  const overrideBySlug = new Map(overrides.rows.map((row) => [row.slug, row]));
  const movies = new Map<string, Movie>();

  function add(row: { slug: string; title: string; poster: string; bvid: string | null; status: string; episodeCount: number; source: "NEON" | "STATIC" }) {
    if (!validateSlug(row.slug) || movies.has(row.slug)) return;
    const override = overrideBySlug.get(row.slug);
    movies.set(row.slug, {
      slug: row.slug,
      title: override?.title_override || row.title,
      originalTitle: row.title,
      poster: override?.poster_override || row.poster,
      titleOverride: override?.title_override || null,
      posterOverride: override?.poster_override || null,
      bvid: row.bvid,
      source: row.source,
      status: row.status,
      episodeCount: row.episodeCount,
      hidden: override?.hidden ?? false,
      version: Number(override?.version || 0),
      updatedAt: override?.updated_at ? new Date(override.updated_at).toISOString() : null,
    });
  }

  for (const row of dynamic.rows) {
    add({slug: row.slug, title: row.title, poster: row.poster || "", bvid: row.bvid,
      status: row.publish_status, episodeCount: Number(row.episode_count || 0), source: "NEON"});
  }
  for (const row of staticMovies) {
    add({slug: row.slug, title: row.title, poster: row.poster || "", bvid: null,
      status: "STATIC", episodeCount: 0, source: "STATIC"});
  }
  return [...movies.values()];
}

export type MovieQuery = { q?: string; status?: string; page?: number; pageSize?: number };

export async function listMovies(query: MovieQuery) {
  const page = Math.max(1, Math.min(99999, query.page || 1));
  const pageSize = Math.max(1, Math.min(100, query.pageSize || 24));
  const q = (query.q || "").trim().toLocaleLowerCase("vi");
  const status = query.status || "all";
  const all = await getAllMovies();
  const totals = {
    total: all.length,
    visible: all.filter((m) => !m.hidden && (m.status === "STATIC" || m.status === "PUBLISHED")).length,
    hidden: all.filter((m) => m.hidden).length,
    draft: all.filter((m) => m.status === "DRAFT").length,
  };
  const filtered = all.filter((m) => {
    if (status === "hidden" && !m.hidden) return false;
    if (status === "visible" && (m.hidden || m.status === "DRAFT")) return false;
    if (status === "draft" && m.status !== "DRAFT") return false;
    if (!q) return true;
    return `${m.title} ${m.originalTitle} ${m.slug} ${m.bvid || ""}`.toLocaleLowerCase("vi").includes(q);
  });
  return { items: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, pageSize, totals };
}

export class EditConflictError extends Error {}
export class NotFoundError extends Error {}

export async function patchMovie(
  slug: string, actorId: string,
  patch: { expectedVersion: number; titleOverride?: string | null; posterOverride?: string | null; hidden?: boolean },
) {
  const movies = await getAllMovies();
  if (!movies.some((m) => m.slug === slug)) throw new NotFoundError("Movie not found");
  return withTransaction(async (client) => {
    await client.query(`INSERT INTO phe_admin.movie_overrides (slug, updated_by) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING`, [slug, actorId]);
    const current = await client.query<OverrideRow>(
      `SELECT slug, title_override, poster_override, hidden, version, updated_at FROM phe_admin.movie_overrides WHERE slug = $1 FOR UPDATE`, [slug],
    );
    const row = current.rows[0];
    if (!row) throw new NotFoundError("Movie override not found");
    if (Number(row.version) !== patch.expectedVersion) throw new EditConflictError("The movie was modified by another admin");
    const nextTitle = patch.titleOverride === undefined ? row.title_override : patch.titleOverride;
    const nextPoster = patch.posterOverride === undefined ? row.poster_override : patch.posterOverride;
    const nextHidden = patch.hidden === undefined ? row.hidden : patch.hidden;
    const updated = await client.query<OverrideRow>(`
        UPDATE phe_admin.movie_overrides SET title_override = $2, poster_override = $3, hidden = $4,
        version = version + 1, updated_by = $5, updated_at = NOW() WHERE slug = $1
        RETURNING slug, title_override, poster_override, hidden, version, updated_at
      `, [slug, nextTitle, nextPoster, nextHidden, actorId]);
    await client.query(`INSERT INTO phe_admin.movie_audit_log (slug, actor_id, action, before_json, after_json)
      VALUES ($1, $2, 'UPDATE', $3::jsonb, $4::jsonb)`, [slug, actorId, JSON.stringify(row), JSON.stringify(updated.rows[0])]);
    return updated.rows[0];
  });
}
