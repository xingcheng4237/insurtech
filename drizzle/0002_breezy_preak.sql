CREATE TABLE `collection_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`collectionTime` float NOT NULL,
	`articleCount` int NOT NULL,
	`emailSent` boolean NOT NULL DEFAULT false,
	`emailSentAt` timestamp,
	`errorMessage` text,
	`status` enum('success','partial','failed') NOT NULL DEFAULT 'success',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collection_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `collection_logs` ADD CONSTRAINT `collection_logs_reportId_reports_id_fk` FOREIGN KEY (`reportId`) REFERENCES `reports`(`id`) ON DELETE no action ON UPDATE no action;