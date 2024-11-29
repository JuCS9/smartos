const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
const session = require('express-session');
const app = express();
const fs = require('fs');
var path = require('path');
const bodyParser = require('body-parser')
var mysql = require('mysql2');
const ejs = require('ejs');
const nodemailer = require('nodemailer');
const router = express.Router();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));


app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'img')));

app.use(bodyParser.json());

const port = process.env.PORT || 3001;


const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

const db = mysql.createPool({
host: process.env.DB_HOST,
user: process.env.DB_USERNAME,
password: process.env.DB_PASSWORD,
database: process.env.DB_DBNAME,
waitForConnections: true,
connectionLimit: 10,
queueLimit: 0
});

//Voltar para a homepage clicando na seta
app.get('/homepage_administrador', (req, res) => {
    res.render('homepages/homepage_administrador');
  });

// ------------------------------------------ Login ------------------------------------------
app.get("/", (req, res) => {
    res.render('index.ejs'); // Renderiza 'pagina.ejs'
});


app.use(session({
    secret: 'VedmV<7{[i*bQ5K+$P{.1)%0J#VTRB', // Troque por um valor seguro
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 600000 } // Expiração da sessão (em milissegundos)
}));



// Processo de login
app.post("/login", (req, res) => {
    const cpf = req.body.cpf.trim();
    const senha = req.body.senha.trim();

    // Primeiro, verificar a senha na tabela 'usuarios'
    db.query('SELECT senha FROM funcionarios WHERE cpf = ?', [cpf], (error, results) => {
        if (error) {
            console.error('Erro ao executar a query:', error);
            res.status(500).send('Erro no servidor');
            return;
        }

        if (results.length > 0) {
            const senhaBD = results[0].senha;

            // Verifica se a senha inserida é correta
            if (senha === senhaBD) {
                console.log("Login bem-sucedido");

                // Agora, consultar o cargo na tabela 'funcionarios'
                db.query('SELECT cargo FROM funcionarios WHERE cpf = ?', [cpf], (error, cargoResults) => {
                    if (error) {
                        console.error('Erro ao consultar o cargo na tabela funcionarios:', error);
                        res.status(500).send('Erro no servidor');
                        return;
                    }

                    if (cargoResults.length > 0) {
                        const cargo = cargoResults[0].cargo;

                        // Redirecionar com base no cargo
                        if (cargo === 'administrador') {
                            res.render('homepages/homepage_administrador');     // Redireciona para a página de administrador 
                        } else if (cargo === 'tesoureiro') {
                            res.render('homepages/homepage_tesoureiro');        // Redireciona para a página de tesoureiro
                        } else if (cargo === 'funcionário') {
                            res.render('homepages/homepage_funcionario');       // Redireciona para a página de funcionário
                        } else {
                            console.log('Cargo desconhecido');
                            res.status(400).send('Cargo desconhecido');
                        }
                    } else {
                        console.log('Usuário não encontrado na tabela funcionarios!');
                        res.status(404).send('Usuário não encontrado na tabela funcionarios');
                    }
                });

            } else {
                console.log("Senha incorreta");
                res.send('Senha incorreta');
            }
        } else {
            console.log('Usuário não cadastrado!');
            res.send('Usuário não cadastrado!');
        }
    });
});


// Rota para o formulário de cadastro
app.get("/cadastro", (req, res) => {
    res.render(path.join(__dirname, 'views', 'cadastro.ejs'));
});

// Processo de cadastro
app.post("/cadastro", (req, res) => {
    const cpf = req.body.cpf.trim();
    const senha = req.body.senha.trim();
    const confirm = req.body.senhaConfirm;

    // Verifica se as senhas coincidem
    if (senha === confirm) {
        // Primeiro, verifica se o CPF existe na tabela funcionarios
        db.query('SELECT cpf FROM funcionarios WHERE cpf = ?', [cpf], (error, results) => {
            if (error) {
                console.log('Erro ao consultar tabela funcionarios:', error);
                res.status(500).send('Erro no servidor');
                return;
            }

            if (results.length > 0) {
                // Se o CPF existir na tabela funcionarios, atualiza o campo senha
                db.query('UPDATE funcionarios SET senha = ? WHERE cpf = ?', [senha, cpf], (error, results) => {
                    if (error) {
                        console.log('Erro ao atualizar senha do funcionário:', error);
                        res.status(500).send('Erro no servidor');
                        return;
                    }
                    console.log('Senha cadastrada com sucesso!');
                    res.send('Senha cadastrada com sucesso!');
                });
            } else {
                // CPF não encontrado na tabela funcionarios
                console.log('CPF não encontrado na tabela funcionarios');
                res.status(400).send('CPF não encontrado na tabela funcionarios');
            }
        });
    } else {
        console.log('Senhas não coincidem');
        res.status(400).send('Senhas não coincidem');
    }
});



