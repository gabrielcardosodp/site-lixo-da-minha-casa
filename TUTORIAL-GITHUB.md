# Tutorial de publicação e manutenção (para iniciantes)

Este tutorial mostra como colocar o site no ar e como atualizá-lo sem reconstruir o projeto. Ele supõe que você nunca publicou um site antes. As telas do GitHub e da Vercel mudam com o tempo; se algum botão tiver nome diferente, procure por uma palavra parecida.

Antes de começar, entenda a diferença entre três coisas:

- **Salvar uma alteração no GitHub** (chamado de "commit"): o arquivo fica registrado no repositório. Nada muda no site ainda.
- **Deploy**: a Vercel (ou outro serviço) lê o repositório e gera a nova versão do site. Costuma levar de alguns segundos a alguns minutos.
- **Site publicado**: a nova versão já aparece no endereço público. Só depois do deploy concluído com sucesso a mudança está no ar.

Ou seja: salvar no GitHub não significa que o site mudou. Ele muda quando o deploy termina.

---

## Passo 1: criar uma conta no GitHub

1. Acesse `https://github.com` e clique em **Sign up**.
2. Informe e-mail, senha e um nome de usuário.
3. Confirme o e-mail que o GitHub enviar.
4. Escolha o plano gratuito (**Free**).

## Passo 2: criar um repositório

Um repositório é a pasta do projeto guardada na nuvem.

1. Logado no GitHub, clique no **+** no canto superior direito e escolha **New repository**.
2. Em **Repository name**, digite `site-lixo-da-minha-casa`.
3. Escolha **Public** (o site é público; o código também ficará visível).
4. Não marque nenhuma opção extra (README, .gitignore ou licença), pois o projeto já tem esses arquivos.
5. Clique em **Create repository**.

## Passo 3: colocar os arquivos do site no repositório

Pelo navegador, sem terminal:

1. Na página do repositório recém-criado, clique em **uploading an existing file** (ou em **Add file > Upload files**).
2. Abra a pasta `site-lixo-da-minha-casa` no seu computador e selecione **todos os arquivos e pastas de dentro dela** (`index.html`, `guia.html`, `css`, `js`, `src`, `README.md` etc.). Arraste-os para a área indicada.
3. Aguarde o envio terminar.
4. Em **Commit changes**, escreva uma mensagem curta, como `Primeira versão do site`.
5. Clique em **Commit changes**.

Confira que `index.html` aparece na raiz do repositório, e não dentro de uma pasta extra. Se a pasta `site-lixo-da-minha-casa` aparecer como item único, abra-a e veja se os arquivos estão lá dentro; se estiverem, prefira enviar o conteúdo da pasta, e não a pasta em si.

## Passo 4: conectar o repositório à Vercel

1. Acesse `https://vercel.com` e clique em **Sign Up**. Escolha **Continue with GitHub** e autorize a Vercel a acessar sua conta.
2. No painel, clique em **Add New... > Project**.
3. Em **Import Git Repository**, localize `site-lixo-da-minha-casa` e clique em **Import**.

Autorize a Vercel somente para o repositório deste projeto, se a tela oferecer essa opção.

## Passo 5: configurar a primeira publicação

Na tela de configuração do projeto:

1. **Framework Preset**: escolha **Other**.
2. **Root Directory**: deixe em branco ou `./`.
3. **Build Command**: deixe **vazio** (o site não precisa de build).
4. **Output Directory**: deixe **vazio** ou escreva `.` (ponto).
5. Não preencha variáveis de ambiente, pois o projeto não usa chaves nem senhas.
6. Clique em **Deploy**.

Aguarde a tela mostrar **Congratulations** ou o status de sucesso.

## Passo 6: encontrar o endereço público do site

Após o deploy, a Vercel mostra uma pré-visualização do site e um link no formato `site-lixo-da-minha-casa.vercel.app` (ou parecido, se o nome já estiver em uso). Clique em **Visit** ou copie o endereço. Esse é o endereço público do site.

## Passo 7: editar um arquivo diretamente pelo navegador do GitHub

Esta é a forma recomendada para alterações simples.

