const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(express.json());





app.get("/health", (req, res) => res.json({ ok: true }));




app.get("/bff/updates", (req, res) => {
  const tab = (req.query.tab || "geral").toLowerCase();

  if (tab === "minhas") {
    return res.json({
      groups: [
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
  }

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
      }
    ]
  });
});



const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`BFF on http://localhost:${port}`));
