-- Criar bucket público para PDFs de licenças
INSERT INTO storage.buckets (id, name, public)
VALUES ('licencas', 'licencas', true);

-- Política: Usuários autenticados podem fazer upload
CREATE POLICY "Authenticated users can upload license PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'licencas');

-- Política: Todos podem visualizar PDFs públicos
CREATE POLICY "Anyone can view license PDFs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'licencas');

-- Política: Admins podem deletar qualquer PDF
CREATE POLICY "Admins can delete any license PDF"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'licencas' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Política: Usuários podem deletar seus próprios PDFs
CREATE POLICY "Users can delete their own license PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'licencas' 
  AND auth.uid() = owner
);