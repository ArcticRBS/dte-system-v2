# Guia de Importação de Dados do TSE - Sistema DTE

Este documento descreve os formatos de arquivos aceitos para importação de dados eleitorais do TSE no Sistema Data Tracking Eleitoral.

## Tipos de Datasets Suportados

### 1. Eleitorado (perfil_eleitorado)

**Arquivo do TSE:** `perfil_eleitorado_YYYY.csv`

| Coluna | Descrição | Tipo |
|--------|-----------|------|
| DT_GERACAO | Data de geração do arquivo | Texto |
| ANO_ELEICAO | Ano da eleição | Inteiro |
| SG_UF | Sigla da UF | Texto (2) |
| CD_MUNICIPIO | Código do município | Texto |
| NM_MUNICIPIO | Nome do município | Texto |
| CD_MRC | Código da MRC | Texto |
| NM_MRC | Nome da MRC | Texto |
| NR_ZONA | Número da zona eleitoral | Inteiro |
| CD_GENERO | Código do gênero | Texto |
| DS_GENERO | Descrição do gênero | Texto |
| CD_ESTADO_CIVIL | Código do estado civil | Texto |
| DS_ESTADO_CIVIL | Descrição do estado civil | Texto |
| CD_FAIXA_ETARIA | Código da faixa etária | Texto |
| DS_FAIXA_ETARIA | Descrição da faixa etária | Texto |
| CD_GRAU_ESCOLARIDADE | Código da escolaridade | Texto |
| DS_GRAU_ESCOLARIDADE | Descrição da escolaridade | Texto |
| QT_ELEITORES_PERFIL_BIOMETRICO | Qtd eleitores com biometria | Inteiro |
| QT_ELEITORES_PERFIL_DEFICIENCIA | Qtd eleitores com deficiência | Inteiro |
| QT_ELEITORES_PERFIL_NOME_SOCIAL | Qtd eleitores com nome social | Inteiro |
| QT_ELEITORES_PERFIL | Quantidade total de eleitores | Inteiro |

---

### 2. Candidatos (consulta_cand)

**Arquivo do TSE:** `consulta_cand_YYYY_RO.csv`

| Coluna | Descrição | Tipo |
|--------|-----------|------|
| DT_GERACAO | Data de geração | Texto |
| ANO_ELEICAO | Ano da eleição | Inteiro |
| CD_TIPO_ELEICAO | Código do tipo de eleição | Texto |
| NM_TIPO_ELEICAO | Nome do tipo de eleição | Texto |
| NR_TURNO | Número do turno | Inteiro |
| CD_ELEICAO | Código da eleição | Texto |
| DS_ELEICAO | Descrição da eleição | Texto |
| SG_UF | Sigla da UF | Texto (2) |
| SG_UE | Sigla da UE | Texto |
| NM_UE | Nome da UE | Texto |
| CD_CARGO | Código do cargo | Texto |
| DS_CARGO | Descrição do cargo | Texto |
| SQ_CANDIDATO | Sequencial do candidato | Texto |
| NR_CANDIDATO | Número do candidato | Inteiro |
| NM_CANDIDATO | Nome completo | Texto |
| NM_URNA | Nome de urna | Texto |
| NM_SOCIAL | Nome social | Texto |
| NR_CPF | CPF do candidato | Texto |
| NM_EMAIL | Email do candidato | Texto |
| CD_SITUACAO_CANDIDATURA | Código da situação | Texto |
| DS_SITUACAO_CANDIDATURA | Descrição da situação | Texto |
| NR_PARTIDO | Número do partido | Inteiro |
| SG_PARTIDO | Sigla do partido | Texto |
| NM_PARTIDO | Nome do partido | Texto |
| SQ_COLIGACAO | Sequencial da coligação | Texto |
| NM_COLIGACAO | Nome da coligação | Texto |
| DS_COMPOSICAO_COLIGACAO | Composição da coligação | Texto |
| DT_NASCIMENTO | Data de nascimento | Texto |
| CD_GENERO | Código do gênero | Texto |
| DS_GENERO | Descrição do gênero | Texto |
| CD_GRAU_INSTRUCAO | Código da instrução | Texto |
| DS_GRAU_INSTRUCAO | Descrição da instrução | Texto |
| CD_COR_RACA | Código da cor/raça | Texto |
| DS_COR_RACA | Descrição da cor/raça | Texto |
| CD_OCUPACAO | Código da ocupação | Texto |
| DS_OCUPACAO | Descrição da ocupação | Texto |

