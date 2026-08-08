# Asfalto Livre · Poggers Skate Crew

**A rua é nossa escola. O skate é nossa língua.**

Projeto cultural de skate da **Poggers Skate Crew**, Monte Belo, MG — desde 2022. O Asfalto Livre existe pra documentar, inspirar e fortalecer a cena do skate na cidade, usando o esporte como ferramenta de cultura e transformação.

---

## Sobre o projeto

A Poggers Skate Crew nasceu em 2022 em Monte Belo, MG. Começamos andando nos picos que a cidade tinha — a Estação Rodoviária, o Estacionamento da Prefeitura e a Quadrinha na Praça de Esportes. Com o tempo, a falta de estrutura local nos empurrou pra evoluir fora: passamos a frequentar cidades vizinhas como Muzambinho e Alfenas, onde rolam sessões na Emize Skate Park e na pista de skate local.

Sem obstáculos e sem espaço adequado, a solução foi construir com as próprias mãos. Com esforço próprio e doações, montamos obstáculos que usamos principalmente na Quadrinha. Hoje somos **16 membros** unidos pela mesma vibe.

### Missão

> Usar o skate como ferramenta de cultura e transformação em Monte Belo. Queremos visibilidade, investimento e espaço — pra que todo rolo da cidade tenha onde evoluir.

### Site

O site funciona como **vitrine do coletivo**: landing page com galeria dinâmica, agenda de eventos, canais de contato e formas de apoiar o projeto. As mídias são servidas via Cloudflare R2 e listadas automaticamente por um Cloudflare Worker.

---

## Funcionalidades

| Página | Descrição |
|--------|-----------|
| **`/` (LP)** | Hero, sobre, CTA pra galeria, Instagram, eventos, apoio, contato |
| **`/midias.html`** | Galeria dinâmica em grid com filtros (Todas / Fotos / Vídeos), lightbox com player customizado |

### Galeria Dinâmica

A galeria busca mídias automaticamente via Cloudflare Worker que lista objetos do bucket R2. Novas mídias aparecem sem deploy — basta upload no R2.

- **Grid responsivo**: 3 colunas desktop, 2 tablet, 1 mobile
- **Filtros**: Todas, Fotos, Vídeos
- **Lightbox**: player customizado com play/pause, mute, volume, seek, fullscreen

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| **Markup** | HTML5 semântico, ARIA |
| **Estilos** | CSS puro com custom properties, Grid |
| **Script** | JavaScript vanilla (ES modules) |
| **Build** | Vite (multi-page) |
| **Armazenamento** | Cloudflare R2 (vídeos + imagens) |
| **API** | Cloudflare Worker (listing do bucket) |
| **Deploy** | Vercel (estático) |
| **Fontes** | Bebas Neue, DM Sans, Space Mono (Google Fonts) |

---

## Estrutura do projeto

```
poggers-skate-crew/
├── index.html                    # Landing page
├── midias.html                   # Galeria dinâmica
├── vite.config.js                # Build multi-page
├── src/
│   ├── main.js                   # Entry point (LP)
│   ├── gallery.js                # Entry point (galeria)
│   ├── components/
│   │   ├── Carousel.js           # Carrossel (não usado na LP atual)
│   │   ├── LazyVideo.js          # IntersectionObserver pra vídeos
│   │   ├── Lightbox.js           # Lightbox reutilizável
│   │   └── VideoPlayer.js        # Player customizado
│   └── styles/
│       ├── base.css              # Reset, variáveis, tipografia
│       ├── nav.css               # Header
│       ├── hero.css              # Hero
│       ├── gallery.css           # Grid + filtros da galeria
│       ├── lightbox.css          # Lightbox/player
│       ├── sections.css          # Sobre, Instagram, Eventos, etc.
│       └── media.css             # Responsive breakpoints
├── worker/
│   ├── index.js                  # Cloudflare Worker (listing R2)
│   └── wrangler.toml             # Config do Worker
└── public/
    ├── media.json                # Manifest de mídias (fallback)
    ├── sitemap.xml
    └── robots.txt
```

---

