ALTER TABLE "members"
ADD COLUMN "username" TEXT;

WITH computed AS (
  SELECT
    id,
    NULLIF(
      regexp_replace(
        lower(
          CASE
            WHEN array_length(regexp_split_to_array(trim(name), '\s+'), 1) >= 2
              THEN
                (regexp_split_to_array(trim(name), '\s+'))[1] ||
                (regexp_split_to_array(trim(name), '\s+'))[array_length(regexp_split_to_array(trim(name), '\s+'), 1)]
            ELSE trim(name)
          END
        ),
        '[^a-z0-9]',
        '',
        'g'
      ),
      ''
    ) AS username_candidate
  FROM "members"
),
unique_candidates AS (
  SELECT username_candidate
  FROM computed
  WHERE username_candidate IS NOT NULL
  GROUP BY username_candidate
  HAVING COUNT(*) = 1
)
UPDATE "members" AS members
SET "username" = computed.username_candidate
FROM computed
JOIN unique_candidates
  ON unique_candidates.username_candidate = computed.username_candidate
WHERE members.id = computed.id;

CREATE UNIQUE INDEX "members_username_key" ON "members"("username");