1. Abra o repositório no GitHub e navegue até o arquivo a alterar. Para indicadores de impacto, por exemplo, vá em `src` > `data` > `impacto.json`.
2. Clique no ícone de lápis (**Edit this file**), no canto superior direito do arquivo.
3. Altere o texto. Não apague aspas, vírgulas nem chaves; esses sinais são obrigatórios em arquivos JSON.
4. Para dados numéricos, troque `null` por um número sem aspas, por exemplo `"valor": 120.5`.

## Passo 8: salvar e publicar uma alteração

1. No canto superior direito, clique em **Commit changes...**.
2. Escreva uma mensagem clara, como `Atualiza óleo coletado em outubro`.
3. Deixe marcado **Commit directly to the main branch**.
4. Clique em **Commit changes**.

Neste momento, a alteração foi salva. A Vercel deve iniciar o deploy automaticamente.

## Passo 9: verificar se o deploy terminou corretamente

1. No painel da Vercel, abra o projeto `site-lixo-da-minha-casa`.
2. Na aba **Deployments**, veja a lista. O primeiro item é o mais recente.
3. Status **Ready** (ou "Completed") significa que deu certo. **Building** significa que ainda está em andamento. **Error** significa que houve falha.
4. Só depois de **Ready**, abra o endereço público e confira a alteração. Pode ser necessário atualizar a página (Ctrl+F5 no computador, ou fechar e abrir a aba).

## Passo 10: identificar e corrigir erros comuns

- **O deploy deu erro**: clique no deployment com falha e leia a mensagem. Se o problema for um arquivo JSON mal formatado, volte ao arquivo no GitHub e corrija a vírgula, a aspas ou a chave indicada, depois salve novamente.
- **A página não mudou**: confirme que o deploy está em **Ready** e atualize o navegador sem cache.
- **O mapa não aparece ou diz que os dados não carregaram**: confira se o JSON de `src/data` está válido. Use o script `validar-dados.js` no computador, se tiver Node.js instalado.
- **Ao abrir a página, aparece "Não foi possível carregar os dados"**: quase sempre é erro de nome de arquivo ou de pasta. Confira se os nomes de `src/data/` estão exatamente como no repositório (letras maiúsculas e minúsculas contam).
- **O site abriu sem estilo (sem cores)**: confira se a pasta `css` foi enviada e se o arquivo se chama `style.css`.

## Passo 11: voltar a uma versão anterior

Se uma alteração causar problemas:

1. No repositório do GitHub, clique em **Commits** (ou no número de commits, acima da lista de arquivos).
2. Encontre o commit da última versão que funcionava e clique nele.
3. Veja os arquivos alterados e anote o que precisa voltar.
4. Para desfazer um commit inteiro, a forma mais segura é editar o(s) arquivo(s) e colar o conteúdo anterior, salvando com nova mensagem. Assim você mantém o histórico.

Como alternativa, a Vercel permite promover um deployment anterior: na aba **Deployments**, abra uma versão que estava **Ready**, clique nos três pontinhos e escolha a opção de restaurar ou promover (**Promote to Production** ou **Redeploy**, conforme a tela).

---

## Alternativa: GitHub Pages

Se preferir não usar a Vercel, o GitHub Pages também publica arquivos estáticos:

1. No repositório, vá em **Settings > Pages**.
2. Em **Build and deployment**, em **Source**, escolha **Deploy from a branch**.
3. Em **Branch**, escolha `main` e a pasta `/ (root)`. Clique em **Save**.
4. Aguarde alguns minutos. O endereço aparecerá no topo da mesma página, no formato `https://seu-usuario.github.io/site-lixo-da-minha-casa/`.

Limitações: o GitHub Pages não tem o recurso de pré-visualização da Vercel e tem menos opções de reversão rápida. Como este site é totalmente estático, ambas as opções funcionam.

---

## Checklist antes de dizer que o site está no ar

- [ ] Repositório criado no GitHub.
- [ ] Arquivos enviados e visíveis na raiz do repositório.
- [ ] Projeto importado na Vercel (ou Pages configurado).
- [ ] Deploy com status **Ready**.
- [ ] Endereço público aberto e funcionando no celular e no computador.
- [ ] Mapa, guia, impacto e referências abrindo sem erro.

Enquanto algum item não estiver marcado, o site ainda não está publicado de forma concluída.
