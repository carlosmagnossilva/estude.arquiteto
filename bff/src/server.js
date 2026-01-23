const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(express.json());





app.get("/health", (req, res) => res.json({ ok: true }));


app.get("/bff/paradas", (req, res) => {
  return res.json({
    items: [
      {
        paradaId: 38,
        sigla: "PDP",
        embarcacao: "P. Paredes",
        coletores: [100],
        escopo: "Mob+PE+Man+DD",
        inicioRP: "30/09/25",
        terminoRP: "12/01/26",
        deltaInicio: 1,
        durRP: 105,
        durOrc: 92,
        deltaDurOrc: 13,
        durPlan: 120,
        fel: "FEL-3",
        statusParada: "Concluida",
        heroImageKey: "parcel-das-paredes"
      },
      {
        paradaId: 82,
        sigla: "PDT",
        embarcacao: "P. Timbebas",
        coletores: [100],
        escopo: "Mob+PE+Man+DD",
        inicioRP: "06/11/25",
        terminoRP: "09/02/26",
        deltaInicio: 36,
        durRP: 96,
        durOrc: 92,
        deltaDurOrc: 4,
        durPlan: 96,
        fel: "FEL-3",
        statusParada: "Execucao",
        heroImageKey: "parcel-das-timbebas"
      },
      {
        paradaId: 160,
        sigla: "PDR",
        embarcacao: "P. Reis",
        coletores: [100, 103],
        escopo: "Mob+Man",
        inicioRP: "24/11/25",
        terminoRP: "12/01/26",
        deltaInicio: 0,
        durRP: 50,
        durOrc: null,
        deltaDurOrc: null,
        durPlan: 48,
        fel: "FEL-3",
        statusParada: "Concluida",
        heroImageKey: "parcel-dos-reis"
      },
      {
        paradaId: 83,
        sigla: "PDB",
        embarcacao: "P. Bandolim",
        coletores: [100],
        escopo: "Mob+PE+Man+DD",
        inicioRP: "12/12/25",
        terminoRP: "25/02/26",
        deltaInicio: 0,
        durRP: 76,
        durOrc: null,
        deltaDurOrc: null,
        durPlan: 76,
        fel: "FEL-3",
        statusParada: "Execucao",
        heroImageKey: "parcel-do-bandolim"
      },
      {
        paradaId: 259,
        sigla: "RPA",
        embarcacao: "R. São Paulo",
        coletores: [100],
        escopo: "Mob",
        inicioRP: "27/12/25",
        terminoRP: "18/01/26",
        deltaInicio: 0,
        durRP: 23,
        durOrc: null,
        deltaDurOrc: null,
        durPlan: 23,
        fel: "FEL-3",
        statusParada: "Concluida",
        heroImageKey: "rochedo-de-sao-paulo"
      },
      {
        paradaId: 33,
        sigla: "PDM",
        embarcacao: "P. Meros",
        coletores: [100],
        escopo: "Mob+PE+Man+DD",
        inicioRP: "15/01/26",
        terminoRP: "05/04/26",
        deltaInicio: 442,
        durRP: 81,
        durOrc: 19,
        deltaDurOrc: 62,
        durPlan: 81,
        fel: "FEL-2",
        statusParada: "Execucao",
        heroImageKey: "parcel-dos-meros"
      },
      {
        paradaId: 207,
        sigla: "RPE",
        embarcacao: "R. São Pedro",
        coletores: [100, 103],
        escopo: "Mob+Man",
        inicioRP: "19/01/26",
        terminoRP: "15/02/26",
        deltaInicio: 0,
        durRP: 28,
        durOrc: null,
        deltaDurOrc: null,
        durPlan: 28,
        fel: "FEL-2",
        statusParada: "Execucao",
        heroImageKey: "rochedo-sao-pedro"
      },
      {
        paradaId: 260,
        sigla: "PFT",
        embarcacao: "P. Feiticeiras",
        coletores: [102],
        escopo: "UWS",
        inicioRP: "28/01/26",
        terminoRP: "01/02/26",
        deltaInicio: 0,
        durRP: 5,
        durOrc: null,
        deltaDurOrc: null,
        durPlan: 5,
        fel: "FEL-2",
        statusParada: "Backlog",
        heroImageKey: "parcel-das-feiticeiras"
      }
    ]
  });
});






app.get("/bff/updates", (req, res) => {
  
  return res.json({
    groups: [
      {
        dateLabel: "26 de Novembro de 2025",
        items: [
          {
            title: "Serviço Atualizado",
            meta: "029 | A. Abrolhos | FEL-2",
            text: "Foi adicionado 2 materiais vinculados a linha de serviço.",
            user: "Daniel Santos",
            time: "11:15"
          },
          {
            title: "Parada Cancelada",
            meta: "033 | I. São sebastião | FEL 1",
            text: "Justificativa anexada",
            user: "Leonardo Silva",
            time: "09:09"
          }
        ]
      },
      {
        dateLabel: "25 de Novembro de 2025",
        items: [
          {
            title: "Nova GMUD aberta",
            meta: "026 | P. dos Reis | FEL-4",
            text: "Foi adicionado 2 materiais vinculados a linha de serviço.",
            user: "Guilherme Abreu",
            time: "11:15"
          }
        ]
      },
      {
          dateLabel: "Para mim",
          items: [
            {
              title: "Pendência atribuída",
              meta: "160 | P. dos Reis | FEL-4",
              text: "Você foi mencionado em uma atualização.",
              user: "Sistema",
              time: "08:40"
            }
          ]
        }
    ]
  });
});



const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`BFF on http://localhost:${port}`));
