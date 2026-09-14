ALTER TABLE `users` ADD `active` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE TRIGGER users_keep_admin_update BEFORE UPDATE OF role,active ON users
WHEN OLD.role='admin' AND OLD.active=1 AND (NEW.role<>'admin' OR NEW.active<>1)
BEGIN
 SELECT RAISE(ABORT,'last_active_admin') WHERE NOT EXISTS(SELECT 1 FROM users WHERE id<>OLD.id AND role='admin' AND active=1);
END;
--> statement-breakpoint
CREATE TRIGGER users_keep_admin_delete BEFORE DELETE ON users
WHEN OLD.role='admin' AND OLD.active=1
BEGIN
 SELECT RAISE(ABORT,'last_active_admin') WHERE NOT EXISTS(SELECT 1 FROM users WHERE id<>OLD.id AND role='admin' AND active=1);
END;
--> statement-breakpoint
CREATE TRIGGER users_revoke_sessions AFTER UPDATE OF role,active,password_hash,salt,email ON users
WHEN OLD.role<>NEW.role OR OLD.active<>NEW.active OR OLD.password_hash<>NEW.password_hash OR OLD.salt<>NEW.salt OR OLD.email<>NEW.email
BEGIN
 DELETE FROM sessions WHERE user_id=NEW.id;
END;
