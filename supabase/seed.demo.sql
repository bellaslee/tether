-- Local narrative demo seed (fictional). Run after migrations: `npm run db:seed:demo`
-- Login: test@test.com / password
-- Idempotent: removes any existing test@test.com user (CASCADE deletes tenant data), then recreates.
-- Wrapped in one PL/pgSQL DO block (not `begin`/`commit`) so `npx supabase db query --local -f` runs a single statement.
-- Presenter walkthrough: docs/local-demo-script.md

do $seed$
begin

-- -----------------------------------------------------------------------------
-- Auth: demo user (triggers seed person_categories, interaction_types, connection_types)
-- -----------------------------------------------------------------------------

delete from auth.users
where email = 'test@test.com';

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone_change,
  phone_change_token,
  email_change_token_current,
  reauthentication_token,
  is_sso_user,
  is_anonymous
)
values (
  '00000000-0000-4000-8000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'test@test.com',
  crypt('password', gen_salt('bf')),
  timezone('utc', now()),
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false,
  timezone('utc', now()),
  timezone('utc', now()),
  '',
  '',
  '',
  '',
  false,
  false
);

insert into auth.identities (
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  '00000000-0000-4000-8000-000000000001'::uuid,
  jsonb_build_object(
    'sub', '00000000-0000-4000-8000-000000000001',
    'email', 'test@test.com',
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  '00000000-0000-4000-8000-000000000001'::uuid,
  timezone('utc', now()),
  timezone('utc', now()),
  timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- Cast — protagonist ~18mo into new city/job; inner circle, work pod, family, light networking
-- -----------------------------------------------------------------------------

-- Inner circle: partner
insert into public.people (
  id, user_id, full_name, display_name, category_id, status,
  location, how_you_met, relationship_context, met_at
)
select
  '00000000-0000-4000-8000-000000000101'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  'Jordan Lee',
  'Jordan',
  c.id,
  'active',
  'Oakland, CA',
  'Met through mutual friends right after the move.',
  'Partner—we share the apartment and debrief the week together.',
  date '2024-03-01'
from public.person_categories c
where c.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and c.name = 'Partner';

-- Inner circle: close friends (recency contrast later via interactions)
insert into public.people (
  id, user_id, full_name, display_name, category_id, status,
  location, how_you_met, relationship_context, met_at
)
select
  '00000000-0000-4000-8000-000000000102'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  'Sam Rivera',
  'Sam',
  c.id,
  'active',
  'Oakland, CA',
  'Running club after work.',
  'Close friend—easy rhythm when schedules line up.',
  date '2024-06-01'
from public.person_categories c
where c.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and c.name = 'Close friend';

insert into public.people (
  id, user_id, full_name, display_name, category_id, status,
  location, how_you_met, relationship_context, met_at
)
select
  '00000000-0000-4000-8000-000000000103'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  'Alex Kim',
  'Alex',
  c.id,
  'active',
  'Portland, OR',
  'Same cohort from the old city.',
  'Close friend emotionally; geography makes visits sparse—easy for months to slip.',
  date '2018-09-01'
from public.person_categories c
where c.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and c.name = 'Close friend';

-- Work pod
insert into public.people (
  id, user_id, full_name, display_name, category_id, status,
  occupation, company, location, how_you_met, relationship_context, met_at
)
select
  '00000000-0000-4000-8000-000000000104'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  'Priya Desai',
  'Priya',
  c.id,
  'active',
  'Engineering Manager',
  'Northline Labs',
  'San Francisco, CA',
  'My manager since onboarding here.',
  'Sets clear expectations; I leave 1:1s knowing what “good” looks like.',
  date '2024-08-01'
from public.person_categories c
where c.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and c.name = 'Coworker';

insert into public.people (
  id, user_id, full_name, display_name, category_id, status,
  occupation, company, location, how_you_met, relationship_context, met_at
)
select
  '00000000-0000-4000-8000-000000000105'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  'Chris Patel',
  'Chris',
  c.id,
  'active',
  'Senior Engineer',
  'Northline Labs',
  'San Francisco, CA',
  'Same squad from week two.',
  'Pair partner on gnarly migrations—high trust, low ego.',
  date '2024-08-01'
from public.person_categories c
where c.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and c.name = 'Coworker';

insert into public.people (
  id, user_id, full_name, display_name, category_id, status,
  occupation, company, location, how_you_met, relationship_context, met_at
)
select
  '00000000-0000-4000-8000-000000000106'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  'Morgan Riley',
  'Morgan',
  c.id,
  'active',
  'Product Manager',
  'Northline Labs',
  'San Francisco, CA',
  'Kickoff that spilled into lunch.',
  'Different squad—mostly cross-team syncs and hallway context.',
  date '2024-10-01'
from public.person_categories c
where c.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and c.name = 'Coworker';

-- Light networking
insert into public.people (
  id, user_id, full_name, display_name, category_id, status,
  occupation, location, how_you_met, relationship_context, met_at
)
select
  '00000000-0000-4000-8000-000000000107'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  'Taylor Brooks',
  'Taylor',
  c.id,
  'active',
  'Designer',
  'Berkeley, CA',
  'Design-systems meetup in Berkeley.',
  'Interesting overlap—not inner circle yet; intentional follow-ups.',
  date '2025-12-01'
from public.person_categories c
where c.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and c.name = 'Networking';

-- Old chapter
insert into public.people (
  id, user_id, full_name, display_name, category_id, status,
  location, how_you_met, relationship_context, met_at
)
select
  '00000000-0000-4000-8000-000000000108'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  'Jamie Okafor',
  'Jamie',
  c.id,
  'dormant',
  'Chicago, IL',
  'College roommate.',
  'Different coasts now—I still root for them from afar.',
  date '2016-09-01'
from public.person_categories c
where c.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and c.name = 'Friend';

-- Family rhythm
insert into public.people (
  id, user_id, full_name, display_name, category_id, status,
  location, how_you_met, relationship_context, met_at
)
select
  '00000000-0000-4000-8000-000000000109'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  'Diane Foster',
  'Mom',
  c.id,
  'active',
  'Sacramento, CA',
  'She raised me.',
  'Sunday calls when travel allows; she tells me about the garden and neighbors.',
  date '1998-05-01'
from public.person_categories c
where c.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and c.name = 'Family';

-- Mentor
insert into public.people (
  id, user_id, full_name, display_name, category_id, status,
  occupation, location, how_you_met, relationship_context, met_at
)
select
  '00000000-0000-4000-8000-000000000110'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  'Robin Vale',
  'Robin',
  c.id,
  'active',
  'Director of Engineering',
  'Seattle, WA',
  'Former manager at my last company—offered to stay in touch.',
  'Occasional mentor calls when I need perspective on scope vs. politics.',
  date '2021-04-01'
from public.person_categories c
where c.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and c.name = 'Mentor';

-- -----------------------------------------------------------------------------
-- Relationship heart baselines (0–20 half-hearts → up to 10 hearts in the UI).
-- Spread makes /people look lived-in. Presenter explains hearts on one profile only
-- (see docs/local-demo-script.md — default: Sam).
-- -----------------------------------------------------------------------------
update public.people as p
set relationship_hearts_baseline_halves = v.halves
from (
  values
    ('00000000-0000-4000-8000-000000000101'::uuid, 17), -- Jordan — partner, high bond
    ('00000000-0000-4000-8000-000000000102'::uuid, 15), -- Sam — key friend for heart narrative
    ('00000000-0000-4000-8000-000000000103'::uuid, 14), -- Alex — same category, different touch rhythm
    ('00000000-0000-4000-8000-000000000104'::uuid, 12), -- Priya
    ('00000000-0000-4000-8000-000000000105'::uuid, 13), -- Chris
    ('00000000-0000-4000-8000-000000000106'::uuid, 10), -- Morgan
    ('00000000-0000-4000-8000-000000000107'::uuid, 7),  -- Taylor — networking, lighter floor
    ('00000000-0000-4000-8000-000000000108'::uuid, 6),  -- Jamie — dormant
    ('00000000-0000-4000-8000-000000000109'::uuid, 18), -- Mom — family
    ('00000000-0000-4000-8000-000000000110'::uuid, 11)  -- Robin — mentor
) as v(id, halves)
where p.id = v.id
  and p.user_id = '00000000-0000-4000-8000-000000000001'::uuid;

-- -----------------------------------------------------------------------------
-- Contact methods (only where the story needs them)
-- -----------------------------------------------------------------------------

insert into public.contact_methods (person_id, type, value, is_primary, notes)
values
  ('00000000-0000-4000-8000-000000000101'::uuid, 'phone', '+1 510 555 0142', true, 'Text-first for quick coordination.'),
  ('00000000-0000-4000-8000-000000000109'::uuid, 'phone', '+1 916 555 0199', true, 'Sunday call window usually mornings PT.'),
  ('00000000-0000-4000-8000-000000000107'::uuid, 'email', 'taylor.brooks.example@mail.test', true, 'Send long reads here.');

-- -----------------------------------------------------------------------------
-- Interactions + links (plain notes like you'd actually type into a PRM after the fact)
-- -----------------------------------------------------------------------------

-- 270d — dormant college friend ping
insert into public.interactions (
  id, user_id, occurred_at, interaction_type_id, title, raw_note, counts_toward_last_touch
)
select
  '00000000-0000-4000-8000-000000010001'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  timezone('utc', now()) - interval '270 days',
  t.id,
  'Jamie—new role, quick text',
  $n001$saw on linkedin (or whatever they posted) that Jamie got a new job — texted congrats while dinner was on the stove

wanted to add "lets find a weekend to catch up" and then got distracted by timer / dishes / forgot

still should actually schedule something, chicago is annoying to get to but not impossible. put on list for next month$n001$,
  true
from public.interaction_types t
where t.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and t.name = 'Text'
limit 1;

insert into public.interaction_people (interaction_id, person_id, role)
values
  ('00000000-0000-4000-8000-000000010001'::uuid, '00000000-0000-4000-8000-000000000108'::uuid, 'primary');

-- 150d — drift with Alex (no recent hangs)
insert into public.interactions (
  id, user_id, occurred_at, interaction_type_id, title, raw_note, counts_toward_last_touch
)
select
  '00000000-0000-4000-8000-000000010002'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  timezone('utc', now()) - interval '150 days',
  t.id,
  'Alex—last big dinner before travel',
  $n002$dinner w Alex — they were in town one night before flying out for a longer trip

small plates place near downtown, we talked work drama then friend stuff, usual. they are stressed but good. told them text me when they land

need to not let another 6 months go by. calendar is the problem not intent$n002$,
  true
from public.interaction_types t
where t.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and t.name = 'Dinner'
limit 1;

insert into public.interaction_people (interaction_id, person_id, role)
values
  ('00000000-0000-4000-8000-000000010002'::uuid, '00000000-0000-4000-8000-000000000103'::uuid, 'primary');

-- 20d — first touch at meetup
insert into public.interactions (
  id, user_id, occurred_at, interaction_type_id, title, raw_note, counts_toward_last_touch
)
select
  '00000000-0000-4000-8000-000000010003'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  timezone('utc', now()) - interval '20 days',
  t.id,
  'Design-systems meetup—Taylor',
  $n003$design systems meetup berkeley

talked to Taylor (designer) — started dumb small talk near snacks, ended up on design↔eng handoffs and why our QA step feels brittle for them. swapped a couple links in the hallway

should follow up this week while I still remember names/faces$n003$,
  true
from public.interaction_types t
where t.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and t.name = 'Party'
limit 1;

insert into public.interaction_people (interaction_id, person_id, role)
values
  ('00000000-0000-4000-8000-000000010003'::uuid, '00000000-0000-4000-8000-000000000107'::uuid, 'primary');

-- 18d — hallway with Morgan
insert into public.interactions (
  id, user_id, occurred_at, interaction_type_id, title, raw_note, counts_toward_last_touch
)
select
  '00000000-0000-4000-8000-000000010004'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  timezone('utc', now()) - interval '18 days',
  t.id,
  'Morgan—elevator after all-hands',
  $n004$ran into Morgan in elevator after all-hands, said congrats on their team getting mentioned

they joked that chris carried the launch basically — note for later bc our squads touch on the migration stuff$n004$,
  true
from public.interaction_types t
where t.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and t.name = 'Small talk'
limit 1;

insert into public.interaction_people (interaction_id, person_id, role)
values
  ('00000000-0000-4000-8000-000000010004'::uuid, '00000000-0000-4000-8000-000000000106'::uuid, 'primary');

-- 14d — mentor call
insert into public.interactions (
  id, user_id, occurred_at, interaction_type_id, title, raw_note, counts_toward_last_touch
)
select
  '00000000-0000-4000-8000-000000010005'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  timezone('utc', now()) - interval '14 days',
  t.id,
  'Robin—mentor call',
  $n005$call w Robin (old mgr / mentor)

vented abt feeling loud when i push on scope vs feeling invisible when i try to be "chill teammate". she reframed it in fewer words than i used which was helpful

also talked abt office politics vs actual outcomes, busy != trusted etc

reminder: send her a non-crisis update sometime next quarter$n005$,
  true
from public.interaction_types t
where t.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and t.name = 'Call'
limit 1;

insert into public.interaction_people (interaction_id, person_id, role)
values
  ('00000000-0000-4000-8000-000000010005'::uuid, '00000000-0000-4000-8000-000000000110'::uuid, 'primary');

-- 11d — introduce Taylor to Sam (multi-person: inner circle + networking)
insert into public.interactions (
  id, user_id, occurred_at, interaction_type_id, title, raw_note, counts_toward_last_touch
)
select
  '00000000-0000-4000-8000-000000010006'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  timezone('utc', now()) - interval '11 days',
  t.id,
  'Dinner at ours—Taylor met Sam',
  $n006$dinner at apt — Jordan + me hosting, Sam + Taylor came

pasta + salad, nothing fancy. Taylor brought wine. Sam did most of the conversational work (asked Taylor about the meetup talk, etc) which was nice bc i was a little stuck in host brain

goal was for Taylor to not feel like a pure "networking" thing. follow up w text or coffee in a week or it will evaporate$n006$,
  true
from public.interaction_types t
where t.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and t.name = 'Dinner'
limit 1;

insert into public.interaction_people (interaction_id, person_id, role)
values
  ('00000000-0000-4000-8000-000000010006'::uuid, '00000000-0000-4000-8000-000000000101'::uuid, 'primary'),
  ('00000000-0000-4000-8000-000000010006'::uuid, '00000000-0000-4000-8000-000000000102'::uuid, 'attendee'),
  ('00000000-0000-4000-8000-000000010006'::uuid, '00000000-0000-4000-8000-000000000107'::uuid, 'attendee');

-- 9d — follow-up with Taylor
insert into public.interactions (
  id, user_id, occurred_at, interaction_type_id, title, raw_note, counts_toward_last_touch
)
select
  '00000000-0000-4000-8000-000000010007'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  timezone('utc', now()) - interval '9 days',
  t.id,
  'Taylor—post-dinner follow-up',
  $n007$text thread / slack DM w Taylor after dinner (whatever we used)

sent 2 links — long systems essay + short pdf of talk notes. message was basically "this reminded me of what you said about handoffs"

they replied w a real question about how we do design QA when eng is slammed. good sign

still owe them that other article i mentioned. bookmark is sitting in tabs$n007$,
  true
from public.interaction_types t
where t.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and t.name = 'Small talk'
limit 1;

insert into public.interaction_people (interaction_id, person_id, role)
values
  ('00000000-0000-4000-8000-000000010007'::uuid, '00000000-0000-4000-8000-000000000107'::uuid, 'primary');

-- 8d — work pod: patio lunch (three people)
insert into public.interactions (
  id, user_id, occurred_at, interaction_type_id, title, raw_note, counts_toward_last_touch
)
select
  '00000000-0000-4000-8000-000000010008'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  timezone('utc', now()) - interval '8 days',
  t.id,
  'Patio lunch—Priya, Chris, Morgan',
  $n008$patio lunch turned into work lunch — Priya + Chris + Morgan

started as "get salads", ended up whiteboarding q3 risks / freeze dates on napkins basically. couldnt read laptop outside, didnt matter

takeaways:
- client shell stuff (Morgan) is easy to forget until it blocks us
- Chris explained eng constraints in normal words which helped
- Priya asked good questions w/o making it feel like a review

need to write up action items for myself tomorrow$n008$,
  true
from public.interaction_types t
where t.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and t.name = 'Hangout'
limit 1;

insert into public.interaction_people (interaction_id, person_id, role)
values
  ('00000000-0000-4000-8000-000000010008'::uuid, '00000000-0000-4000-8000-000000000104'::uuid, 'primary'),
  ('00000000-0000-4000-8000-000000010008'::uuid, '00000000-0000-4000-8000-000000000105'::uuid, 'attendee'),
  ('00000000-0000-4000-8000-000000010008'::uuid, '00000000-0000-4000-8000-000000000106'::uuid, 'attendee');

-- 5d — family call
insert into public.interactions (
  id, user_id, occurred_at, interaction_type_id, title, raw_note, counts_toward_last_touch
)
select
  '00000000-0000-4000-8000-000000010009'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  timezone('utc', now()) - interval '5 days',
  t.id,
  'Sunday call with Mom',
  $n009$sunday phone call mom

she's redoing part of the backyard for pollinators / native plants, wants to send bee photos when they show up

i talked about work more than planned, she mostly listened

call again sooner than last time (i always say that but actually put on calendar)$n009$,
  true
from public.interaction_types t
where t.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and t.name = 'Call'
limit 1;

insert into public.interaction_people (interaction_id, person_id, role)
values
  ('00000000-0000-4000-8000-000000010009'::uuid, '00000000-0000-4000-8000-000000000109'::uuid, 'primary');

-- 4d — 1:1 with manager
insert into public.interactions (
  id, user_id, occurred_at, interaction_type_id, title, raw_note, counts_toward_last_touch
)
select
  '00000000-0000-4000-8000-000000010010'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  timezone('utc', now()) - interval '4 days',
  t.id,
  '1:1 with Priya',
  $n010$1:1 Priya — conf room 4B

roadmap: whats actually shipping vs wishful. then i brought up worried abt being too pushy / steamrolling ppl when i want impact

she asked what "strong impact" means for our team this half (concrete). also touched promo path but not weird

action items (for me):
- 3 things she asked me to drive (will put in work tracker)
- ask for feedback more regularly not only when im stressed$n010$,
  true
from public.interaction_types t
where t.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and t.name = 'Meeting'
limit 1;

insert into public.interaction_people (interaction_id, person_id, role)
values
  ('00000000-0000-4000-8000-000000010010'::uuid, '00000000-0000-4000-8000-000000000104'::uuid, 'primary');

-- 3d — inner circle hike
insert into public.interactions (
  id, user_id, occurred_at, interaction_type_id, title, raw_note, counts_toward_last_touch
)
select
  '00000000-0000-4000-8000-000000010011'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  timezone('utc', now()) - interval '3 days',
  t.id,
  'Saturday hike—Redwood loop',
  $n011$hike — redwood loop, Jordan + Sam

Jordan brought snacks again. Sam wore a stupid hat. talked random mix of work stress + bird we couldnt id + Sam maybe visiting family in aug

good day, legs tired. weather was foggy at the top$n011$,
  true
from public.interaction_types t
where t.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and t.name = 'Hangout'
limit 1;

insert into public.interaction_people (interaction_id, person_id, role)
values
  ('00000000-0000-4000-8000-000000010011'::uuid, '00000000-0000-4000-8000-000000000101'::uuid, 'primary'),
  ('00000000-0000-4000-8000-000000010011'::uuid, '00000000-0000-4000-8000-000000000102'::uuid, 'attendee');

-- 2d — deep work with Chris
insert into public.interactions (
  id, user_id, occurred_at, interaction_type_id, title, raw_note, counts_toward_last_touch
)
select
  '00000000-0000-4000-8000-000000010012'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  timezone('utc', now()) - interval '2 days',
  t.id,
  'Pairing with Chris—API cutover',
  $n012$paired w Chris on API cutover (screen share)

took longer than the optimistic estimate (shocking)

found 2 edge cases that looked small but wouldve been bad in prod. Chris is patient / explains assumptions as he goes

leftover work monday but main scary chunk is mapped$n012$,
  true
from public.interaction_types t
where t.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and t.name = 'Meeting'
limit 1;

insert into public.interaction_people (interaction_id, person_id, role)
values
  ('00000000-0000-4000-8000-000000010012'::uuid, '00000000-0000-4000-8000-000000000105'::uuid, 'primary');

-- 1d — morning coffee with partner + Sam
insert into public.interactions (
  id, user_id, occurred_at, interaction_type_id, title, raw_note, counts_toward_last_touch
)
select
  '00000000-0000-4000-8000-000000010013'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  timezone('utc', now()) - interval '1 day',
  t.id,
  'Morning coffee—Sam joined',
  $n013$coffee — corner spot w Jordan + Sam

Sam late few min, immediately venting abt manager change at their job (who is leaving / interim / what it means for roadmap). easier in person than slack threads

Jordan asked normal follow up questions. i mostly listened + joked a little

half my brain still on work stuff tbh$n013$,
  true
from public.interaction_types t
where t.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and t.name = 'Hangout'
limit 1;

insert into public.interaction_people (interaction_id, person_id, role)
values
  ('00000000-0000-4000-8000-000000010013'::uuid, '00000000-0000-4000-8000-000000000101'::uuid, 'primary'),
  ('00000000-0000-4000-8000-000000010013'::uuid, '00000000-0000-4000-8000-000000000102'::uuid, 'attendee');

-- 2h — logistics text to Sam (latest touch for Sam)
insert into public.interactions (
  id, user_id, occurred_at, interaction_type_id, title, raw_note, counts_toward_last_touch
)
select
  '00000000-0000-4000-8000-000000010014'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  timezone('utc', now()) - interval '2 hours',
  t.id,
  'Sam—running late, rescheduling dinner',
  $n014$text Sam — running late for dinner, train + meeting ran long, my fault on buffer time

asked to move. they said thursday ok (bless)

put calendar hold so i dont flake twice$n014$,
  true
from public.interaction_types t
where t.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and t.name = 'Text'
limit 1;

insert into public.interaction_people (interaction_id, person_id, role)
values
  ('00000000-0000-4000-8000-000000010014'::uuid, '00000000-0000-4000-8000-000000000102'::uuid, 'primary');

-- -----------------------------------------------------------------------------
-- Person graph: coworkers on adjacent squads
-- -----------------------------------------------------------------------------

insert into public.person_connections (
  id, user_id, person_id, related_person_id, connection_type_id, notes
)
select
  '00000000-0000-4000-8000-000000020001'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  '00000000-0000-4000-8000-000000000105'::uuid,
  '00000000-0000-4000-8000-000000000106'::uuid,
  ct.id,
  'Same org—Morgan''s squad owns the client shell we integrate with on the migration.'
from public.connection_types ct
where ct.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  and ct.name = 'Coworker'
limit 1;

-- -----------------------------------------------------------------------------
-- Facts (recall before next chat)
-- -----------------------------------------------------------------------------

insert into public.facts (
  user_id, person_id, body, review_status, extractor_metadata
)
values
  (
    '00000000-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-4000-8000-000000000109'::uuid,
    'Redoing the backyard for native pollinators—wants to share photos when the first bees show up.',
    'accepted',
    '{"seed":true}'::jsonb
  ),
  (
    '00000000-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-4000-8000-000000000105'::uuid,
    'Prefers async updates in Slack; save real-time calls for incidents or tight deadlines.',
    'accepted',
    '{"seed":true}'::jsonb
  ),
  (
    '00000000-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-4000-8000-000000000107'::uuid,
    'Considering a pivot toward product management—take future conversations slow and curious.',
    'candidate',
    '{"seed":true}'::jsonb
  );

-- -----------------------------------------------------------------------------
-- Tasks (open loops from the story)
-- -----------------------------------------------------------------------------

insert into public.tasks (
  user_id, person_id, title, description, status, due_at, suggester_metadata
)
values
  (
    '00000000-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-4000-8000-000000000107'::uuid,
    'Send Taylor the long-form systems-thinking article',
    'Promised after dinner—closes the loop from the meetup follow-up text.',
    'active',
    timezone('utc', now()) + interval '3 days',
    '{"seed":true}'::jsonb
  ),
  (
    '00000000-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-4000-8000-000000000106'::uuid,
    'Ask Morgan for the deck link from patio lunch',
    'Optional—only if Q3 planning comes up again this week.',
    'suggested',
    timezone('utc', now()) + interval '5 days',
    '{"seed":true}'::jsonb
  );

-- -----------------------------------------------------------------------------
-- Last touch (mirrors app: latest occurred_at with counts_toward_last_touch, not future)
-- -----------------------------------------------------------------------------

update public.people p
set last_interaction_at = x.max_at
from (
  select
    ip.person_id,
    max(i.occurred_at) filter (
      where i.counts_toward_last_touch
        and i.occurred_at <= timezone('utc', now())
    ) as max_at
  from public.interaction_people ip
  join public.interactions i on i.id = ip.interaction_id
  where i.user_id = '00000000-0000-4000-8000-000000000001'::uuid
  group by ip.person_id
) x
where p.id = x.person_id
  and p.user_id = '00000000-0000-4000-8000-000000000001'::uuid;

end
$seed$;
