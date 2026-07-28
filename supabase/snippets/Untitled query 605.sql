SELECT id, title, COUNT(*) 
FROM product 
WHERE title IN ('What''s Going On', 'Pet Sounds')
GROUP BY id, title;