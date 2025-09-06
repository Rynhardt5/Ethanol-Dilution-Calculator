import { Pool } from 'pg';

// Database connection singleton
class DatabaseConnection {
  private static instance: Pool | null = null;

  static getInstance(): Pool {
    if (!DatabaseConnection.instance) {
      const connectionString = process.env.DATABASE_URL;
      
      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is required');
      }

      DatabaseConnection.instance = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false
        } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    }

    return DatabaseConnection.instance;
  }

  static async closeConnection(): Promise<void> {
    if (DatabaseConnection.instance) {
      await DatabaseConnection.instance.end();
      DatabaseConnection.instance = null;
    }
  }
}

export const db = DatabaseConnection.getInstance();

// Query helpers for herbs database
export class HerbsDatabase {
  
  // Search herbs with full-text search
  static async searchHerbs(query: string, limit: number = 50) {
    const searchQuery = `
      SELECT DISTINCT h.*, 
        array_agg(DISTINCT ma.name) FILTER (WHERE ma.name IS NOT NULL) as medicinal_actions,
        array_agg(DISTINCT i.name) FILTER (WHERE i.name IS NOT NULL) as indications,
        array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags,
        ts_rank(to_tsvector('english', 
          coalesce(h.common_name, '') || ' ' || 
          coalesce(h.latin_name, '') || ' ' || 
          coalesce(h.family, '') || ' ' || 
          coalesce(h.folk_uses, '')
        ), plainto_tsquery('english', $1)) as rank
      FROM herbs h
      LEFT JOIN herb_medicinal_actions hma ON h.id = hma.herb_id
      LEFT JOIN medicinal_actions ma ON hma.action_id = ma.id
      LEFT JOIN herb_indications hi ON h.id = hi.herb_id
      LEFT JOIN indications i ON hi.indication_id = i.id
      LEFT JOIN herb_tags ht ON h.id = ht.herb_id
      LEFT JOIN tags t ON ht.tag_id = t.id
      WHERE to_tsvector('english', 
        coalesce(h.common_name, '') || ' ' || 
        coalesce(h.latin_name, '') || ' ' || 
        coalesce(h.family, '') || ' ' || 
        coalesce(h.folk_uses, '')
      ) @@ plainto_tsquery('english', $1)
      GROUP BY h.id
      ORDER BY rank DESC
      LIMIT $2
    `;
    
    const result = await db.query(searchQuery, [query, limit]);
    return result.rows;
  }

  // Get herb by ID with all related data
  static async getHerbById(id: string) {
    const herbQuery = `
      SELECT h.*,
        array_agg(DISTINCT pp.name) FILTER (WHERE pp.name IS NOT NULL) as plant_parts_used,
        array_agg(DISTINCT ma.name) FILTER (WHERE ma.name IS NOT NULL) as medicinal_actions,
        array_agg(DISTINCT i.name) FILTER (WHERE i.name IS NOT NULL) as indications,
        array_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL) as best_preparations,
        array_agg(DISTINCT int.name) FILTER (WHERE int.name IS NOT NULL) as interactions,
        array_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as sources,
        array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags
      FROM herbs h
      LEFT JOIN herb_plant_parts hpp ON h.id = hpp.herb_id
      LEFT JOIN plant_parts pp ON hpp.part_id = pp.id
      LEFT JOIN herb_medicinal_actions hma ON h.id = hma.herb_id
      LEFT JOIN medicinal_actions ma ON hma.action_id = ma.id
      LEFT JOIN herb_indications hi ON h.id = hi.herb_id
      LEFT JOIN indications i ON hi.indication_id = i.id
      LEFT JOIN herb_preparations hp ON h.id = hp.herb_id
      LEFT JOIN preparations p ON hp.preparation_id = p.id
      LEFT JOIN herb_interactions hint ON h.id = hint.herb_id
      LEFT JOIN interactions int ON hint.interaction_id = int.id
      LEFT JOIN herb_sources hs ON h.id = hs.herb_id
      LEFT JOIN sources s ON hs.source_id = s.id
      LEFT JOIN herb_tags ht ON h.id = ht.herb_id
      LEFT JOIN tags t ON ht.tag_id = t.id
      WHERE h.id = $1
      GROUP BY h.id
    `;

    const constituentQuery = `
      SELECT name, class, water_soluble, ethanol_range, notes
      FROM constituents
      WHERE herb_id = $1
      ORDER BY name
    `;

    const solventQuery = `
      SELECT preparation_type, ethanol_percent, ratio, notes
      FROM solvent_recommendations
      WHERE herb_id = $1
      ORDER BY preparation_type
    `;

    const [herbResult, constituentResult, solventResult] = await Promise.all([
      db.query(herbQuery, [id]),
      db.query(constituentQuery, [id]),
      db.query(solventQuery, [id])
    ]);

    if (herbResult.rows.length === 0) {
      return null;
    }

    const herb = herbResult.rows[0];
    interface ConstituentRow {
      name: string;
      class: string;
      water_soluble: boolean;
      ethanol_range: string;
      notes: string;
    }

    herb.constituents = constituentResult.rows.map((c: ConstituentRow) => ({
      name: c.name,
      class: c.class,
      solubility: {
        water: c.water_soluble,
        ethanol_range: c.ethanol_range
      },
      notes: c.notes
    }));
    herb.solvent_recommendations = solventResult.rows;

    return herb;
  }

