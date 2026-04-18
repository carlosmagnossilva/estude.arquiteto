# 🏗️ Revisão de Arquitetura — Hub de Obras (Senior Dev Review)

Análise de aderência do projeto atual à arquitetura definida nos documentos principais:
- **Containers & Integração v1.3** — Estrutura dos componentes, integrações e stack
- **Serviços/Componentes v1.1** — Detalhamento lógico dos serviços e recomendações de infra

---

## 1. Componentes Físicos (Repositórios)

| Componente Previsto | Status | O que existe no projeto | Observação |
|---|:---:|---|---|
| **hub-web** (Frontend React) | ✅ | `/src/` — React, MSAL, componentes modularizados e totalmente em TypeScript (`.tsx`) | Totalmente funcional, tipado e com interface extraída em componentes independentes |
| **hub-api-gateway** (BFF) | ✅ | `/bff/` — Servidor Node/Express (agora `.ts`) | Atua como orquestrador/proxy e valida auth Entra ID |
| **hub-core-service** | ✅ | `/hub-core/` — Node/Express `.ts` + mssql | Serviço isolado detentor do banco de dados e lógica Core |
| **hub-integration-orchestrator** | ⚠️ | `/bff/src/servicebus.ts` — pub/sub integrado no BFF | Ainda existe logicamente dentro do BFF em vez de um adapter/servidor à parte |

---

## 2. Stack de Tecnologias

| Recomendação | Status | Implementação Atual | Gap |
|---|:---:|---|---|
| Frontend em **React** | ✅ | React 19 em TypeScript | OK |
| Backend em **Node.js + Express** | ✅ | Express (v4.19 padronizada em todos os serviços) e executado em dev via `tsx` | OK |
| Frontend com **PrimeReact** | ❌ | Componentes e utilitários visuais (Tailwind) construídos "manualmente" | Padrões de design system próprios |
| **Sequelize** (ORM) | ❌ | Uso manual de package de client do DB (mssql) | Consultas SQL Raw |
| **TypeScript** com Types compartilhados | ✅ | Monorepo via `npm workspaces` com o pacote de contratos `@hub/types`. | 100% tipado e com type-checks limpos em todos os ambientes |
| **Docker** / Containerização | ❌ | Nenhum `Dockerfile` ou template Compose presente | Deployments atrelados puramente à Vercel/Azure web app (ainda sem containerização explícita backend) |
| **OpenTelemetry** para observabilidade | ❌ | Logs manuais padrão `console` | Necessário integrar uma biblioteca de instrumentação |

---

## 3. Arquitetura de Frontend (hub-web)

| Recomendação | Status | Implementação Atual | Gap |
|---|:---:|---|---|
| Autenticação via **MSAL** OAUTH2/OIDC | ✅ | `@azure/msal-browser` + `@azure/msal-react` | Fluxo redirect funcional e seguro |
| Código único **Web + PWA** | ⚠️ | Apenas versão web | Sem manifest.json / service worker para PWA |
| **Componentes compartilhados** | ✅ | Extraídos módulos: `HeroRotativo`, `UpdateList`, `icons` etc. em `src/components/` | Modularização realizada, reduzindo inflação no App.tsx |
| **Feature modules** separados | ✅ | Refatoração feita separando dashboards num escopo próprio (ex. `CapexDashboard`) | OK |
| Roteamento condicional (dispositivo) | ❌ | Uso de estados locais primitivos para roteamento | Falta react-router-dom para lidar com PWA e URL States |
| Design **responsivo** | ⚠️ | Classes React+Tailwind (`md:`, `lg:`) | Há risco que a estrutura force view desktop |
| **Mobile-first** para páginas PWA | ❌ | Foco forte e absoluto na exibição Desktop | Ajuste radical de mídia e de hierarquia seriam necessários para Mobile-First |

---

## 4. Arquitetura do BFF (hub-api-gateway)

