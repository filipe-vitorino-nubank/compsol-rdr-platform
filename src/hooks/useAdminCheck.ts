import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { env } from "../config/env";

export function useAdminCheck() {
  const { googleUser, getAccessTokenForSheets } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!googleUser?.email) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        if (env.isAppsScript && (window as any).google?.script?.run) {
          const result = await new Promise<{ isAdmin: boolean; error: string | null }>((resolve, reject) => {
            (window as any).google.script.run
              .withSuccessHandler(resolve)
              .withFailureHandler(reject)
              .checkIsAdmin(googleUser.email);
          });
          setIsAdmin(result.isAdmin);
        } else {
          const token = await getAccessTokenForSheets({ interactive: false });
          const sheetId = env.sheetId;
          const range = "Admins!A2:C";
          const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;

          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) throw new Error(`Sheets API ${res.status}`);

          const data = await res.json();
          const rows: string[][] = data.values || [];

          const found = rows.find(
            (row) =>
              row[0]?.toLowerCase() === googleUser.email.toLowerCase() &&
              row[2]?.toLowerCase() === "true",
          );

          setIsAdmin(!!found);
        }
      } catch (err) {
        console.error("[useAdminCheck] Erro:", (err as Error).message);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [googleUser?.email, getAccessTokenForSheets]);

  return { isAdmin, isLoading };
}
