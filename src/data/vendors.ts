import { staticFile } from "remotion";

export type Vendor = {
  slug: string;
  name: string;
  fullLogoAspect?: number;
};

export const vendors: Vendor[] = [
  { slug: "astra", name: "Astra DB" },
  { slug: "azure-ai-search", name: "Azure AI Search" },
  { slug: "chroma", name: "Chroma", fullLogoAspect: 4.08 },
  { slug: "convex", name: "Convex", fullLogoAspect: 4.0 },
  { slug: "couchbase", name: "Couchbase", fullLogoAspect: 4.86 },
  { slug: "duckdb", name: "DuckDB", fullLogoAspect: 3.43 },
  { slug: "elasticsearch", name: "Elasticsearch", fullLogoAspect: 4.56 },
  { slug: "lance", name: "LanceDB", fullLogoAspect: 4.28 },
  { slug: "libsql", name: "libSQL" },
  { slug: "mongodb", name: "MongoDB", fullLogoAspect: 3.96 },
  { slug: "opensearch", name: "OpenSearch", fullLogoAspect: 5.17 },
  { slug: "oracledb", name: "Oracle Database", fullLogoAspect: 7.7 },
  { slug: "pg", name: "PostgreSQL", fullLogoAspect: 3.18 },
  { slug: "pinecone", name: "Pinecone", fullLogoAspect: 4.9 },
  { slug: "qdrant", name: "Qdrant", fullLogoAspect: 3.77 },
  { slug: "s3vectors", name: "Amazon S3 Vectors" },
  { slug: "turbopuffer", name: "turbopuffer" },
  { slug: "upstash", name: "Upstash", fullLogoAspect: 3.46 },
  { slug: "vectorize", name: "Cloudflare Vectorize", fullLogoAspect: 3.03 },
  { slug: "weaviate", name: "Weaviate", fullLogoAspect: 5.8 },
];

export const iconSrc = (vendor: Vendor) => {
  return staticFile(`logos/icons/${vendor.slug}.svg`);
};

export const fullLogoSrc = (vendor: Vendor) => {
  return staticFile(`logos/full/${vendor.slug}.svg`);
};