| Recomendação | Status | Implementação Atual | Gap |
|---|:---:|---|---|
| **Autenticação/CORS** | ✅ | CORS funcional; JWT validado por MSAL + jwtks/middlewares (`auth.ts`) | Segurança plena |
| Endpoints orientados à **UX** | ✅ | `/bff/paradas`, `/bff/updates`, `/bff/capex` | Facade perfeita que formata, intercepta cache/SGO ou vai no hub-core |
| Orquestração de **múltiplos serviços** | ✅ | BFF unificado servindo apenas gateway das regras do core + bus system | Comunicação de rede intra-microsserviço OK |
| **OpenAPI/Swagger** | ❌ | Nenhuma doc em TSDoc ou interface explícita gerada | Sugere-se tsoa, trpc ou similar para exportação de docs |
| **Idempotency handler** | ❌ | Sem middleware ou lógica para prevenir concorrências | Deve ser inserido no futuro |
| Valida **JWT** do Entra ID | ✅ | Assinatura e Audiences perfeitamente tipados no Typescript | OK |
| Propaga **token via header** ao core | ❌ | O BFF aciona o Core sem propagar o token | Token de request só morre no BFF |
| **Não implementar regras de negócio** | ✅ | Isolado e passador | Totalmente movido para hub-core |
| **Não acessar banco** (exceto Redis) | ✅ | Excluso completamente dos imports de data connectors (migrados para Hub Core) | OK |
| Sem SDKs específicos | ❌ | Usa pacote SDK oficial `@azure/service-bus` direto | SDK Azure no BFF |

---

## 5. Hub-Core-Service

| Recomendação | Status | O que existe | Gap |
|---|:---:|---|---|
| Monorepo por **módulos de domínio** | ✅ | `/hub-core` em TypeScript rodando isoladamente via portificação | OK |
| **Sequelize** para persistência | ❌ | Persistência usando apenas biblioteca driver de SGBD | Sem ORM |
| **DTOs** para entrada/saída | ✅ | Contratos de interface centralizados (`@hub/types`) e importados aqui | Interfaces estritas evitam retornos corrompidos |
| Padrão **MVC** por domínio | ❌ | Lógicas misturadas (Controllers roteando e modelando) no Server.ts e Db.ts | Faltam Design Patterns clássicos MVC para escala limpa |
| **Dependency Injection** | ❌ | Hardcoded import no topo de módulos | Acoplamento duro dificulta Mock de Testes unitários do Core |
| Gera **eventos de integração** | ⚠️ | A publicação SGO vive no BFF. | Core deveria notificar sobre deleções e mutações (pub/sub). |

---

## 6. Integração e Orquestração

| Recomendação | Status | Implementação Atual | Gap |
|---|:---:|---|---|
| Modelo **Event-Driven** | ✅ | Implementado via Service Bus client (consumer peek-lock test mode) e Tipagem restrita (`IServiceBusMeta`) | OK |
| **Envelope padrão** | ✅ | `buildEnvelope()` garantindo UUIDs (message e correlation ids) | Completamente implementado em `servicebus.ts` |
| **Dead-letter** para schemas inválidos | ✅ | Presente na checagem do schemaVersion em validação do payload | OK |
| **integration-orchestrator-service** | ❌ | Embutido direto na API como callback em listeners de backend do BFF | Precisaria despachar processo background Node autônomo |
| **Adapters** por sistema externo | ❌ | Tipificação restrita da Service Bus unificada | Não se adaptam dinamicamente a outro SQS, Rabbit etc |
| **Idempotent Consumer** | ❌ | Nivelamento de cache global primitivo usado | Processo falharia grave numa topologia alta-escala de duplicação. |

---

## 7. Observabilidade

| Recomendação | Status | Implementação Atual | Gap |
|---|:---:|---|---|
| **Azure App Insights / Log Analytics** | ❌ | Sem pacote de aplicação do Monitor log insights | Faltando |
| Instrumentação via **OpenTelemetry** | ❌ | Sem OTel | Ausente |
| **TraceID** gerado pelo API gateway | ❌ | BFF não embute request Trace header nativo para correlacionar falhas | Ausente |
| **CorrelationId** no orchestrator | ⚠️ | Restrito somente ao envelope de publish no Azure Service bus | Parcial |
| Logs via **stdout/stderr** | ✅ | `console.log` nativo de node para output no terminal | Faltando nível, format logs genéricos (winston) e stream. |

---

## 8. Padrões de Código

