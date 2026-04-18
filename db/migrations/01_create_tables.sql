-- ============================================================
-- Hub de Obras – DDL (Azure SQL Database)
-- Modelo Dimensional:  Dimensões + Fatos Operacionais + Capex
-- Autor: DBA Pipeline  |  Ambiente: rg-hubdeobras-dev
-- ============================================================

-- Schema isolado para Hub de Obras
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'hub')
    EXEC('CREATE SCHEMA hub');
GO

-- ============================================================
--  D I M E N S Õ E S
-- ============================================================

-- dim_embarcacao: Cadastro master de embarcações
CREATE TABLE hub.dim_embarcacao (
    id              INT           IDENTITY(1,1)  NOT NULL,
    sigla           VARCHAR(10)   NOT NULL,          -- ex: PDR, PDB, ISS
    nome            VARCHAR(100)  NOT NULL,          -- ex: P. Bandolim
    hero_image_key  VARCHAR(60)   NULL,              -- chave para imagem no frontend
    ativo           BIT           NOT NULL  DEFAULT 1,
    criado_em       DATETIME2(0)  NOT NULL  DEFAULT SYSUTCDATETIME(),
    atualizado_em   DATETIME2(0)  NOT NULL  DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_dim_embarcacao PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_dim_embarcacao_sigla UNIQUE (sigla)
);
GO

-- dim_coletor: Tipos de coletor (100, 101, 102, 103, 105, 301…)
CREATE TABLE hub.dim_coletor (
    codigo      INT           NOT NULL,
    descricao   VARCHAR(80)   NULL,              -- ex: "Manutenção Corretiva"
    criado_em   DATETIME2(0)  NOT NULL  DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_dim_coletor PRIMARY KEY CLUSTERED (codigo)
);
GO

-- dim_fase_fel: Fases do ciclo de vida da parada
CREATE TABLE hub.dim_fase_fel (
    codigo      VARCHAR(10)   NOT NULL,          -- FEL-0, FEL-1, …, FEL-4, FECH
    descricao   VARCHAR(60)   NOT NULL,
    ordem       TINYINT       NOT NULL,          -- para ordenação natural
    categoria   VARCHAR(20)   NOT NULL,          -- 'futura', 'andamento', 'encerrada'

    CONSTRAINT PK_dim_fase_fel PRIMARY KEY CLUSTERED (codigo),
    CONSTRAINT CK_dim_fase_fel_categoria CHECK (categoria IN ('futura','andamento','encerrada'))
);
GO

-- ============================================================
--  F A T O S   O P E R A C I O N A I S
-- ============================================================

-- fato_parada: Entidade central – cada parada de uma embarcação
CREATE TABLE hub.fato_parada (
    id                INT            IDENTITY(1,1)  NOT NULL,
    parada_id         INT            NOT NULL,          -- ID de negócio (69, 70, 75…)
    embarcacao_id     INT            NOT NULL,
    fel_codigo        VARCHAR(10)    NOT NULL,
    condicao          VARCHAR(10)    NOT NULL,           -- 'Seco' | 'Molhado'
    inicio_rp         DATE           NOT NULL,
    termino_rp        DATE           NOT NULL,
    dur_rp            INT            NOT NULL,           -- dias
    realizado_brl_m   DECIMAL(12,2)  NULL,               -- milhões BRL
    outlook_brl_m     DECIMAL(12,2)  NULL,
    -- Breakdown financeiro (percentuais)
    re_perc           DECIMAL(5,2)   NULL,               -- NULL = "-"
    em_perc           DECIMAL(5,2)   NULL,
    co_perc           DECIMAL(5,2)   NULL,
    es_perc           DECIMAL(5,2)   NULL,
    nc_perc           DECIMAL(5,2)   NULL,
    criado_em         DATETIME2(0)   NOT NULL  DEFAULT SYSUTCDATETIME(),
    atualizado_em     DATETIME2(0)   NOT NULL  DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_fato_parada PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_fato_parada_negocio UNIQUE (parada_id),
    CONSTRAINT FK_fato_parada_embarcacao FOREIGN KEY (embarcacao_id) REFERENCES hub.dim_embarcacao(id),
    CONSTRAINT FK_fato_parada_fel FOREIGN KEY (fel_codigo) REFERENCES hub.dim_fase_fel(codigo),
    CONSTRAINT CK_fato_parada_condicao CHECK (condicao IN ('Seco','Molhado'))
);
GO

