# image-generator.js — Upload + Polling + Resultado (HTML/JS puro)

Extraído do fluxo React (`home/index.tsx` + `result/index.tsx`) do projeto `comfyui_demo`, adaptado para
funcionar sem build step, fixando o workflow em `change_background_v01_api.json`.

## Como funciona (visão geral)

```
[usuário seleciona imagem]
        |
        v
POST {baseApi}/uploadwithworkflow   (multipart/form-data: image + workflow)
        |
        v
resposta: { request_id }  -> guardamos o jobId
        |
        v
loop: GET {baseApi}/result?request_id=...   (a cada 2s, configurável)
        |
        +--> status "queued"      -> continua o loop
        +--> status "processing"  -> continua o loop
        +--> status "error"       -> rejeita com a mensagem de erro
        +--> status "done"        -> resolve com image_url
        |
        v
[imagem final disponível em image_url]
```

Não existe WebSocket nem SSE nessa etapa do frontend — é *polling* simples baseado em `setTimeout`.
O backend é quem conversa com o ComfyUI e atualiza um status em Redis; o frontend só pergunta
"terminou?" de tempos em tempos.

## Endpoints usados

| Ação            | Método | Rota                       | Payload                                   | Resposta relevante                          |
|-----------------|--------|----------------------------|--------------------------------------------|----------------------------------------------|
| Enviar imagem   | POST   | `/uploadwithworkflow`      | `FormData{ image: File, workflow: string }`| `{ request_id }`                              |
| Checar status   | GET    | `/result?request_id=...`   | —                                           | `{ status, image_url?, error? }`             |

`status` pode ser: `queued`, `processing`, `error`, `done` (qualquer outro valor é tratado como
"status desconhecido", e o polling continua).

O `workflow` é sempre `"change_background_v01_api.json"` neste projeto simplificado — no projeto
React original esse valor varia conforme o card do carrossel selecionado; aqui removemos essa
escolha porque só existe um workflow.

## Arquivo: `image-generator.js`

Expõe um objeto global `ImageGenerator` com:

- `configure({ baseApi, pollingIntervalMs, pollingTimeoutMs })`
  Ajusta a URL base do backend e os tempos de polling. Chame antes de usar o restante.

- `generate(file, { onStatusChange, onDone, onError })`
  Fluxo completo: faz upload, faz polling, e resolve com a `image_url` final.
  É a função que você normalmente vai chamar.

- `uploadImage(file)` — só o upload, retorna o `jobId`.
- `getJobStatus(jobId)` — só uma consulta de status (sem loop).
- `pollJobStatus(jobId, onStatusChange)` — só o loop de polling a partir de um `jobId` já existente.
- `downloadImage(imageUrl, filename?)` — baixa a imagem final forçando o download no navegador
  (equivalente ao botão "Baixar" da página de resultado original).

## Exemplo de uso (HTML puro)

```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8" />
  <title>Gerador de Imagem</title>
</head>
<body>
  <input type="file" id="file-input" accept="image/*" />
  <button id="btn-gerar">Gerar</button>
  <p id="status"></p>
  <img id="resultado" style="max-width: 400px; display: none;" />
  <button id="btn-download" style="display: none;">Baixar</button>

  <script src="image-generator.js"></script>
  <script>
    ImageGenerator.configure({
      baseApi: "https://dbdemo.dbpe.com.br/api", // troque pela URL do seu backend
    });

    const fileInput = document.getElementById("file-input");
    const statusEl = document.getElementById("status");
    const imgEl = document.getElementById("resultado");
    const btnDownload = document.getElementById("btn-download");

    let lastImageUrl = null;

    document.getElementById("btn-gerar").addEventListener("click", async () => {
      const file = fileInput.files[0];
      if (!file) {
        alert("Selecione uma imagem primeiro.");
        return;
      }

      statusEl.textContent = "Enviando...";
      imgEl.style.display = "none";
      btnDownload.style.display = "none";

      try {
        const imageUrl = await ImageGenerator.generate(file, {
          onStatusChange: (status) => {
            const textos = {
              uploading: "Enviando imagem...",
              queued: "Na fila. Aguardando início do processamento...",
              processing: "Processando imagem...",
              done: "Imagem pronta!",
            };
            statusEl.textContent = textos[status] || `Status: ${status}`;
          },
        });

        lastImageUrl = imageUrl;
        imgEl.src = imageUrl;
        imgEl.style.display = "block";
        btnDownload.style.display = "inline-block";
      } catch (err) {
        statusEl.textContent = "Erro: " + err.message;
      }
    });

    btnDownload.addEventListener("click", () => {
      if (lastImageUrl) ImageGenerator.downloadImage(lastImageUrl);
    });
  </script>
</body>
</html>
```

## Detalhes que valem lembrar

- **`baseApi`** deve ser a raiz da API (ex.: `https://dbdemo.dbpe.com.br/api`), sem barra final.
- O **workflow é fixo** (`change_background_v01_api.json`) — não precisa expor essa escolha na UI.
- O **timeout padrão** do polling é 3 minutos (`pollingTimeoutMs`); ajuste via `configure()` se o
  processamento do seu workflow for mais lento.
- Erros de rede durante o polling **não interrompem o loop** — só um `status: "error"` retornado
  pelo backend interrompe (rejeita a Promise). Isso evita que uma falha de rede pontual aborte o
  processo.
- `downloadImage` cria um link temporário (`<a download>`) e libera a `blob:` URL depois do clique,
  igual ao comportamento da página de resultado original.
- Se quiser também um botão de "Compartilhar" (Web Share API), o padrão é o mesmo: `fetch(imageUrl)`
  → `blob` → `new File([blob], ...)` → `navigator.share({ files: [file] })`, só funciona em
  navegadores/contexto que suportam `canShare` com arquivos (normalmente mobile, HTTPS).
