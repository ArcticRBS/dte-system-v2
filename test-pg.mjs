import pg from 'pg';

const { Client } = pg;

async function testConnection() {
  console.log('Testando conexão PostgreSQL com Supabase...');
  
  const client = new Client({
    connectionString: 'postgresql://postgres:@DataTr4ck1ng!@db.tmcdfdpbnkmcvjzqedvw.supabase.co:5432/postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    const result = await client.query('SELECT version()');
    console.log('Versão do PostgreSQL:', result.rows[0].version);
    
    // Listar tabelas existentes
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tabelas existentes:', tables.rows.map(r => r.table_name));
    
    await client.end();
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
  }
}

testConnection();
