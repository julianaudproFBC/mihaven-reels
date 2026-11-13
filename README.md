# Reels Mi-Haven

Agent qui fabrique et publie un Reel sur @mihaven.ma, 10 fois par jour (GitHub Actions).

- `queue.json` : Reels faits à la main, publiés en premier.
- `gen/make.mjs` : fabrique un nouveau Reel (8 formats ; logements, accroches et musiques en rotation).
- `gen/render.mjs` : rendu vidéo. `gen/post.mjs` : publication.
- `history.json` et `published.json` : ce qui est déjà publié.