  // Get all herbs with basic info (for listing)
  static async getAllHerbs(limit: number = 100, offset: number = 0) {
    const query = `
      SELECT h.id, h.common_name, h.latin_name, h.family,
        array_agg(DISTINCT ma.name) FILTER (WHERE ma.name IS NOT NULL) as medicinal_actions,
        array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags
      FROM herbs h
      LEFT JOIN herb_medicinal_actions hma ON h.id = hma.herb_id
      LEFT JOIN medicinal_actions ma ON hma.action_id = ma.id
      LEFT JOIN herb_tags ht ON h.id = ht.herb_id
      LEFT JOIN tags t ON ht.tag_id = t.id
      GROUP BY h.id, h.common_name, h.latin_name, h.family
      ORDER BY h.common_name
      LIMIT $1 OFFSET $2
    `;

    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }

  // Search by specific criteria
  static async searchByAction(action: string) {
    const query = `
      SELECT DISTINCT h.id, h.common_name, h.latin_name, h.family
      FROM herbs h
      JOIN herb_medicinal_actions hma ON h.id = hma.herb_id
      JOIN medicinal_actions ma ON hma.action_id = ma.id
      WHERE ma.name ILIKE $1
      ORDER BY h.common_name
    `;

    const result = await db.query(query, [`%${action}%`]);
    return result.rows;
  }

  static async searchByIndication(indication: string) {
    const query = `
      SELECT DISTINCT h.id, h.common_name, h.latin_name, h.family
      FROM herbs h
      JOIN herb_indications hi ON h.id = hi.herb_id
      JOIN indications i ON hi.indication_id = i.id
      WHERE i.name ILIKE $1
      ORDER BY h.common_name
    `;

    const result = await db.query(query, [`%${indication}%`]);
    return result.rows;
  }

  static async searchByConstituent(constituent: string) {
    const query = `
      SELECT DISTINCT h.id, h.common_name, h.latin_name, h.family
      FROM herbs h
      JOIN constituents c ON h.id = c.herb_id
      WHERE c.name ILIKE $1 OR c.class ILIKE $1
      ORDER BY h.common_name
    `;

    const result = await db.query(query, [`%${constituent}%`]);
    return result.rows;
  }

