-- CreateTable
CREATE TABLE `DocumentRequest` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `consultationId` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NULL,
    `note` VARCHAR(500) NULL,
    `createdByLawyerSlug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DocumentRequest_messageId_key`(`messageId`),
    INDEX `DocumentRequest_conversationId_createdAt_idx`(`conversationId`, `createdAt`),
    INDEX `DocumentRequest_consultationId_idx`(`consultationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentRequestItem` (
    `id` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `documentId` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `rejectReason` VARCHAR(300) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DocumentRequestItem_documentId_key`(`documentId`),
    INDEX `DocumentRequestItem_requestId_sortOrder_idx`(`requestId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DocumentRequest` ADD CONSTRAINT `DocumentRequest_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentRequest` ADD CONSTRAINT `DocumentRequest_consultationId_fkey` FOREIGN KEY (`consultationId`) REFERENCES `Consultation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentRequest` ADD CONSTRAINT `DocumentRequest_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentRequestItem` ADD CONSTRAINT `DocumentRequestItem_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `DocumentRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentRequestItem` ADD CONSTRAINT `DocumentRequestItem_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `ConsultationDocument`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
