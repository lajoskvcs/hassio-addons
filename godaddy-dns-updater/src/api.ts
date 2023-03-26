import { z } from 'zod'

const GODADDY_DOMAIN = 'https://api.godaddy.com'

const getDomainsSchema = z.array(z.object({
    domain: z.string(),
    domainId: z.number(),
    status: z.enum(['ACTIVE', 'INACTIVE'])
}))

const getDomainARecordSchema = z.array(z.object({
    data: z.string(),
    name: z.string(),
    ttl: z.number(),
    type: z.enum(['A'])
}))

type godaddyOptions = {
    godaddyKey: string
    godaddySecret: string
}

export async function getDomains({
    godaddyKey,
    godaddySecret
}: godaddyOptions) {
    const response = await fetch(`${GODADDY_DOMAIN}/v1/domains`, {
        method: 'GET',
        headers: {
            Authorization: `sso-key ${godaddyKey}:${godaddySecret}`,
        }
    })
    if(response.status === 200) {
        const parsed = await getDomainsSchema.safeParseAsync(response.json())
        if(parsed.success) {
            return parsed.data
        }
    }
}

type GetDomainARecordsOptions = {
    domain: string
    subdomain: string
}

export async function getDomainARecords({
    domain,
    subdomain
}: GetDomainARecordsOptions , {
    godaddyKey,
    godaddySecret
}: godaddyOptions) {
    const response = await fetch(`${GODADDY_DOMAIN}/v1/domains/${domain}/records/A/${subdomain}`, {
        method: 'GET',
        headers: {
            Authorization: `sso-key ${godaddyKey}:${godaddySecret}`,
        }
    })
    if(response.status === 200) {
        const parsed = await getDomainsSchema.safeParseAsync(response.json())
        if(parsed.success) {
            return parsed.data
        }
    }
}

type PutDomainARecord = {
    domain: string
    subdomain: string
    ip: string
    ttl: number
}

export async function putDomainARecord({
    domain,
    subdomain,
    ip,
    ttl
}: PutDomainARecord,
{
    godaddyKey,
    godaddySecret
}: godaddyOptions) {
    const response = await fetch(`${GODADDY_DOMAIN}/v1/domains/${domain}/records/A/${subdomain}`, {
        method: 'PUT',
        headers: {
            Authorization: `sso-key ${godaddyKey}:${godaddySecret}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify([{ data: ip, ttl }])
    })
    if(response.status === 200) {
        const parsed = await getDomainsSchema.safeParseAsync(response.json())
        if(parsed.success) {
            return parsed.data
        }
    }
}