//Esqueci Senha 
app.get("/esqueci", (req, res) => {
    res.render('recSenha.ejs');
})

//Direcionar para Login de volta
app.get("/login2", (req, res) => {
    res.render('index.ejs');
})

//Enviar email de recuperação de senha
app.post('/enviarEmail', (req, res) => {
    const userEmail = req.body.email.trim();  // Recebe o e-mail do usuário


    //Email existe? Descubra executando o código abaixo
    db.query('SELECT * FROM funcionarios WHERE email = ?', [userEmail], (error, results) => {
        if (error) {
            console.log('Erro ao verificar e-mail no banco de dados:', error);
            return res.status(500).send('Erro no servidor.');
        }
        if (results.length === 0) {
            return res.send('E-mail não cadastrado. Verifique e tente novamente.');
        }

        // Função para gerar o código
        function gerarCodigo(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        let codigo = gerarCodigo(1000, 9999);

        // Armazena o e-mail e o código na sessão
        req.session.email = userEmail;
        req.session.codigo = codigo;

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'smartossuporte@gmail.com',
                pass: 'mrtv vaoi afnp rjbk'
            }
        });

        let mailOptions = {
            from: '"Suporte SmartOS" <smartossuporte@gmail.com>',
            to: userEmail,
            subject: 'Recuperação de Senha',
            html: `<h1>Seu código de recuperação é: ${codigo}</h1>`  // Envia o código no e-mail
        };

        // Enviar o e-mail
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Erro ao enviar o e-mail.');
            }
            console.log('E-mail enviado: ' + info.response);
            // Renderiza a página para o usuário inserir o código
            res.render('codigo.ejs');
        });
    });
});


app.post('/verificarCodigo', (req, res) => {
    const codigoDigitado = req.body.codigoDigitado;
    const codigoSessao = req.session.codigo;

    console.log("Código digitado:", codigoDigitado);
    console.log("Código da sessão:", codigoSessao);

    if (String(codigoDigitado) === String(codigoSessao)) {
        res.render('novaSenha.ejs');
        console.log('Código correto')
    } else {
        res.send('Código incorreto. Tente novamente.');
    }
});

//Atualizar a senha
app.post('/atualizarSenha', (req, res) => {
    const novaSenha = req.body.novaSenha.trim();  // Captura a nova senha digitada pelo usuário
    const confirmSenha = req.body.confirmSenha.trim();  // Captura a confirmação da senha
    const emailSessao = req.session.email;  // O e-mail que foi armazenado na sessão durante o envio do código

    // Verifica se as senhas coincidem
    if (novaSenha === confirmSenha) {
        // Busca o CPF a partir do email na tabela 'funcionarios'
        db.query('SELECT cpf FROM funcionarios WHERE email = ?', [emailSessao], (error, results) => {
            if (error) {
                console.log('Erro ao consultar tabela funcionarios:', error);
                res.status(500).send('Erro no servidor.');
                return;
            }

            if (results.length > 0) {
                const cpf = results[0].cpf;  // Extrai o CPF do funcionário

                // Atualiza a senha na tabela 'usuarios' com base no CPF
                db.query('UPDATE funcionarios SET senha = ? WHERE cpf = ?', [novaSenha, cpf], (error, results) => {
                    if (error) {
                        console.log('Erro ao atualizar a senha:', error);
                        res.status(500).send('Erro ao atualizar a senha.');
                        return;
                    }

                    console.log('Senha atualizada com sucesso!');
                    res.send('Senha atualizada com sucesso! Agora você pode fazer login com a nova senha.');
                });
            } else {
                console.log('Nenhum funcionário encontrado com esse e-mail.');
                res.status(404).send('Nenhum funcionário encontrado com esse e-mail.');
            }
        });
    } else {
        console.log('As senhas não coincidem.');
        res.status(400).send('As senhas não coincidem. Tente novamente.');
    }
});

