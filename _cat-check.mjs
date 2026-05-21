import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/technostore";
const client = new MongoClient(uri);
await client.connect();
const db = client.db();

const cats = await db.collection("categories").find().sort({ name: 1 }).toArray();

const parents = cats.filter((c) => !c.parentId);
for (const p of parents) {
  const children = cats.filter((c) => String(c.parentId) === String(p._id));
  if (children.length > 0) {
    console.log(`${p.name} (${p.slug})`);
    children.forEach((c) => console.log(`  └─ ${c.name} (${c.slug})`));
  } else {
    console.log(`${p.name} (${p.slug})`);
  }
}
console.log("---");
console.log(`Total: ${cats.length} categorías`);
await client.close();
