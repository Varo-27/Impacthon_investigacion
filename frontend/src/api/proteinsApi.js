/**
 * Helper para consultar el catálogo de proteínas de la API CESGA
 * Ayuda a enriquecer jobs con información del catálogo
 */

const PROTEINS_API_BASE = "https://api-mock-cesga.onrender.com";

/**
 * Buscar proteínas por nombre en el catálogo
 * @param {string} searchTerm - Nombre o término de búsqueda
 * @returns {Promise<Array>} Lista de proteínas encontradas
 */
export async function searchProteins(searchTerm) {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) return [];
    
    const response = await fetch(
      `${PROTEINS_API_BASE}/proteins/?search=${encodeURIComponent(searchTerm)}`
    );
    if (!response.ok) return [];
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Error searching proteins:", e);
    return [];
  }
}

/**
 * Obtener detalles completos de una proteína específica
 * @param {string} proteinId - ID de la proteína (ej: ubiquitin, gfp)
 * @returns {Promise<Object|null>} Datos completos de la proteína o null
 */
export async function getProteinDetails(proteinId) {
  try {
    if (!proteinId) return null;
    
    const response = await fetch(`${PROTEINS_API_BASE}/proteins/${proteinId}`);
    if (!response.ok) return null;
    
    return await response.json();
  } catch (e) {
    console.error(`Error fetching protein ${proteinId}:`, e);
    return null;
  }
}

/**
 * Buscar mejor coincidencia de proteína en el catálogo
 * Compara nombre y categoría contra proteínas conocidas
 * @param {string} proteinName - Nombre a buscar
 * @param {number} aaLength - Longitud en aminoácidos (para refinar búsqueda)
 * @returns {Promise<Object|null>} Mejor coincidencia encontrada o null
 */
export async function findBestProteinMatch(proteinName, aaLength) {
  try {
    if (!proteinName || proteinName.trim().length < 2) return null;
    
    // Buscar con el nombre
    const results = await searchProteins(proteinName);
    
    if (results.length === 0) return null;
    
    // Si solo hay uno, retornarlo
    if (results.length === 1) return results[0];
    
    // Si hay varios, preferir el que coincida en longitud (~10% de tolerancia)
    if (aaLength && aaLength > 0) {
      const tolerance = aaLength * 0.1;
      const bestByLength = results.find(
        p => p.length && Math.abs(p.length - aaLength) <= tolerance
      );
      if (bestByLength) return bestByLength;
    }
    
    // Si no, retornar el primero
    return results[0];
  } catch (e) {
    console.error("Error in findBestProteinMatch:", e);
    return null;
  }
}

/**
 * Extraer información de enriquecimiento de una proteína del catálogo
 * @param {Object} proteinData - Datos de la proteína desde /proteins/{id}
 * @returns {Object} Información filtrada para Firebase
 */
export function extractProteinMetadata(proteinData) {
  if (!proteinData) return {};
  
  return {
    // Identificadores
    proteinId: proteinData.protein_id || null,
    uniprot: proteinData.uniprot_id || null,
    pdbId: proteinData.pdb_id || null,
    
    // Información básica
    functionalCategory: proteinData.category || null,
    organism: proteinData.organism || null,
    aaLength: proteinData.length || null,
    
    // Información detallada
    functionalDescription: proteinData.description || null,
    molecularWeight: proteinData.molecular_weight_kda || null,
    
    // Información de estructura
    secondaryStructure: proteinData.secondary_structure 
      ? {
          helixPercent: proteinData.secondary_structure.helix_percent,
          strandPercent: proteinData.secondary_structure.strand_percent,
          coilPercent: proteinData.secondary_structure.coil_percent,
        }
      : null,
    
    // Keywords/Tags del catálogo
    tags: Array.isArray(proteinData.keywords) ? proteinData.keywords : [],
    
    // Información taxonómica si está disponible
    taxonomy: proteinData.taxonomy 
      ? {
          superkingdom: proteinData.taxonomy.superkingdom,
          phylum: proteinData.taxonomy.phylum,
          species: proteinData.taxonomy.species,
        }
      : null,
      
    // Mark que proviene del catálogo
    fromCatalog: true,
  };
}

/**
 * Obtener estadísticas del catálogo (para poblar selectores dinámicos)
 * @returns {Promise<Object>} Estadísticas y listas de categorías, organismos, etc.
 */
export async function getCatalogStats() {
  try {
    const response = await fetch(`${PROTEINS_API_BASE}/proteins/stats`);
    if (!response.ok) return null;
    
    const stats = await response.json();
    return {
      totalProteins: stats.total_proteins,
      embeddedProteins: stats.embedded_proteins,
      averageLength: stats.average_length,
      byCategory: stats.by_category || {},
    };
  } catch (e) {
    console.error("Error fetching catalog stats:", e);
    return null;
  }
}

/**
 * Obtener todas las proteínas del catálogo (para índice local)
 * @returns {Promise<Array>} Lista completa de proteínas
 */
export async function getAllProteins() {
  try {
    const response = await fetch(`${PROTEINS_API_BASE}/proteins/?limit=1000`);
    if (!response.ok) return [];
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Error fetching all proteins:", e);
    return [];
  }
}