CREATE NONCLUSTERED INDEX IX_fato_parada_fel      ON hub.fato_parada(fel_codigo);
CREATE NONCLUSTERED INDEX IX_fato_parada_embarc   ON hub.fato_parada(embarcacao_id);
CREATE NONCLUSTERED INDEX IX_fato_parada_termino  ON hub.fato_parada(termino_rp);
GO

-- Bridge table: relação N:N entre parada e coletores
CREATE TABLE hub.parada_coletor (
    id            INT  IDENTITY(1,1) NOT NULL,
    parada_id     INT  NOT NULL,                       -- FK para fato_parada.parada_id
    coletor_codigo INT NOT NULL,

    CONSTRAINT PK_parada_coletor PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_parada_coletor_parada FOREIGN KEY (parada_id) REFERENCES hub.fato_parada(parada_id),
    CONSTRAINT FK_parada_coletor_coletor FOREIGN KEY (coletor_codigo) REFERENCES hub.dim_coletor(codigo),
    CONSTRAINT UQ_parada_coletor UNIQUE (parada_id, coletor_codigo)
);
GO

-- fato_obra_progresso: KPIs de progresso por parada (1:1)
CREATE TABLE hub.fato_obra_progresso (
    id              INT  IDENTITY(1,1) NOT NULL,
    parada_id       INT  NOT NULL,
    mat_realizado   INT  NOT NULL  DEFAULT 0,
    mat_total       INT  NOT NULL  DEFAULT 0,
    ser_realizado   INT  NOT NULL  DEFAULT 0,
    ser_total       INT  NOT NULL  DEFAULT 0,
    fac_realizado   INT  NOT NULL  DEFAULT 0,
    fac_total       INT  NOT NULL  DEFAULT 0,
    atualizado_em   DATETIME2(0)  NOT NULL  DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_fato_obra_progresso PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_fato_obra_progresso_parada FOREIGN KEY (parada_id) REFERENCES hub.fato_parada(parada_id),
    CONSTRAINT UQ_fato_obra_progresso UNIQUE (parada_id)
);
GO

-- fato_gmud: Contadores de GMUD por parada (1:1)
CREATE TABLE hub.fato_gmud (
    id           INT  IDENTITY(1,1) NOT NULL,
    parada_id    INT  NOT NULL,
    total        INT  NOT NULL  DEFAULT 0,
    aprovadas    INT  NOT NULL  DEFAULT 0,
    adicao       INT  NOT NULL  DEFAULT 0,
    exclusao     INT  NOT NULL  DEFAULT 0,
    alteracao    INT  NOT NULL  DEFAULT 0,
    quebra       INT  NOT NULL  DEFAULT 0,
    atualizado_em DATETIME2(0) NOT NULL  DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_fato_gmud PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_fato_gmud_parada FOREIGN KEY (parada_id) REFERENCES hub.fato_parada(parada_id),
    CONSTRAINT UQ_fato_gmud UNIQUE (parada_id)
);
GO

-- ============================================================
--  F A T O S   F I N A N C E I R O S  (Capex)
-- ============================================================

-- dim_capex_ano: Outlook anual consolidado
CREATE TABLE hub.dim_capex_ano (
    id                     INT           IDENTITY(1,1) NOT NULL,
    ano                    INT           NOT NULL,
    outlook_brl_m          DECIMAL(12,2) NOT NULL,          -- ex: 265.6
    variacao_orcamento_perc DECIMAL(5,2) NULL,               -- ex: -3.00
    total_obras            INT           NOT NULL DEFAULT 0,
    obras_executadas       INT           NOT NULL DEFAULT 0,
    criado_em              DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_dim_capex_ano PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_dim_capex_ano UNIQUE (ano)
);
GO

