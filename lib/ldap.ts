import { Client } from "ldapts";
import pool from "./db";

export interface LdapUser {
  email: string;
  name: string;
  dn: string;
}

async function getLdapConfig() {
  const { rows } = await pool.query(
    `SELECT key, value FROM tg_settings
     WHERE key IN ('ldap_enabled','ldap_url','ldap_domain','ldap_base_dn','ldap_group_dn','ldap_bind_dn','ldap_bind_password','ldap_ca_cert')`
  );
  const cfg: Record<string, string> = {};
  for (const r of rows) cfg[r.key] = r.value;
  return cfg;
}

export async function isLdapEnabled(): Promise<boolean> {
  const cfg = await getLdapConfig();
  return cfg.ldap_enabled === "true" && !!cfg.ldap_url?.trim();
}

export async function ldapAuthenticate(
  email: string,
  password: string
): Promise<LdapUser | null> {
  const cfg = await getLdapConfig();

  if (cfg.ldap_enabled !== "true" || !cfg.ldap_url?.trim()) return null;

  const url     = cfg.ldap_url.trim();
  const domain  = cfg.ldap_domain?.trim() ?? "";
  const baseDn  = cfg.ldap_base_dn?.trim() ?? "";
  const groupDn = cfg.ldap_group_dn?.trim() ?? "";
  const bindDn  = cfg.ldap_bind_dn?.trim() ?? "";
  const bindPw  = cfg.ldap_bind_password ?? "";
  const caCert  = cfg.ldap_ca_cert?.trim() ?? "";

  const upn = email.includes("@") ? email : `${email}@${domain}`;

  const tlsOptions: Record<string, unknown> = { rejectUnauthorized: false };
  if (caCert) tlsOptions.ca = caCert;

  const client = new Client({ url, tlsOptions });

  try {
    await client.bind(upn, password);

    const { searchEntries } = await client.search(baseDn, {
      scope: "sub",
      filter: `(userPrincipalName=${upn})`,
      attributes: ["cn", "displayName", "mail", "memberOf"],
    });

    const entry = searchEntries[0];
    if (!entry) return null;

    // Gruppen-Check
    if (groupDn) {
      const memberOf = Array.isArray(entry.memberOf)
        ? (entry.memberOf as string[])
        : entry.memberOf ? [entry.memberOf as string] : [];

      const inGroup = memberOf.some((dn) => dn.toLowerCase() === groupDn.toLowerCase());

      if (!inGroup) {
        if (bindDn && bindPw) {
          try {
            const svc = new Client({ url, tlsOptions });
            await svc.bind(bindDn, bindPw);
            const { searchEntries: members } = await svc.search(groupDn, {
              scope: "base",
              filter: `(member:1.2.840.113556.1.4.1941:=${entry.dn})`,
              attributes: ["dn"],
            });
            await svc.unbind();
            if (members.length === 0) return null;
          } catch { return null; }
        } else { return null; }
      }
    }

    return {
      email: (entry.mail as string) || email,
      name:  (entry.displayName as string) || (entry.cn as string) || upn.split("@")[0],
      dn:    entry.dn,
    };
  } catch {
    return null;
  } finally {
    try { await client.unbind(); } catch { /* ignore */ }
  }
}
