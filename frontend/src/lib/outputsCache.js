const CESGA_BASE = "https://api-mock-cesga.onrender.com";

// Cache compartido entre Viewer y RAGAssistant.
// Un job COMPLETED nunca cambia — se fetchea una sola vez por sesión.
const cache = new Map();

export async function getJobOutputs(cesgaJobId) {
  if (cache.has(cesgaJobId)) return cache.get(cesgaJobId);

  const resp = await fetch(`${CESGA_BASE}/jobs/${cesgaJobId}/outputs`);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const out = await resp.json();

  const data = {
    name:           out.protein_metadata?.protein_name    || null,
    plddt:          out.structural_data?.confidence?.plddt_mean
                 ?? out.structural_data?.confidence?.plddt_average
                 ?? out.protein_metadata?.plddt_average
                 ?? null,
    pdbFileUrl:     out.structural_data?.pdb_file         || null,
    biological:     out.biological_data                   || null,
    uniprot:        out.protein_metadata?.uniprot_id      || null,
    organism:       out.protein_metadata?.organism        || null,
    paeMatrix:      out.structural_data?.confidence?.pae_matrix      || null,
    plddtHistogram: out.structural_data?.confidence?.plddt_histogram || null,
  };

  cache.set(cesgaJobId, data);
  return data;
}

export function getCachedOutputs(cesgaJobId) {
  return cache.get(cesgaJobId) ?? null;
}
