-- Roller ve izinler veri olarak durur. Yeni rol eklemek = yeni satır.
-- Kod hiçbir yerde rol ismine bakmaz, yalnızca izin sorar.

insert into permissions (key, description) values
  ('org.read',          'Kuruluşu ve üye listesini görüntüler'),
  ('org.member.invite', 'Kuruluşa yeni üye davet eder'),
  ('org.member.remove', 'Kuruluştan üye çıkarır'),
  ('org.role.assign',   'Kuruluş üyelerinin rolünü değiştirir'),
  ('org.delete',        'Kuruluşu siler'),
  ('product.play',      'Ürünü çalıştırır'),
  ('product.manage',    'Ürün ayarlarını yönetir')
on conflict (key) do nothing;

insert into roles (scope_type, key, name) values
  ('org',     'owner',  'Sahip'),
  ('org',     'admin',  'Yönetici'),
  ('org',     'member', 'Üye'),
  ('product', 'owner',  'Ürün Sahibi'),
  ('product', 'player', 'Oyuncu')
on conflict (scope_type, key) do nothing;

insert into role_permissions (role_id, permission_key)
select r.id, p.key
from roles r
join permissions p on true
where (r.scope_type, r.key) = ('org', 'owner')
  and p.key in ('org.read', 'org.member.invite', 'org.member.remove',
                'org.role.assign', 'org.delete')
on conflict do nothing;

insert into role_permissions (role_id, permission_key)
select r.id, p.key
from roles r
join permissions p on true
where (r.scope_type, r.key) = ('org', 'admin')
  and p.key in ('org.read', 'org.member.invite', 'org.member.remove')
on conflict do nothing;

insert into role_permissions (role_id, permission_key)
select r.id, 'org.read' from roles r
where (r.scope_type, r.key) = ('org', 'member')
on conflict do nothing;

insert into role_permissions (role_id, permission_key)
select r.id, p.key
from roles r
join permissions p on true
where (r.scope_type, r.key) = ('product', 'owner')
  and p.key in ('product.play', 'product.manage')
on conflict do nothing;

insert into role_permissions (role_id, permission_key)
select r.id, 'product.play' from roles r
where (r.scope_type, r.key) = ('product', 'player')
on conflict do nothing;
