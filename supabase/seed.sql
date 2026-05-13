-- StudentNest starter data
-- Run this after supabase/schema.sql

alter table if exists public.properties
  add column if not exists featured_rank integer not null default 0;

alter table if exists public.properties
  add column if not exists listing_status text not null default 'active';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'properties'
      and column_name = 'listing_status'
  ) then
    begin
      alter table public.properties
        add constraint properties_listing_status_check
        check (listing_status in ('active', 'draft', 'unavailable'));
    exception
      when duplicate_object then null;
    end;
  end if;
end $$;

with upserted_properties as (
  insert into public.properties (
    title,
    slug,
    description,
    monthly_rent,
    currency,
    location,
    region,
    nearby_university_id,
    distance_from_university,
    room_type,
    shared_room,
    furnished,
    utilities_included,
    gender_preference,
    amenities,
    roommate_count,
    verified,
    featured,
    featured_rank,
    listing_status,
    available_from,
    whatsapp_number
  )
  values
    (
      'JAIU Riverside Studio',
      'jaiu-riverside-studio',
      'A quiet verified studio for JAIU students who want a private space close to campus, food spots, and evening transport.',
      18000,
      'KGS',
      'Lenin Street, Jalal-Abad',
      'Jalal-Abad',
      (select id from public.universities where short_name = 'JAIU' limit 1),
      '2 mins from JAIU',
      'Studio',
      false,
      true,
      true,
      'Mixed',
      array['Fast WiFi', 'Study desk', 'Private bathroom', 'Laundry access', 'Heating', 'Kitchenette'],
      0,
      true,
      true,
      0,
      'active',
      '2026-08-01',
      '+996555011697'
    ),
    (
      'JASU Central Shared Flat',
      'jasu-central-shared-flat',
      'A bright shared flat for JASU students, with friendly roommates, a study-ready living room, and simple routes to class.',
      13000,
      'KGS',
      'Toktogul Avenue, Jalal-Abad',
      'Jalal-Abad',
      (select id from public.universities where short_name = 'JASU' limit 1),
      '6 mins from JASU',
      'Shared room',
      true,
      true,
      true,
      'Mixed',
      array['Shared kitchen', 'WiFi Included', 'Balcony', 'Washing machine', 'Heating', 'Bus nearby'],
      2,
      true,
      true,
      1,
      'active',
      '2026-07-15',
      '+996555011697'
    ),
    (
      'CAIMU Medical Room',
      'caimu-medical-room',
      'A calm private room for CAIMU medical students, with a study desk, reliable heating, and a verified host.',
      15000,
      'KGS',
      'Sputnik District, Jalal-Abad',
      'Jalal-Abad',
      (select id from public.universities where short_name = 'CAIMU' limit 1),
      '5 mins from CAIMU',
      'Private room',
      false,
      true,
      false,
      'Female only',
      array['Study desk', 'Quiet hours', 'Security entrance', 'Heating', 'Shared kitchen', 'Near clinic'],
      1,
      true,
      true,
      2,
      'active',
      '2026-06-20',
      '+996555011697'
    ),
    (
      'JAIU Campus Apartment',
      'jaiu-campus-apartment',
      'A spacious Jalal-Abad student apartment with a virtual tour, shared kitchen, laundry access, and shuttle routes.',
      25000,
      'KGS',
      'Kurmanbek Street, Jalal-Abad',
      'Jalal-Abad',
      (select id from public.universities where short_name = 'JAIU' limit 1),
      '12 mins by shuttle to JAIU',
      'Apartment',
      false,
      true,
      true,
      'Mixed',
      array['Virtual tour', 'Shared kitchen', 'Laundry access', 'Fast WiFi', 'Study area', 'Bills Included'],
      3,
      true,
      false,
      3,
      'active',
      '2026-08-10',
      '+996555011697'
    ),
    (
      'JASU Budget Student Room',
      'jasu-budget-student-room',
      'A budget-friendly shared room for JASU students who want a simple verified place close to class and everyday food spots.',
      11000,
      'KGS',
      'Kok-Art Microdistrict, Jalal-Abad',
      'Jalal-Abad',
      (select id from public.universities where short_name = 'JASU' limit 1),
      '9 mins from JASU',
      'Shared room',
      true,
      true,
      true,
      'Male only',
      array['Bills Included', 'Shared kitchen', 'Study desk', 'Heating', 'Market nearby', 'WiFi Included'],
      2,
      true,
      false,
      4,
      'active',
      '2026-06-01',
      '+996555011697'
    ),
    (
      'CAIMU Exchange House',
      'caimu-exchange-house',
      'A friendly Jalal-Abad house for exchange and medical students, with flexible move-in dates and verified landlord support.',
      14000,
      'KGS',
      'Central Jalal-Abad',
      'Jalal-Abad',
      (select id from public.universities where short_name = 'CAIMU' limit 1),
      '18 mins by shuttle to CAIMU',
      'Private room',
      false,
      true,
      true,
      'Mixed',
      array['Exchange friendly', 'Garden', 'Shared kitchen', 'WiFi Included', 'Shuttle route', 'Flexible move-in'],
      4,
      true,
      false,
      5,
      'active',
      '2026-07-01',
      '+996555011697'
    )
  on conflict (slug) do update set
    title = excluded.title,
    description = excluded.description,
    monthly_rent = excluded.monthly_rent,
    location = excluded.location,
    region = excluded.region,
    nearby_university_id = excluded.nearby_university_id,
    distance_from_university = excluded.distance_from_university,
    room_type = excluded.room_type,
    shared_room = excluded.shared_room,
    furnished = excluded.furnished,
    utilities_included = excluded.utilities_included,
    gender_preference = excluded.gender_preference,
    amenities = excluded.amenities,
    roommate_count = excluded.roommate_count,
    verified = excluded.verified,
    featured = excluded.featured,
    featured_rank = excluded.featured_rank,
    listing_status = excluded.listing_status,
    available_from = excluded.available_from,
    whatsapp_number = excluded.whatsapp_number
  returning id, slug
)
insert into public.property_images (property_id, image_url, sort_order)
select p.id, image_url, sort_order
from upserted_properties p
join (
  values
    ('jaiu-riverside-studio', '/assets/property1.jpg', 0),
    ('jaiu-riverside-studio', '/assets/heroSmall.jpg', 1),
    ('jaiu-riverside-studio', '/assets/heroHome.jpg', 2),
    ('jasu-central-shared-flat', '/assets/property2.jpg', 0),
    ('jasu-central-shared-flat', '/assets/heroSmallAlt.jpg', 1),
    ('jasu-central-shared-flat', '/assets/tenantHome.jpg', 2),
    ('caimu-medical-room', '/assets/property3.jpg', 0),
    ('caimu-medical-room', '/assets/property1.jpg', 1),
    ('caimu-medical-room', '/assets/heroSmall.jpg', 2),
    ('jaiu-campus-apartment', '/assets/property4.jpg', 0),
    ('jaiu-campus-apartment', '/assets/tenantHome.jpg', 1),
    ('jaiu-campus-apartment', '/assets/heroHome.jpg', 2),
    ('jasu-budget-student-room', '/assets/property5.jpg', 0),
    ('jasu-budget-student-room', '/assets/property6.jpg', 1),
    ('jasu-budget-student-room', '/assets/heroSmallAlt.jpg', 2),
    ('caimu-exchange-house', '/assets/property6.jpg', 0),
    ('caimu-exchange-house', '/assets/property2.jpg', 1),
    ('caimu-exchange-house', '/assets/tenantHome.jpg', 2)
) as images(slug, image_url, sort_order) on images.slug = p.slug
on conflict do nothing;
