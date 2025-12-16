import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

const { Pool } = pg;

// String de conexão do Supabase usando o pooler
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.tmcdfdpbnkmcvjzqedvw:@DataTr4ck1ng!@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

async function testDrizzleConnection() {
  console.log('🔄 Testando conexão Drizzle ORM com PostgreSQL (Supabase)...');
  console.log('Projeto: DTE (tmcdfdpbnkmcvjzqedvw)');
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const db = drizzle(pool);
    
    // Testar query simples
    const result = await db.execute(sql`SELECT NOW() as current_time, current_database() as database`);
    console.log('✅ Conexão Drizzle estabelecida com sucesso!');
    console.log('📊 Informações do banco:');
    console.log('   - Data/Hora atual:', result.rows[0].current_time);
    console.log('   - Banco de dados:', result.rows[0].database);
    
    // Listar tabelas existentes
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tabelas existentes no banco:');
    if (tablesResult.rows.length === 0) {
      console.log('   (Nenhuma tabela encontrada - banco vazio)');
    } else {
      tablesResult.rows.forEach(row => {
        console.log('   -', row.table_name);
      });
    }
    
    // Contar registros em algumas tabelas
    console.log('\n📈 Contagem de registros:');
    
    const usersCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    console.log('   - users:', usersCount.rows[0].count);
    
    const regioesCount = await db.execute(sql`SELECT COUNT(*) as count FROM regioes`);
    console.log('   - regioes:', regioesCount.rows[0].count);
    
    const municipiosCount = await db.execute(sql`SELECT COUNT(*) as count FROM municipios`);
    console.log('   - municipios:', municipiosCount.rows[0].count);
    
    await pool.end();
    console.log('\n✅ Teste de conexão Drizzle concluído com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
    await pool.end();
    return false;
  }
}

testDrizzleConnection();