---

### 3. Partidos (consulta_legendas)

**Arquivo do TSE:** `consulta_legendas_YYYY_RO.csv`

| Coluna | Descrição | Tipo |
|--------|-----------|------|
| DT_GERACAO | Data de geração | Texto |
| ANO_ELEICAO | Ano da eleição | Inteiro |
| SG_UF | Sigla da UF | Texto (2) |
| TP_AGREMIACAO | Tipo de agremiação | Texto |
| NR_PARTIDO | Número do partido | Inteiro |
| SG_PARTIDO | Sigla do partido | Texto |
| NM_PARTIDO | Nome do partido | Texto |
| SQ_PARTIDO | Sequencial do partido | Texto |
| NR_CNPJ | CNPJ do partido | Texto |
| DT_CRIACAO_PARTIDO | Data de criação | Texto |
| DT_REGISTRO_TSE | Data de registro no TSE | Texto |
| DT_EXTINCAO_PARTIDO | Data de extinção | Texto |

---

### 4. Coligações (consulta_coligacao)

**Arquivo do TSE:** `consulta_coligacao_YYYY_RO.csv`

| Coluna | Descrição | Tipo |
|--------|-----------|------|
| DT_GERACAO | Data de geração | Texto |
| ANO_ELEICAO | Ano da eleição | Inteiro |
| CD_TIPO_ELEICAO | Código do tipo de eleição | Texto |
| NM_TIPO_ELEICAO | Nome do tipo de eleição | Texto |
| NR_TURNO | Número do turno | Inteiro |
| CD_ELEICAO | Código da eleição | Texto |
| DS_ELEICAO | Descrição da eleição | Texto |
| SG_UF | Sigla da UF | Texto (2) |
| SG_UE | Sigla da UE | Texto |
| NM_UE | Nome da UE | Texto |
| CD_CARGO | Código do cargo | Texto |
| DS_CARGO | Descrição do cargo | Texto |
| TP_AGREMIACAO | Tipo de agremiação | Texto |
| SQ_COLIGACAO | Sequencial da coligação | Texto |
| NM_COLIGACAO | Nome da coligação | Texto |
| DS_COMPOSICAO_COLIGACAO | Composição da coligação | Texto |
| ST_COLIGACAO | Situação da coligação | Texto |

---

## Como Importar

1. Acesse o sistema DTE com uma conta de **Administrador** ou **Gestor**
2. Vá para **Importar Dados** no menu lateral
3. Selecione o **Tipo de Dataset** correspondente ao arquivo
4. Selecione o **Ano de Referência**
5. Faça upload do arquivo CSV (codificação Latin-1 ou UTF-8)
6. Aguarde o processamento

## Observações Importantes

- Os arquivos do TSE geralmente usam codificação **Latin-1 (ISO-8859-1)**
- O separador padrão é **ponto e vírgula (;)**
- Arquivos grandes podem levar alguns minutos para processar
- Recomenda-se importar na ordem: Partidos → Coligações → Candidatos → Eleitorado

## Download dos Dados do TSE

Os dados podem ser obtidos no portal de dados abertos do TSE:
- https://dadosabertos.tse.jus.br/dataset/

Selecione o ano desejado e baixe os arquivos correspondentes para Rondônia (RO).
