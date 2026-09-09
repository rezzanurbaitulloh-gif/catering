-- Catering OS · 0006_foto_paket (URL Unsplash terverifikasi 200, relevan kuliner)
update public.packages set image_url = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=70'
  where id = 'c0000000-0000-0000-0000-000000000001';
update public.packages set image_url = 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=70'
  where id = 'c0000000-0000-0000-0000-000000000002';
update public.packages set image_url = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=70'
  where id = 'c0000000-0000-0000-0000-000000000003';
update public.packages set image_url = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=70'
  where id = 'c0000000-0000-0000-0000-000000000004';
update public.menu_items set image_url = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=70'
  where id in ('b0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000003');
update public.menu_items set image_url = 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=70'
  where id = 'b0000000-0000-0000-0000-000000000005';
update public.galleries set image_url = 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=70'
  where business_id = '11111111-1111-1111-1111-111111111111';
insert into public.galleries (business_id, image_url, caption, sort)
select '11111111-1111-1111-1111-111111111111', u, c, s from (values
  ('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=70','Prasmanan pernikahan',1),
  ('https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=70','Nasi box korporat',2),
  ('https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=900&q=70','Dapur produksi',3)
) t(u,c,s)
on conflict do nothing;
