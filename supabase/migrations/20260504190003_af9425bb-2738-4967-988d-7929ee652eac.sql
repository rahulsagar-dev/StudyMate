
-- 1) user_inventory: revoke direct client write access
DROP POLICY IF EXISTS "Users can insert own inventory" ON public.user_inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON public.user_inventory;
DROP POLICY IF EXISTS "Users can delete own inventory" ON public.user_inventory;

-- 2) active_boosts: revoke direct client write access
DROP POLICY IF EXISTS "Users can insert own active boosts" ON public.active_boosts;
DROP POLICY IF EXISTS "Users can update own active boosts" ON public.active_boosts;
DROP POLICY IF EXISTS "Users can delete own active boosts" ON public.active_boosts;

-- 3) documents: remove broad UPDATE; only the parser (service role) updates parsed fields
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;

-- 4) storage.objects: explicit UPDATE policy for the private "documents" bucket,
--    scoped to the owning user folder.
DROP POLICY IF EXISTS "Users can update their own documents files" ON storage.objects;
CREATE POLICY "Users can update their own documents files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
