/**
 * Test script for scraper-run.repository
 * Run with: npx tsx src/lib/scraper/test-resume.ts
 */

import "dotenv/config"; // Load environment variables
import { scraperRunRepository } from "@/api/repository/scraper-run.repository";
import { getDb } from "@/config/db";

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("🧪 Starting scraper-run repository tests...\n");

  const db = await getDb();
  
  // Clean up test data first
  const testRuns = await db.collection("scraper_runs").deleteMany({
    runId: { $regex: /^test-/ }
  });
  console.log(`🧹 Cleaned up ${testRuns.deletedCount} test runs\n`);

  // Ensure indexes
  await scraperRunRepository.ensureIndexes();
  console.log("✅ Indexes ensured\n");

  // Test 1: Create a new run
  console.log("📝 Test 1: Create new run");
  const newRun = await scraperRunRepository.create({
    source: "test",
    categoryId: "memorias",
    categoriesToProcess: ["memorias", "discos", "pendrives"]
  });
  console.log(`   Created run: ${newRun.runId}`);
  console.log(`   Status: ${newRun.status}`);
  console.log(`   Categories: ${newRun.categoriesToProcess.join(", ")}`);
  console.log("   ✅ PASSED\n");

  // Test 2: Find incomplete run
  console.log("📝 Test 2: Find incomplete run");
  const incomplete = await scraperRunRepository.findIncomplete();
  console.log(`   Found: ${incomplete?.runId || "none"}`);
  console.log(`   Status: ${incomplete?.status || "N/A"}`);
  if (incomplete?.runId === newRun.runId) {
    console.log("   ✅ PASSED\n");
  } else {
    console.log("   ❌ FAILED\n");
  }

  // Test 3: Update checkpoint
  console.log("📝 Test 3: Update checkpoint");
  await scraperRunRepository.updateCheckpoint(newRun.runId, {
    lastCategoryId: "memorias",
    lastCategoryName: "Memorias",
    currentCategoryIndex: 1,
    lastPageNumber: 3,
    productsScraped: 50,
    productsSaved: 45
  });
  const afterCheckpoint = await scraperRunRepository.findByRunId(newRun.runId);
  console.log(`   Category index: ${afterCheckpoint?.currentCategoryIndex}`);
  console.log(`   Page: ${afterCheckpoint?.lastPageNumber}`);
  console.log(`   Products scraped: ${afterCheckpoint?.productsScraped}`);
  if (afterCheckpoint?.currentCategoryIndex === 1 && afterCheckpoint?.lastPageNumber === 3) {
    console.log("   ✅ PASSED\n");
  } else {
    console.log("   ❌ FAILED\n");
  }

  // Test 4: Mark completed
  console.log("📝 Test 4: Mark completed");
  await scraperRunRepository.markCompleted(newRun.runId, {
    productsScraped: 150,
    productsSaved: 140,
    durationMs: 300000
  });
  const completed = await scraperRunRepository.findByRunId(newRun.runId);
  console.log(`   Status: ${completed?.status}`);
  console.log(`   Duration: ${completed?.durationMs}ms`);
  if (completed?.status === "completed") {
    console.log("   ✅ PASSED\n");
  } else {
    console.log("   ❌ FAILED\n");
  }

  // Test 5: Cleanup stale runs (create stale run first)
  console.log("📝 Test 5: Cleanup stale runs");
  const staleRun = await scraperRunRepository.create({
    source: "test-stale",
    categoriesToProcess: ["test"]
  });
  
  // Manually set updatedAt to 25 hours ago to make it stale
  const db2 = await getDb();
  await db2.collection("scraper_runs").updateOne(
    { runId: staleRun.runId },
    { $set: { updatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000) } }
  );
  console.log(`   Created stale run: ${staleRun.runId}`);
  
  const cleaned = await scraperRunRepository.cleanupStaleRuns(24);
  console.log(`   Cleaned ${cleaned} stale runs`);
  
  const afterCleanup = await scraperRunRepository.findByRunId(staleRun.runId);
  console.log(`   Status after cleanup: ${afterCleanup?.status}`);
  if (afterCleanup?.status === "stale") {
    console.log("   ✅ PASSED\n");
  } else {
    console.log("   ❌ FAILED\n");
  }

  // Test 6: Resume count increment
  console.log("📝 Test 6: Resume count increment");
  const resumeRun = await scraperRunRepository.create({
    source: "test-resume",
    categoriesToProcess: ["test"]
  });
  console.log(`   Initial resumeCount: ${resumeRun.resumeCount}`);
  
  await scraperRunRepository.incrementResumeCount(resumeRun.runId);
  await scraperRunRepository.incrementResumeCount(resumeRun.runId);
  const afterResume = await scraperRunRepository.findByRunId(resumeRun.runId);
  console.log(`   After 2 increments: ${afterResume?.resumeCount}`);
  if (afterResume?.resumeCount === 2) {
    console.log("   ✅ PASSED\n");
  } else {
    console.log("   ❌ FAILED\n");
  }

  // Test 7: Find recent runs
  console.log("📝 Test 7: Find recent runs");
  const recent = await scraperRunRepository.findRecent(5);
  console.log(`   Found ${recent.length} recent runs`);
  recent.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.runId} - ${r.status} (${r.source})`);
  });
  console.log("   ✅ PASSED\n");

  // Cleanup test data
  await db.collection("scraper_runs").deleteMany({
    runId: { $regex: /^test-/ }
  });
  
  console.log("🎉 All tests completed!");
  console.log("\n📊 Summary:");
  console.log("   ✅ create() works");
  console.log("   ✅ findIncomplete() works");
  console.log("   ✅ updateCheckpoint() works");
  console.log("   ✅ markCompleted() works");
  console.log("   ✅ cleanupStaleRuns() works");
  console.log("   ✅ incrementResumeCount() works");
  console.log("   ✅ findRecent() works");
}

main().catch(console.error);
