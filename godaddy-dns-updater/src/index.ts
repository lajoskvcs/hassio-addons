import fs from 'fs'
import { z } from 'zod'
import { getScanInterval } from './utils';
import { getDomains, putDomainARecord } from './api'
import { publicIpv4 } from 'public-ip'

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
	godaddySecret: z.string().nonempty(),
	godaddyKey: z.string().nonempty(),
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
	const { godaddyKey, godaddySecret } = config
	const registeredDomains = await getDomains({
		godaddyKey,
		godaddySecret
	})
	if(typeof registeredDomains === 'undefined') {
		console.error('No registered domains found on Godaddy account')
		process.exit(22)
	}
	const externalIP = await publicIpv4()
	console.log(`The current external IP is ${externalIP}`)
	for(const domainConfig of config.domains) {
		const registeredDomain = registeredDomains.find(registeredDomain => registeredDomain.domain === domainConfig.domain)
		if(typeof registeredDomain === 'undefined') {
			console.error(`The domain ${domainConfig.domain} is not registered on Godaddy account`)
			continue
		}
		if(registeredDomain.status !== 'ACTIVE') {
			console.log(`The domain ${domainConfig.domain} is not active. You may encounter unaccessibility`)
		}
		for(const subdomain of domainConfig.subdomains) {
			await putDomainARecord({
				domain: domainConfig.domain,
				subdomain,
				ttl: domainConfig.ttl,
				ip: externalIP
			}, { godaddyKey, godaddySecret })
			console.log(`Ip refreshed for subdomain ${subdomain} on domain ${domainConfig.domain} with ttl ${domainConfig.ttl}`)
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
