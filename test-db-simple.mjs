#!/usr/bin/env node

import { Pool } from 'pg';

async function testConnection() {
  console.log('🧪 Testing PostgreSQL Connection...\n');

  try {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error('❌ DATABASE_URL environment variable is required');
      console.log('💡 Set it like: export DATABASE_URL="postgresql://user:pass@host:5432/dbname"');
      process.exit(1);
    }

    const pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false,
    });

    // Test basic connection
    console.log('🔌 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL successfully!');
    
    // Test if tables exist
    console.log('\n📋 Checking if herbs tables exist...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('herbs', 'constituents', 'medicinal_actions')
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No herbs tables found. Run the migration first:');
      console.log('   DATABASE_URL="..." node database/migrate-to-postgres.js');
    } else {
      console.log(`✅ Found ${tablesResult.rows.length} herbs tables:`);
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      
      // Test record counts if tables exist
      if (tablesResult.rows.length >= 3) {
        console.log('\n📊 Getting record counts...');
        const herbCount = await client.query('SELECT COUNT(*) FROM herbs');
        const constituentCount = await client.query('SELECT COUNT(*) FROM constituents');
        const actionCount = await client.query('SELECT COUNT(*) FROM medicinal_actions');
        
        console.log(`✅ Database contains:`);
        console.log(`   - ${herbCount.rows[0].count} herbs`);
        console.log(`   - ${constituentCount.rows[0].count} constituents`);
        console.log(`   - ${actionCount.rows[0].count} medicinal actions`);
      }
    }
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Connection failed. Check your DATABASE_URL and network connection.');
    } else if (error.message.includes('authentication')) {
      console.log('\n💡 Authentication failed. Check your username/password in DATABASE_URL.');
    }
    
    process.exit(1);
  }
}

testConnection();
