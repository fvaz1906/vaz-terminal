# vaz-terminal

`vaz-terminal` e o nome do projeto.  
`Vaz Terminal` e o nome de exibicao da aplicacao.

Aplicacao desktop open source construida com Electron para oferecer uma experiencia de terminal moderna no Windows, com visual refinado, multiplas abas, temas, configuracoes de terminal e gerenciamento de conexoes SSH salvas.

## Visao geral

O Vaz Terminal foi pensado para unir:

- shell local real no Windows
- interface inspirada em terminais modernos
- personalizacao visual
- gerenciamento simples de acessos SSH
- empacotamento em instalador `.exe`

O foco desta versao e entregar uma base solida para evoluir o projeto como software livre.

## Principais funcionalidades

### Terminal local real

- sessao local de `PowerShell`
- sessao local de `CMD`
- abertura padrao em `C:\Users\<usuario-logado>`
- suporte a multiplas abas
- fechamento automatico e controle individual por aba

### Interface e experiencia de uso

- layout desktop com barra superior customizada
- temas visuais prontos
- topo da aplicacao sincronizado com o tema ativo
- ajuste dinamico de tamanho com `ResizeObserver`
- barra de abas com compressao progressiva quando muitas abas sao abertas

### Personalizacao do terminal

- troca de fonte
- tamanho da fonte
- altura de linha
- peso da fonte
- estilo do cursor
- cursor piscando
- persistencia local dessas preferencias

### Suporte a SSH

- cadastro local de acessos SSH
- edicao de um SSH salvo
- exclusao de um SSH salvo
- importacao de acessos a partir de JSON
- exportacao de acessos para JSON
- senha armazenada em arquivo JSON local do usuario
- tentativa de conexao por `ssh2`
- feedback visual de status da conexao
- fechamento automatico da aba quando a sessao SSH encerra

### Recursos de produtividade

- copiar e colar no terminal
- menu de contexto nativo do Electron
- historico de comandos no modo de compatibilidade
- autocomplete com `Tab` no modo de compatibilidade
- comandos de limpeza e navegacao ajustados para o fallback

## Tecnologias e bibliotecas utilizadas

### Base da aplicacao

- `electron`
  Responsavel pela aplicacao desktop, janela nativa, IPC e integracao com Windows.

- `electron-builder`
  Responsavel pelo empacotamento e geracao do instalador Windows.

- `rcedit`
  Utilizado no processo de build para garantir identidade visual e metadados do executavel.

### Terminal

- `xterm`
  Renderizacao do terminal na interface.

- `xterm-addon-fit`
  Ajusta automaticamente colunas e linhas ao espaco disponivel.

- `node-pty`
  Fornece integracao TTY real quando disponivel no ambiente.

- `iconv-lite`
  Ajuda no tratamento de encoding das saidas do terminal.

### SSH

- `ssh2`
  Cliente SSH usado para conexoes salvas e controle programatico do estado da sessao.

## Arquitetura do projeto

### Arquivos principais

- `main.js`
  Processo principal do Electron. Cria a janela, gerencia sessoes de terminal, IPC, contexto nativo, SSH, armazenamento de acessos e fallback de shell.

- `preload.js`
  Bridge segura entre renderer e main process.

- `src/index.html`
  Estrutura da interface.

- `src/styles.css`
  Visual, layout, temas, painel lateral, abas e formularios.

- `src/renderer.js`
  Logica da interface, abas, configuracoes, temas, terminal, SSH e interacoes do usuario.

- `build/after-pack.js`
  Ajustes de build apos o empacotamento.

- `assets/`
  Logo, icones e identidade visual da aplicacao.

- `data/ssh-accesses.json`
  Arquivo local utilizado para persistir acessos SSH salvos.

## Como rodar em desenvolvimento

### Requisitos

- Windows
- Node.js instalado
- npm disponivel

### Instalar dependencias

```powershell
cd "C:\Projetos\Vaz Tecnologia\Aplicações\Projeto Terminal"
npm.cmd install
```

### Iniciar a aplicacao

```powershell
cd "C:\Projetos\Vaz Tecnologia\Aplicações\Projeto Terminal"
npm.cmd start
```

## Scripts disponiveis

- `npm.cmd start`
  Inicia a aplicacao em modo de desenvolvimento.

- `npm.cmd pack`
  Gera a pasta empacotada sem instalador.

- `npm.cmd dist`
  Executa os targets configurados no `electron-builder`.

- `npm.cmd dist:win`
  Gera o instalador Windows no formato NSIS.

- `npm.cmd run rebuild-node-pty`
  Tenta recompilar o `node-pty` para a versao atual do Electron.

## Como gerar o instalador do Windows

```powershell
cd "C:\Projetos\Vaz Tecnologia\Aplicações\Projeto Terminal"
npm.cmd run dist:win
```

O instalador e gerado em:

```text
dist\Vaz Terminal Setup 1.0.0.exe
```

Esse `.exe` e o arquivo principal para distribuicao e testes.

## Armazenamento de SSH

Em desenvolvimento, os acessos SSH sao salvos em:

```text
data\ssh-accesses.json
```

Na aplicacao instalada no Windows, os acessos SSH sao salvos em:

```text
%APPDATA%\Vaz Terminal\data\ssh-accesses.json
```

Estrutura esperada:

```json
{
  "version": 1,
  "exportedAt": "2026-04-06T00:00:00.000Z",
  "accesses": [
    {
      "id": "uuid",
      "name": "Servidor Producao",
      "host": "192.168.0.10",
      "port": "22",
      "user": "admin",
      "password": "senha"
    }
  ]
}
```

## Temas e configuracoes

O projeto inclui uma biblioteca de temas visuais prontos, com variacoes de cores para:

- fundo da aplicacao
- topo
- painel lateral
- terminal
- cursor
- texto
- acentos visuais

As preferencias do usuario ficam salvas localmente no navegador embutido do Electron.

## Comportamento de encoding e idioma

O terminal local foi configurado para priorizar:

- `UTF-8`
- locale `pt-BR`
- mensagens e ambiente mais consistentes em portugues

Isso ajuda na exibicao correta de acentuacao e em saidas comuns do PowerShell e do CMD.

## Fallback e compatibilidade

Quando o `node-pty` nao esta disponivel no ambiente, o app continua funcionando em modo de compatibilidade.

Nesse modo:

- o shell continua real
- comandos locais continuam funcionando
- historico e autocomplete sao tratados pela interface
- alguns comportamentos avancados de TTY podem variar em relacao ao modo completo

Esse fallback existe para facilitar desenvolvimento, testes e distribuicao mesmo em maquinas que nao tenham todo o ambiente nativo de compilacao configurado.

## Limitacoes atuais

- a senha SSH e armazenada em JSON local
  Em uma evolucao futura, o ideal e usar armazenamento seguro do sistema operacional.

- o suporte TTY completo depende da disponibilidade do `node-pty`

- algumas ferramentas de terminal podem se comportar de forma diferente entre o modo TTY completo e o modo de compatibilidade

## Roadmap sugerido

- suporte a chaves privadas SSH
- cofres seguros para credenciais
- duplicacao de abas
- renomear abas
- dropdown de nova aba com perfis diferentes
- favoritos de tema
- reconexao de sessoes SSH
- logs de conexao

## Licenca

MIT

## Autor

Vaz Tecnologia
