/**
 * image-generator.js
 * Upload de imagem -> processamento via ComfyUI (workflow "change_background_v01_api.json")
 * -> polling de status -> retorno da URL da imagem final.
 */
(function (global) {
  "use strict";

  const WORKFLOW_NAME = "change_background_v01_api.json";

  let config = {
    baseApi: "https://dbdemo.dbpe.com.br/api",
    pollingIntervalMs: 2000,
    pollingTimeoutMs: 3 * 60 * 1000, // 3 minutos
  };

  function configure(newConfig) {
    config = { ...config, ...newConfig };
  }

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("workflow", WORKFLOW_NAME);

    const response = await fetch(`${config.baseApi}/uploadwithworkflow`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Falha no upload (HTTP ${response.status})`);
    }

    const data = await response.json();
    const jobId = data.request_id || data.job_id;

    if (!jobId) {
      throw new Error("ID do job não encontrado na resposta do servidor.");
    }

    return jobId;
  }

  async function getJobStatus(jobId) {
    const url = new URL(`${config.baseApi}/result`);
    url.searchParams.set("request_id", jobId);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Falha ao consultar status (HTTP ${response.status})`);
    }

    return response.json();
  }

  function pollJobStatus(jobId, onStatusChange) {
    return new Promise((resolve, reject) => {
      const startedAt = Date.now();

      const check = async () => {
        if (Date.now() - startedAt > config.pollingTimeoutMs) {
          reject(new Error("Tempo limite excedido aguardando o resultado."));
          return;
        }

        try {
          const data = await getJobStatus(jobId);

          switch (data.status) {
            case "queued":
              onStatusChange && onStatusChange("queued");
              break;
            case "processing":
              onStatusChange && onStatusChange("processing");
              break;
            case "error":
              reject(new Error(data.error || "Erro desconhecido no processamento."));
              return;
            case "done":
              onStatusChange && onStatusChange("done");
              if (!data.image_url) {
                reject(new Error("Job concluído, mas sem image_url."));
                return;
              }
              resolve(data.image_url);
              return;
            default:
              onStatusChange && onStatusChange(data.status || "unknown");
              break;
          }
        } catch (err) {
          onStatusChange && onStatusChange("polling_error");
          // não interrompe o polling em caso de erro transitório de rede
        }

        setTimeout(check, config.pollingIntervalMs);
      };

      check();
    });
  }

  async function generate(file, callbacks = {}) {
    const { onStatusChange, onDone, onError } = callbacks;

    try {
      onStatusChange && onStatusChange("uploading");
      const jobId = await uploadImage(file);

      const imageUrl = await pollJobStatus(jobId, onStatusChange);

      onDone && onDone(imageUrl);
      return imageUrl;
    } catch (err) {
      onError && onError(err);
      throw err;
    }
  }

  async function downloadImage(imageUrl, filename) {
    const response = await fetch(imageUrl, {
      mode: "cors",
      headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
    });
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const randomInt = Math.floor(Math.random() * 90000) + 10000;
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename || `${randomInt}_db_IA.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }

  global.ImageGenerator = {
    configure,
    uploadImage,
    getJobStatus,
    pollJobStatus,
    generate,
    downloadImage,
  };
})(window);
