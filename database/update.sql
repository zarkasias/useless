update achievements
set icon_path = '/achievement_icons/webp/translate-trickster.webp'
where title in (
    'Translate Trickster'
);

update achievements
set icon_path = '/achievement_icons/webp/url-copier.webp'
where title in (
    'URL Copier'
);

update achievements
set icon_path = '/achievement_icons/webp/valentine-visitor.webp'
where title in (
  'Valentine''s Visitor'
);

update achievements
set icon_path = '/achievement_icons/webp/weekend-warrior.webp'
where title in (
    'Weekend Warrior'
);

update profiles
set role = 'admin'
where id = 'f2fe197a-4ef6-4022-8992-6d098c75ebf8';

# core pack id e1eb6002-c5ac-4a72-bc84-d3d14b57d372
# halloween pack id efa4356f-0611-45ed-b2ab-3fa962bd49e0




update achievements
set pack_id = (
  select id
  from achievement_packs
  where slug = 'core'
)
where pack_id is null;





delete from achievements
where id in (
  '6bed459c-2903-46e5-a715-07b48b1a5705',
  'd5ab9213-60ff-4ffb-b4a8-bc87da6bc9f3'
);

update achievement_packs
set cover_image_path = '/achievement_packs/webp/halloween-pack.webp'
where slug = 'halloween-2026';

delete from user_achievements
where user_id in (
  'f2fe197a-4ef6-4022-8992-6d098c75ebf8',
  '51febd78-3ae7-4104-83d6-f418dac89120'
);