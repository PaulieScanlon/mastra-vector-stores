# mastra-vector-stores

Looping logo animations for the vector store vendors Mastra supports. No audio, no outro.

## Compositions

| ID | Scene | Notes |
|----|-------|-------|
| `LogoWall` | `src/scenes/logo-wall.tsx` | 4-row marquee, alternating directions, 14s seamless loop. `mode` prop: `"full"` or `"icon-label"`. |
| `Orbit` | `src/scenes/orbit.tsx` | 3D atom: cursor clicks the Mastra sphere, icons fan out from behind it and orbit on three rings, then gather back. Matte spheres, chromatic aberration. `desaturateIcons` prop. 9s loop. |
| `EmbeddingsFlight` | `src/scenes/embeddings-flight.tsx` | Fly through a rotating tunnel of embedding dots past vendor cards, with dots branching into each. `logoStyle` (`"full"` cards or `"icon"` spheres) and `desaturateIcons` props. 20s loop. |

```bash
npm start
npm run render:logo-wall
npm run render:orbit
npm run render:embeddings-flight
```

The 3D scenes use `@remotion/three` and render with `--gl=angle`. `remotion.config.ts` also pins the render server to port 3917, so renders don't collide with another dev server on 3000. Post-processing runs through `src/components/remotion-effects.tsx`, which holds each frame until the effect composer is ready.

## Logos

Vendor list lives in `src/data/vendors.ts`. Slugs match the docs URLs (`mastra.ai/reference/vectors/<slug>`).

```
public/logos/
  icons/<slug>.svg   -- all 20, icon only, colored for dark backgrounds
  full/<slug>.svg    -- 15 with an official icon + text lockup
```

No official lockup: Astra DB, Azure AI Search, libSQL, Amazon S3 Vectors, turbopuffer. These fall back to icon + name in `full` mode.

Sources: svgl.app, vendor sites and brand pages, vendor GitHub repos (DuckDB, Weaviate, LanceDB, DataStax), Elastic EUI, the official Azure and AWS architecture icon packs, Wikimedia (Oracle, Cloudflare, Elasticsearch wordmarks), and mastra.ai/integrations.

Dark-background edits: Chroma, Couchbase, Elasticsearch, OpenSearch, Pinecone and Cloudflare had dark text/segments recolored to white. LanceDB's wordmark is an embedded PNG (857×200) from their repo.
