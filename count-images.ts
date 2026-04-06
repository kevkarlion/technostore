import "dotenv/config";
import { getDb } from "@/config/db";

async function check() {
  const db = await getDb();

  const multi = await db.collection("products").countDocuments({
    supplier: "jotakp",
    "imageUrls.1": { $exists: true }
  });

  const single = await db.collection("products").countDocuments({
    supplier: "jotakp",
    $expr: { $eq: [{ $size: "$imageUrls" }, 1] }
  });

  const total = await db.collection("products").countDocuments({ supplier: "jotakp" });

  console.log("Products with 2+ images:", multi);
  console.log("Products with 1 image:", single);
  console.log("Total jotakp products:", total);
}

check();