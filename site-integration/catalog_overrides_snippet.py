# Add to LETAN-Media/phephim/app/services/catalog.py (not executed by admin app).
# This helper only SELECTs from the new Neon table.

def apply_admin_movie_overrides(movies: dict) -> dict:
    if not movies:
        return movies
    try:
        from app.core.database import engine
        from sqlalchemy import text
        with engine.connect() as db:
            overrides = db.execute(
                text('''
                    SELECT slug, title_override, poster_override, hidden
                    FROM phe_admin.movie_overrides
                    WHERE slug = ANY(CAST(:slugs AS text[]))
                '''),
                {"slugs": list(movies)}
            ).mappings().all()
    except Exception as exc:
        logger.warning('Admin overrides unavailable; using original catalog: %s', exc)
        return movies

    result = dict(movies)
    for override in overrides:
        slug = override['slug']
        if slug not in result:
            continue
        if override['hidden']:
            result.pop(slug, None)
            continue
        movie = dict(result[slug])
        if override['title_override']:
            movie['title'] = override['title_override']
        if override['poster_override']:
            movie['poster'] = override['poster_override']
            movie['backdrop'] = override['poster_override']
            movie['thumbnail_url'] = override['poster_override']
        result[slug] = movie
    return result


def is_admin_movie_hidden(slug: str) -> bool:
    if not slug:
        return False
    try:
        from app.core.database import engine
        from sqlalchemy import text
        with engine.connect() as db:
            return bool(db.execute(
                text('SELECT hidden FROM phe_admin.movie_overrides WHERE slug = :slug'),
                {'slug': slug}
            ).scalar_one_or_none())
    except Exception as exc:
        logger.warning('Cannot check hidden state for %s: %s', slug, exc)
        return False
