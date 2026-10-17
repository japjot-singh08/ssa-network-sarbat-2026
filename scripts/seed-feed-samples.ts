import { transaction, closeStore } from "../lib/store";
import { sampleFeedPosts } from "../lib/sample-feed";
async function main() {
  const count = await transaction((s) => {
    let n = 0;
    for (const p of sampleFeedPosts) {
      if (
        !s.posts.some((x) => x.id === p.id) &&
        s.chapters.some((c) => c.id === p.chapterId)
      ) {
        s.posts.push({ ...p });
        n++;
      }
    }
    return n;
  });
  console.log(
    `Added ${count} fictional sample posts. No awards or user posts changed.`,
  );
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(closeStore);