-- fato_capex_tipo_obra: Breakdown por tipo (MC, DE, DI, PP, UP)
CREATE TABLE hub.fato_capex_tipo_obra (
    id              INT            IDENTITY(1,1) NOT NULL,
    capex_ano_id    INT            NOT NULL,
    codigo          VARCHAR(10)    NOT NULL,       -- MC, DE, DI, PP, UP
    valor_brl_m     DECIMAL(12,2)  NOT NULL,
    percentual      DECIMAL(5,2)   NOT NULL,
    criado_em       DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_fato_capex_tipo_obra PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_fato_capex_tipo_obra_ano FOREIGN KEY (capex_ano_id) REFERENCES hub.dim_capex_ano(id)
);
GO

-- fato_capex_subsistema: Custos por subsistema técnico
CREATE TABLE hub.fato_capex_subsistema (
    id              INT            IDENTITY(1,1) NOT NULL,
    capex_ano_id    INT            NOT NULL,
    nome            VARCHAR(80)    NOT NULL,       -- ex: "Propulsão"
    codigo          VARCHAR(20)    NOT NULL,       -- ex: "630.001"
    valor_brl_m     DECIMAL(12,2)  NOT NULL,
    percentual      TINYINT        NOT NULL,
    criado_em       DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_fato_capex_subsistema PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_fato_capex_subsistema_ano FOREIGN KEY (capex_ano_id) REFERENCES hub.dim_capex_ano(id)
);
GO

-- fato_capex_composicao: Composição do Capex (Serviços, Material, Facilidades)
CREATE TABLE hub.fato_capex_composicao (
    id              INT            IDENTITY(1,1) NOT NULL,
    capex_ano_id    INT            NOT NULL,
    categoria       VARCHAR(30)    NOT NULL,       -- 'Serviços', 'Material', 'Facilidades'
    percentual      DECIMAL(5,2)   NOT NULL,
    valor_brl_m     DECIMAL(12,2)  NOT NULL,
    variacao_perc   DECIMAL(5,2)   NULL,           -- ex: +1, -4, -3
    criado_em       DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_fato_capex_composicao PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_fato_capex_composicao_ano FOREIGN KEY (capex_ano_id) REFERENCES hub.dim_capex_ano(id)
);
GO

-- fato_capex_historico_anual: Série temporal do gráfico "Capex por Ano"
CREATE TABLE hub.fato_capex_historico_anual (
    id              INT            IDENTITY(1,1) NOT NULL,
    ano             INT            NOT NULL,
    valor_brl_m     DECIMAL(12,2)  NOT NULL,
    criado_em       DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_fato_capex_historico_anual PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_fato_capex_historico_anual UNIQUE (ano)
);
GO

-- ============================================================
--  F A T O S   D E   C O M U N I C A Ç Ã O
-- ============================================================

-- fato_notificacao: Notificações e atualizações do sistema
CREATE TABLE hub.fato_notificacao (
    id            INT            IDENTITY(1,1) NOT NULL,
    titulo        VARCHAR(120)   NOT NULL,
    meta_info     VARCHAR(120)   NULL,          -- ex: "029 | A. Abrolhos | FEL-2"
    texto         VARCHAR(500)   NULL,
    usuario       VARCHAR(80)    NOT NULL,
    data_hora     DATETIME2(0)   NOT NULL,
    tipo          VARCHAR(20)    NOT NULL DEFAULT 'geral',  -- 'geral' | 'pessoal'
    lida          BIT            NOT NULL DEFAULT 0,
    criado_em     DATETIME2(0)   NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_fato_notificacao PRIMARY KEY CLUSTERED (id),
    CONSTRAINT CK_fato_notificacao_tipo CHECK (tipo IN ('geral','pessoal'))
);
GO

CREATE NONCLUSTERED INDEX IX_fato_notificacao_tipo ON hub.fato_notificacao(tipo, data_hora DESC);
GO

PRINT '✅ Todas as tabelas criadas com sucesso no schema [hub].';
GO
