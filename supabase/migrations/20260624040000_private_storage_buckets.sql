-- SEC-10: Private storage buckets for sensitive documents

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'collaborator-documents',
    'collaborator-documents',
    false,
    5242880,
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'rented-equipments',
    'rented-equipments',
    false,
    5242880,
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- SELECT: company members can read files under their company folder
CREATE POLICY storage_collaborator_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'collaborator-documents'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_my_companies())
  );

CREATE POLICY storage_rented_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'rented-equipments'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_my_companies())
  );

-- INSERT: company members with colaboradores create or obra access
CREATE POLICY storage_collaborator_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'collaborator-documents'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_my_companies())
  );

CREATE POLICY storage_rented_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'rented-equipments'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_my_companies())
  );

-- DELETE: same company scope
CREATE POLICY storage_collaborator_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'collaborator-documents'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_my_companies())
  );

CREATE POLICY storage_rented_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'rented-equipments'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_my_companies())
  );
