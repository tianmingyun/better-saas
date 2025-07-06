CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"price_id" text NOT NULL,
	"type" text NOT NULL,
	"interval" text,
	"user_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"subscription_id" text,
	"status" text NOT NULL,
	"period_start" timestamp,
	"period_end" timestamp,
	"cancel_at_period_end" boolean,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_event" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"event_type" text NOT NULL,
	"stripe_event_id" text,
	"event_data" text,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "payment_event_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_event" ADD CONSTRAINT "payment_event_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE cascade ON UPDATE no action;