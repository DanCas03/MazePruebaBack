-- back#46: campaign boards reshaped to 9:16 (all-timed, denser finale); the 15
-- ids keep their identity but their levels changed, so prior score/leaderboard
-- entries for them are meaningless and must be reset. Pre-release: no id
-- migration; client completion flags are kept; only ScoreEntry rows for the
-- campaign ids drop.
DELETE FROM "ScoreEntry"
WHERE "levelId" IN (
  'level-01','level-02','level-03','level-04','level-05',
  'level-06','level-07','level-08','level-09','level-10',
  'level-11','level-12','level-13','level-14','level-15'
);
