CREATE TABLE "api_key" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"hashed_key" text NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "api_key_hashed_key_unique" UNIQUE("hashed_key")
);
--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;