-- Apply when MySQL is available: npx prisma db push
-- Manual fallback for consultation lifecycle + wallet payout

ALTER TABLE `User`
  ADD COLUMN IF NOT EXISTS `bankIban` VARCHAR(34) NULL,
  ADD COLUMN IF NOT EXISTS `bankAccountName` VARCHAR(120) NULL;

ALTER TABLE `Consultation`
  ADD COLUMN IF NOT EXISTS `cancelRequestedAt` DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS `statusBeforeCancel` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `lastRejectReason` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `rejectedLawyerSlugs` JSON NULL;

CREATE TABLE IF NOT EXISTS `WalletPayoutRequest` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `amountToman` INTEGER NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `bankIban` VARCHAR(34) NOT NULL,
  `bankAccountName` VARCHAR(120) NOT NULL,
  `userNote` VARCHAR(500) NULL,
  `staffNote` TEXT NULL,
  `reviewedAt` DATETIME(3) NULL,
  `paidAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `WalletPayoutRequest_userId_createdAt_idx` (`userId`, `createdAt`),
  INDEX `WalletPayoutRequest_status_createdAt_idx` (`status`, `createdAt`),
  CONSTRAINT `WalletPayoutRequest_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
