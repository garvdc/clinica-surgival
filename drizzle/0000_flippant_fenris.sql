CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`payer_id` text NOT NULL,
	`professional_id` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`duration` integer NOT NULL,
	`reason` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payer_id`) REFERENCES `payers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`professional_id`) REFERENCES `professionals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `appointments_schedule` ON `appointments` (`professional_id`,`date`,`status`);--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`email` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`window` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`entity_id` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `patient_payers` (
	`patient_id` text NOT NULL,
	`payer_id` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payer_id`) REFERENCES `payers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `patient_payer_unique` ON `patient_payers` (`patient_id`,`payer_id`);--> statement-breakpoint
CREATE TABLE `patients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`document` text NOT NULL,
	`phone` text NOT NULL,
	`birth_date` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `patients_document_unique` ON `patients` (`document`);--> statement-breakpoint
CREATE TABLE `payers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `professionals` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`specialty` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`salt` text NOT NULL,
	`password_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TRIGGER appointment_no_overlap_insert BEFORE INSERT ON appointments WHEN NEW.status NOT IN ('cancelada','no_asistio') BEGIN
 SELECT RAISE(ABORT,'appointment_overlap') WHERE EXISTS(SELECT 1 FROM appointments a WHERE a.professional_id=NEW.professional_id AND a.date=NEW.date AND a.status NOT IN ('cancelada','no_asistio') AND (CAST(substr(a.time,1,2) AS INTEGER)*60+CAST(substr(a.time,4,2) AS INTEGER)) < (CAST(substr(NEW.time,1,2) AS INTEGER)*60+CAST(substr(NEW.time,4,2) AS INTEGER)+NEW.duration) AND (CAST(substr(a.time,1,2) AS INTEGER)*60+CAST(substr(a.time,4,2) AS INTEGER)+a.duration) > (CAST(substr(NEW.time,1,2) AS INTEGER)*60+CAST(substr(NEW.time,4,2) AS INTEGER)));
END;
--> statement-breakpoint
CREATE TRIGGER appointment_no_overlap_update BEFORE UPDATE ON appointments WHEN NEW.status NOT IN ('cancelada','no_asistio') BEGIN
 SELECT RAISE(ABORT,'appointment_overlap') WHERE EXISTS(SELECT 1 FROM appointments a WHERE a.id<>NEW.id AND a.professional_id=NEW.professional_id AND a.date=NEW.date AND a.status NOT IN ('cancelada','no_asistio') AND (CAST(substr(a.time,1,2) AS INTEGER)*60+CAST(substr(a.time,4,2) AS INTEGER)) < (CAST(substr(NEW.time,1,2) AS INTEGER)*60+CAST(substr(NEW.time,4,2) AS INTEGER)+NEW.duration) AND (CAST(substr(a.time,1,2) AS INTEGER)*60+CAST(substr(a.time,4,2) AS INTEGER)+a.duration) > (CAST(substr(NEW.time,1,2) AS INTEGER)*60+CAST(substr(NEW.time,4,2) AS INTEGER)));
END;
