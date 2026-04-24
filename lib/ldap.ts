import { Client } from "ldapts";

export interface LdapUser {
  email: string;
  name: string;
  dn: string;
}

export async function ldapAuthenticate(
  email: string,
  password: string
): Promise<LdapUser | null> {
  const url      = process.env.LDAP_URL!;
  const domain   = process.env.LDAP_DOMAIN ?? "";           // z.B. rohde.cl.darp.ad
  const baseDn   = process.env.LDAP_BASE_DN ?? "";          // z.B. DC=rohde,DC=cl,DC=darp,DC=ad
  const groupDn  = process.env.LDAP_GROUP_DN ?? "";         // z.B. CN=Topograph,OU=Groups,...
  const bindDn   = process.env.LDAP_BIND_DN ?? "";          // Service-Account-DN (optional)
  const bindPw   = process.env.LDAP_BIND_PASSWORD ?? "";

  // UPN: user@domain.com oder nur user
  const upn = email.includes("@") ? email : `${email}@${domain}`;

  const client = new Client({ url, tlsOptions: { rejectUnauthorized: false } });

  try {
    // Mit User-Credentials binden (verifiziert Passwort)
    await client.bind(upn, password);

    // Suche nach dem Nutzer
    const { searchEntries } = await client.search(baseDn, {
      scope: "sub",
      filter: `(userPrincipalName=${upn})`,
      attributes: ["cn", "displayName", "mail", "memberOf"],
    });

    const entry = searchEntries[0];
    if (!entry) return null;

    // Gruppen-Check (falls LDAP_GROUP_DN gesetzt)
    if (groupDn) {
      const memberOf = Array.isArray(entry.memberOf)
        ? (entry.memberOf as string[])
        : entry.memberOf ? [entry.memberOf as string] : [];

      const inGroup = memberOf.some(
        (dn: string) => dn.toLowerCase() === groupDn.toLowerCase()
      );

      // Falls nicht direkt in Gruppe: prüfe rekursiv via Service-Account
      if (!inGroup) {
        if (bindDn && bindPw) {
          try {
            const svcClient = new Client({ url, tlsOptions: { rejectUnauthorized: false } });
            await svcClient.bind(bindDn, bindPw);
            const { searchEntries: groupMembers } = await svcClient.search(groupDn, {
              scope: "base",
              filter: `(member:1.2.840.113556.1.4.1941:=${entry.dn})`,
              attributes: ["dn"],
            });
            await svcClient.unbind();
            if (groupMembers.length === 0) return null;
          } catch {
            return null;
          }
        } else {
          return null;
        }
      }
    }

    const resolvedName =
      (entry.displayName as string) || (entry.cn as string) || upn.split("@")[0];
    const resolvedEmail = (entry.mail as string) || email;

    return { email: resolvedEmail, name: resolvedName, dn: entry.dn };
  } catch {
    return null;
  } finally {
    try { await client.unbind(); } catch { /* ignore */ }
  }
}
