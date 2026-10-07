import sqlite3

conn = sqlite3.connect('data/media_hub.db')
c = conn.cursor()
c.execute("SELECT count(id) FROM media WHERE id LIKE 'mock-%'")
count = c.fetchone()[0]
print(f"Mock items in DB: {count}")

c.execute("DELETE FROM favorites WHERE media_id LIKE 'mock-%'")
c.execute("DELETE FROM watchlists WHERE media_id LIKE 'mock-%'")
c.execute("DELETE FROM watch_progress WHERE media_id LIKE 'mock-%'")
c.execute("DELETE FROM reading_progress WHERE book_id LIKE 'mock-%'")
c.execute("DELETE FROM episodes WHERE id LIKE 'mock-%'")
c.execute("DELETE FROM seasons WHERE id LIKE 'mock-%' OR series_id LIKE 'mock-%'")
c.execute("DELETE FROM movies WHERE id LIKE 'mock-%'")
c.execute("DELETE FROM series WHERE id LIKE 'mock-%'")
c.execute("DELETE FROM media WHERE id LIKE 'mock-%'")
conn.commit()
print("Cleaned all mock items from database successfully.")
conn.close()
