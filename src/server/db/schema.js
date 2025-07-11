"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentEvent = exports.payment = exports.file = exports.verification = exports.account = exports.session = exports.user = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
exports.user = (0, pg_core_1.pgTable)('user', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    emailVerified: (0, pg_core_1.boolean)('email_verified')
        .$defaultFn(function () { return false; })
        .notNull(),
    image: (0, pg_core_1.text)('image'),
    createdAt: (0, pg_core_1.timestamp)('created_at')
        .$defaultFn(function () { /* @__PURE__ */ return new Date(); })
        .notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at')
        .$defaultFn(function () { /* @__PURE__ */ return new Date(); })
        .notNull(),
    role: (0, pg_core_1.text)('role'),
    banned: (0, pg_core_1.boolean)('banned'),
    banReason: (0, pg_core_1.text)('ban_reason'),
    banExpires: (0, pg_core_1.timestamp)('ban_expires'),
});
exports.session = (0, pg_core_1.pgTable)('session', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    token: (0, pg_core_1.text)('token').notNull().unique(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull(),
    ipAddress: (0, pg_core_1.text)('ip_address'),
    userAgent: (0, pg_core_1.text)('user_agent'),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(function () { return exports.user.id; }, { onDelete: 'cascade' }),
    impersonatedBy: (0, pg_core_1.text)('impersonated_by'),
});
exports.account = (0, pg_core_1.pgTable)('account', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    accountId: (0, pg_core_1.text)('account_id').notNull(),
    providerId: (0, pg_core_1.text)('provider_id').notNull(),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(function () { return exports.user.id; }, { onDelete: 'cascade' }),
    accessToken: (0, pg_core_1.text)('access_token'),
    refreshToken: (0, pg_core_1.text)('refresh_token'),
    idToken: (0, pg_core_1.text)('id_token'),
    accessTokenExpiresAt: (0, pg_core_1.timestamp)('access_token_expires_at'),
    refreshTokenExpiresAt: (0, pg_core_1.timestamp)('refresh_token_expires_at'),
    scope: (0, pg_core_1.text)('scope'),
    password: (0, pg_core_1.text)('password'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull(),
});
exports.verification = (0, pg_core_1.pgTable)('verification', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    identifier: (0, pg_core_1.text)('identifier').notNull(),
    value: (0, pg_core_1.text)('value').notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').$defaultFn(function () { /* @__PURE__ */ return new Date(); }),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').$defaultFn(function () { /* @__PURE__ */ return new Date(); }),
});
exports.file = (0, pg_core_1.pgTable)('file', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    filename: (0, pg_core_1.text)('filename').notNull(),
    originalName: (0, pg_core_1.text)('original_name').notNull(),
    mimeType: (0, pg_core_1.text)('mime_type').notNull(),
    size: (0, pg_core_1.integer)('size').notNull(),
    width: (0, pg_core_1.integer)('width'),
    height: (0, pg_core_1.integer)('height'),
    r2Key: (0, pg_core_1.text)('r2_key').notNull(),
    thumbnailKey: (0, pg_core_1.text)('thumbnail_key'),
    uploadUserId: (0, pg_core_1.text)('upload_user_id')
        .notNull()
        .references(function () { return exports.user.id; }, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at')
        .$defaultFn(function () { /* @__PURE__ */ return new Date(); })
        .notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at')
        .$defaultFn(function () { /* @__PURE__ */ return new Date(); })
        .notNull(),
});
exports.payment = (0, pg_core_1.pgTable)('payment', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    priceId: (0, pg_core_1.text)('price_id').notNull(),
    type: (0, pg_core_1.text)('type').notNull(),
    interval: (0, pg_core_1.text)('interval'),
    userId: (0, pg_core_1.text)('user_id')
        .notNull()
        .references(function () { return exports.user.id; }, { onDelete: 'cascade' }),
    customerId: (0, pg_core_1.text)('customer_id').notNull(),
    subscriptionId: (0, pg_core_1.text)('subscription_id'),
    status: (0, pg_core_1.text)('status').notNull(),
    periodStart: (0, pg_core_1.timestamp)('period_start'),
    periodEnd: (0, pg_core_1.timestamp)('period_end'),
    cancelAtPeriodEnd: (0, pg_core_1.boolean)('cancel_at_period_end'),
    trialStart: (0, pg_core_1.timestamp)('trial_start'),
    trialEnd: (0, pg_core_1.timestamp)('trial_end'),
    createdAt: (0, pg_core_1.timestamp)('created_at')
        .$defaultFn(function () { /* @__PURE__ */ return new Date(); })
        .notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at')
        .$defaultFn(function () { /* @__PURE__ */ return new Date(); })
        .notNull(),
});
exports.paymentEvent = (0, pg_core_1.pgTable)('payment_event', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    paymentId: (0, pg_core_1.text)('payment_id')
        .notNull()
        .references(function () { return exports.payment.id; }, { onDelete: 'cascade' }),
    eventType: (0, pg_core_1.text)('event_type').notNull(),
    stripeEventId: (0, pg_core_1.text)('stripe_event_id').unique(),
    eventData: (0, pg_core_1.text)('event_data'), // JSON string
    createdAt: (0, pg_core_1.timestamp)('created_at')
        .$defaultFn(function () { /* @__PURE__ */ return new Date(); })
        .notNull(),
});
