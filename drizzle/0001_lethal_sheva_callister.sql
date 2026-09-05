CREATE TABLE `articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`url` varchar(1024) NOT NULL,
	`source` varchar(256),
	`publishedDate` varchar(128),
	`snippet` text,
	`category` varchar(128),
	`region` varchar(64),
	`collectedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `articles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportDate` timestamp NOT NULL,
	`htmlContent` text NOT NULL,
	`aiAnalysis` text,
	`articleCount` int NOT NULL DEFAULT 0,
	`categories` text,
	`emailSent` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
