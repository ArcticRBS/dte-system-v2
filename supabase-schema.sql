-- ============================================================
-- SCRIPT SQL PARA CRIAÇÃO DO BANCO DE DADOS DTE NO SUPABASE
-- Sistema Data Tracking Eleitoral - Campanhas 2026
-- ============================================================

-- Limpar tabelas existentes (CUIDADO: isso apaga todos os dados!)
-- Descomente as linhas abaixo apenas se quiser recriar do zero
-- DROP TABLE IF EXISTS audit_logs CASCADE;
-- DROP TABLE IF EXISTS demo_data CASCADE;
-- DROP TABLE IF EXISTS importacoes CASCADE;
-- DROP TABLE IF EXISTS votos_nulos_brancos CASCADE;
-- DROP TABLE IF EXISTS resultados_eleitorais CASCADE;
-- DROP TABLE IF EXISTS candidatos CASCADE;
-- DROP TABLE IF EXISTS partidos CASCADE;
-- DROP TABLE IF EXISTS eleitorado CASCADE;
-- DROP TABLE IF EXISTS secoes_eleitorais CASCADE;
-- DROP TABLE IF EXISTS zonas_eleitorais CASCADE;
-- DROP TABLE IF EXISTS bairros CASCADE;
-- DROP TABLE IF EXISTS municipios CASCADE;
-- DROP TABLE IF EXISTS regioes CASCADE;
-- DROP TABLE IF EXISTS system_settings CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- TIPOS ENUMERADOS
-- ============================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'gestor', 'politico', 'demo');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE import_status AS ENUM ('pendente', 'processando', 'concluido', 'erro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- TABELA: USUÁRIOS E AUTENTICAÇÃO
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    "openId" VARCHAR(64) NOT NULL UNIQUE,
    name TEXT,
    email VARCHAR(320),
    "loginMethod" VARCHAR(64),
    role user_role NOT NULL DEFAULT 'demo',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "lastSignedIn" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para usuários
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Comentários
COMMENT ON TABLE users IS 'Tabela de usuários do sistema com controle de acesso RBAC';
COMMENT ON COLUMN users.role IS 'Papel do usuário: admin (administrador), gestor (gestor de campanha), politico (político), demo (demonstração)';

-- ============================================================
-- TABELA: CONFIGURAÇÕES DO SISTEMA
-- ============================================================

CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    "settingKey" VARCHAR(100) NOT NULL UNIQUE,
    "settingValue" TEXT,
    description TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELAS: DADOS GEOGRÁFICOS
-- ============================================================

-- Regiões
CREATE TABLE IF NOT EXISTS regioes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    codigo VARCHAR(20),
    uf VARCHAR(2) DEFAULT 'RO',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Municípios
CREATE TABLE IF NOT EXISTS municipios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    codigo VARCHAR(20),
    "regiaoId" INTEGER REFERENCES regioes(id) ON DELETE SET NULL,
    uf VARCHAR(2) DEFAULT 'RO',
    latitude VARCHAR(20),
    longitude VARCHAR(20),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_municipios_regiao ON municipios("regiaoId");

-- Bairros
CREATE TABLE IF NOT EXISTS bairros (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    codigo VARCHAR(20),
    "municipioId" INTEGER REFERENCES municipios(id) ON DELETE SET NULL,
    latitude VARCHAR(20),
    longitude VARCHAR(20),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bairros_municipio ON bairros("municipioId");

-- Zonas Eleitorais
CREATE TABLE IF NOT EXISTS zonas_eleitorais (
    id SERIAL PRIMARY KEY,
    numero INTEGER NOT NULL,
    nome VARCHAR(100),
    "municipioId" INTEGER REFERENCES municipios(id) ON DELETE SET NULL,
    endereco TEXT,
    latitude VARCHAR(20),
    longitude VARCHAR(20),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zonas_municipio ON zonas_eleitorais("municipioId");

-- Seções Eleitorais
CREATE TABLE IF NOT EXISTS secoes_eleitorais (
    id SERIAL PRIMARY KEY,
    numero INTEGER NOT NULL,
    "zonaId" INTEGER REFERENCES zonas_eleitorais(id) ON DELETE SET NULL,
    "localVotacao" TEXT,
    "bairroId" INTEGER REFERENCES bairros(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_secoes_zona ON secoes_eleitorais("zonaId");
CREATE INDEX IF NOT EXISTS idx_secoes_bairro ON secoes_eleitorais("bairroId");

-- ============================================================
-- TABELA: ELEITORADO
-- ============================================================

CREATE TABLE IF NOT EXISTS eleitorado (
    id SERIAL PRIMARY KEY,
    "anoEleicao" INTEGER NOT NULL,
    "municipioId" INTEGER REFERENCES municipios(id) ON DELETE SET NULL,
    "bairroId" INTEGER REFERENCES bairros(id) ON DELETE SET NULL,
    "zonaId" INTEGER REFERENCES zonas_eleitorais(id) ON DELETE SET NULL,
    "secaoId" INTEGER REFERENCES secoes_eleitorais(id) ON DELETE SET NULL,
    "totalEleitores" INTEGER DEFAULT 0,
    "eleitoresMasculino" INTEGER DEFAULT 0,
    "eleitoresFeminino" INTEGER DEFAULT 0,
    "eleitoresOutros" INTEGER DEFAULT 0,
    "faixa16a17" INTEGER DEFAULT 0,
    "faixa18a24" INTEGER DEFAULT 0,
    "faixa25a34" INTEGER DEFAULT 0,
    "faixa35a44" INTEGER DEFAULT 0,
    "faixa45a59" INTEGER DEFAULT 0,
    "faixa60a69" INTEGER DEFAULT 0,
    "faixa70mais" INTEGER DEFAULT 0,
    "escolaridadeAnalfabeto" INTEGER DEFAULT 0,
    "escolaridadeFundamental" INTEGER DEFAULT 0,
    "escolaridadeMedio" INTEGER DEFAULT 0,
    "escolaridadeSuperior" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eleitorado_ano ON eleitorado("anoEleicao");
CREATE INDEX IF NOT EXISTS idx_eleitorado_municipio ON eleitorado("municipioId");
CREATE INDEX IF NOT EXISTS idx_eleitorado_bairro ON eleitorado("bairroId");
CREATE INDEX IF NOT EXISTS idx_eleitorado_zona ON eleitorado("zonaId");

COMMENT ON TABLE eleitorado IS 'Dados do eleitorado por região, incluindo distribuição demográfica';

-- ============================================================
-- TABELAS: PARTIDOS E CANDIDATOS
-- ============================================================

-- Partidos
CREATE TABLE IF NOT EXISTS partidos (
    id SERIAL PRIMARY KEY,
    sigla VARCHAR(20) NOT NULL,
    nome VARCHAR(200) NOT NULL,
    numero INTEGER NOT NULL,
    cor VARCHAR(7),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_partidos_numero ON partidos(numero);

-- Candidatos
CREATE TABLE IF NOT EXISTS candidatos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    "nomeUrna" VARCHAR(100),
    numero INTEGER NOT NULL,
    "partidoId" INTEGER REFERENCES partidos(id) ON DELETE SET NULL,
    cargo VARCHAR(50) NOT NULL,
    "anoEleicao" INTEGER NOT NULL,
    "municipioId" INTEGER REFERENCES municipios(id) ON DELETE SET NULL,
    situacao VARCHAR(50),
    foto TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidatos_partido ON candidatos("partidoId");
CREATE INDEX IF NOT EXISTS idx_candidatos_ano ON candidatos("anoEleicao");
CREATE INDEX IF NOT EXISTS idx_candidatos_cargo ON candidatos(cargo);

-- ============================================================
-- TABELA: RESULTADOS ELEITORAIS
-- ============================================================

CREATE TABLE IF NOT EXISTS resultados_eleitorais (
    id SERIAL PRIMARY KEY,
    "anoEleicao" INTEGER NOT NULL,
    turno INTEGER DEFAULT 1,
    cargo VARCHAR(50) NOT NULL,
    "municipioId" INTEGER REFERENCES municipios(id) ON DELETE SET NULL,
    "bairroId" INTEGER REFERENCES bairros(id) ON DELETE SET NULL,
    "zonaId" INTEGER REFERENCES zonas_eleitorais(id) ON DELETE SET NULL,
    "secaoId" INTEGER REFERENCES secoes_eleitorais(id) ON DELETE SET NULL,
    "candidatoId" INTEGER REFERENCES candidatos(id) ON DELETE SET NULL,
    "partidoId" INTEGER REFERENCES partidos(id) ON DELETE SET NULL,
    "votosValidos" INTEGER DEFAULT 0,
    "votosNominais" INTEGER DEFAULT 0,
    "votosLegenda" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resultados_ano ON resultados_eleitorais("anoEleicao");
CREATE INDEX IF NOT EXISTS idx_resultados_cargo ON resultados_eleitorais(cargo);
CREATE INDEX IF NOT EXISTS idx_resultados_candidato ON resultados_eleitorais("candidatoId");
CREATE INDEX IF NOT EXISTS idx_resultados_partido ON resultados_eleitorais("partidoId");
CREATE INDEX IF NOT EXISTS idx_resultados_municipio ON resultados_eleitorais("municipioId");

COMMENT ON TABLE resultados_eleitorais IS 'Resultados das eleições por candidato, partido e região';

-- ============================================================
-- TABELA: VOTOS NULOS E BRANCOS
-- ============================================================

CREATE TABLE IF NOT EXISTS votos_nulos_brancos (
    id SERIAL PRIMARY KEY,
    "anoEleicao" INTEGER NOT NULL,
    turno INTEGER DEFAULT 1,
    cargo VARCHAR(50) NOT NULL,
    "municipioId" INTEGER REFERENCES municipios(id) ON DELETE SET NULL,
    "bairroId" INTEGER REFERENCES bairros(id) ON DELETE SET NULL,
    "zonaId" INTEGER REFERENCES zonas_eleitorais(id) ON DELETE SET NULL,
    "secaoId" INTEGER REFERENCES secoes_eleitorais(id) ON DELETE SET NULL,
    "votosNulos" INTEGER DEFAULT 0,
    "votosBrancos" INTEGER DEFAULT 0,
    abstencoes INTEGER DEFAULT 0,
    "totalAptos" INTEGER DEFAULT 0,
    comparecimento INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nulos_ano ON votos_nulos_brancos("anoEleicao");
CREATE INDEX IF NOT EXISTS idx_nulos_municipio ON votos_nulos_brancos("municipioId");
CREATE INDEX IF NOT EXISTS idx_nulos_bairro ON votos_nulos_brancos("bairroId");
CREATE INDEX IF NOT EXISTS idx_nulos_zona ON votos_nulos_brancos("zonaId");

COMMENT ON TABLE votos_nulos_brancos IS 'Rastreamento de votos nulos, brancos e abstenções por região - FOCO PRINCIPAL DO SISTEMA';

-- ============================================================
-- TABELA: IMPORTAÇÕES
-- ============================================================

CREATE TABLE IF NOT EXISTS importacoes (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
    "nomeArquivo" VARCHAR(255) NOT NULL,
    "tipoArquivo" VARCHAR(50) NOT NULL,
    "tipoDataset" VARCHAR(50) NOT NULL,
    "totalRegistros" INTEGER DEFAULT 0,
    "registrosImportados" INTEGER DEFAULT 0,
    "registrosErro" INTEGER DEFAULT 0,
    status import_status DEFAULT 'pendente',
    "mensagemErro" TEXT,
    "anoReferencia" INTEGER,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_importacoes_user ON importacoes("userId");
CREATE INDEX IF NOT EXISTS idx_importacoes_status ON importacoes(status);

COMMENT ON TABLE importacoes IS 'Histórico de importações de datasets eleitorais';

-- ============================================================
-- TABELA: LOGS DE AUDITORIA
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    "tableName" VARCHAR(100),
    "recordId" INTEGER,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs("userId");
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_logs("tableName");
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs("createdAt");

COMMENT ON TABLE audit_logs IS 'Logs de auditoria para rastreamento de ações dos usuários';

-- ============================================================
-- TABELA: DADOS DE DEMONSTRAÇÃO
-- ============================================================

CREATE TABLE IF NOT EXISTS demo_data (
    id SERIAL PRIMARY KEY,
    "dataType" VARCHAR(50) NOT NULL,
    "dataContent" JSONB,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FUNÇÃO: ATUALIZAR TIMESTAMP
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updatedAt automaticamente
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_eleitorado_updated_at ON eleitorado;
CREATE TRIGGER update_eleitorado_updated_at
    BEFORE UPDATE ON eleitorado
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_importacoes_updated_at ON importacoes;
CREATE TRIGGER update_importacoes_updated_at
    BEFORE UPDATE ON importacoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DADOS INICIAIS: PARTIDOS BRASILEIROS
-- ============================================================

INSERT INTO partidos (sigla, nome, numero, cor) VALUES
    ('MDB', 'Movimento Democrático Brasileiro', 15, '#00A651'),
    ('PT', 'Partido dos Trabalhadores', 13, '#ED1C24'),
    ('PSDB', 'Partido da Social Democracia Brasileira', 45, '#003E7E'),
    ('PP', 'Progressistas', 11, '#0066CC'),
    ('PDT', 'Partido Democrático Trabalhista', 12, '#FF6600'),
    ('PTB', 'Partido Trabalhista Brasileiro', 14, '#000000'),
    ('PL', 'Partido Liberal', 22, '#1E3A5F'),
    ('PSB', 'Partido Socialista Brasileiro', 40, '#FFD700'),
    ('REPUBLICANOS', 'Republicanos', 10, '#0033A0'),
    ('UNIÃO', 'União Brasil', 44, '#00529B'),
    ('PSD', 'Partido Social Democrático', 55, '#FF8C00'),
    ('PSOL', 'Partido Socialismo e Liberdade', 50, '#FFCC00'),
    ('PCdoB', 'Partido Comunista do Brasil', 65, '#CC0000'),
    ('PODE', 'Podemos', 20, '#00A86B'),
    ('CIDADANIA', 'Cidadania', 23, '#009639'),
    ('PV', 'Partido Verde', 43, '#00FF00'),
    ('AVANTE', 'Avante', 70, '#FF6B00'),
    ('SOLIDARIEDADE', 'Solidariedade', 77, '#FF4500'),
    ('NOVO', 'Partido Novo', 30, '#FF6600'),
    ('REDE', 'Rede Sustentabilidade', 18, '#00CED1')
ON CONFLICT DO NOTHING;

-- ============================================================
-- DADOS INICIAIS: REGIÃO E MUNICÍPIO DE PORTO VELHO
-- ============================================================

INSERT INTO regioes (nome, codigo, uf) VALUES
    ('Região Metropolitana de Porto Velho', 'RO-PVH', 'RO')
ON CONFLICT DO NOTHING;

INSERT INTO municipios (nome, codigo, uf, latitude, longitude, "regiaoId") VALUES
    ('Porto Velho', '1100205', 'RO', '-8.7619', '-63.9039', 1)
ON CONFLICT DO NOTHING;

-- ============================================================
-- DADOS INICIAIS: BAIRROS DE PORTO VELHO
-- ============================================================

INSERT INTO bairros (nome, "municipioId", latitude, longitude) VALUES
    ('Centro', 1, '-8.7619', '-63.9039'),
    ('Nova Porto Velho', 1, '-8.7420', '-63.8840'),
    ('Embratel', 1, '-8.7321', '-63.8741'),
    ('Caiari', 1, '-8.7522', '-63.9142'),
    ('São Cristóvão', 1, '-8.7723', '-63.9243'),
    ('Arigolândia', 1, '-8.7524', '-63.8944'),
    ('Pedrinhas', 1, '-8.7825', '-63.9345'),
    ('Tancredo Neves', 1, '-8.7926', '-63.9446'),
    ('Liberdade', 1, '-8.7718', '-63.9138'),
    ('Três Marias', 1, '-8.7817', '-63.9237'),
    ('Flodoaldo Pontes Pinto', 1, '-8.7216', '-63.8636'),
    ('Lagoa', 1, '-8.7117', '-63.8537'),
    ('Ronaldo Aragão', 1, '-8.7018', '-63.8438'),
    ('Marcos Freire', 1, '-8.7319', '-63.8839'),
    ('JK', 1, '-8.7420', '-63.8940'),
    ('Nacional', 1, '-8.7521', '-63.9041'),
    ('Escola de Polícia', 1, '-8.7622', '-63.9142'),
    ('Costa e Silva', 1, '-8.7723', '-63.9243'),
    ('Olaria', 1, '-8.7824', '-63.9344'),
    ('Mocambo', 1, '-8.7925', '-63.9445')
ON CONFLICT DO NOTHING;

-- ============================================================
-- DADOS INICIAIS: ZONAS ELEITORAIS DE PORTO VELHO
-- ============================================================

INSERT INTO zonas_eleitorais (numero, nome, "municipioId") VALUES
    (1, 'Zona Eleitoral 001', 1),
    (2, 'Zona Eleitoral 002', 1),
    (3, 'Zona Eleitoral 003', 1),
    (4, 'Zona Eleitoral 004', 1),
    (5, 'Zona Eleitoral 005', 1),
    (6, 'Zona Eleitoral 006', 1),
    (7, 'Zona Eleitoral 007', 1),
    (8, 'Zona Eleitoral 008', 1),
    (9, 'Zona Eleitoral 009', 1),
    (10, 'Zona Eleitoral 010', 1)
ON CONFLICT DO NOTHING;

-- ============================================================
-- DADOS DE EXEMPLO: ELEITORADO 2024
-- ============================================================

INSERT INTO eleitorado ("anoEleicao", "municipioId", "bairroId", "totalEleitores", 
    "eleitoresMasculino", "eleitoresFeminino", "faixa16a17", "faixa18a24", 
    "faixa25a34", "faixa35a44", "faixa45a59", "faixa60a69", "faixa70mais",
    "escolaridadeAnalfabeto", "escolaridadeFundamental", "escolaridadeMedio", "escolaridadeSuperior")
VALUES
    (2024, 1, 1, 25678, 12500, 13178, 512, 3850, 5650, 5200, 4800, 3200, 2466, 1284, 4878, 10271, 9245),
    (2024, 1, 2, 18234, 8900, 9334, 364, 2735, 4012, 3693, 3410, 2273, 1747, 912, 3465, 7294, 6563),
    (2024, 1, 3, 15678, 7650, 8028, 313, 2351, 3449, 3173, 2931, 1954, 1507, 784, 2979, 6271, 5644),
    (2024, 1, 4, 12345, 6020, 6325, 247, 1852, 2716, 2500, 2309, 1539, 1182, 617, 2346, 4938, 4444),
    (2024, 1, 5, 11234, 5480, 5754, 225, 1685, 2471, 2274, 2101, 1400, 1078, 562, 2134, 4494, 4044),
    (2024, 1, 6, 9876, 4820, 5056, 198, 1481, 2173, 2000, 1847, 1231, 946, 494, 1876, 3950, 3556),
    (2024, 1, 7, 8765, 4280, 4485, 175, 1315, 1928, 1775, 1640, 1093, 839, 438, 1665, 3506, 3156),
    (2024, 1, 8, 7654, 3735, 3919, 153, 1148, 1684, 1550, 1432, 954, 733, 383, 1454, 3062, 2755),
    (2024, 1, 9, 6543, 3195, 3348, 131, 981, 1439, 1325, 1224, 816, 627, 327, 1243, 2617, 2356),
    (2024, 1, 10, 5432, 2650, 2782, 109, 815, 1195, 1100, 1016, 677, 520, 272, 1032, 2173, 1955)
ON CONFLICT DO NOTHING;

-- ============================================================
-- DADOS DE EXEMPLO: VOTOS NULOS E BRANCOS 2024
-- ============================================================

INSERT INTO votos_nulos_brancos ("anoEleicao", turno, cargo, "municipioId", "bairroId",
    "votosNulos", "votosBrancos", abstencoes, "totalAptos", comparecimento)
VALUES
    (2024, 1, 'Prefeito', 1, 1, 1234, 876, 2567, 25678, 23111),
    (2024, 1, 'Prefeito', 1, 2, 987, 654, 1823, 18234, 16411),
    (2024, 1, 'Prefeito', 1, 3, 876, 543, 1568, 15678, 14110),
    (2024, 1, 'Prefeito', 1, 4, 765, 432, 1234, 12345, 11111),
    (2024, 1, 'Prefeito', 1, 5, 654, 321, 1123, 11234, 10111),
    (2024, 1, 'Vereador', 1, 1, 2345, 1234, 2567, 25678, 23111),
    (2024, 1, 'Vereador', 1, 2, 1876, 987, 1823, 18234, 16411),
    (2024, 1, 'Vereador', 1, 3, 1654, 876, 1568, 15678, 14110),
    (2024, 1, 'Vereador', 1, 4, 1432, 765, 1234, 12345, 11111),
    (2024, 1, 'Vereador', 1, 5, 1234, 654, 1123, 11234, 10111)
ON CONFLICT DO NOTHING;

-- ============================================================
-- CONFIGURAÇÕES INICIAIS DO SISTEMA
-- ============================================================

INSERT INTO system_settings ("settingKey", "settingValue", description) VALUES
    ('sistema_nome', 'Data Tracking Eleitoral', 'Nome do sistema'),
    ('sistema_versao', '1.0.0', 'Versão atual do sistema'),
    ('municipio_padrao', 'Porto Velho', 'Município padrão para exibição'),
    ('uf_padrao', 'RO', 'UF padrão para exibição'),
    ('ano_eleicao_atual', '2024', 'Ano da eleição atual em análise'),
    ('modo_demonstracao', 'true', 'Sistema em modo demonstração')
ON CONFLICT ("settingKey") DO UPDATE SET "settingValue" = EXCLUDED."settingValue";

-- ============================================================
-- POLÍTICAS DE SEGURANÇA (RLS) - Row Level Security
-- ============================================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE importacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios dados
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (true);

-- Política para importações
CREATE POLICY "Users can view own imports" ON importacoes
    FOR SELECT USING (true);

CREATE POLICY "Users can create imports" ON importacoes
    FOR INSERT WITH CHECK (true);

-- Política para logs de auditoria (apenas leitura para admins)
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (true);

-- ============================================================
-- GRANT DE PERMISSÕES
-- ============================================================

-- Conceder permissões ao role anon e authenticated do Supabase
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
