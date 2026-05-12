import { supabase } from '@/integrations/supabase/client';

interface UploadMonitoringEvidenceParams {
  contractId: string;
  monitoramentoId: string;
  file: File;
  referenciaAno: number;
  referenciaMes: number;
}

interface UploadResult {
  path: string;
  publicUrl: string;
}

const MONITORING_BUCKET = 'monitoramentos';

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

function padMonth(month: number): string {
  return month.toString().padStart(2, '0');
}

export async function uploadMonitoringEvidence(
  params: UploadMonitoringEvidenceParams
): Promise<UploadResult> {
  const timestamp = Date.now();
  const sanitizedName = sanitizeFileName(params.file.name);
  const folder = `${params.contractId}/${params.referenciaAno}-${padMonth(params.referenciaMes)}`;
  const path = `${folder}/${params.monitoramentoId}_${timestamp}_${sanitizedName}`;

  const { error: uploadError } = await supabase.storage
    .from(MONITORING_BUCKET)
    .upload(path, params.file, {
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Falha ao enviar arquivo para o storage: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(MONITORING_BUCKET)
    .getPublicUrl(path);

  if (!publicUrlData?.publicUrl) {
    throw new Error('Não foi possível obter a URL pública do arquivo enviado.');
  }

  return {
    path,
    publicUrl: publicUrlData.publicUrl,
  };
}













