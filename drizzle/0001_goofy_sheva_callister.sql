CREATE TABLE `encounter_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`encounter_id` text NOT NULL,
	`version` integer NOT NULL,
	`notes` text NOT NULL,
	`author` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`encounter_id`) REFERENCES `encounters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `encounter_version_unique` ON `encounter_versions` (`encounter_id`,`version`);--> statement-breakpoint
CREATE TABLE `encounters` (
	`id` text PRIMARY KEY NOT NULL,
	`appointment_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`author` text NOT NULL,
	`notes` text NOT NULL,
	`status` text NOT NULL,
	`version` integer NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `encounters_appointment_id_unique` ON `encounters` (`appointment_id`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text NOT NULL,
	`rate` text NOT NULL,
	`usd_cents` integer NOT NULL,
	`method` text NOT NULL,
	`reference` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`appointment_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`payer_id` text NOT NULL,
	`description` text NOT NULL,
	`total_cents` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payer_id`) REFERENCES `payers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` text PRIMARY KEY NOT NULL,
	`quote_id` text NOT NULL,
	`total_cents` integer NOT NULL,
	`fiscal_status` text NOT NULL,
	`fiscal_ref` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_quote_id_unique` ON `sales` (`quote_id`);--> statement-breakpoint
CREATE TRIGGER payment_balance BEFORE INSERT ON payments BEGIN
 SELECT RAISE(ABORT,'payment_exceeds_balance') WHERE NEW.usd_cents<=0 OR NEW.usd_cents>COALESCE((SELECT total_cents FROM sales WHERE id=NEW.sale_id),0)-COALESCE((SELECT SUM(usd_cents) FROM payments WHERE sale_id=NEW.sale_id),0);
END;
