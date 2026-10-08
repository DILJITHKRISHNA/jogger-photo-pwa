-- Login switches from phone number to email.
ALTER TABLE "users" ADD COLUMN "email" TEXT;
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Staff accounts from "365 users id list 6-10-2026.csv". Each account gets the
-- password of the existing (oldest) account with the same role, so ADMINs sign
-- in with the current admin password and everyone else with the current user
-- password. On a fresh database with no accounts yet, nothing is inserted
-- here — the seed script creates the first logins instead.
INSERT INTO "users" ("id", "name", "email", "passwordHash", "role", "active", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.name, v.email, src."passwordHash", v.role::"Role", true, NOW(), NOW()
FROM (VALUES
  ('Abhijith VC', 'abhijith.vc@jogger.co.in', 'EXECUTIVE'),
  ('Abhijith VV', 'abhijith.vv@jogger.co.in', 'EXECUTIVE'),
  ('Adithya Dinesh', 'adithya.d@jogger.co.in', 'EXECUTIVE'),
  ('Amal K Chandran', 'amal.kc@jogger.co.in', 'EXECUTIVE'),
  ('Ameenul Rashad', 'rashad@jogger.co.in', 'ADMIN'),
  ('Anoop AM', 'anoop.am@jogger.co.in', 'EXECUTIVE'),
  ('Anoop KM', 'anoop.km@jogger.co.in', 'EXECUTIVE'),
  ('Anusree N', 'anusree.n@jogger.co.in', 'EXECUTIVE'),
  ('Athira T', 'athira.t@jogger.co.in', 'EXECUTIVE'),
  ('Aysha Thoyba', 'aysha.thoyba@jogger.co.in', 'EXECUTIVE'),
  ('Deepika T', 'deepika.t@jogger.co.in', 'EXECUTIVE'),
  ('Deepu V', 'deepu.v@jogger.co.in', 'EXECUTIVE'),
  ('Dhanya V', 'dhanya.v@jogger.co.in', 'EXECUTIVE'),
  ('Gokulakannan M', 'gokulakannan.m@jogger.co.in', 'EXECUTIVE'),
  ('Jamsheer CP', 'jamsheer.cp@jogger.co.in', 'EXECUTIVE'),
  ('Jithu Peter', 'jithu.peter@jogger.co.in', 'EXECUTIVE'),
  ('Lajesh Kolath', 'lk@jogger.co.in', 'EXECUTIVE'),
  ('Lal Krishna', 'lal.krishna@jogger.co.in', 'EXECUTIVE'),
  ('Linu N', 'linu.n@jogger.co.in', 'EXECUTIVE'),
  ('Mahammad Faizal', 'mahammad.faizal@jogger.co.in', 'EXECUTIVE'),
  ('Muhammed Hadi', 'hadi@jogger.co.in', 'EXECUTIVE'),
  ('Muhammed Yasir M P', 'yasir.mp@jogger.co.in', 'EXECUTIVE'),
  ('Musamil PP', 'musamil@jogger.co.in', 'EXECUTIVE'),
  ('Nandhu PS', 'nandhu.ps@jogger.co.in', 'EXECUTIVE'),
  ('Nithin NP', 'nithin.n@jogger.co.in', 'EXECUTIVE'),
  ('Rashid P P', 'rashid.pp@jogger.co.in', 'EXECUTIVE'),
  ('Sahood K', 'sahood@jogger.co.in', 'EXECUTIVE'),
  ('Salam K', 'salam.k@jogger.co.in', 'EXECUTIVE'),
  ('Shamim SN', 'shamim.sn@jogger.co.in', 'EXECUTIVE'),
  ('Shibu Annangatt', 'shibu.a@jogger.co.in', 'EXECUTIVE'),
  ('Studio Jogger', 'studio@jogger.co.in', 'ADMIN'),
  ('Vijay Kumar', 'vijay.kumar@jogger.co.in', 'EXECUTIVE'),
  ('Vinay', 'vinay.d@jogger.co.in', 'EXECUTIVE')
) AS v(name, email, role)
JOIN LATERAL (
  SELECT u."passwordHash" FROM "users" u
  WHERE u."role" = v.role::"Role"
  ORDER BY u."createdAt" ASC
  LIMIT 1
) AS src ON true
ON CONFLICT ("email") DO NOTHING;
