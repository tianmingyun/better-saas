CREATE TABLE "file" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"r2_key" text NOT NULL,
	"thumbnail_key" text,
	"upload_user_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_upload_user_id_user_id_fk" FOREIGN KEY ("upload_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;