//Funcionários
app.get('/funcionarios', (req, res) => {
    const limite = req.query.limite === 'todos' ? null : parseInt(req.query.limite, 10);
    const totalQuery = `SELECT COUNT(*) AS total FROM funcionarios;`;
    const listarProd = limite ? `SELECT * FROM funcionarios LIMIT ${limite};` : `SELECT * FROM funcionarios;`;

    db.query(listarProd, (error, results) => {
        if (error) {
            console.error("Erro ao listar funcionários:", error);
            return res.status(500).send('Erro no banco de dados');
        }

        db.query(totalQuery, (error, totalResults) => {
            if (error) {
                console.error("Erro ao contar funcionários:", error);
                return res.status(500).send('Erro ao contar funcionários');
            } else {
                const total = totalResults[0].total;
                res.render('tabelas/funcionarios.ejs', {
                    funcionarios: results,
                    total: total
                });
            }
        });
    });
});
//Fim funcuinários 

// Rota para editar funcionário
app.post('/editarFuncionarios', (req, res) => {
    const { nome, cpf, telefone, email, endereco, cargo } = req.body;
    const query = `UPDATE funcionarios SET nome=?, telefone=?, email=?, endereco=?, cargo=? WHERE cpf=?;`;

    db.query(query, [nome, telefone, email, endereco, cargo, cpf], (error, results) => {
        if (error) {
            console.error("Erro ao editar funcionário:", error);
            res.status(500).send('Erro ao editar funcionário');
        } else {
            res.redirect('/funcionarios');
        }
    });
});



//Pesquisar Funcionários
app.get('/pesquisarFuncionarios', (req, res) => {
    const termoBusca = req.query.termo || ''; // Termo de pesquisa enviado pelo cliente

    // Consulta ao banco de dados com múltiplos critérios de busca
    const sqlSearch = `
      SELECT * FROM funcionarios
      WHERE nome LIKE ? OR cpf LIKE ? OR email LIKE ? OR endereco LIKE ? OR telefone LIKE ? OR cargo LIKE ?
    `;

    const buscaComLike = `%${termoBusca}%`; // Formato do termo para o LIKE

    db.query(sqlSearch, [buscaComLike, buscaComLike, buscaComLike, buscaComLike, buscaComLike, buscaComLike], (err, results) => {
        if (err) {
            console.error('Erro ao buscar funcionários:', err);
            return res.status(500).send('Erro na busca');
        }
        res.json(results);
    });
});
//Fim pesquisa funcionários

