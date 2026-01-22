// App.js
import React, { useEffect, useState } from "react";
import heroImg from "./assets/parcel-dos-reis.jpg";
import logoOPC from "./assets/logo.png";
import { useBff } from "./hooks/useBff";

function IconHome(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12 3.1 3 10.2v10.7h6.3v-6.2h5.4v6.2H21V10.2L12 3.1zm7 16.8h-2.3v-6.2H7.3v6.2H5V11.1l7-5.5 7 5.5v8.8z"
      />
    </svg>
  );
}

function IconMoney(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.7-12.4V7h-1.4v.7c-1.4.3-2.4 1.2-2.4 2.5 0 1.6 1.3 2.2 2.7 2.5 1.2.3 1.8.6 1.8 1.2 0 .6-.6 1-1.6 1-1.1 0-1.8-.4-2.2-1.3l-1.3.5c.4 1.2 1.4 1.9 3 2.1V17h1.4v-.8c1.6-.3 2.6-1.3 2.6-2.6 0-1.6-1.2-2.2-2.8-2.6-1.1-.3-1.7-.6-1.7-1.1 0-.5.5-.9 1.4-.9.9 0 1.5.3 1.9 1l1.2-.6c-.4-.8-1.2-1.4-2.3-1.6z"
      />
    </svg>
  );
}

function IconGrid(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
      />
    </svg>
  );
}

function IconDoc(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 1.8V8h4.2L14 3.8zM6 11h12v1.8H6V11zm0 4h12v1.8H6V15zm0-8h6v1.8H6V7z"
      />
    </svg>
  );
}

function IconBell(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5-6.7V3a2 2 0 1 0-4 0v1.3A7 7 0 0 0 5 11v5l-2 2v1h20v-1l-2-2zM7 16v-5a5 5 0 1 1 10 0v5H7z"
      />
    </svg>
  );
}

function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"
      />
    </svg>
  );
}

function IconGear(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M19.4 13a7.8 7.8 0 0 0 .1-1l2-1.6-2-3.5-2.5 1a7.7 7.7 0 0 0-1.7-1l-.4-2.7H10l-.4 2.7c-.6.3-1.2.6-1.7 1l-2.5-1-2 3.5 2 1.6a7.8 7.8 0 0 0 .1 1 7.8 7.8 0 0 0-.1 1l-2 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1l.4 2.7h4.1l.4-2.7c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5-2-1.6a7.8 7.8 0 0 0-.1-1zM12 16.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9z"
      />
    </svg>
  );
}

function IconUser(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5z"
      />
    </svg>
  );
}

function IconExit(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M10 17v-2h4v-6h-4V7l-5 5 5 5zm9-14H11v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
      />
    </svg>
  );
}

// Pin (enabled)
function IconPinEnabled(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 3l7 7-3 3v3.5L13.5 21H10v-3.5L5.5 13H2.5l3-3 1-6h7.5z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M10 17.5l-6 6"
      />
    </svg>
  );
}

// Pin (disabled) = mesmo pin com “slash”
function IconPinDisabled(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 3l7 7-3 3v3.5L13.5 21H10v-3.5L5.5 13H2.5l3-3 1-6h7.5z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M10 17.5l-6 6"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M4 4l16 16"
      />
    </svg>
  );
}


function Badge({ children }) {
  return <span className="badge">{children}</span>;
}

function UpdateCard({ title, meta, text, user, time }) {
  return (
    <div className="uCard">
      <div className="uCardTop">
        <div className="uIcon" aria-hidden="true">⟲</div>
        <div className="uMain">
          <div className="uTitle">{title}</div>
          <div className="uMeta">{meta}</div>
        </div>
        <div className="uTime">{time}</div>
      </div>
      <div className="uText">{text}</div>
      <div className="uUser">
        <div className="avatar" aria-hidden="true" />
        <div className="uUserName">{user}</div>
      </div>
    </div>
  );
}


