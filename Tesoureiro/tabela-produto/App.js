const express = require('express');
const app = express();
const fs = require('fs');
var path = require('path');
const bodyParser = require('body-parser')

const port = 4000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true}))
app.use(express.static(path.join(__dirname, 'public')))

app.use(express.static(path.join(__dirname, 'img')));


app.get('/', (req, resp) => {
  fs.readFile('produtos.json', 'utf8', (error, data) => {
      if (error){
          console.log('Erro ao ler o arquivo', error)
          resp.status(500).send('Erro ao ler o arquivo')
          return
      }

      const produtos = JSON.parse(data).produtos
      resp.render('produtos', {produtos})
  });
});


app.post('/adicionar', (req, res) => {
  //console.log(req.body)
  const novaProduto = { nome: req.body.nome, quantidade: req.body.quantidade, valor: parseFloat(req.body.valor) };
  fs.readFile('produtos.json', 'utf8', (error, data) => {
      if (error) {
          console.log('Erro ao ler o arquivo:', error)
          res.status(500).send('Erro ao ler o arquivo')
          return
      }

      const json = JSON.parse(data)
      json.produtos.push(novaProduto)

      fs.writeFile('produtos.json', JSON.stringify(json, null, 2), 'utf8', (error) => {
          if (error) {
              console.log('Erro ao escrever no arquivo:', error)
              res.status(500).send('Erro ao escrever no arquivo')
              return
          }
          res.redirect('/')
      })

  })
});

// Filtrar por


//Fim filtro

//limitar registros


// Fim limite

//Mostrar listando

/* app.get('/dashboard', (req, res) =>{
    connection.query('SELECT COUNT(*) FROM despesa', function(error, resultsd) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        connection.query('SELECT COUNT(*) FROM despesa', function(error, resultsc) {
            if (error) {
                console.log(error);
                res.sendStatus(500);
                return;
            }
                res.render('./dashboard', {
                    resultsd:resultsd,
                    resultsc:resultsc
                });
            })
        })
    }) */

//Fim listando

  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});