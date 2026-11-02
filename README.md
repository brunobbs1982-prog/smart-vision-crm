# SMART V.I.S.I.O.N. CRM v4.0 — Completo

CRM B2B + Agente Autônomo Multi-Canal · export estático (GitHub Pages).

## Início rápido

```bash
cd smart-vision-crm
npm install
npm run dev
```

1. Abre `/setup` → wizard de instalação (cria admin)
2. Use o funil, tarefas, conectores, agente, backup

## Módulos

| Módulo | Status |
|--------|--------|
| Wizard instalação + admin | ✅ |
| Login / logout | ✅ |
| Usuários (criar equipe) | ✅ |
| Dashboard + KPIs | ✅ |
| Funil Kanban 6 etapas + forecast | ✅ |
| Ficha conta (CRUD, excluir) | ✅ |
| Tarefas + atalhos + 3 filas | ✅ |
| Contatos + diretório | ✅ |
| Histórico de interações | ✅ |
| Script Assistant (SPIN/JOLT/Jarvis/FUP) | ✅ |
| Catálogo de produtos | ✅ |
| Insights + regras KB Ciamakers | ✅ |
| Hand-off do agente | ✅ |
| Conectores + wizard canal | ✅ |
| Ciclo do agente | ✅ |
| Toasts de feedback | ✅ |
| Central de Produção (export/import JSON + smart merge) | ✅ |
| Backend FastAPI opcional | ✅ |
| GitHub Pages (`out/`) | ✅ |

## Backup / dados

- Persistência local: chave `ciamakers_crm_official_prod_db`
- Botão **Backup** no topo → export/import JSON (Zero Data Loss / smart merge)
- Deploy de código **não** apaga o localStorage do usuário

## Publicar (GitHub Pages)

```bash
npm run build   # gera out/
```

Settings → Pages → GitHub Actions (workflow incluso).  
Se project page: variável `BASE_PATH=/nome-do-repo`.

## Backend opcional

```bash
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
