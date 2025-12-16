import pg from 'pg';
const { Client } = pg;

// String de conexão do Supabase usando o pooler
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.tmcdfdpbnkmcvjzqedvw:@DataTr4ck1ng!@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

async function testConnection() {
  console.log('🔄 Testando conexão com o banco DTE no Supabase...');
  console.log('Host: aws-0-us-west-2.pooler.supabase.com');
  console.log('Projeto: DTE (tmcdfdpbnkmcvjzqedvw)');
  
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar query simples
    const result = await client.query('SELECT NOW() as current_time, current_database() as database');
    console.log('📊 Informações do banco:');
    console.log('   - Data/Hora atual:', result.rows[0].current_time);
    console.log('   - Banco de dados:', result.rows[0].database);
    
    // Listar tabelas existentes
    const tablesResult = await client.query(`
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
    
    await client.end();
    console.log('\n✅ Teste de conexão concluído com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
    return false;
  }
}

testConnection();
