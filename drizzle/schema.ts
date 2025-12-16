import { integer, pgEnum, pgTable, text, timestamp, varchar, decimal, bigint, boolean, json, serial } from "drizzle-orm/pg-core";

// ==================== ENUMS POSTGRESQL ====================

export const userRoleEnum = pgEnum("user_role", ["admin", "gestor", "politico", "demo"]);
export const activityTypeEnum = pgEnum("activity_type", ["login", "logout", "import", "export", "create", "update", "delete", "view", "download"]);
export const importStatusEnum = pgEnum("import_status", ["pendente", "processando", "concluido", "erro"]);
export const datasetTypeEnum = pgEnum("dataset_type", ["eleitorado", "candidatos", "partidos", "coligacoes", "resultados", "votos_nulos_brancos"]);
export const backupFrequencyEnum = pgEnum("backup_frequency", ["daily", "weekly", "monthly"]);
export const backupFormatEnum = pgEnum("backup_format", ["csv", "json"]);
export const backupStatusEnum = pgEnum("backup_status", ["success", "failed", "running"]);
export const notificationTypeEnum = pgEnum("notification_type", ["info", "warning", "error", "success"]);
export const notificationCategoryEnum = pgEnum("notification_category", ["backup", "security", "system", "user", "import"]);

// ==================== USUÁRIOS E AUTENTICAÇÃO ====================

