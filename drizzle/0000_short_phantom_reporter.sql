CREATE TABLE `deployments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`repo_url` text NOT NULL,
	`dockerfile_path` text NOT NULL,
	`exposed_port` integer NOT NULL,
	`image_tag` text NOT NULL,
	`service_name` text NOT NULL,
	`domain` text NOT NULL,
	`status` text DEFAULT 'building' NOT NULL,
	`custom_labels_json` text,
	`error_message` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
