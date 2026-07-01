const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const sm = new SecretsManagerClient({});

async function getApiToken(secretArn) {
  const { SecretString } = await sm.send(new GetSecretValueCommand({ SecretId: secretArn }));
  return SecretString;
}

async function cfRequest(method, path, apiToken, body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!data.success) throw new Error(`Cloudflare API error: ${JSON.stringify(data.errors)}`);
  return data;
}

exports.handler = async (event) => {
  const { apiTokenSecretArn, zoneId, type, name, content, proxied } = event.ResourceProperties;
  const apiToken = await getApiToken(apiTokenSecretArn);
  const record = { type, name, content, proxied: proxied === 'true', ttl: 1 };

  if (event.RequestType === 'Create') {
    const { result } = await cfRequest('POST', `/zones/${zoneId}/dns_records`, apiToken, record);
    return { PhysicalResourceId: result.id };
  }

  if (event.RequestType === 'Update') {
    const { result } = await cfRequest('PUT', `/zones/${zoneId}/dns_records/${event.PhysicalResourceId}`, apiToken, record);
    return { PhysicalResourceId: result.id };
  }

  if (event.RequestType === 'Delete') {
    await cfRequest('DELETE', `/zones/${zoneId}/dns_records/${event.PhysicalResourceId}`, apiToken);
    return { PhysicalResourceId: event.PhysicalResourceId };
  }
};
