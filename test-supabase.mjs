import mysql from 'mysql2/promise';

// Testar se conseguimos conectar ao Supabase via Node.js
// Supabase usa PostgreSQL, então vamos usar pg

async function testConnection() {
  const connectionString = 'postgresql://postgres:@DataTr4ck1ng!@db.tmcdfdpbnkmcvjzqedvw.supabase.co:5432/postgres';
  
  console.log('Testando conexão com Supabase...');
  console.log('Host: db.tmcdfdpbnkmcvjzqedvw.supabase.co');
  
  try {
    // Fazer uma requisição HTTP para verificar se o host existe
    const response = await fetch('https://tmcdfdpbnkmcvjzqedvw.supabase.co/rest/v1/', {
      method: 'GET',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
      }
    });
    console.log('Status da API Supabase:', response.status);
  } catch (error) {
    console.log('Erro ao conectar:', error.message);
  }
}

testConnection();
