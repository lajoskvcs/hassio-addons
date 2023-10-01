import { record, z } from 'zod'
import fetch from 'node-fetch'

const DIGITALOCEAN_DOMAIN = 'https://api.digitalocean.com'

const getDomainsSchema = z.object({
    domains: z.array(z.object({
        name: z.string(),
        ttl: z.optional(z.number()),
        zone_file: z.optional(z.string())
    })),
    links: z.object({}),
    meta: z.object({
        total: z.number()
    })
})
const getDomainARecordsSchema = z.object({
    domain_records: z.array(z.object({
        id: z.number(),
        type: z.string(),
        name: z.string(),
        data: z.string(),
        priority: z.nullable(z.number()),
        port: z.nullable(z.number()),
        ttl: z.number(),
        weight: z.nullable(z.number()),
        flags: z.nullable(z.number()),
    })),
    links: z.object({}),
    meta: z.object({
        total: z.number()
    })
})

type DomainARecordsResponse = z.infer<typeof getDomainARecordsSchema>

const getDomainARecordSchema = z.array(z.object({
    data: z.string(),
    name: z.string(),
    ttl: z.number(),
    type: z.enum(['A'])
}))

type godaddyOptions = {
    apiKey: string
}

export async function getDomains({
    apiKey,
}: godaddyOptions) {
    const response = await fetch(`${DIGITALOCEAN_DOMAIN}/v2/domains`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${apiKey}`,
        }
    })
    if(response.status === 200) {
        const parsed = await getDomainsSchema.safeParseAsync(await response.json())
        if(parsed.success) {
            return parsed.data
        }
    }
}

type GetDomainARecordsOptions = {
    domain: string
}

export async function getDomainARecords({
    domain
}: GetDomainARecordsOptions , {
    apiKey,
}: godaddyOptions): Promise<[string, null] | [null, DomainARecordsResponse]> {
    const response = await fetch(`${DIGITALOCEAN_DOMAIN}/v2/domains/${domain}/records?type=A`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${apiKey}`,
        }
    })
    if(response.status === 200) {
        const parsed = await getDomainARecordsSchema.safeParseAsync(await response.json())
        if(parsed.success) {
            return [null, parsed.data]
        }
        return [parsed.error.toString(), null]
    }
    return [response.statusText, null]
}

type PutDomainARecord = {
    domain: string
    subdomain: string
    ip: string
    ttl: number
}

export async function putDomainARecord({
    recordId,
    domain,
    subdomain,
    ip,
    ttl
}: PutDomainARecord & {recordId: number},
{
    apiKey
}: godaddyOptions) {
    const response = await fetch(`${DIGITALOCEAN_DOMAIN}/v2/domains/${domain}/records/${recordId}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify([{ type: 'A', data: ip, ttl }])
    })
}

export async function postDomainARecord({
    domain,
    subdomain,
    ip,
    ttl
}: PutDomainARecord,
{
    apiKey
}: godaddyOptions) {
    const response = await fetch(`${DIGITALOCEAN_DOMAIN}/v2/domains/${domain}/records`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
            type: 'A',
            name: subdomain,
            data: ip,
            ttl
        }])
    })
    if(!response.ok) {
        throw new Error(JSON.stringify(await response.json()))
    }
}
