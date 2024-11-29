
CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    telefone VARCHAR(15),
    email VARCHAR(255) NOT NULL UNIQUE,
    endereco TEXT,
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultima_atividade DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE funcionarios (
    id_funcionario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    telefone VARCHAR(15),
    email VARCHAR(255) NOT NULL UNIQUE,
    endereco TEXT,
    cargo ENUM('administrador', 'funcionário', 'tesoureiro') NOT NULL,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    senha VARCHAR(255) NOT NULL,
    ultimo_acesso DATETIME
);

CREATE TABLE solicitacoes (
    id_solicitacao INT AUTO_INCREMENT PRIMARY KEY,
    cpf_funcionario VARCHAR(11) NOT NULL,
    nome_produto VARCHAR(255) NOT NULL,
    quantidade INT NOT NULL,
    observacao TEXT,
    data_solicitacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cpf_funcionario) REFERENCES funcionarios(cpf) ON DELETE CASCADE
    );
   
    CREATE TABLE servicos (
    id_servico INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    valor_mao_obra DECIMAL(10, 2) NOT NULL
    );
   
    CREATE TABLE produtos (
    id_produto INT AUTO_INCREMENT PRIMARY KEY,   -- Código do produto
    nome_produto VARCHAR(100) NOT NULL,          -- Nome do produto
    quantidade_estoque INT NOT NULL,             -- Quantidade em estoque
    valor_unitario DECIMAL(10, 2) NOT NULL       -- Valor unitário do produto
    );

    CREATE TABLE orcamentos (
    id_orcamento INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,  -- ID do cliente
    tecnico_responsavel INT NOT NULL,  -- ID do técnico que está logado
    produto_id INT,  -- ID do produto (se houver)
    servico_id INT,  -- ID do serviço
    valor_total DECIMAL(10, 2) NOT NULL,
    status ENUM('aguardando aprovação', 'cancelados', 'aprovados') DEFAULT 'aguardando aprovação',
    prazo DATE NOT NULL,  -- Prazo de 15 dias após a abertura
    data_abertura DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id_cliente),
    FOREIGN KEY (produto_id) REFERENCES produtos(id_produto),
    FOREIGN KEY (servico_id) REFERENCES servicos(id_servico),
    FOREIGN KEY (tecnico_responsavel) REFERENCES funcionarios(id_funcionario)  -- Usando ID do funcionário
);

    CREATE TABLE ordens_de_servico (
    id_os INT AUTO_INCREMENT PRIMARY KEY,
    id_orcamento INT NOT NULL,
    id_cliente INT NOT NULL,
    id_funcionario INT NOT NULL,
    data_emissao DATE NOT NULL,
    laudo_tecnico TEXT NOT NULL,
    problema_solu TEXT NOT NULL,
    pecas_utilizadas TEXT,
    horario_inicio DATETIME,
    horario_fim DATETIME,
    valor_servico DECIMAL(10, 2) NOT NULL,
    forma_pagamento ENUM('cartao', 'dinheiro', 'pix', 'cheque') NOT NULL,
    status ENUM('aberta', 'finalizada') DEFAULT 'aberta',
    FOREIGN KEY (id_orcamento) REFERENCES orcamentos(id_orcamento) ON DELETE CASCADE,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (id_funcionario) REFERENCES funcionarios(id_funcionario) ON DELETE CASCADE
);

CREATE TABLE relatorio_ordens_servico (
    id_relatorio INT AUTO_INCREMENT PRIMARY KEY,    -- ID único do relatório (Chave Primária)
    id_os INT NOT NULL,                             -- ID da ordem de serviço (Chave Estrangeira)
    responsavel INT NOT NULL,                       -- ID do responsável pela OS (Chave Estrangeira)
    valor DECIMAL(10, 2) NOT NULL,                  -- Valor da ordem de serviço
    data_abertura DATETIME NOT NULL,                -- Data de abertura da OS
    status ENUM('aberta', 'finalizada') NOT NULL,   -- Status da OS
    FOREIGN KEY (id_os) REFERENCES ordens_de_servico(id_os), -- Relacionamento com a tabela de ordens de serviço
    FOREIGN KEY (responsavel) REFERENCES funcionarios(id_funcionario) -- Relacionamento com a tabela de funcionários
    );
   
     CREATE TABLE relatorio_orcamentos (
    id_relatorio INT AUTO_INCREMENT PRIMARY KEY,
    id_orcamento INT,
    responsavel VARCHAR(14),  -- CPF do responsável
    valor_total DECIMAL(10, 2),
    data_abertura DATETIME,
    status ENUM('aguardando aprovação', 'cancelados', 'aprovados'),
    FOREIGN KEY (id_orcamento) REFERENCES orcamentos(id_orcamento) ON DELETE CASCADE
    );
    
    SELECT * FROM funcionarios;