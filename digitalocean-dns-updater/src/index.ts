import fs from 'fs'
import { z } from 'zod'
import { getScanInterval } from './utils';
import { getDomainARecords, getDomains } from './api'
import { publicIpv4 } from 'public-ip'

import DigitalOcean from 'do-wrapper'

let configFile

try {
	configFile = JSON.parse(fs.readFileSync('/data/options.json', 'utf8'))
	// configFile = JSON.parse(fs.readFileSync(process.cwd() + '/testData.json', 'utf8'))
} catch(error: unknown) {
	console.error('Configuration is not valid');
	process.exit(22);
}

const configSchema = z.object({
	scanInterval: z.coerce.number(),
	apiKey: z.string().nonempty(),
	domains: z.array(z.object({
		domain: z.string().nonempty(),
		ttl: z.coerce.number().default(600),
		subdomains: z.array(z.string().nonempty())
	}))
})

const parsed = configSchema.safeParse(configFile)


if(parsed.success === false) {
	console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
	process.exit(22);
}

const config = parsed.data

async function checkDomains() {
	const { apiKey } = config
	const instance = new DigitalOcean(apiKey)
	const registeredDomains = await getDomains({
		apiKey,
	})
	if(typeof registeredDomains === 'undefined') {
		console.error('No registered domains found on Digital Ocean account')
		process.exit(22)
	}
	const externalIP = await publicIpv4()
	console.log(`The current external IP is ${externalIP}`)
	for(const domainConfig of config.domains) {
		const registeredDomain = registeredDomains.domains.find(domain => domain.name === domainConfig.domain)
		if(typeof registeredDomain === 'undefined') {
			console.error(`The domain ${domainConfig.domain} is not registered on Digital Ocean account`)
			continue
		}
		console.log(`The domain ${domainConfig.domain} is registered on Digital Ocean account`)
		const [error, aRecords] = await getDomainARecords({ domain: domainConfig.domain }, { apiKey })
		if(error) {
			console.error('Error during A records fetching')
			console.error(error)
			continue;
		}
		const subdomainsToAdd = new Set(domainConfig.subdomains)
		const subdomainsToUpdate: Array<{ subdomain: string, recordId: string }> = [];
		aRecords?.domain_records.forEach(record => {
			if(subdomainsToAdd.has(record.name)) {
				subdomainsToAdd.delete(record.name)
			}
			if(record.data !== externalIP) {
				subdomainsToUpdate.push({ subdomain: record.name, recordId: record.id.toString() })
			}
		})
		console.log(`Subdomains to add: ${JSON.stringify(Array.from(subdomainsToAdd.values()))}`)
		console.log(`Subdomains to update: ${JSON.stringify(subdomainsToUpdate)}`)
		for(const subdomain of subdomainsToAdd) {
			try {
				await instance.domains.createRecord(domainConfig.domain, {
					data: externalIP,
					type: 'A',
					name: subdomain,
					ttl: domainConfig.ttl,
					tag: '',
				})
				console.log(`Created record for ${subdomain} on domain ${domainConfig.domain} with ttl ${domainConfig.ttl}`)
			} catch(err) {
				console.error(`Failed to create domain A record for ${subdomain}`)
			}
		}
		for(const subdomain of subdomainsToUpdate) {
			console.log(subdomain)
			try {
				await instance.domains.updateRecord(domainConfig.domain, subdomain.recordId, {
					data: externalIP,
					type: 'A',
					tag: '',
					name: subdomain.subdomain,
					ttl: domainConfig.ttl
				})
				console.log(`Ip refreshed for subdomain ${subdomain} on domain ${domainConfig.domain} with ttl ${domainConfig.ttl}`)
			} catch(error) {
				console.error(`Failed to update domain A record for ${subdomain}`)
			}
			console.log(`Ip refreshed for subdomain ${subdomain.subdomain} on domain ${domainConfig.domain} with ttl ${domainConfig.ttl}`)
		}
	}
}


async function startProcess() {
	await checkDomains()
	setTimeout(() => {
		startProcess()
	}, getScanInterval(config.scanInterval))
}

startProcess().catch(console.error)