//Adicionar Funcionários
app.post('/adicionarFuncionarios', (req, res) => {
    console.log(req.body); // Verifique os dados recebidos

    const { nome, cpf, endereco, telefone, email, cargo } = req.body;

    const sqlInsert = `INSERT INTO funcionarios (nome, cpf, endereco, telefone, email, cargo) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(sqlInsert, [nome, cpf, endereco, telefone, email, cargo], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar funcionário:', err);
            return res.status(500).send('Erro ao adicionar funcionário');
        }
        res.send('Funcionário adicionado com sucesso');
    });
});
//Fim Adicionar Funcionários

//Excluir Funcionários
app.post('/excluirFuncionario', (req, res) => {
    const cpf = req.body.cpf;

    const sqlDelete = `DELETE FROM funcionarios WHERE cpf = ?`;
    db.query(sqlDelete, [cpf], (err, result) => {
        if (err) {
            console.error('Erro ao excluir funcionário:', err);
            return res.status(500).send('Erro ao excluir funcionário');
        }
        res.send('Funcionário excluído com sucesso');
    });
});
//Fim excluir Funcionários



//Produtos
app.get(['/produtos', '/voltar'], (req, res) => {
    const limite = req.query.limite === 'todos' ? null : parseInt(req.query.limite, 10);
    const totalQuery = `SELECT COUNT(*) AS total FROM produtos;`;
    const listarFunc = limite ? `SELECT * FROM produtos LIMIT ${limite};` : `SELECT * FROM produtos;`;

    // Primeira query para listar produtos
    db.query(listarFunc, (error, results) => {
        if (error) {
            console.error("Erro ao listar produtos:", error);
            return res.status(500).send('Erro no banco de dados');
        } else {

            // Segunda query para contar o total de produtos
            db.query(totalQuery, (error, totalResults) => {
                if (error) {
                    console.error("Erro ao contar produtos:", error);
                    return res.status(500).send('Erro ao contar produtos');
                } else {

                    const total = totalResults[0].total;
                    res.render('tabelas/produtos.ejs', {
                        produtos: results,
                        total: total,

                    });

                }
            });
        }
    });
});

// Adicionar produto
app.post('/adicionarProduto', (req, res) => {
    console.log(req.body); // Exibe os dados recebidos no console para depuração

    // Desestrutura os dados enviados no formulário
    const { nome, quantidade, valor } = req.body;

    // Query SQL para inserir o produto (o código será gerado automaticamente)
    const sqlInsert = `
        INSERT INTO produtos (nome_produto, quantidade_estoque, valor_unitario) 
        VALUES (?, ?, ?)
    `;

    // Executa a query no banco de dados
    db.query(sqlInsert, [nome, quantidade, valor], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar produto:', err);
            return res.status(500).send('Erro ao adicionar produto');
        }

        console.log('Produto adicionado com sucesso:', result.insertId); // Mostra o ID gerado
        res.status(200).send('Produto adicionado com sucesso');
    });
});

// Pesquisar Produtos
app.get('/pesquisarFuncionarios', (req, res) => {
    const termoBusca = req.query.termo || ''; // Termo de pesquisa enviado pelo cliente

    // Consulta ao banco de dados com múltiplos critérios de busca
    const sqlSearch = `
      SELECT * FROM funcionarios
      WHERE nome LIKE ? OR cpf LIKE ? OR email LIKE ? OR endereco LIKE ? OR telefone LIKE ? OR cargo LIKE ?
    `;

    const buscaComLike = `%${termoBusca}%`; // Formato do termo para o LIKE

    db.query(sqlSearch, [buscaComLike, buscaComLike, buscaComLike, buscaComLike, buscaComLike, buscaComLike], (err, results) => {
        if (err) {
            console.error('Erro ao buscar funcionários:', err);
            return res.status(500).send('Erro na busca');
        }
        res.json(results);
    });
});
//Fim pesquisa produtos


//Clientes

app.get(['/clientes', '/voltar'], (req, res) => {
    const limite = req.query.limite === 'todos' ? null : parseInt(req.query.limite, 10);
    const totalQuery = `SELECT COUNT(*) AS total FROM clientes;`;
    const listarFunc = limite ? `SELECT * FROM clientes LIMIT ${limite};` : `SELECT * FROM clientes;`;

    // Primeira query para listar clientes
    db.query(listarFunc, (error, results) => {
        if (error) {
            console.error("Erro ao listar clientes:", error);
            return res.status(500).send('Erro no banco de dados');
        } else {

            // Segunda query para contar o total de clientes
            db.query(totalQuery, (error, totalResults) => {
                if (error) {
                    console.error("Erro ao contar clientes:", error);
                    return res.status(500).send('Erro ao contar clientes');
                } else {

                    const total = totalResults[0].total;
                    res.render('tabelas/clientes.ejs', {
                        clientes: results,
                        total: total,

                    });

                }
            });
        }
    });
});

// Adicionar Clientes
app.use(express.json()); // Adiciona suporte para JSON

app.post('/adicionarClientes', (req, res) => {
    console.log(req.body); // Verifique os dados recebidos

    const { nome, cpf, endereco, telefone, email } = req.body;

    const sqlInsert = `INSERT INTO clientes (nome, cpf, endereco, telefone, email) VALUES (?, ?, ?, ?, ?)`;
    db.query(sqlInsert, [nome, cpf, endereco, telefone, email], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar cliente:', err);
            return res.status(500).send('Erro ao adicionar cliente');
        }
        res.send('Cliente adicionado com sucesso');
    });
});

// Fim Adicionar Clientes

//Editando Clientes
app.post('/editarClientes', (req, res) => {
    const { nome, cpf, telefone, email, endereco} = req.body;
    const query = `UPDATE clientes SET nome=?, telefone=?, email=?, endereco=? WHERE cpf=?;`;

    db.query(query, [nome, telefone, email, endereco, cpf], (error, results) => {
        if (error) {
            console.error("Erro ao editar cliente:", error);
            res.status(500).send('Erro ao editar cliente');
        } else {
            res.redirect('/clientes');
        }
    });
});

//Deletando Clientes
app.post('/excluirCliente', (req, res) => {
    const cpf = req.body.cpf;

    const sqlDelete = `DELETE FROM clientes WHERE cpf = ?`;
    db.query(sqlDelete, [cpf], (err, result) => {
        if (err) {
            console.error('Erro ao excluir clientes:', err);
            return res.status(500).send('Erro ao excluir clientes');
        }
        res.send('Cliente excluído comm sucesso');
    });
});

//Pesquisar Clientes
app.get('/pesquisarClientes', (req, res) => {
    const termoBusca = req.query.termo || ''; // Termo de pesquisa enviado pelo cliente

    // Consulta ao banco de dados com múltiplos critérios de busca
    const sqlSearch = `
      SELECT * FROM clientes
      WHERE nome LIKE ? OR cpf LIKE ? OR email LIKE ? OR endereco LIKE ? OR telefone LIKE ?
    `;

    const buscaComLike = `%${termoBusca}%`; // Formato do termo para o LIKE

    db.query(sqlSearch, [buscaComLike, buscaComLike, buscaComLike, buscaComLike, buscaComLike], (err, results) => {
        if (err) {
            console.error('Erro ao buscar clientes:', err);
            return res.status(500).send('Erro na busca');
        }
        res.json(results);
    });
});
//Fim pesquisa funcionários



//Despesas
app.get(['/despesas', '/voltar'], (req, res) => {
    const limite = req.query.limite === 'todos' ? null : parseInt(req.query.limite, 10);
    const totalQuery = `SELECT COUNT(*) AS total FROM despesas;`;
    const listarFunc = limite ? `SELECT * FROM despesas LIMIT ${limite};` : `SELECT * FROM despesas;`;

    // Primeira query para listar despesas
    db.query(listarFunc, (error, results) => {
        if (error) {
            console.error("Erro ao listar despesas:", error);
            return res.status(500).send('Erro no banco de dados');
        } else {

            // Segunda query para contar o total de despesas
            db.query(totalQuery, (error, totalResults) => {
                if (error) {
                    console.error("Erro ao contar despesas:", error);
                    return res.status(500).send('Erro ao contar despesas');
                } else {

                    const total = totalResults[0].total;
                    res.render('tabelas/despesas.ejs', {
                        despesas: results,
                        total: total,

                    });

                }
            });
        }
    });
});

//Movimentações

app.get(['/movimentacoes', '/voltar'], (req, res) => {
    const limite = req.query.limite === 'todos' ? null : parseInt(req.query.limite, 10);
    const totalQuery = `SELECT COUNT(*) AS total FROM movimentacoes;`;
    const listarFunc = limite ? `SELECT * FROM movimentacoes LIMIT ${limite};` : `SELECT * FROM movimentacoes;`;

    // Primeira query para listar movimentacoes
    db.query(listarFunc, (error, results) => {
        if (error) {
            console.error("Erro ao listar movimentacoes:", error);
            return res.status(500).send('Banco não existe');
        } else {

            // Segunda query para contar o total de movimentacoes
            db.query(totalQuery, (error, totalResults) => {
                if (error) {
                    console.error("Erro ao contar movimentacoes:", error);
                    return res.status(500).send('Erro ao contar movimentacoes');
                } else {

                    const total = totalResults[0].total;
                    res.render('tabelas/movimentacoes.ejs', {
                        movimentacoes: results,
                        total: total,

                    });

                }
            });
        }
    });
});

//Orçamentos

app.get(['/orcamentos', '/voltar'], (req, res) => {
    const limite = req.query.limite === 'todos' ? null : parseInt(req.query.limite, 10);
    const totalQuery = `SELECT COUNT(*) AS total FROM orcamentos;`;
    const listarFunc = limite ? `SELECT * FROM orcamentos LIMIT ${limite};` : `SELECT * FROM orcamentos;`;

    // Primeira query para listar orcamentos
    db.query(listarFunc, (error, results) => {
        if (error) {
            console.error("Erro ao listar orcamentos:", error);
            return res.status(500).send('Erro no banco de dados');
        } else {

            // Segunda query para contar o total de orcamentos
            db.query(totalQuery, (error, totalResults) => {
                if (error) {
                    console.error("Erro ao contar orcamentos:", error);
                    return res.status(500).send('Erro ao contar orcamentos');
                } else {

                    const total = totalResults[0].total;
                    res.render('tabelas/orcamentos.ejs', {
                        orcamentos: results,
                        total: total,

                    });

                }
            });
        }
    });
});

//Ordem de serviços

app.get(['/ordemdeservicos', '/voltar'], (req, res) => {
    const limite = req.query.limite === 'todos' ? null : parseInt(req.query.limite, 10);
    const totalQuery = `SELECT COUNT(*) AS total FROM ordemdeservicos;`;
    const listarFunc = limite ? `SELECT * FROM ordemdeservicos LIMIT ${limite};` : `SELECT * FROM ordemdeservicos;`;

    // Primeira query para listar ordemdeservicos
    db.query(listarFunc, (error, results) => {
        if (error) {
            console.error("Erro ao listar ordemdeservicos:", error);
            return res.status(500).send('Banco não existe');
        } else {

            // Segunda query para contar o total de ordemdeservicos
            db.query(totalQuery, (error, totalResults) => {
                if (error) {
                    console.error("Erro ao contar ordemdeservicos:", error);
                    return res.status(500).send('Erro ao contar ordemdeservicos');
                } else {

                    const total = totalResults[0].total;
                    res.render('tabelas/ordemdeservicos.ejs', {
                        ordemdeservicos: results,
                        total: total,

                    });

                }
            });
        }
    });
});

//Solicitações

app.get(['/solicitacoes', '/voltar'], (req, res) => {
    const limite = req.query.limite === 'todos' ? null : parseInt(req.query.limite, 10);
    const totalQuery = `SELECT COUNT(*) AS total FROM solicitacoes;`;
    const listarFunc = limite ? `SELECT * FROM solicitacoes LIMIT ${limite};` : `SELECT * FROM solicitacoes;`;

    // Primeira query para listar solicitacoes
    db.query(listarFunc, (error, results) => {
        if (error) {
            console.error("Erro ao listar solicitacoes:", error);
            return res.status(500).send('Erro no banco de dados');
        } else {

            // Segunda query para contar o total de solicitacoes
            db.query(totalQuery, (error, totalResults) => {
                if (error) {
                    console.error("Erro ao contar solicitacoes:", error);
                    return res.status(500).send('Erro ao contar solicitacoes');
                } else {

                    const total = totalResults[0].total;
                    res.render('tabelas/solicitacoes.ejs', {
                        solicitacoes: results,
                        total: total,

                    });

                }
            });
        }
    });
});

//Contar usuários

app.get(['/usuarios', '/voltar'], (req, res) => {
    const limite = req.query.limite === 'todos' ? null : parseInt(req.query.limite, 10);
    const totalQuery = `SELECT COUNT(*) AS total FROM usuarios;`;
    const listarFunc = limite ? `SELECT * FROM usuarios LIMIT ${limite};` : `SELECT * FROM usuarios;`;

    // Primeira query para listar usuarios
    db.query(listarFunc, (error, results) => {
        if (error) {
            console.error("Erro ao listar usuarios:", error);
            return res.status(500).send('Erro no banco de dados');
        } else {

            // Segunda query para contar o total de usuarios
            db.query(totalQuery, (error, totalResults) => {
                if (error) {
                    console.error("Erro ao contar usuarios:", error);
                    return res.status(500).send('Erro ao contar usuarios');
                } else {

                    const total = totalResults[0].total;
                    res.render('tabelas/usuarios.ejs', {
                        usuarios: results,
                        total: total,

                    });

                }
            });
        }
    });
});

app.get(['/homepage_administrador','/ir-para'], (req, res) => {
    const destino = req.query.destino;
  
    if (destino === 'perfil') {
      // Redireciona para a página de perfil
      res.redirect('/perfil');
    } else if (destino === 'login') {
        req.session.destroy((err) => {
            if (err) {
              return res.status(500).send('Erro ao encerrar a sessão');
            }
           res.redirect('/');
     });
    }
  });

  app.get(['/perfil', '/dados'], (req, res) => {
    const destino = req.query.destino;
    const cpf = req.session.cpf;
    const query = `SELECT * FROM funcionarios WHERE cpf = ?;`;
    
    db.query(query, [cpf], (error, results) => {
        if (error) {
            console.error("Erro ao listar solicitacoes:", error);
            return res.status(500).send('Erro no banco de dados');
        } else {
    res.render('perfil-tcc/perfil.ejs', {
        dados:results,
    });

        }
    });
});

app.listen(port, () => {
    console.log(`Servidor iniciado em http://localhost:${port}`);
});
