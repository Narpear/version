-- Seed data for public.public_food_templates (shared vegetarian food library).
--
-- Sources:
--   IFCT 2017  = Indian Food Composition Tables 2017, National Institute of Nutrition (ICMR), India
--   USDA SR28  = USDA National Nutrient Database for Standard Reference, Release 28
--                (the dataset FoodData Central's SR Legacy is built on)
--
-- Single foods: database values scaled to the serving weight in grams.
-- Dishes: home-style recipes. Each ingredient's raw weight comes from the database, and the
-- totals are summed. The recipe quantities themselves (how much oil, dal, etc.) are estimates;
-- the line comment above each dish lists them so you can adjust.
-- Carbs are total carbohydrate including fiber (USDA convention; for IFCT = available carbs + fiber).
--
-- Safe to re-run: names that already exist (case-insensitive) are skipped.
-- Run after schema.sql and disable_rls.sql.

insert into public.public_food_templates
  (template_name, meal_type, calories, protein_g, carbs_g, fats_g, is_healthy)
select v.template_name, v.meal_type, v.calories, v.protein_g, v.carbs_g, v.fats_g, v.is_healthy
from (values
  -- Rice, parboiled, milled 12g [IFCT A014], Black gram, dal 4g [IFCT B003]
  ('Idli (1 piece)', 'breakfast', 55, 1.9, 12.2, 0.1, true),
  -- Rice, parboiled, milled 30g [IFCT A014], Black gram, dal 10g [IFCT B003], Sunflower oil 3g [IFCT T012]
  ('Plain Dosa (1 medium)', 'breakfast', 165, 4.6, 30.6, 3.3, true),
  -- Rice, parboiled, milled 30g [IFCT A014], Black gram, dal 10g [IFCT B003], Sunflower oil 6g [IFCT T012], Potato, brown skin, big 80g [IFCT F006], Onion, big 20g [IFCT G017], Sunflower oil 4g [IFCT T012]
  ('Masala Dosa (1)', 'breakfast', 293, 6.2, 46.2, 10.6, false),
  -- Wheat, semolina 20g [IFCT A022], Rice, raw, milled 15g [IFCT A015], Sunflower oil 6g [IFCT T012]
  ('Rava Dosa (1)', 'breakfast', 174, 3.5, 27.8, 6.2, false),
  -- Ragi 30g [IFCT A010], Black gram, dal 8g [IFCT B003], Sunflower oil 3g [IFCT T012]
  ('Ragi Dosa (1)', 'breakfast', 149, 4.0, 28.4, 3.7, true),
  -- Rice, parboiled, milled 35g [IFCT A014], Black gram, dal 12g [IFCT B003], Onion, big 20g [IFCT G017], Tomato, ripe, hybrid 20g [IFCT D075], Sunflower oil 5g [IFCT T012]
  ('Onion Uttapam (1)', 'breakfast', 220, 6.0, 39.2, 5.5, true),
  -- Black gram, dal 20g [IFCT B003], Sunflower oil 6g [IFCT T012]
  ('Medu Vada (1 piece)', 'breakfast', 119, 4.6, 12.6, 6.3, false),
  -- Wheat, semolina 50g [IFCT A022], Sunflower oil 7g [IFCT T012], Onion, big 20g [IFCT G017], Carrot, orange 15g [IFCT F002], Peas, fresh 10g [IFCT D061]
  ('Upma (1 cup)', 'breakfast', 253, 6.9, 44.8, 7.5, true),
  -- Rice, flakes 50g [IFCT A011], Sunflower oil 7g [IFCT T012], Onion, big 25g [IFCT G017], Potato, brown skin, big 25g [IFCT F006], Ground nut 8g [IFCT H012]
  ('Poha (1 cup)', 'breakfast', 311, 6.4, 49.5, 10.9, true),
  -- Rice, raw, milled 40g [IFCT A015], Green gram, dal 15g [IFCT B010], Ghee 8g [IFCT T013], Cashew nut 4g [IFCT H005]
  ('Ven Pongal (1 cup)', 'breakfast', 287, 7.5, 42.9, 10.2, false),
  -- Tapioca, pearl 60g [USDA 20068], Ground nut 20g [IFCT H012], Potato, brown skin, big 40g [IFCT F006], Ghee 8g [IFCT T013]
  ('Sabudana Khichdi (1 cup)', 'breakfast', 419, 5.5, 65.4, 16.0, false),
  -- Wheat, vermicelli 50g [IFCT A023], Sunflower oil 7g [IFCT T012], Onion, big 20g [IFCT G017], Carrot, orange 15g [IFCT F002], Peas, fresh 10g [IFCT D061]
  ('Semiya Upma (1 cup)', 'breakfast', 252, 6.0, 45.5, 7.4, true),
  -- Wheat flour, atta 50g [IFCT A019], Potato, brown skin, big 60g [IFCT F006], Ghee 6g [IFCT T013]
  ('Aloo Paratha (1)', 'breakfast', 256, 6.2, 47.7, 6.9, false),
  -- Wheat flour, atta 40g [IFCT A019], Ghee 6g [IFCT T013]
  ('Plain Paratha (1)', 'breakfast', 182, 4.2, 30.2, 6.6, false),
  -- Wheat flour, atta 50g [IFCT A019], Paneer 40g [IFCT L003], Ghee 6g [IFCT T013]
  ('Paneer Paratha (1)', 'breakfast', 317, 12.8, 42.7, 12.7, false),
  -- Wheat flour, atta 30g [IFCT A019], Bengal gram, dal 5g [IFCT B001], Fenugreek leaves 10g [IFCT C020], Yogurt, plain 5g [USDA 01116], Sunflower oil 4g [IFCT T012]
  ('Methi Thepla (1)', 'breakfast', 155, 4.8, 26.7, 5.0, true),
  -- Bengal gram, dal 35g [IFCT B001], Onion, big 15g [IFCT G017], Tomato, ripe, hybrid 15g [IFCT D075], Sunflower oil 4g [IFCT T012]
  ('Besan Chilla (1)', 'breakfast', 161, 7.9, 24.2, 5.9, true),
  -- Green gram, dal 35g [IFCT B010], Onion, big 15g [IFCT G017], Sunflower oil 4g [IFCT T012]
  ('Moong Dal Chilla (1)', 'breakfast', 157, 8.6, 23.5, 4.5, true),
  -- Red gram, dal 25g [IFCT B021], Drumstick 20g [IFCT D046], Onion, big 20g [IFCT G017], Tomato, ripe, hybrid 20g [IFCT D075], Brinjal - all varieties 20g [IFCT D031], Tamarind, pulp 5g [IFCT E064], Sunflower oil 4g [IFCT T012]
  ('Sambar (1 cup)', 'lunch', 157, 6.8, 26.7, 4.6, true),
  -- Coconut, kernel, fresh 15g [IFCT H007], Bengal gram, dal 5g [IFCT B001], Sunflower oil 1g [IFCT T012]
  ('Coconut Chutney (2 tbsp)', 'breakfast', 87, 1.7, 5.6, 7.5, false),
  -- Tomato, ripe, hybrid 30g [IFCT D075], Onion, big 10g [IFCT G017], Sunflower oil 2g [IFCT T012]
  ('Tomato Chutney (2 tbsp)', 'breakfast', 28, 0.4, 2.6, 2.1, true),
  -- Ground nut 12g [IFCT H012], Sunflower oil 1g [IFCT T012]
  ('Peanut Chutney (2 tbsp)', 'breakfast', 71, 2.8, 3.3, 5.8, true),
  -- Coriander leaves 15g [IFCT G009]
  ('Coriander-Mint Chutney (2 tbsp)', 'snack', 5, 0.5, 1.0, 0.1, true),
  -- Wheat flour, atta 30g [IFCT A019]
  ('Roti / Chapati, no ghee (1 medium)', 'lunch', 96, 3.2, 22.7, 0.5, true),
  -- Wheat flour, atta 30g [IFCT A019], Ghee 3g [IFCT T013]
  ('Roti / Chapati with ghee (1 medium)', 'lunch', 123, 3.2, 22.7, 3.5, true),
  -- Wheat flour, atta 15g [IFCT A019], Sunflower oil 4g [IFCT T012]
  ('Puri (1)', 'breakfast', 84, 1.6, 11.3, 4.2, false),
  -- Wheat flour, refined 45g [IFCT A018], Yogurt, plain 10g [USDA 01116], Sunflower oil 10g [IFCT T012]
  ('Bhatura (1)', 'lunch', 254, 5.0, 35.1, 10.7, false),
  -- Bajra 35g [IFCT A003]
  ('Bajra Roti (1)', 'lunch', 122, 3.8, 25.6, 1.9, true),
  -- Jowar 35g [IFCT A005]
  ('Jowar Roti (1)', 'lunch', 117, 3.5, 27.3, 0.6, true),
  -- Ragi 60g [IFCT A010]
  ('Ragi Mudde (1 ball)', 'lunch', 192, 4.3, 46.8, 1.2, true),
  -- Bread, naan 90g [USDA 28307]
  ('Naan, plain (1 piece)', 'dinner', 262, 8.7, 45.4, 5.1, false),
  -- Bread, naan 90g [USDA 28307], Butter, salted 7g [USDA 01001]
  ('Butter Naan (1 piece)', 'dinner', 312, 8.7, 45.4, 10.8, false),
  -- Rice, raw, milled 55g [IFCT A015]
  ('Steamed Rice (1 cup cooked)', 'lunch', 196, 4.4, 44.6, 0.3, true),
  -- Rice, raw, milled 55g [IFCT A015], Ghee 5g [IFCT T013]
  ('Jeera Rice (1 cup)', 'lunch', 241, 4.4, 44.6, 5.3, false),
  -- Rice, raw, milled 50g [IFCT A015], Peas, fresh 20g [IFCT D061], Carrot, orange 20g [IFCT F002], Onion, big 15g [IFCT G017], Ghee 6g [IFCT T013]
  ('Veg Pulao (1 cup)', 'lunch', 262, 5.8, 47.9, 6.4, false),
  -- Rice, raw, milled 55g [IFCT A015], Sunflower oil 6g [IFCT T012], Ground nut 6g [IFCT H012], Bengal gram, dal 3g [IFCT B001]
  ('Lemon Rice (1 cup)', 'lunch', 291, 6.4, 48.1, 8.8, false),
  -- Rice, raw, milled 55g [IFCT A015], Sunflower oil 8g [IFCT T012], Ground nut 6g [IFCT H012], Tamarind, pulp 5g [IFCT E064], Bengal gram, dal 3g [IFCT B001]
  ('Tamarind Rice / Puliyogare (1 cup)', 'lunch', 323, 6.6, 51.7, 10.8, false),
  -- Rice, raw, milled 40g [IFCT A015], Yogurt, plain 100g [USDA 01116], Sunflower oil 2g [IFCT T012]
  ('Curd Rice (1 cup)', 'lunch', 222, 6.6, 37.1, 5.5, true),
  -- Rice, raw, milled 35g [IFCT A015], Red gram, dal 15g [IFCT B021], Carrot, orange 15g [IFCT F002], Peas, fresh 15g [IFCT D061], Onion, big 10g [IFCT G017], Tamarind, pulp 4g [IFCT E064], Ghee 7g [IFCT T013]
  ('Bisi Bele Bath (1 cup)', 'lunch', 271, 7.5, 46.3, 7.5, false),
  -- Rice, raw, milled 50g [IFCT A015], Carrot, orange 20g [IFCT F002], Peas, fresh 15g [IFCT D061], Potato, brown skin, big 15g [IFCT F006], Onion, big 20g [IFCT G017], Yogurt, plain 15g [USDA 01116], Ghee 8g [IFCT T013]
  ('Veg Biryani (1 cup)', 'lunch', 298, 6.3, 50.8, 8.9, false),
  -- Rice, raw, milled 30g [IFCT A015], Green gram, dal 20g [IFCT B010], Ghee 5g [IFCT T013]
  ('Khichdi (1 cup)', 'dinner', 217, 7.2, 36.7, 5.4, true),
  -- Red gram, dal 40g [IFCT B021]
  ('Toor Dal, plain (1 cup)', 'lunch', 132, 8.7, 25.7, 0.6, true),
  -- Red gram, dal 40g [IFCT B021], Onion, big 15g [IFCT G017], Tomato, ripe, hybrid 20g [IFCT D075], Ghee 5g [IFCT T013]
  ('Dal Tadka (1 cup)', 'lunch', 188, 9.1, 28.5, 5.7, true),
  -- Green gram, dal 40g [IFCT B010], Tomato, ripe, hybrid 20g [IFCT D075], Sunflower oil 5g [IFCT T012]
  ('Moong Dal (1 cup)', 'lunch', 179, 9.7, 25.7, 5.6, true),
  -- Lentil, dal 40g [IFCT B013], Onion, big 15g [IFCT G017], Tomato, ripe, hybrid 20g [IFCT D075], Sunflower oil 5g [IFCT T012]
  ('Masoor Dal (1 cup)', 'lunch', 185, 10.1, 27.9, 5.4, true),
  -- Black gram, whole 30g [IFCT B004], Rajmah, red 8g [IFCT B020], Tomato, ripe, hybrid 30g [IFCT D075], Butter, salted 8g [USDA 01001], Cream, fluid 15g [USDA 01053]
  ('Dal Makhani (1 cup)', 'dinner', 225, 8.9, 26.4, 12.6, false),
  -- Red gram, dal 8g [IFCT B021], Tomato, ripe, hybrid 40g [IFCT D075], Tamarind, pulp 4g [IFCT E064], Sunflower oil 3g [IFCT T012]
  ('Rasam (1 cup)', 'lunch', 73, 2.2, 10.0, 3.2, true),
  -- Yogurt, plain 120g [USDA 01116], Bengal gram, dal 15g [IFCT B001], Sunflower oil 5g [IFCT T012]
  ('Kadhi (1 cup)', 'lunch', 168, 7.4, 14.9, 9.7, false),
  -- Bengal gram, whole 50g [IFCT B002], Onion, big 30g [IFCT G017], Tomato, ripe, hybrid 40g [IFCT D075], Sunflower oil 7g [IFCT T012]
  ('Chana Masala / Chole (1 cup)', 'lunch', 228, 10.1, 37.9, 9.7, true),
  -- Rajmah, red 45g [IFCT B020], Onion, big 30g [IFCT G017], Tomato, ripe, hybrid 40g [IFCT D075], Sunflower oil 7g [IFCT T012]
  ('Rajma (1 cup)', 'lunch', 220, 9.7, 34.8, 8.0, true),
  -- Spinach 150g [IFCT C033], Paneer 60g [IFCT L003], Onion, big 20g [IFCT G017], Tomato, ripe, hybrid 20g [IFCT D075], Sunflower oil 6g [IFCT T012], Cream, fluid 5g [USDA 01053]
  ('Palak Paneer (1 cup)', 'dinner', 276, 15.1, 17.6, 17.7, true),
  -- Paneer 80g [IFCT L003], Tomato, ripe, hybrid 80g [IFCT D075], Onion, big 20g [IFCT G017], Cashew nut 8g [IFCT H005], Butter, salted 8g [USDA 01001], Cream, fluid 15g [USDA 01053]
  ('Paneer Butter Masala (1 cup)', 'dinner', 386, 18.0, 18.9, 27.6, false),
  -- Paneer 80g [IFCT L003], Capsicum, green 40g [IFCT D033], Onion, big 30g [IFCT G017], Tomato, ripe, hybrid 50g [IFCT D075], Sunflower oil 8g [IFCT T012]
  ('Kadai Paneer (1 cup)', 'dinner', 309, 16.4, 17.5, 20.2, false),
  -- Paneer 60g [IFCT L003], Peas, fresh 50g [IFCT D061], Onion, big 25g [IFCT G017], Tomato, ripe, hybrid 50g [IFCT D075], Sunflower oil 7g [IFCT T012]
  ('Matar Paneer (1 cup)', 'dinner', 280, 15.7, 21.9, 16.1, true),
  -- Paneer 100g [IFCT L003], Onion, big 30g [IFCT G017], Tomato, ripe, hybrid 30g [IFCT D075], Sunflower oil 6g [IFCT T012]
  ('Paneer Bhurji (1 cup)', 'dinner', 332, 19.5, 17.4, 20.9, true),
  -- Potato, brown skin, big 80g [IFCT F006], Cauliflower 100g [IFCT D036], Onion, big 15g [IFCT G017], Sunflower oil 7g [IFCT T012]
  ('Aloo Gobi (1 cup)', 'lunch', 149, 3.6, 20.8, 7.7, true),
  -- Potato, brown skin, big 80g [IFCT F006], Peas, fresh 50g [IFCT D061], Tomato, ripe, hybrid 50g [IFCT D075], Onion, big 20g [IFCT G017], Sunflower oil 7g [IFCT T012]
  ('Aloo Matar (1 cup)', 'lunch', 179, 5.5, 27.2, 7.4, true),
  -- Potato, brown skin, big 150g [IFCT F006], Sunflower oil 8g [IFCT T012]
  ('Jeera Aloo (1 cup)', 'lunch', 177, 2.3, 24.9, 8.3, false),
  -- Ladies finger 150g [IFCT D056], Onion, big 30g [IFCT G017], Sunflower oil 8g [IFCT T012]
  ('Bhindi Masala (1 cup)', 'lunch', 128, 3.6, 15.2, 8.4, true),
  -- Brinjal - all varieties 200g [IFCT D031], Onion, big 30g [IFCT G017], Tomato, ripe, hybrid 40g [IFCT D075], Sunflower oil 7g [IFCT T012]
  ('Baingan Bharta (1 cup)', 'dinner', 136, 3.7, 20.5, 7.8, true),
  -- Carrot, orange 40g [IFCT F002], Peas, fresh 30g [IFCT D061], Cauliflower 50g [IFCT D036], Potato, brown skin, big 40g [IFCT F006], Capsicum, green 20g [IFCT D033], Sunflower oil 7g [IFCT T012]
  ('Mixed Veg Sabzi (1 cup)', 'lunch', 143, 4.5, 19.6, 7.6, true),
  -- Cabbage, green 150g [IFCT C015], Coconut, kernel, fresh 10g [IFCT H007], Bengal gram, dal 2g [IFCT B001], Sunflower oil 5g [IFCT T012]
  ('Cabbage Poriyal (1 cup)', 'lunch', 125, 2.9, 11.9, 9.4, true),
  -- Bottle gourd, elongate, pale green 200g [IFCT D007], Tomato, ripe, hybrid 20g [IFCT D075], Sunflower oil 5g [IFCT T012]
  ('Lauki Sabzi (1 cup)', 'lunch', 71, 1.2, 8.6, 5.3, true),
  -- Yogurt, plain 245g [USDA 01116]
  ('Plain Curd / Dahi (1 cup)', 'lunch', 149, 8.5, 11.4, 8.0, true),
  -- Yogurt, plain 100g [USDA 01116], Cucumber, green, elongate 30g [IFCT D043], Onion, big 10g [IFCT G017]
  ('Cucumber Raita (1/2 cup)', 'lunch', 72, 3.8, 7.5, 3.3, true),
  -- Yogurt, plain 60g [USDA 01116]
  ('Buttermilk / Chaas (1 glass)', 'lunch', 37, 2.1, 2.8, 1.9, true),
  -- Yogurt, plain 200g [USDA 01116], Sugars, granulated 20g [USDA 19335]
  ('Sweet Lassi (1 glass)', 'snack', 199, 6.9, 29.3, 6.5, false),
  -- Milk, whole, Cow 75g [IFCT L002], Sugars, granulated 8g [USDA 19335]
  ('Masala Chai with sugar (1 cup)', 'snack', 86, 2.4, 11.7, 3.4, false),
  -- Milk, whole, Cow 100g [IFCT L002], Sugars, granulated 8g [USDA 19335]
  ('Filter Coffee with sugar (1 cup)', 'breakfast', 104, 3.3, 12.9, 4.5, false),
  -- Wheat flour, refined 25g [IFCT A018], Potato, brown skin, big 40g [IFCT F006], Peas, fresh 5g [IFCT D061], Sunflower oil 12g [IFCT T012]
  ('Samosa (1)', 'snack', 228, 3.6, 26.8, 12.3, false),
  -- Rolls, dinner 40g [USDA 18342], Potato, brown skin, big 80g [IFCT F006], Bengal gram, dal 15g [IFCT B001], Sunflower oil 10g [IFCT T012]
  ('Vada Pav (1)', 'snack', 319, 8.8, 43.4, 13.6, false),
  -- Rolls, dinner 80g [USDA 18342], Potato, brown skin, big 80g [IFCT F006], Peas, fresh 30g [IFCT D061], Cauliflower 30g [IFCT D036], Capsicum, green 20g [IFCT D033], Tomato, ripe, hybrid 50g [IFCT D075], Butter, salted 15g [USDA 01001]
  ('Pav Bhaji (2 pav + bhaji)', 'dinner', 455, 13.5, 65.3, 17.9, false),
  -- Wheat, semolina 15g [IFCT A022], Sunflower oil 6g [IFCT T012], Potato, brown skin, big 30g [IFCT F006], Bengal gram, whole 10g [IFCT B002], Tamarind, pulp 5g [IFCT E064], Jaggery, cane 5g [IFCT I001]
  ('Pani Puri (6 pieces)', 'snack', 186, 4.3, 31.1, 6.7, false),
  -- Rice, puffed 25g [IFCT A012], Bengal gram, dal 8g [IFCT B001], Sunflower oil 3g [IFCT T012], Onion, big 20g [IFCT G017], Tomato, ripe, hybrid 20g [IFCT D075], Ground nut 5g [IFCT H012], Tamarind, pulp 5g [IFCT E064], Jaggery, cane 5g [IFCT I001]
  ('Bhel Puri (1 cup)', 'snack', 215, 5.5, 37.6, 5.9, false),
  -- Bengal gram, dal 30g [IFCT B001], Sunflower oil 4g [IFCT T012], Sugars, granulated 3g [USDA 19335]
  ('Khaman Dhokla (4 pieces)', 'snack', 146, 6.5, 21.6, 5.6, true),
  -- Bengal gram, dal 25g [IFCT B001], Onion, big 40g [IFCT G017], Sunflower oil 10g [IFCT T012]
  ('Onion Pakora (4 pieces)', 'snack', 191, 6.0, 20.3, 11.4, false),
  -- Bengal gram, whole 30g [IFCT B002]
  ('Roasted Chana (30g)', 'snack', 86, 5.6, 19.4, 1.5, true),
  -- Ground nut 30g [IFCT H012]
  ('Masala Peanuts (30g)', 'snack', 156, 7.1, 8.3, 11.9, true),
  -- Khoa 15g [IFCT L004], Wheat flour, refined 3g [IFCT A018], Sugars, granulated 15g [USDA 19335], Sunflower oil 3g [IFCT T012]
  ('Gulab Jamun (1 piece)', 'snack', 143, 2.8, 19.8, 6.1, false),
  -- Wheat flour, refined 15g [IFCT A018], Sugars, granulated 25g [USDA 19335], Sunflower oil 8g [IFCT T012]
  ('Jalebi (50g)', 'snack', 222, 1.6, 36.5, 8.1, false),
  -- Milk, whole, Cow 120g [IFCT L002], Rice, raw, milled 8g [IFCT A015], Sugars, granulated 12g [USDA 19335]
  ('Rice Kheer (1/2 cup)', 'snack', 162, 4.5, 24.4, 5.4, false),
  -- Milk, whole, Cow 120g [IFCT L002], Wheat, vermicelli 10g [IFCT A023], Sugars, granulated 12g [USDA 19335], Ghee 2g [IFCT T013]
  ('Semiya Payasam (1/2 cup)', 'snack', 185, 4.9, 25.9, 7.4, false),
  -- Bengal gram, dal 14g [IFCT B001], Ghee 8g [IFCT T013], Sugars, granulated 9g [USDA 19335]
  ('Besan Ladoo (1)', 'snack', 153, 3.0, 17.7, 8.7, false),
  -- Wheat, semolina 25g [IFCT A022], Ghee 8g [IFCT T013], Sugars, granulated 25g [USDA 19335]
  ('Rava Kesari (1/2 cup)', 'snack', 252, 2.8, 44.5, 8.2, false),
  -- Pasta, cooked 200g [USDA 20121], Sauce, pasta 125g [USDA 06931], Cheese, parmesan 5g [USDA 01032]
  ('Spaghetti Marinara (1 plate)', 'dinner', 400, 14.8, 71.7, 5.3, true),
  -- Pasta, cooked 200g [USDA 20121], Sauce, pasta 125g [USDA 06931], Oil, olive 5g [USDA 04053]
  ('Penne Arrabbiata (1 plate)', 'dinner', 423, 13.3, 71.0, 8.9, true),
  -- Pasta, cooked 200g [USDA 20121], Sauce, pesto 32g [USDA 06627]
  ('Pasta al Pesto (1 plate)', 'dinner', 452, 13.2, 63.7, 15.4, false),
  -- Pasta, cooked 200g [USDA 20121], Butter, salted 15g [USDA 01001], Cream, fluid 60g [USDA 01053], Cheese, parmesan 25g [USDA 01032]
  ('Fettuccine Alfredo (1 plate)', 'dinner', 733, 20.5, 66.9, 42.6, false),
  -- Pasta, cooked 200g [USDA 20121], Oil, olive 15g [USDA 04053]
  ('Aglio e Olio (1 plate)', 'dinner', 449, 11.6, 61.7, 16.9, false),
  -- Pasta, cooked 200g [USDA 20121], Sauce, pasta 100g [USDA 06931], Cream, fluid 30g [USDA 01053], Cheese, parmesan 10g [USDA 01032]
  ('Pasta in Pink Sauce (1 plate)', 'dinner', 510, 16.7, 71.4, 17.1, false),
  -- Pasta, cooked 140g [USDA 20121], Cheese, cheddar 30g [USDA 01009], Milk, whole 60g [USDA 01077], Butter, salted 7g [USDA 01001]
  ('Mac and Cheese, homemade (1 cup)', 'dinner', 429, 16.9, 47.0, 18.9, false),
  -- Pasta, cooked 80g [USDA 20121], Cheese, ricotta 60g [USDA 01037], Cheese, mozzarella 40g [USDA 01028], Sauce, pasta 100g [USDA 06931], Cheese, parmesan 8g [USDA 01032], Spinach 30g [IFCT C033]
  ('Vegetable Lasagna (1 piece)', 'dinner', 402, 25.5, 38.8, 15.9, false),
  -- Tortellini, pasta with cheese filling 85g [USDA 22901], Sauce, pasta 60g [USDA 06931]
  ('Cheese Tortellini with Marinara (1 cup)', 'dinner', 291, 12.3, 44.4, 7.1, false),
  -- Eggplant, raw 150g [USDA 11209], Bread crumbs, dry 20g [USDA 18079], Cheese, mozzarella 40g [USDA 01028], Cheese, parmesan 10g [USDA 01032], Sauce, pasta 120g [USDA 06931], Oil, olive 10g [USDA 04053]
  ('Eggplant Parmesan (1 serving)', 'dinner', 408, 18.4, 34.6, 22.4, false),
  -- Rice, white 60g [USDA 20050], Mushrooms, white 50g [USDA 11260], Butter, salted 8g [USDA 01001], Oil, olive 5g [USDA 04053], Cheese, parmesan 10g [USDA 01032]
  ('Mushroom Risotto (1 cup)', 'dinner', 371, 8.4, 50.6, 14.8, false),
  -- Fast Food, Pizza Chain 107g [USDA 21299]
  ('Cheese Pizza (1 slice, 14" regular)', 'dinner', 285, 12.2, 35.7, 10.4, false),
  -- Fast Food, Pizza Chain 76g [USDA 21301]
  ('Cheese Pizza (1 slice, 14" thin crust)', 'dinner', 230, 9.8, 23.7, 10.6, false),
  -- Soup, minestrone 240g [USDA 06039]
  ('Minestrone Soup (1 cup)', 'lunch', 127, 5.1, 20.7, 2.8, true),
  -- Cheese, mozzarella 60g [USDA 01028], Tomatoes, red 100g [USDA 11529], Oil, olive 7g [USDA 04053]
  ('Caprese Salad (1 plate)', 'lunch', 232, 15.4, 5.6, 16.8, true),
  -- Bread, italian 50g [USDA 18033], Tomatoes, red 50g [USDA 11529], Oil, olive 7g [USDA 04053]
  ('Bruschetta (2 pieces)', 'snack', 206, 4.8, 27.0, 8.8, true),
  -- Garlic bread, frozen 40g [USDA 18963]
  ('Garlic Bread (1 slice)', 'dinner', 140, 3.3, 16.7, 6.6, false),
  -- Focaccia, Italian flatbread 60g [USDA 18973]
  ('Focaccia (1 piece)', 'lunch', 149, 5.3, 21.5, 4.7, false),
  -- Sauce, pasta 125g [USDA 06931]
  ('Marinara Sauce (1/2 cup)', 'dinner', 62, 1.7, 9.3, 2.0, true),
  -- Sauce, pesto 32g [USDA 06627]
  ('Pesto (2 tbsp)', 'dinner', 136, 1.6, 2.0, 13.6, false),
  -- Tortillas, ready-to-bake or -fry 72g [USDA 18364], Refried beans, canned 120g [USDA 16103], Cheese, Mexican blend 30g [USDA 01251], Sauce, salsa 30g [USDA 06164]
  ('Bean and Cheese Burrito (1)', 'lunch', 444, 19.4, 54.3, 16.8, false),
  -- Rice, white 150g [USDA 20045], Beans, black 130g [USDA 16015], Corn, sweet 50g [USDA 11168], Sauce, salsa 60g [USDA 06164], Cheese, Mexican blend 28g [USDA 01251], Cream, sour 30g [USDA 01056], Avocados, raw 30g [USDA 09037], Lettuce, cos or romaine 30g [USDA 11251]
  ('Veg Burrito Bowl (rice, beans, corn, salsa, cheese, sour cream, guac)', 'lunch', 645, 26.5, 93.0, 20.2, false),
  -- Tortillas, ready-to-bake or -fry 72g [USDA 18364], Cheese, Mexican blend 56g [USDA 01251], Sunflower oil 3g [IFCT T012]
  ('Cheese Quesadilla (1)', 'lunch', 448, 19.1, 36.5, 24.7, false),
  -- Tortillas, ready-to-bake or -fry 48g [USDA 18363], Beans, black 100g [USDA 16015], Cheese, Mexican blend 20g [USDA 01251], Sauce, salsa 30g [USDA 06164], Lettuce, cos or romaine 15g [USDA 11251]
  ('Black Bean Tacos (2)', 'lunch', 319, 16.9, 48.0, 7.7, true),
  -- Tortillas, ready-to-bake or -fry 48g [USDA 18363], Cheese, Mexican blend 60g [USDA 01251], Sauce, enchilada 120g [USDA 27063], Sunflower oil 5g [IFCT T012]
  ('Cheese Enchiladas (2)', 'dinner', 400, 17.6, 28.3, 24.6, false),
  -- Tortillas, ready-to-bake or -fry 24g [USDA 18363], Sunflower oil 5g [IFCT T012], Refried beans, canned 60g [USDA 16103], Cheese, Mexican blend 15g [USDA 01251], Lettuce, cos or romaine 15g [USDA 11251], Cream, sour 10g [USDA 01056]
  ('Bean Tostada (1)', 'lunch', 227, 8.3, 20.1, 13.1, false),
  -- Snacks, tortilla chips 50g [USDA 19056], Cheese, Mexican blend 40g [USDA 01251], Refried beans, canned 60g [USDA 16103], Sauce, salsa 30g [USDA 06164], Cream, sour 20g [USDA 01056]
  ('Veg Nachos (1 plate)', 'snack', 482, 16.9, 45.6, 26.9, false),
  -- Snacks, tortilla chips 28g [USDA 19056], Sauce, salsa 65g [USDA 06164]
  ('Chips and Salsa (1 oz chips + 1/4 cup salsa)', 'snack', 151, 3.0, 23.3, 5.9, false),
  -- Avocados, raw 55g [USDA 09037], Onions, raw 5g [USDA 11282], Tomatoes, red 5g [USDA 11529], Lime juice, raw 3g [USDA 09160]
  ('Guacamole (1/4 cup)', 'snack', 92, 1.2, 5.6, 8.1, true),
  -- Sauce, salsa 65g [USDA 06164]
  ('Salsa (1/4 cup)', 'snack', 19, 1.0, 4.3, 0.1, true),
  -- Refried beans, canned 119g [USDA 16103]
  ('Refried Beans (1/2 cup)', 'lunch', 107, 5.9, 16.1, 2.4, true),
  -- Rice, white 55g [USDA 20044], Tomatoes, red 30g [USDA 11529], Onions, raw 15g [USDA 11282], Sunflower oil 6g [IFCT T012]
  ('Mexican Rice (1 cup)', 'lunch', 266, 4.4, 46.5, 6.4, false),
  -- Corn, sweet 103g [USDA 11168], Salad dressing, mayonnaise 10g [USDA 04025], Cheese, mexican 10g [USDA 01267], Butter, salted 5g [USDA 01001]
  ('Elote / Mexican Street Corn (1 ear)', 'snack', 239, 5.7, 22.1, 16.1, false),
  -- Cream, sour 24g [USDA 01056]
  ('Sour Cream (2 tbsp)', 'dinner', 48, 0.6, 1.1, 4.6, false),
  -- Rice, white 158g [USDA 20045]
  ('White Rice, cooked (1 cup)', 'lunch', 205, 4.3, 44.5, 0.4, true),
  -- Rice, brown 202g [USDA 20037]
  ('Brown Rice, cooked (1 cup)', 'lunch', 248, 5.5, 51.7, 2.0, true),
  -- Quinoa, cooked 185g [USDA 20137]
  ('Quinoa, cooked (1 cup)', 'lunch', 222, 8.1, 39.4, 3.6, true),
  -- Couscous, cooked 157g [USDA 20029]
  ('Couscous, cooked (1 cup)', 'lunch', 176, 6.0, 36.5, 0.3, true),
  -- Pasta, cooked 124g [USDA 20121]
  ('Pasta, cooked (1 cup)', 'dinner', 196, 7.2, 38.3, 1.2, true),
  -- Pasta, whole-wheat 140g [USDA 20125]
  ('Whole Wheat Pasta, cooked (1 cup)', 'dinner', 209, 8.4, 42.1, 2.4, true),
  -- Cereals, oats 40g [USDA 08120]
  ('Rolled Oats (1/2 cup dry)', 'breakfast', 152, 5.3, 27.1, 2.6, true),
  -- Cereals ready-to-eat, granola 61g [USDA 08037]
  ('Granola (1/2 cup)', 'breakfast', 298, 8.3, 32.9, 14.8, false),
  -- Cereals ready-to-eat, KELLOGG 28g [USDA 08020]
  ('Corn Flakes (1 cup)', 'breakfast', 100, 2.1, 23.5, 0.1, false),
  -- Cereals ready-to-eat, GENERAL MILLS 28g [USDA 08013]
  ('Cheerios (1 cup)', 'breakfast', 105, 3.4, 20.5, 1.9, true),
  -- Bread, whole-wheat 32g [USDA 18075]
  ('Whole Wheat Bread (1 slice)', 'breakfast', 81, 4.0, 13.7, 1.1, true),
  -- Bread, white 27g [USDA 18069]
  ('White Bread (1 slice)', 'breakfast', 72, 2.4, 13.3, 0.9, false),
  -- Bread, multi-grain (includes whole-grain) 26g [USDA 28397]
  ('Multigrain Bread (1 slice)', 'breakfast', 69, 3.5, 11.3, 1.1, true),
  -- Bagels, plain 105g [USDA 18001]
  ('Plain Bagel (1 medium)', 'breakfast', 277, 11.1, 55.0, 1.4, false),
  -- Tortillas, ready-to-bake or -fry 72g [USDA 18364]
  ('Flour Tortilla (1, 10-inch)', 'lunch', 220, 5.9, 35.6, 5.8, false),
  -- Tortillas, ready-to-bake or -fry 24g [USDA 18363]
  ('Corn Tortilla (1)', 'lunch', 52, 1.4, 10.7, 0.7, true),
  -- Bread, pita 60g [USDA 18041]
  ('Pita Bread (1 large)', 'lunch', 165, 5.5, 33.4, 0.7, false),
  -- Rolls, dinner 40g [USDA 18342]
  ('Dinner Roll / Pav (1)', 'dinner', 124, 4.3, 20.8, 2.6, false),
  -- Croissants, butter 57g [USDA 18239]
  ('Croissant, butter (1 medium)', 'breakfast', 231, 4.7, 26.1, 12.0, false),
  -- Muffins, blueberry 113g [USDA 18274]
  ('Blueberry Muffin (1 medium)', 'breakfast', 424, 5.1, 59.9, 18.2, false),
  -- Pancakes, plain 76g [USDA 18293]
  ('Pancakes (2 x 4-inch)', 'breakfast', 173, 4.9, 21.5, 7.4, false),
  -- Waffles, plain 75g [USDA 18367]
  ('Waffle (1, 7-inch)', 'breakfast', 218, 5.9, 24.7, 10.6, false),
  -- Potatoes, baked 173g [USDA 11674]
  ('Potato, baked (1 medium)', 'dinner', 161, 4.3, 36.6, 0.2, true),
  -- Sweet potato, cooked 114g [USDA 11508]
  ('Sweet Potato, baked (1 medium)', 'lunch', 103, 2.3, 23.6, 0.2, true),
  -- Milk, whole 244g [USDA 01077]
  ('Milk, whole (1 cup)', 'breakfast', 149, 7.7, 11.7, 7.9, true),
  -- Milk, reduced fat 244g [USDA 01079]
  ('Milk, 2% (1 cup)', 'breakfast', 122, 8.1, 11.7, 4.8, true),
  -- Milk, nonfat 245g [USDA 01085]
  ('Milk, skim (1 cup)', 'breakfast', 83, 8.3, 12.2, 0.2, true),
  -- Soymilk, original and vanilla 243g [USDA 16120]
  ('Soy Milk, unsweetened (1 cup)', 'breakfast', 131, 7.9, 15.3, 4.3, true),
  -- Beverages, almond milk 240g [USDA 14091]
  ('Almond Milk, unsweetened (1 cup)', 'breakfast', 36, 1.4, 1.4, 2.6, true),
  -- Yogurt, Greek 170g [USDA 01256]
  ('Greek Yogurt, plain nonfat (170g)', 'breakfast', 100, 17.3, 6.1, 0.7, true),
  -- Yogurt, Greek 170g [USDA 01293]
  ('Greek Yogurt, plain whole milk (170g)', 'breakfast', 165, 15.3, 6.8, 8.5, true),
  -- Yogurt, Greek 150g [USDA 01285]
  ('Greek Yogurt, strawberry nonfat (150g cup)', 'breakfast', 123, 12.1, 18.1, 0.2, true),
  -- Yogurt, plain 245g [USDA 01116]
  ('Yogurt, plain whole milk (1 cup)', 'breakfast', 149, 8.5, 11.4, 8.0, true),
  -- Cheese, cottage 113g [USDA 01015]
  ('Cottage Cheese, 2% (1/2 cup)', 'snack', 92, 11.8, 5.4, 2.6, true),
  -- Paneer 100g [IFCT L003]
  ('Paneer (100g)', 'dinner', 258, 18.9, 12.4, 14.8, true),
  -- Cheese, cheddar 28g [USDA 01009]
  ('Cheddar Cheese (1 oz)', 'snack', 113, 6.4, 0.9, 9.3, false),
  -- Cheese, mozzarella 28g [USDA 01028]
  ('Mozzarella, part skim (1 oz)', 'snack', 71, 6.8, 0.8, 4.5, true),
  -- Cheese, parmesan 5g [USDA 01032]
  ('Parmesan, grated (1 tbsp)', 'dinner', 21, 1.4, 0.7, 1.4, false),
  -- Cheese, feta 28g [USDA 01019]
  ('Feta Cheese (1 oz)', 'lunch', 74, 4.0, 1.1, 6.0, false),
  -- Cheese, ricotta 124g [USDA 01037]
  ('Ricotta, part skim (1/2 cup)', 'dinner', 171, 14.1, 6.4, 9.8, true),
  -- Cheese, cream 29g [USDA 01017]
  ('Cream Cheese (2 tbsp)', 'breakfast', 102, 1.8, 1.6, 10.0, false),
  -- Butter, salted 14g [USDA 01001]
  ('Butter (1 tbsp)', 'breakfast', 100, 0.1, 0.0, 11.4, false),
  -- Ghee 5g [IFCT T013]
  ('Ghee (1 tsp)', 'lunch', 45, 0.0, 0.0, 5.0, false),
  -- Cream, fluid 15g [USDA 01053]
  ('Heavy Cream (1 tbsp)', 'breakfast', 51, 0.4, 0.4, 5.4, false),
  -- Beverages, Protein powder whey based 30g [USDA 14066]
  ('Whey Protein (1 scoop, 30g)', 'snack', 106, 23.4, 1.9, 0.5, true),
  -- Egg, whole 50g [USDA 01123]
  ('Egg, whole (1 large)', 'breakfast', 72, 6.3, 0.4, 4.8, true),
  -- Egg, whole 50g [USDA 01129]
  ('Egg, hard-boiled (1 large)', 'breakfast', 78, 6.3, 0.6, 5.3, true),
  -- Egg, white 33g [USDA 01124]
  ('Egg White (1 large)', 'breakfast', 17, 3.6, 0.2, 0.1, true),
  -- Egg, whole 122g [USDA 01130]
  ('Omelette, plain (2 eggs)', 'breakfast', 188, 12.9, 0.8, 14.2, true),
  -- Egg, whole 122g [USDA 01132]
  ('Scrambled Eggs (2 eggs)', 'breakfast', 182, 12.2, 2.0, 13.4, true),
  -- Tofu, raw 100g [USDA 16426]
  ('Tofu, firm (100g)', 'dinner', 144, 17.3, 2.8, 8.7, true),
  -- Edamame, frozen 155g [USDA 11212]
  ('Edamame (1 cup)', 'snack', 188, 18.5, 13.8, 8.1, true),
  -- Beans, black 86g [USDA 16015]
  ('Black Beans, cooked (1/2 cup)', 'lunch', 114, 7.6, 20.4, 0.5, true),
  -- Chickpeas (garbanzo beans, bengal gram) 82g [USDA 16057]
  ('Chickpeas, cooked (1/2 cup)', 'lunch', 134, 7.3, 22.5, 2.1, true),
  -- Beans, kidney 89g [USDA 16033]
  ('Kidney Beans, cooked (1/2 cup)', 'lunch', 113, 7.7, 20.3, 0.4, true),
  -- Lentils, mature seeds 99g [USDA 16070]
  ('Lentils, cooked (1/2 cup)', 'lunch', 115, 8.9, 19.9, 0.4, true),
  -- Beans, pinto 86g [USDA 16043]
  ('Pinto Beans, cooked (1/2 cup)', 'lunch', 123, 7.7, 22.5, 0.6, true),
  -- Hummus, commercial 30g [USDA 16158]
  ('Hummus (2 tbsp)', 'snack', 50, 2.4, 4.3, 2.9, true),
  -- Broccoli, cooked 156g [USDA 11091]
  ('Broccoli, cooked (1 cup)', 'dinner', 55, 3.7, 11.2, 0.6, true),
  -- Spinach, raw 30g [USDA 11457]
  ('Spinach, raw (1 cup)', 'lunch', 7, 0.9, 1.1, 0.1, true),
  -- Carrots, raw 61g [USDA 11124]
  ('Carrot (1 medium)', 'snack', 25, 0.6, 5.8, 0.1, true),
  -- Cucumber, with peel 104g [USDA 11205]
  ('Cucumber (1 cup sliced)', 'snack', 16, 0.7, 3.8, 0.1, true),
  -- Tomatoes, red 123g [USDA 11529]
  ('Tomato (1 medium)', 'lunch', 22, 1.1, 4.8, 0.2, true),
  -- Onions, raw 110g [USDA 11282]
  ('Onion (1 medium)', 'lunch', 44, 1.2, 10.3, 0.1, true),
  -- Lettuce, cos or romaine 47g [USDA 11251]
  ('Romaine Lettuce (1 cup)', 'lunch', 8, 0.6, 1.5, 0.1, true),
  -- Mushrooms, white 70g [USDA 11260]
  ('Mushrooms (1 cup)', 'dinner', 15, 2.2, 2.3, 0.2, true),
  -- Corn, sweet 149g [USDA 11168]
  ('Sweet Corn (1 cup)', 'lunch', 143, 5.1, 31.3, 2.2, true),
  -- Peas, green 160g [USDA 11313]
  ('Green Peas (1 cup)', 'lunch', 125, 8.2, 22.8, 0.4, true),
  -- Cauliflower, raw 107g [USDA 11135]
  ('Cauliflower (1 cup)', 'dinner', 27, 2.1, 5.3, 0.3, true),
  -- Peppers, sweet 119g [USDA 11821]
  ('Bell Pepper, red (1 medium)', 'lunch', 37, 1.2, 7.2, 0.4, true),
  -- Squash, summer 196g [USDA 11477]
  ('Zucchini (1 medium)', 'dinner', 33, 2.4, 6.1, 0.6, true),
  -- Kale, raw 21g [USDA 11233]
  ('Kale (1 cup)', 'lunch', 10, 0.9, 1.8, 0.2, true),
  -- Bananas, raw 118g [USDA 09040]
  ('Banana (1 medium)', 'snack', 105, 1.3, 27.0, 0.4, true),
  -- Apples, raw 182g [USDA 09003]
  ('Apple (1 medium)', 'snack', 95, 0.5, 25.1, 0.3, true),
  -- Oranges, raw 131g [USDA 09200]
  ('Orange (1 medium)', 'snack', 62, 1.2, 15.4, 0.2, true),
  -- Strawberries, raw 152g [USDA 09316]
  ('Strawberries (1 cup)', 'snack', 49, 1.0, 11.7, 0.5, true),
  -- Blueberries, raw 148g [USDA 09050]
  ('Blueberries (1 cup)', 'snack', 84, 1.1, 21.4, 0.5, true),
  -- Grapes, red or green (European type 151g [USDA 09132]
  ('Grapes (1 cup)', 'snack', 104, 1.1, 27.3, 0.2, true),
  -- Mangos, raw 165g [USDA 09176]
  ('Mango (1 cup)', 'snack', 99, 1.4, 24.7, 0.6, true),
  -- Watermelon, raw 152g [USDA 09326]
  ('Watermelon (1 cup)', 'snack', 46, 0.9, 11.5, 0.2, true),
  -- Papayas, raw 145g [USDA 09226]
  ('Papaya (1 cup)', 'breakfast', 62, 0.7, 15.7, 0.4, true),
  -- Pineapple, raw 165g [USDA 09266]
  ('Pineapple (1 cup)', 'snack', 82, 0.9, 21.6, 0.2, true),
  -- Pears, raw 178g [USDA 09252]
  ('Pear (1 medium)', 'snack', 101, 0.6, 27.1, 0.2, true),
  -- Pomegranates, raw 87g [USDA 09286]
  ('Pomegranate Arils (1/2 cup)', 'snack', 72, 1.5, 16.3, 1.0, true),
  -- Guavas, common 55g [USDA 09139]
  ('Guava (1 fruit)', 'snack', 37, 1.4, 7.9, 0.5, true),
  -- Kiwifruit, green 69g [USDA 09148]
  ('Kiwi (1 fruit)', 'snack', 42, 0.8, 10.1, 0.4, true),
  -- Dates, medjool 48g [USDA 09421]
  ('Medjool Dates (2)', 'snack', 133, 0.9, 36.0, 0.1, true),
  -- Raisins, seedless 28g [USDA 09298]
  ('Raisins (1 oz)', 'snack', 84, 0.9, 22.2, 0.1, true),
  -- Avocados, raw 68g [USDA 09037]
  ('Avocado (1/2)', 'lunch', 109, 1.4, 5.8, 10.0, true),
  -- Nuts, almonds 28g [USDA 12061]
  ('Almonds (1 oz, ~23)', 'snack', 162, 5.9, 6.0, 14.0, true),
  -- Nuts, cashew nuts 28g [USDA 12087]
  ('Cashews (1 oz)', 'snack', 155, 5.1, 8.5, 12.3, true),
  -- Nuts, walnuts 28g [USDA 12155]
  ('Walnuts (1 oz)', 'snack', 183, 4.3, 3.8, 18.3, true),
  -- Nuts, pistachio nuts 28g [USDA 12151]
  ('Pistachios (1 oz)', 'snack', 157, 5.6, 7.6, 12.7, true),
  -- Peanuts, all types 28g [USDA 16087]
  ('Peanuts (1 oz)', 'snack', 159, 7.2, 4.5, 13.8, true),
  -- Peanut butter, smooth style 32g [USDA 16398]
  ('Peanut Butter (2 tbsp)', 'snack', 191, 7.1, 7.1, 16.4, true),
  -- Nuts, almond butter 32g [USDA 12195]
  ('Almond Butter (2 tbsp)', 'snack', 196, 6.7, 6.0, 17.8, true),
  -- Seeds, chia seeds 12g [USDA 12006]
  ('Chia Seeds (1 tbsp)', 'breakfast', 58, 2.0, 5.1, 3.7, true),
  -- Seeds, flaxseed 10g [USDA 12220]
  ('Flaxseed (1 tbsp)', 'breakfast', 53, 1.8, 2.9, 4.2, true),
  -- Seeds, pumpkin and squash seed kernels 28g [USDA 12014]
  ('Pumpkin Seeds (1 oz)', 'snack', 157, 8.5, 3.0, 13.7, true),
  -- Seeds, sunflower seed kernels 28g [USDA 12036]
  ('Sunflower Seeds (1 oz)', 'snack', 164, 5.8, 5.6, 14.4, true),
  -- Seeds, sesame butter 15g [USDA 12166]
  ('Tahini (1 tbsp)', 'lunch', 89, 2.5, 3.2, 8.1, true),
  -- Oil, olive 13.5g [USDA 04053]
  ('Olive Oil (1 tbsp)', 'lunch', 119, 0.0, 0.0, 13.5, true),
  -- Sunflower oil 14g [IFCT T012]
  ('Cooking Oil (1 tbsp)', 'lunch', 126, 0.0, 0.0, 14.0, false),
  -- Sugars, granulated 4g [USDA 19335]
  ('Sugar (1 tsp)', 'breakfast', 15, 0.0, 4.0, 0.0, false),
  -- Jaggery, cane 10g [IFCT I001]
  ('Jaggery (10g)', 'snack', 35, 0.2, 8.5, 0.0, false),
  -- Honey 21g [USDA 19296]
  ('Honey (1 tbsp)', 'breakfast', 64, 0.1, 17.3, 0.0, false),
  -- Syrups, maple 20g [USDA 19353]
  ('Maple Syrup (1 tbsp)', 'breakfast', 52, 0.0, 13.4, 0.0, false),
  -- Jams and preserves 20g [USDA 19297]
  ('Jam (1 tbsp)', 'breakfast', 56, 0.1, 13.8, 0.0, false),
  -- Catsup 17g [USDA 11935]
  ('Ketchup (1 tbsp)', 'lunch', 17, 0.2, 4.7, 0.0, false),
  -- Salad dressing, mayonnaise 14g [USDA 04025]
  ('Mayonnaise (1 tbsp)', 'lunch', 95, 0.1, 0.1, 10.5, false),
  -- Bread, whole-wheat 32g [USDA 18075], Avocados, raw 50g [USDA 09037]
  ('Avocado Toast (1 slice + 1/4 avocado)', 'breakfast', 161, 5.0, 17.9, 8.4, true),
  -- Bread, whole-wheat 32g [USDA 18075], Peanut butter, smooth style 16g [USDA 16398]
  ('Peanut Butter Toast (1 slice + 1 tbsp)', 'breakfast', 176, 7.5, 17.2, 9.3, true),
  -- Snacks, popcorn 24g [USDA 19034]
  ('Popcorn, air-popped (3 cups)', 'snack', 93, 3.1, 18.7, 1.1, true),
  -- Snacks, potato chips 28g [USDA 19411]
  ('Potato Chips (1 oz)', 'snack', 149, 1.8, 15.1, 9.5, false),
  -- Snacks, tortilla chips 28g [USDA 19056]
  ('Tortilla Chips (1 oz)', 'snack', 132, 2.0, 19.0, 5.8, false),
  -- Crackers, standard snack-type 28g [USDA 18229]
  ('Crackers (1 oz)', 'snack', 143, 1.9, 17.2, 7.4, false),
  -- Snacks, granola bars 25g [USDA 19015]
  ('Granola Bar (1)', 'snack', 118, 2.5, 16.1, 5.0, false),
  -- Chocolate, dark 28g [USDA 19904]
  ('Dark Chocolate 70-85% (1 oz)', 'snack', 167, 2.2, 12.9, 11.9, false),
  -- Cookies, chocolate chip 13g [USDA 18159]
  ('Chocolate Chip Cookie (1)', 'snack', 64, 0.7, 8.5, 3.2, false),
  -- Ice creams, vanilla 66g [USDA 19095]
  ('Vanilla Ice Cream (1/2 cup)', 'snack', 137, 2.3, 15.6, 7.3, false),
  -- Fast foods, potato 117g [USDA 21138]
  ('French Fries (medium)', 'dinner', 365, 4.0, 48.5, 17.2, false),
  -- Beverages, coffee 237g [USDA 14209]
  ('Black Coffee (1 cup)', 'breakfast', 2, 0.3, 0.0, 0.0, true),
  -- Beverages, tea 237g [USDA 14355]
  ('Black Tea (1 cup)', 'breakfast', 2, 0.0, 0.7, 0.0, true),
  -- Milk, reduced fat 300g [USDA 01079]
  ('Latte, 2% milk (16 oz)', 'breakfast', 150, 9.9, 14.4, 5.9, false),
  -- Milk, reduced fat 190g [USDA 01079]
  ('Cappuccino, 2% milk (16 oz)', 'breakfast', 95, 6.3, 9.1, 3.8, false),
  -- Orange juice, raw 248g [USDA 09206]
  ('Orange Juice (1 cup)', 'breakfast', 112, 1.7, 25.8, 0.5, false),
  -- Beverages, carbonated 368g [USDA 14148]
  ('Cola (12 oz can)', 'snack', 155, 0.0, 38.1, 0.9, false),
  -- Alcoholic beverage, beer 356g [USDA 14003]
  ('Beer (12 oz)', 'dinner', 153, 1.6, 12.6, 0.0, false),
  -- Alcoholic beverage, wine 147g [USDA 14096]
  ('Red Wine (5 oz glass)', 'dinner', 125, 0.1, 3.8, 0.0, false)
) as v(template_name, meal_type, calories, protein_g, carbs_g, fats_g, is_healthy)
where not exists (
  select 1 from public.public_food_templates p
  where lower(p.template_name) = lower(v.template_name)
);
