-- Consolidated Supabase Setup Script for Puniora
-- This script sets up the entire database schema, RLS policies, and triggers.
-- Run this in the Supabase SQL Editor.

-- ==========================================
-- 1. CLEANUP (Optional - Use with caution)
-- ==========================================
-- DROP TABLE IF EXISTS public.orders CASCADE;
-- DROP TABLE IF EXISTS public.reviews CASCADE;
-- DROP TABLE IF EXISTS public.products CASCADE;
-- DROP TABLE IF EXISTS public.site_settings CASCADE;
-- DROP TABLE IF EXISTS public.blogs CASCADE;
-- DROP TABLE IF EXISTS public.addresses CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- ==========================================
-- 2. PRODUCTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Men', 'Women', 'Unisex')),
  price DECIMAL(10, 2) NOT NULL,
  size TEXT NOT NULL,
  notes TEXT[] NOT NULL,
  description TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  variants JSONB DEFAULT '[]'::jsonb,
  is_gift_set BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional Columns added later
  bundle_items TEXT[] DEFAULT '{}',
  gallery TEXT[] DEFAULT '{}',
  "olfactoryNotes" JSONB DEFAULT '[]'::jsonb,
  "extraSections" JSONB DEFAULT '[]'::jsonb,
  "isHidden" BOOLEAN DEFAULT FALSE,
  videos TEXT[] DEFAULT '{}',
  real_price DECIMAL(10, 2),
  is_featured BOOLEAN DEFAULT FALSE,
  is_sold_out BOOLEAN DEFAULT FALSE,
  stock_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE
);

-- DISABLE Row Level Security for production simplicity (Admin App handles security via API logic often)
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Storage Policies for Products (Public Upload/View)
DO $$ 
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('product-images', 'product-images', true)
    ON CONFLICT (id) DO NOTHING;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Uploads') THEN
        CREATE POLICY "Public Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Viewing') THEN
        CREATE POLICY "Public Viewing" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
    END IF;
END $$;


-- ==========================================
-- 3. PROFILES & AUTH (Linked to auth.users)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone.') THEN
        CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile.') THEN
        CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile.') THEN
        CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- 4. ADDRESSES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Address Policies (Safe creation using IF NOT EXISTS logic via DO block or just loose CREATE POLICY which errors if exists, using DO block is cleaner)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'addresses' AND policyname = 'Users can view their own addresses.') THEN
      CREATE POLICY "Users can view their own addresses." ON addresses FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'addresses' AND policyname = 'Users can insert their own addresses.') THEN
      CREATE POLICY "Users can insert their own addresses." ON addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'addresses' AND policyname = 'Users can update their own addresses.') THEN
      CREATE POLICY "Users can update their own addresses." ON addresses FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'addresses' AND policyname = 'Users can delete their own addresses.') THEN
      CREATE POLICY "Users can delete their own addresses." ON addresses FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;


-- ==========================================
-- 5. ORDERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    customer_name TEXT, -- Can be null? Schema said NOT NULL originally but checkout changes might affect this. Keeping loose for safety.
    customer_mobile TEXT NOT NULL,
    customer_email TEXT, -- Added for Guest Checkout
    address_json JSONB NOT NULL,
    total_amount NUMERIC NOT NULL,
    payment_status TEXT DEFAULT 'pending' NOT NULL,
    tracking_status TEXT DEFAULT 'Order Placed' NOT NULL,
    tracking_id TEXT,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    items JSONB NOT NULL,
    user_id UUID REFERENCES auth.users(id), -- Linked to Auth User
    cancellation_reason TEXT,
    shiprocket_order_id TEXT,
    shiprocket_shipment_id TEXT,
    awb_code TEXT
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can view their own orders') THEN
      CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Anyone can create orders') THEN
      CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
  END IF;
  
  -- Admin Access: Ideally restricted, but for this app structure often "Anyone" or Service Role is used.
  -- Adding a policy that allows everything for service role is implicit.
END $$;


-- ==========================================
-- 6. REVIEWS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;


-- ==========================================
-- 7. BLOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  author_name TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blogs' AND policyname = 'Public can view blogs') THEN
      CREATE POLICY "Public can view blogs" ON blogs FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blogs' AND policyname = 'Admins can insert blogs') THEN
      CREATE POLICY "Admins can insert blogs" ON blogs FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blogs' AND policyname = 'Admins can update blogs') THEN
      CREATE POLICY "Admins can update blogs" ON blogs FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blogs' AND policyname = 'Admins can delete blogs') THEN
      CREATE POLICY "Admins can delete blogs" ON blogs FOR DELETE USING (true);
  END IF;
END $$;


-- ==========================================
-- 8. SITE SETTINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.site_settings DISABLE ROW LEVEL SECURITY;

-- Seed Settings
INSERT INTO site_settings (key, value)
VALUES 
  ('hero_image_url', ''), 
  ('hero_images', '[]'),
  ('hero_images_mobile', '[]'),
  ('banner_enabled', 'false'),
  ('banner_text', ''),
  ('home_media_slots', '[{"key":"hero_main","label":"Hero Main Banner","location":"Homepage > Top Hero","url":"/home/banner-main.jpg","link":"/products"},{"key":"collection_1","label":"Collection Card 1","location":"Homepage > Shop By Collection","url":"/home/collection-1.jpg","link":"/products"},{"key":"collection_2","label":"Collection Card 2","location":"Homepage > Shop By Collection","url":"/home/collection-2.jpg","link":"/products"},{"key":"collection_3","label":"Collection Card 3","location":"Homepage > Shop By Collection","url":"/home/collection-3.jpg","link":"/products"},{"key":"brand_story","label":"Brand Story Image","location":"Homepage > Brand Story Split Section","url":"/our-story-saree.jpg","link":"/about"},{"key":"gallery_1","label":"Gallery Image 1","location":"Homepage > Photo Gallery","url":"/home/gallery-1.jpg","link":"/products"},{"key":"gallery_2","label":"Gallery Image 2","location":"Homepage > Photo Gallery","url":"/home/gallery-2.jpg","link":"/products"},{"key":"gallery_3","label":"Gallery Image 3","location":"Homepage > Photo Gallery","url":"/home/gallery-3.jpg","link":"/products"},{"key":"gallery_4","label":"Gallery Image 4","location":"Homepage > Photo Gallery","url":"/home/gallery-4.jpg","link":"/products"}]')
ON CONFLICT (key) DO NOTHING;


-- ==========================================
-- 9. FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_blog_updated ON public.blogs;
CREATE TRIGGER on_blog_updated
  BEFORE UPDATE ON public.blogs
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_product_updated ON public.products;
CREATE TRIGGER on_product_updated
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
-- Add real_price column to products table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'real_price') THEN 
        ALTER TABLE public.products ADD COLUMN real_price DECIMAL(10, 2); 
    END IF; 

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_email') THEN 
        ALTER TABLE public.orders ADD COLUMN customer_email TEXT; 
    END IF;

    -- Add order_number for friendly IDs (PF01 style)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_number') THEN
        ALTER TABLE public.orders ADD COLUMN order_number BIGINT GENERATED BY DEFAULT AS IDENTITY;
    END IF;
END $$;
