-- AlterTable
ALTER TABLE `Appointment` MODIFY `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Appointment` ADD COLUMN `guestClientName` VARCHAR(120) NULL,
    ADD COLUMN `guestClientPhone` VARCHAR(20) NULL;
