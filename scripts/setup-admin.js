#!/usr/bin/env tsx
"use strict";
/**
 * setup admin script
 * example: pnpm tsx scripts/setup-admin.ts admin@example.com
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables from .env file
var dotenv_1 = require("dotenv");
var node_path_1 = require("node:path");
var node_url_1 = require("node:url");
// Get current directory in ES module
var __filename = (0, node_url_1.fileURLToPath)(import.meta.url);
var __dirname = (0, node_path_1.dirname)(__filename);
// Load environment variables from .env file
(0, dotenv_1.config)({ path: (0, node_path_1.resolve)(__dirname, '../.env') });
var drizzle_orm_1 = require("drizzle-orm");
var neon_http_1 = require("drizzle-orm/neon-http");
var serverless_1 = require("@neondatabase/serverless");
var schema_1 = require("../src/server/db/schema");
var logger_1 = require("@/lib/logger/logger");
var setupAdminLogger = (0, logger_1.createChildLogger)('setup-admin');
// Create database connection
var databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL is not set');
    process.exit(1);
}
var sql = (0, serverless_1.neon)(databaseUrl);
var db = (0, neon_http_1.drizzle)(sql);
function getAdminEmails() {
    var adminEmails = process.env.ADMIN_EMAILS || '';
    return adminEmails.split(',').map(function (email) { return email.trim(); }).filter(Boolean);
}
function isAdminEmail(email) {
    var adminEmails = getAdminEmails();
    return adminEmails.includes(email);
}
function setupAdmin(email) {
    return __awaiter(this, void 0, void 0, function () {
        var existingUser, currentUser, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    setupAdminLogger.info('🔍 check admin config...');
                    // check if the email is in the admin list
                    if (!isAdminEmail(email)) {
                        setupAdminLogger.error('❌ error: this email is not in the admin list');
                        setupAdminLogger.info('please add this email to the ADMIN_EMAILS environment variable');
                        setupAdminLogger.info('current admin emails:', getAdminEmails());
                        process.exit(1);
                    }
                    // find user
                    setupAdminLogger.info("\uD83D\uDD0D find user: ".concat(email));
                    return [4 /*yield*/, db
                            .select()
                            .from(schema_1.user)
                            .where((0, drizzle_orm_1.eq)(schema_1.user.email, email))
                            .limit(1)];
                case 1:
                    existingUser = _a.sent();
                    if (existingUser.length === 0) {
                        setupAdminLogger.error('❌ error: user not found');
                        setupAdminLogger.info('please ensure the user has registered an account');
                        process.exit(1);
                    }
                    currentUser = existingUser[0];
                    if (!currentUser) {
                        setupAdminLogger.error('❌ error: user data is abnormal');
                        process.exit(1);
                    }
                    // check if the user is already an admin
                    if (currentUser.role === 'admin') {
                        setupAdminLogger.warn('✅ this user is already an admin');
                        return [2 /*return*/];
                    }
                    // update user role to admin
                    setupAdminLogger.info('🔄 set user to admin...');
                    return [4 /*yield*/, db
                            .update(schema_1.user)
                            .set({
                            role: 'admin',
                            updatedAt: new Date()
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.user.email, email))];
                case 2:
                    _a.sent();
                    setupAdminLogger.info('✅ success set admin');
                    setupAdminLogger.info("".concat(email, " is now an admin"));
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('❌ error: failed to set admin:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var email, emailRegex;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    email = process.argv[2];
                    if (!email) {
                        setupAdminLogger.error('❌ error: please provide an email address');
                        setupAdminLogger.info('example: pnpm tsx scripts/setup-admin.ts admin@example.com');
                        process.exit(1);
                    }
                    emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(email)) {
                        setupAdminLogger.error('❌ error: invalid email format');
                        process.exit(1);
                    }
                    return [4 /*yield*/, setupAdmin(email)];
                case 1:
                    _a.sent();
                    process.exit(0);
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error);