export const userRoles = ["admin", "gestor", "politico", "demo"] as const;
export type UserRole = (typeof userRoles)[number];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  username: varchar("username", { length: 50 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  avatarUrl: varchar("avatarUrl", { length: 500 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("demo").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== ATIVIDADES DO USUÁRIO ====================

export const activityTypes = ["login", "logout", "import", "export", "create", "update", "delete", "view", "download"] as const;
export type ActivityType = (typeof activityTypes)[number];

export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id).notNull(),
  activityType: activityTypeEnum("activityType").notNull(),
  description: text("description"),
  metadata: text("metadata"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: varchar("userAgent", { length: 500 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = typeof userActivities.$inferInsert;

// ==================== CONFIGURAÇÕES DO SISTEMA ====================

export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  description: text("description"),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

// ==================== DADOS GEOGRÁFICOS ====================

export const regioes = pgTable("regioes", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  codigo: varchar("codigo", { length: 20 }),
  uf: varchar("uf", { length: 2 }).default("RO"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const municipios = pgTable("municipios", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  codigo: varchar("codigo", { length: 20 }),
  codigoTse: varchar("codigoTse", { length: 10 }),
  regiaoId: integer("regiaoId").references(() => regioes.id),
  uf: varchar("uf", { length: 2 }).default("RO"),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const bairros = pgTable("bairros", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  codigo: varchar("codigo", { length: 20 }),
  municipioId: integer("municipioId").references(() => municipios.id),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const zonasEleitorais = pgTable("zonas_eleitorais", {
  id: serial("id").primaryKey(),
  numero: integer("numero").notNull(),
  nome: varchar("nome", { length: 100 }),
  municipioId: integer("municipioId").references(() => municipios.id),
  endereco: text("endereco"),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const secoesEleitorais = pgTable("secoes_eleitorais", {
  id: serial("id").primaryKey(),
  numero: integer("numero").notNull(),
  zonaId: integer("zonaId").references(() => zonasEleitorais.id),
  localVotacao: text("localVotacao"),
  bairroId: integer("bairroId").references(() => bairros.id),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// ==================== ELEITORADO TSE ====================

export const eleitorado = pgTable("eleitorado", {
  id: serial("id").primaryKey(),
  anoEleicao: integer("anoEleicao").notNull(),
  municipioId: integer("municipioId").references(() => municipios.id),
  bairroId: integer("bairroId").references(() => bairros.id),
  zonaId: integer("zonaId").references(() => zonasEleitorais.id),
  secaoId: integer("secaoId").references(() => secoesEleitorais.id),
  totalEleitores: integer("totalEleitores").default(0),
  eleitoresMasculino: integer("eleitoresMasculino").default(0),
  eleitoresFeminino: integer("eleitoresFeminino").default(0),
  eleitoresOutros: integer("eleitoresOutros").default(0),
  faixa16a17: integer("faixa16a17").default(0),
  faixa18a24: integer("faixa18a24").default(0),
  faixa25a34: integer("faixa25a34").default(0),
  faixa35a44: integer("faixa35a44").default(0),
  faixa45a59: integer("faixa45a59").default(0),
  faixa60a69: integer("faixa60a69").default(0),
  faixa70mais: integer("faixa70mais").default(0),
  escolaridadeAnalfabeto: integer("escolaridadeAnalfabeto").default(0),
  escolaridadeFundamental: integer("escolaridadeFundamental").default(0),
  escolaridadeMedio: integer("escolaridadeMedio").default(0),
  escolaridadeSuperior: integer("escolaridadeSuperior").default(0),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

// Tabela detalhada de eleitores do TSE (perfil_eleitorado)
export const eleitoradoTse = pgTable("eleitorado_tse", {
  id: serial("id").primaryKey(),
  dtGeracao: varchar("dtGeracao", { length: 20 }),
  anoEleicao: integer("anoEleicao").notNull(),
  sgUf: varchar("sgUf", { length: 2 }).default("RO"),
  cdMunicipio: varchar("cdMunicipio", { length: 10 }),
  nmMunicipio: varchar("nmMunicipio", { length: 100 }),
  cdMrc: varchar("cdMrc", { length: 10 }),
  nmMrc: varchar("nmMrc", { length: 100 }),
  nrZona: integer("nrZona"),
  cdGenero: varchar("cdGenero", { length: 5 }),
  dsGenero: varchar("dsGenero", { length: 20 }),
  cdEstadoCivil: varchar("cdEstadoCivil", { length: 5 }),
  dsEstadoCivil: varchar("dsEstadoCivil", { length: 30 }),
  cdFaixaEtaria: varchar("cdFaixaEtaria", { length: 10 }),
  dsFaixaEtaria: varchar("dsFaixaEtaria", { length: 30 }),
  cdGrauEscolaridade: varchar("cdGrauEscolaridade", { length: 5 }),
  dsGrauEscolaridade: varchar("dsGrauEscolaridade", { length: 50 }),
  qtEleitoresPerfilBiometrico: integer("qtEleitoresPerfilBiometrico").default(0),
  qtEleitoresPerfilDeficiencia: integer("qtEleitoresPerfilDeficiencia").default(0),
  qtEleitoresPerfilNomeSocial: integer("qtEleitoresPerfilNomeSocial").default(0),
  qtEleitoresPerfil: integer("qtEleitoresPerfil").default(0),
  importacaoId: integer("importacaoId").references(() => importacoes.id),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// ==================== PARTIDOS TSE ====================

export const partidos = pgTable("partidos", {
  id: serial("id").primaryKey(),
  sigla: varchar("sigla", { length: 20 }).notNull(),
  nome: varchar("nome", { length: 200 }).notNull(),
  numero: integer("numero").notNull(),
  cor: varchar("cor", { length: 7 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// Tabela detalhada de partidos do TSE
export const partidosTse = pgTable("partidos_tse", {
  id: serial("id").primaryKey(),
  dtGeracao: varchar("dtGeracao", { length: 20 }),
  anoEleicao: integer("anoEleicao").notNull(),
  sgUf: varchar("sgUf", { length: 2 }),
  tpAgremiacao: varchar("tpAgremiacao", { length: 50 }),
  nrPartido: integer("nrPartido"),
  sgPartido: varchar("sgPartido", { length: 20 }),
  nmPartido: varchar("nmPartido", { length: 200 }),
  sqPartido: varchar("sqPartido", { length: 20 }),
  nrCnpj: varchar("nrCnpj", { length: 20 }),
  dtCriacaoPartido: varchar("dtCriacaoPartido", { length: 20 }),
  dtRegistroTse: varchar("dtRegistroTse", { length: 20 }),
  dtExtincaoPartido: varchar("dtExtincaoPartido", { length: 20 }),
  importacaoId: integer("importacaoId").references(() => importacoes.id),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// ==================== COLIGAÇÕES TSE ====================

export const coligacoesTse = pgTable("coligacoes_tse", {
  id: serial("id").primaryKey(),
  dtGeracao: varchar("dtGeracao", { length: 20 }),
  anoEleicao: integer("anoEleicao").notNull(),
  cdTipoEleicao: varchar("cdTipoEleicao", { length: 10 }),
  nmTipoEleicao: varchar("nmTipoEleicao", { length: 50 }),
  nrTurno: integer("nrTurno").default(1),
  cdEleicao: varchar("cdEleicao", { length: 20 }),
  dsEleicao: varchar("dsEleicao", { length: 100 }),
  sgUf: varchar("sgUf", { length: 2 }),
  sgUe: varchar("sgUe", { length: 10 }),
  nmUe: varchar("nmUe", { length: 100 }),
  cdCargo: varchar("cdCargo", { length: 10 }),
  dsCargo: varchar("dsCargo", { length: 50 }),
  tpAgremiacao: varchar("tpAgremiacao", { length: 50 }),
  sqColigacao: varchar("sqColigacao", { length: 20 }),
  nmColigacao: varchar("nmColigacao", { length: 200 }),
  dsComposicaoColigacao: text("dsComposicaoColigacao"),
  stColigacao: varchar("stColigacao", { length: 20 }),
  importacaoId: integer("importacaoId").references(() => importacoes.id),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// ==================== CANDIDATOS TSE ====================

export const candidatos = pgTable("candidatos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  nomeUrna: varchar("nomeUrna", { length: 100 }),
  numero: integer("numero").notNull(),
  partidoId: integer("partidoId").references(() => partidos.id),
  cargo: varchar("cargo", { length: 50 }).notNull(),
  anoEleicao: integer("anoEleicao").notNull(),
  municipioId: integer("municipioId").references(() => municipios.id),
  situacao: varchar("situacao", { length: 50 }),
  foto: text("foto"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// Tabela detalhada de candidatos do TSE
export const candidatosTse = pgTable("candidatos_tse", {
  id: serial("id").primaryKey(),
  dtGeracao: varchar("dtGeracao", { length: 20 }),
  anoEleicao: integer("anoEleicao").notNull(),
  cdTipoEleicao: varchar("cdTipoEleicao", { length: 10 }),
  nmTipoEleicao: varchar("nmTipoEleicao", { length: 50 }),
  nrTurno: integer("nrTurno").default(1),
  cdEleicao: varchar("cdEleicao", { length: 20 }),
  dsEleicao: varchar("dsEleicao", { length: 100 }),
  sgUf: varchar("sgUf", { length: 2 }),
  sgUe: varchar("sgUe", { length: 10 }),
  nmUe: varchar("nmUe", { length: 100 }),
  cdCargo: varchar("cdCargo", { length: 10 }),
  dsCargo: varchar("dsCargo", { length: 50 }),
  sqCandidato: varchar("sqCandidato", { length: 20 }),
  nrCandidato: integer("nrCandidato"),
  nmCandidato: varchar("nmCandidato", { length: 200 }),
  nmUrna: varchar("nmUrna", { length: 100 }),
  nmSocial: varchar("nmSocial", { length: 200 }),
  nrCpf: varchar("nrCpf", { length: 15 }),
  nmEmail: varchar("nmEmail", { length: 200 }),
  cdSituacaoCandidatura: varchar("cdSituacaoCandidatura", { length: 10 }),
  dsSituacaoCandidatura: varchar("dsSituacaoCandidatura", { length: 50 }),
  cdDetalhesSituacaoCand: varchar("cdDetalhesSituacaoCand", { length: 10 }),
  dsDetalhesSituacaoCand: varchar("dsDetalhesSituacaoCand", { length: 100 }),
  tpAgremiacao: varchar("tpAgremiacao", { length: 50 }),
  nrPartido: integer("nrPartido"),
  sgPartido: varchar("sgPartido", { length: 20 }),
  nmPartido: varchar("nmPartido", { length: 200 }),
  sqColigacao: varchar("sqColigacao", { length: 20 }),
  nmColigacao: varchar("nmColigacao", { length: 200 }),
  dsComposicaoColigacao: text("dsComposicaoColigacao"),
  cdNacionalidade: varchar("cdNacionalidade", { length: 10 }),
  dsNacionalidade: varchar("dsNacionalidade", { length: 50 }),
  sgUfNascimento: varchar("sgUfNascimento", { length: 2 }),
  cdMunicipioNascimento: varchar("cdMunicipioNascimento", { length: 10 }),
  nmMunicipioNascimento: varchar("nmMunicipioNascimento", { length: 100 }),
  dtNascimento: varchar("dtNascimento", { length: 20 }),
  nrIdadeDataPosse: integer("nrIdadeDataPosse"),
  nrTituloEleitoral: varchar("nrTituloEleitoral", { length: 20 }),
  cdGenero: varchar("cdGenero", { length: 5 }),
  dsGenero: varchar("dsGenero", { length: 20 }),
  cdGrauInstrucao: varchar("cdGrauInstrucao", { length: 5 }),
  dsGrauInstrucao: varchar("dsGrauInstrucao", { length: 50 }),
  cdEstadoCivil: varchar("cdEstadoCivil", { length: 5 }),
  dsEstadoCivil: varchar("dsEstadoCivil", { length: 30 }),
  cdCorRaca: varchar("cdCorRaca", { length: 5 }),
  dsCorRaca: varchar("dsCorRaca", { length: 30 }),
  cdOcupacao: varchar("cdOcupacao", { length: 10 }),
  dsOcupacao: varchar("dsOcupacao", { length: 100 }),
  vrDespesaMaxCampanha: decimal("vrDespesaMaxCampanha", { precision: 15, scale: 2 }),
  cdSitTotTurno: varchar("cdSitTotTurno", { length: 10 }),
  dsSitTotTurno: varchar("dsSitTotTurno", { length: 50 }),
  stReeleicao: varchar("stReeleicao", { length: 5 }),
  stDeclaraBens: varchar("stDeclaraBens", { length: 5 }),
  nrProtocoloCandidatura: varchar("nrProtocoloCandidatura", { length: 30 }),
  nrProcesso: varchar("nrProcesso", { length: 30 }),
  importacaoId: integer("importacaoId").references(() => importacoes.id),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// ==================== RESULTADOS ELEITORAIS ====================

export const resultadosEleitorais = pgTable("resultados_eleitorais", {
  id: serial("id").primaryKey(),
  anoEleicao: integer("anoEleicao").notNull(),
  turno: integer("turno").default(1),
  cargo: varchar("cargo", { length: 50 }).notNull(),
  municipioId: integer("municipioId").references(() => municipios.id),
  bairroId: integer("bairroId").references(() => bairros.id),
  zonaId: integer("zonaId").references(() => zonasEleitorais.id),
  secaoId: integer("secaoId").references(() => secoesEleitorais.id),
  candidatoId: integer("candidatoId").references(() => candidatos.id),
  partidoId: integer("partidoId").references(() => partidos.id),
  votosValidos: integer("votosValidos").default(0),
  votosNominais: integer("votosNominais").default(0),
  votosLegenda: integer("votosLegenda").default(0),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// ==================== VOTOS NULOS E BRANCOS ====================

export const votosNulosBrancos = pgTable("votos_nulos_brancos", {
  id: serial("id").primaryKey(),
  anoEleicao: integer("anoEleicao").notNull(),
  turno: integer("turno").default(1),
  cargo: varchar("cargo", { length: 50 }).notNull(),
  municipioId: integer("municipioId").references(() => municipios.id),
  bairroId: integer("bairroId").references(() => bairros.id),
  zonaId: integer("zonaId").references(() => zonasEleitorais.id),
  secaoId: integer("secaoId").references(() => secoesEleitorais.id),
  votosNulos: integer("votosNulos").default(0),
  votosBrancos: integer("votosBrancos").default(0),
  abstencoes: integer("abstencoes").default(0),
  totalAptos: integer("totalAptos").default(0),
  comparecimento: integer("comparecimento").default(0),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// ==================== IMPORTAÇÕES ====================

export const importacoes = pgTable("importacoes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id),
  nomeArquivo: varchar("nomeArquivo", { length: 255 }).notNull(),
  tipoArquivo: varchar("tipoArquivo", { length: 50 }).notNull(),
  tipoDataset: datasetTypeEnum("tipoDataset").notNull(),
  totalRegistros: integer("totalRegistros").default(0),
  registrosImportados: integer("registrosImportados").default(0),
  registrosErro: integer("registrosErro").default(0),
  status: importStatusEnum("status").default("pendente"),
  mensagemErro: text("mensagemErro"),
  anoReferencia: integer("anoReferencia"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

// ==================== LOGS DE AUDITORIA ====================

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  tableName: varchar("tableName", { length: 100 }),
  recordId: integer("recordId"),
  oldValues: json("oldValues"),
  newValues: json("newValues"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// ==================== DADOS DE DEMONSTRAÇÃO ====================

export const demoData = pgTable("demo_data", {
  id: serial("id").primaryKey(),
  dataType: varchar("dataType", { length: 50 }).notNull(),
  dataContent: json("dataContent"),
  description: text("description"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// ==================== BACKUPS AGENDADOS ====================

export const scheduledBackups = pgTable("scheduled_backups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  dataTypes: json("dataTypes").notNull(), // ["users", "eleitorado", "resultados", "activities"]
  frequency: backupFrequencyEnum("frequency").notNull(),
  dayOfWeek: integer("dayOfWeek"), // 0-6 for weekly
  dayOfMonth: integer("dayOfMonth"), // 1-31 for monthly
  timeOfDay: varchar("timeOfDay", { length: 5 }).default("03:00"), // HH:MM
  emailRecipients: json("emailRecipients"), // Array of emails
  format: backupFormatEnum("format").default("csv"),
  isActive: boolean("isActive").default(true),
  lastRunAt: timestamp("lastRunAt", { withTimezone: true }),
  nextRunAt: timestamp("nextRunAt", { withTimezone: true }),
  createdBy: integer("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export const backupHistory = pgTable("backup_history", {
  id: serial("id").primaryKey(),
  scheduledBackupId: integer("scheduledBackupId").references(() => scheduledBackups.id),
  status: backupStatusEnum("status").default("running"),
  dataTypes: json("dataTypes"),
  recordCounts: json("recordCounts"), // { users: 100, eleitorado: 5000, ... }
  fileSize: integer("fileSize"), // in bytes
  fileUrl: text("fileUrl"),
  errorMessage: text("errorMessage"),
  emailSent: boolean("emailSent").default(false),
  startedAt: timestamp("startedAt", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// ==================== NOTIFICAÇÕES ADMIN ====================

export const adminNotifications = pgTable("admin_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id), // null = all admins
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  type: notificationTypeEnum("type").default("info"),
  category: notificationCategoryEnum("category").default("system"),
  isRead: boolean("isRead").default(false),
  actionUrl: varchar("actionUrl", { length: 500 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// ==================== TYPES ====================

export type Regiao = typeof regioes.$inferSelect;
export type Municipio = typeof municipios.$inferSelect;
export type Bairro = typeof bairros.$inferSelect;
export type ZonaEleitoral = typeof zonasEleitorais.$inferSelect;
export type SecaoEleitoral = typeof secoesEleitorais.$inferSelect;
export type Eleitorado = typeof eleitorado.$inferSelect;
export type EleitoradoTse = typeof eleitoradoTse.$inferSelect;
export type Partido = typeof partidos.$inferSelect;
export type PartidoTse = typeof partidosTse.$inferSelect;
export type ColigacaoTse = typeof coligacoesTse.$inferSelect;
export type Candidato = typeof candidatos.$inferSelect;
export type CandidatoTse = typeof candidatosTse.$inferSelect;
export type ResultadoEleitoral = typeof resultadosEleitorais.$inferSelect;
export type VotoNuloBranco = typeof votosNulosBrancos.$inferSelect;
export type Importacao = typeof importacoes.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
