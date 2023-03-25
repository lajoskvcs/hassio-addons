var exampleEnvVar = process.env.EXAMPLE_ENV_VAR;

if (exampleEnvVar == undefined) {
	console.log("You must set a example env var in the addon config");
	process.exit(22);
}