## Como adicionar mídias (vídeos e fotos)

### Fluxo rápido

1. Upload do arquivo no R2 (dashboard ou CLI)
2. Upload da thumbnail (se for vídeo)
3. Pronto — galeria atualiza automaticamente

### 1. Upload no R2

Acesse o dashboard Cloudflare → R2 → bucket `poggers-media` → Upload

| Tipo | Pasta no R2 | Formato |
|------|-------------|---------|
| Vídeo | `videos/` | `.mp4` |
| Imagem | `images/` | `.webp` (recomendado), `.jpg`, `.png` |
| Thumbnail | `thumbs/` | `.webp` 320x180 |

**Nome do arquivo**: usar snake_case (ex: `victor_kickflip.mp4`)

### 2. Gerar thumbnail (para vídeos)

Use `ffmpeg` pra extrair frame no 1 segundo e converter pra WebP 320x180:

```bash
# Extrair frame no 1s, redimensionar pra 320px de largura, salvar como WebP
ffmpeg -i video.mp4 -ss 00:00:01 -vframes 1 -vf "scale=320:-1" -q:v 5 thumb.webp
```

**Exemplo completo:**

```bash
# Gerar thumbnail a partir do vídeo
ffmpeg -i victor_kickflip.mp4 -ss 00:00:01 -vframes 1 \
  -vf "scale=320:-1" -q:v 5 victor_kickflip.webp

# Upload da thumbnail pro R2 (pasta thumbs/)
# Via dashboard: upload victor_kickflip.webp → pasta thumbs/
# Via Wrangler CLI:
npx wrangler r2 object put poggers-media/thumbs/victor_kickflip.webp \
  --file=victor_kickflip.webp --content-type="image/webp"
```

**Script pra gerar todas as thumbnails de uma pasta:**

```bash
# Gerar thumbnails de todos os vídeos numa pasta
for f in *.mp4; do
  name="${f%.mp4}"
  ffmpeg -i "$f" -ss 00:00:01 -vframes 1 -vf "scale=320:-1" -q:v 5 "${name}.webp"
done
```

### 3. Verificar

Acesse `poggers-skate-crew.vercel.app/midias.html` — a nova mídia deve aparecer automaticamente.

> **Nota**: O Worker usa cache de 5 minutos. Pra ver imediatamente, adicione `?t=1` na URL da galeria ou abra em aba anônima.

---

## Como rodar localmente

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento (com HMR)
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

---

## Cloudflare Worker

O Worker `poggers-media-api` lista objetos do bucket R2 e retorna como JSON.

**URL de produção:** `https://poggers-media-api.abuvitordiego-contato.workers.dev/api/media`

**Deploy do Worker:**

```bash
cd worker
CLOUDFLARE_API_TOKEN=<token> npx wrangler deploy
```

Ou via API REST (ver `worker/deploy.mjs`).

---

## Custos

| Serviço | Free Tier | Uso estimado |
|---------|-----------|-------------|
| Vercel | 100GB bandwidth | Landing page estática |
| Cloudflare R2 | 10GB storage + 10M reads/mês | ~120MB storage, ~k reads/mês |
| Cloudflare Workers | 100k req/dá | ~1k req/dá |
| **Total** | **$0/mês** | — |

---

## Como apoiar

### PIX
Chave: `f85cb6cc-80df-41ae-b257-67eb56ffc182`
Titular: Diego Antônio Bueno Vitor - PicPay

### Vakinha Online
Meta atual: R$ 1.500 — Quarter Pipe (rampa pro espaço comunitário)
[Contribuir na Vakinha](https://www.vakinha.com.br/vaquinha/quarter-rampa-de-skate)

---

## Contato

- **Instagram**: [@poggers_sk8](https://instagram.com/poggers_sk8)
- **WhatsApp**: [Grupo da Poggers Skate Crew](https://chat.whatsapp.com/H1VoSoDyt007YdN5I4uRdE)

Encontros abertos todo **2º sábado do mês às 15h** na Quadrinha — Praça de Esportes, Monte Belo, MG.

---

## Licença

MIT © Poggers Skate Crew
