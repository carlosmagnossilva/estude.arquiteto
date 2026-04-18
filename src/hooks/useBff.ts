import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { IBffResponse } from "@hub/types";

// Controle de erro para todos os componentes se comunicarem com BFF
export function useBff<T = any>(url: string, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);
  const { instance, accounts } = useMsal();

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      if (accounts.length === 0) return;

      try {
        setLoading(true);
        setErr(null);

        // Adquirir token de acesso ESPECÍFICO para a nossa API
        const scope = process.env.REACT_APP_AZURE_SCOPE;
        if (!scope) throw new Error("Configuração REACT_APP_AZURE_SCOPE ausente.");

        const tokenResponse = await instance.acquireTokenSilent({
          scopes: [scope],
          account: accounts[0]
        });

        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "Authorization": `Bearer ${tokenResponse.accessToken}`,
            "Content-Type": "application/json"
          }
        });

        if (res.status === 401) throw new Error("Não autorizado. Faça login novamente.");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        setData(json);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setErr(e.message || "Erro ao carregar");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, accounts]);

  return { data, loading, err };
}
