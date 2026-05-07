ALTER TABLE `character_chat_messages`
ADD COLUMN `sequence` INTEGER NOT NULL DEFAULT 0 AFTER `content`;

UPDATE `character_chat_messages` c
JOIN (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY userId, characterId
            ORDER BY createdAt ASC, CASE role WHEN 'user' THEN 0 ELSE 1 END, id ASC
        ) AS rowNumber
    FROM `character_chat_messages`
) ranked ON ranked.id = c.id
SET c.sequence = ranked.rowNumber;

CREATE INDEX `character_chat_messages_user_character_sequence_idx`
ON `character_chat_messages`(`userId`, `characterId`, `sequence`);