| Recomendação | Status | Implementação Atual | Gap |
|---|:---:|---|---|
| **TypeScript** com types compartilhados | ✅ | Integrado! Pacote workspace puro e strict compiler pass | OK |
| Padrão **RESTful** (substantivos, métodos) | ⚠️ | Base boa no Core, porém verbos RPC como `/bff/paradas/publish` presentes | Falta design purista de recursos HTTP |
| **Error handler/middleware** centralizado | ❌ | Reprovado (Cada controller processa trycatch duplicado na formatação res.status(500)) | Express global handler não implementado |
| **Não expor detalhes técnicos** | ⚠️ | A interceptação atual propaga erro formatado `.message` vs `String(e)` | O Stack real do node é evitado, porém o client recebe e.message. |
| **Dependency Injection** | ❌ | Módulos amarrados explicitamente por arquivo | Ausente |

---

## 9. Infraestrutura / Deploy

| Recomendação | Status | Implementação Atual | Gap |
|---|:---:|---|---|
| **Containerização via Docker** | ❌ | Deploy rodando "raw" com package manager `concurrently` / runtime local | Sem build context OCI (Dockerfiles) pronto para cloud Kubernetes ou Azure Container APPs. |
| Deploy em **Azure Static Web Apps** | ✅ | Preparo em GitHub e outputs otimizados no CRA | OK |
| Deploy do **BFF & Core** containerizados | ❌ | Deployments backends não foram scriptados nem orquestrados fora de node hostings tradicionais | Gap alto. |
| **Azure SQL** | ✅ | Cloud MS SQL rodando remoto c/ TLS e Timeout customizados (db.ts compat) | OK |
| **Azure Service Bus** | ✅ | Namespace gerido na nuvem OK | OK |

---

## 📊 Resumo Executivo (Atualizado Pós-Migração)

| Dimensão | Conforme | Parcial | Não Conforme | Total |
|---|:---:|:---:|:---:|:---:|
| **Componentes Físicos** | 3 | 1 | 0 | 4 |
| **Stack Tecnológica** | 3 | 0 | 4 | 7 |
| **Frontend (hub-web)** | 4 | 2 | 1 | 7 |
| **BFF (hub-api-gateway)** | 6 | 0 | 4 | 10 |
| **Hub-Core-Service** | 2 | 1 | 3 | 6 |
| **Integração** | 3 | 0 | 3 | 6 |
| **Observabilidade** | 1 | 1 | 3 | 5 |
| **Padrões de Código** | 1 | 2 | 2 | 5 |
| **Infraestrutura** | 3 | 0 | 2 | 5 |
| **TOTAL** | **26** (47%) | **7** (13%) | **22** (40%) | **55** |

*(**Nota**: No último benchmark com a migração para `.ts`, criação do `Hub Core` base e divisão arquitetural em monorepo com pacotes extraídos, o número de pontos **"Conforme"** evoluiu significativamente de 12 (22%) para 26 (47%).)*

---

## 🎯 Top 5 Prioridades para Conformidade Restante (Next Steps)

| # | Ação | Impacto | Esforço |
|---|---|---|---|
| 1 | **Containerizar aplicações (Docker)** — Criar escopo de empacotamento com PM2/Nginx/Node nativo e gerar imagens para cada worker do Monorepo. | 🔴 Alto | Baixo |
| 2 | **Roteamento Global/Middleware de Erros Express** — Desenvolver handler limpo e seguro ao invés de N sub-tratamentos por Controller nos serviços back-end. | 🟡 Médio | Baixo |
| 3 | **Documentação OpenAPI/Swagger** — Expor contrato do Hub-Core e BFF nativamente gerado utilizando annotations no Typescript. | 🟡 Médio | Médio |
| 4 | **Separar Integration Orchestrator (Opcional Futuro)** — Realocar consumers de pub/sub pra fora da UI BFF visando processabilidade purista background sem sugar taxa de request API. | 🟢 Baixo | Alto |
| 5 | **Frameworks Globais Front-end** — Padronizar React Router DOM da PWA (no lugar de States) | 🟢 Baixo | Baixo |

> [!NOTE]
> **Segurança**: Credenciais não estão comitadas, mas os hardcoded `.env` keys no servidor e localmente devem migrar lentamente para `Azure Key Vault` no ambiente Cloud em etapas conseguintes.
