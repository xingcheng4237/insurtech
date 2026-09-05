CREATE TABLE `subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`verified` boolean NOT NULL DEFAULT false,
	`verificationToken` varchar(64),
	`unsubscribeToken` varchar(64) NOT NULL,
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	`verifiedAt` timestamp,
	`unsubscribedAt` timestamp,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscribers_email_unique` UNIQUE(`email`)
);
