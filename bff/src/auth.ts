import jwt, { JwtPayload, Algorithm, VerifyErrors } from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import "dotenv/config";
import { Request, Response, NextFunction } from "express";

// Estende o Request para incluir o usuário autenticado
export interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/discovery/v2.0/keys`
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
    } else {
      const signingKey = key?.getPublicKey();
      callback(null, signingKey);
    }
  });
}

/**
 * Middleware para validar o token JWT do Azure Entra ID.
 * Procura o token no header 'Authorization: Bearer <token>'
 */
export function validateJwt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de autorização ausente ou malformatado" });
  }

  const token = authHeader.split(" ")[1];

  // Configuração flexível para aceitar variações do Azure AD
  const audiences = [
    process.env.AZURE_CLIENT_ID,
    `api://${process.env.AZURE_CLIENT_ID}`
  ].filter((v): v is string => Boolean(v));

  const options = {
    audience: audiences.join(",") as string,
    issuer: [
      `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0`,
      `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/`,
      `https://sts.windows.net/${process.env.AZURE_TENANT_ID}/`
    ] as [string, ...string[]],
    algorithms: ["RS256" as Algorithm]
  };

  jwt.verify(token, getKey, options, (err: VerifyErrors | null, decoded: JwtPayload | string | undefined) => {
    if (err) {
      console.error("[AUTH] Erro na validação:", err.message);
      return res.status(401).json({ error: "Token inválido ou expirado", details: err.message });
    }

    // Adiciona o usuário decodificado ao request para uso posterior
    req.user = decoded;
    next();
  });
}
