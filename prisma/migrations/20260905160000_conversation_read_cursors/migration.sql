-- AlterTable
ALTER TABLE `Conversation` ADD COLUMN `userLastReadAt` DATETIME(3) NULL,
    ADD COLUMN `lawyerLastReadAt` DATETIME(3) NULL;