  // Combined search with filters for server-side filtering
  static async searchHerbsWithFilters(filters: {
    query?: string | null;
    action?: string | null;
    preparation?: string | null;
    indication?: string | null;
    constituent?: string | null;
    limit: number;
    offset: number;
  }) {
    const whereConditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    // Build WHERE conditions based on filters
    if (filters.query) {
      whereConditions.push(`(
        h.common_name ILIKE $${paramIndex} OR 
        h.latin_name ILIKE $${paramIndex} OR 
        h.family ILIKE $${paramIndex} OR 
        h.folk_uses ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.query}%`);
      paramIndex++;
    }

    if (filters.action) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM herb_medicinal_actions hma2 
        JOIN medicinal_actions ma2 ON hma2.action_id = ma2.id 
        WHERE hma2.herb_id = h.id AND ma2.name ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.action}%`);
      paramIndex++;
    }

    if (filters.preparation) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM herb_preparations hp2 
        JOIN preparations p2 ON hp2.preparation_id = p2.id 
        WHERE hp2.herb_id = h.id AND p2.name ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.preparation}%`);
      paramIndex++;
    }

    if (filters.indication) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM herb_indications hi2 
        JOIN indications i2 ON hi2.indication_id = i2.id 
        WHERE hi2.herb_id = h.id AND i2.name ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.indication}%`);
      paramIndex++;
    }

    if (filters.constituent) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM constituents c2 
        WHERE c2.herb_id = h.id AND (c2.name ILIKE $${paramIndex} OR c2.class ILIKE $${paramIndex})
      )`);
      params.push(`%${filters.constituent}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const searchQuery = `
      SELECT DISTINCT h.id, h.common_name, h.latin_name, h.family, h.folk_uses, h.is_priority, h.is_featured,
        array_agg(DISTINCT pp.name) FILTER (WHERE pp.name IS NOT NULL) as plant_parts_used,
        array_agg(DISTINCT ma.name) FILTER (WHERE ma.name IS NOT NULL) as medicinal_actions,
        array_agg(DISTINCT i.name) FILTER (WHERE i.name IS NOT NULL) as indications,
        array_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL) as best_preparations,
        array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags
      FROM herbs h
      LEFT JOIN herb_plant_parts hpp ON h.id = hpp.herb_id
      LEFT JOIN plant_parts pp ON hpp.part_id = pp.id
      LEFT JOIN herb_medicinal_actions hma ON h.id = hma.herb_id
      LEFT JOIN medicinal_actions ma ON hma.action_id = ma.id
      LEFT JOIN herb_indications hi ON h.id = hi.herb_id
      LEFT JOIN indications i ON hi.indication_id = i.id
      LEFT JOIN herb_preparations hp ON h.id = hp.herb_id
      LEFT JOIN preparations p ON hp.preparation_id = p.id
      LEFT JOIN herb_tags ht ON h.id = ht.herb_id
      LEFT JOIN tags t ON ht.tag_id = t.id
      ${whereClause}
      GROUP BY h.id, h.common_name, h.latin_name, h.family, h.folk_uses, h.is_priority, h.is_featured
      ORDER BY 
        ${filters.query ? 'h.is_priority DESC,' : 'h.is_featured DESC, h.is_priority DESC,'}
        h.common_name
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(filters.limit, filters.offset);
    
    const result = await db.query(searchQuery, params);
    return result.rows;
  }

  // Get count of herbs matching filters for pagination
  static async getHerbsCount(filters: {
    query?: string | null;
    action?: string | null;
    preparation?: string | null;
    indication?: string | null;
    constituent?: string | null;
  }) {
    const whereConditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    // Build WHERE conditions (same logic as searchHerbsWithFilters)
    if (filters.query) {
      whereConditions.push(`
        to_tsvector('english', 
          coalesce(h.common_name, '') || ' ' || 
          coalesce(h.latin_name, '') || ' ' || 
          coalesce(h.family, '') || ' ' || 
          coalesce(h.folk_uses, '')
        ) @@ plainto_tsquery('english', $${paramIndex})
      `);
      params.push(filters.query);
      paramIndex++;
    }

    if (filters.action) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM herb_medicinal_actions hma2 
        JOIN medicinal_actions ma2 ON hma2.action_id = ma2.id 
        WHERE hma2.herb_id = h.id AND ma2.name ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.action}%`);
      paramIndex++;
    }

    if (filters.preparation) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM herb_preparations hp2 
        JOIN preparations p2 ON hp2.preparation_id = p2.id 
        WHERE hp2.herb_id = h.id AND p2.name ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.preparation}%`);
      paramIndex++;
    }

    if (filters.indication) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM herb_indications hi2 
        JOIN indications i2 ON hi2.indication_id = i2.id 
        WHERE hi2.herb_id = h.id AND i2.name ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.indication}%`);
      paramIndex++;
    }

    if (filters.constituent) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM constituents c2 
        WHERE c2.herb_id = h.id AND (c2.name ILIKE $${paramIndex} OR c2.class ILIKE $${paramIndex})
      )`);
      params.push(`%${filters.constituent}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(DISTINCT h.id) as total
      FROM herbs h
      ${whereClause}
    `;

    const result = await db.query(countQuery, params);
    return parseInt(result.rows[0].total);
  }

  // Get database statistics
  static async getStats() {
    const queries = [
      'SELECT COUNT(*) as herb_count FROM herbs',
      'SELECT COUNT(*) as constituent_count FROM constituents',
      'SELECT COUNT(*) as action_count FROM medicinal_actions',
      'SELECT COUNT(*) as indication_count FROM indications'
    ];

    const results = await Promise.all(
      queries.map(query => db.query(query))
    );

    return {
      herbs: parseInt(results[0].rows[0].herb_count),
      constituents: parseInt(results[1].rows[0].constituent_count),
      actions: parseInt(results[2].rows[0].action_count),
      indications: parseInt(results[3].rows[0].indication_count)
    };
  }
}

export default HerbsDatabase;