export default function App() {
    const [updatesTab, setUpdatesTab] = useState("geral"); // default: geral
    const [pinned, setPinned] = useState(false);


  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">

          <img className="brandLogo" src={logoOPC} alt="OceanPact" />
          <div className="brandText">OceanPact</div>
        </div>

        <nav className="menu">
          <a className="menuItem active" href="#"><IconHome /> <span>Início</span></a>
          <a className="menuItem" href="#"><IconMoney /> <span>Financeiro</span></a>
          <a className="menuItem" href="#"><IconGrid /> <span>Obras</span></a>
          <a className="menuItem" href="#"><IconDoc /> <span>GMUDs</span></a>
          <a className="menuItem" href="#"><IconDoc /> <span>Relatórios</span></a>

          <div className="menuDivider" />

          <a className="menuItem" href="#"><IconBell /> <span>Atualizações</span> <span className="pill">4</span></a>
          <a className="menuItem" href="#"><IconCheck /> <span>Pendências</span> <span className="pill">2</span></a>
          <a className="menuItem" href="#"><IconGear /> <span>Painel de Controle</span></a>

          <div className="menuDivider" />

          <a className="menuItem" href="#"><IconUser /> <span>Meu Perfil</span></a>
          <a className="menuItem" href="#"><IconExit /> <span>Sair</span></a>
        </nav>
      </aside>

      <main className="main">

        <section className="hero" style={{ "--hero-img": `url(${heroImg})` }}>
          <div className="heroOverlay" />
          <div className="heroContent">

          <div className="tabsTop">
            <div className="tabs">
              <button className="tab active">Visão Geral</button>
              <button className="tab">Obras Futuras</button>
              <button className="tab">Obras em Andamento</button>
              <button className="tab">Obras Finalizadas</button>
            </div>
            <button
              type="button"
              className={`btnIcon ${pinned ? "isPinned" : ""}`}
              aria-label={pinned ? "Desafixar" : "Fixar"}
              aria-pressed={pinned}
              onClick={() => setPinned(v => !v)}
            >
              📌
            </button>
            
          </div>
          
            <Badge>ID 160</Badge>
            <h1 className="heroTitle">A Mobilização do Parcel dos Reis termina no dia 12 de janeiro.</h1>
            <p className="heroSub">Acesse a parada 160 e verifique suas pendências.</p>

            <div className="heroBottom">
              <div/>

              <div className="stats">
                <div className="statCard">
                  <div className="statTitle">Capex</div>
                  <div className="statLine">Estimado:</div>
                  <div className="statLine">Comprometido:</div>
                  <div className="statLine">Realizado:</div>
                </div>
                <div className="statCard">
                  <div className="statTitle">Esteira Financeira</div>
                  <div className="statLine">Com pendência:</div>
                  <div className="statLine">Materiais em atraso:</div>
                  <div className="statLine">Falha de conciliação:</div>
                </div>
                <div className="statCard">
                  <div className="statTitle">Não Conformidade</div>
                  <div className="statLine">NC Críticas em aberto:</div>
                  <div className="statLine">NC em tratamento:</div>
                  <div className="statLine">NC atentidas no período:</div>
                </div>
                <div className="statCard">
                  <div className="statTitle">GMUDs</div>
                  <div className="statLine">Em rascunho:</div>
                  <div className="statLine">Em aprovação:</div>
                  <div className="statLine">Impácto estimado total:</div>
                </div>

                <button className="btnPrimary">Acessar Parada <span aria-hidden="true">→</span></button>

              </div>
            </div>
          </div>
        </section>
      </main>

      <aside className="right">

        <div className="rightHeader">
          <div className="rightTitle">Atualizações</div>
          <a className="rightLink" href="#">Ver Todas</a>
        </div>

        <div className="rightTabs">
          <button type="buttom" className={`rTab ${updatesTab === "geral" ? "active" : ""}`}
          onClick={() => setUpdatesTab("geral")}
          >Geral</button>
          
          
          <button
            type="button"
            className={`rTab ${updatesTab === "minhas" ? "active" : ""}`}
            onClick={() => setUpdatesTab("minhas")}
          >Para Mim</button>
        </div>

        <UpdateList tab={updatesTab === "geral" ? "geral" : "minhas"} />

        
      </aside>

      <button className="fab" aria-label="Ação rápida">
        ✦
      </button>
    </div>
  );
}




function UpdateList({ tab }) {
  
  //chama o verificador de erro antes de imprimir
  const { data, loading, err } = useBff(
    `/bff/updates?tab=${encodeURIComponent(tab)}`,
    [tab]
  );

  if (loading) return <div className="updates">Carregando...</div>;
  if (err) return <div className="updates">Erro: {err}</div>;

  return (
    <div className="updates">
      {(data?.groups || []).map((g, idx) => (
        <div key={`${g.dateLabel}-${idx}`}>
          <div className="date">{g.dateLabel}</div>
          {(g.items || []).map((it, j) => (
            <UpdateCard key={`${it.title}-${it.time}-${j}`} {...it} />
          ))}
        </div>
      ))}
    </div>
  );
}




