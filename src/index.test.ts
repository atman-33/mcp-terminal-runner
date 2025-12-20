import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { load } from 'js-yaml';
import { server } from './index.js';

describe('MCP Server', () => {
  let client: Client;

  beforeEach(async () => {
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    // Connect server
    await server.connect(serverTransport);

    // Connect client
    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} }
    );
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await client.close();
    await server.close();
    process.env.ALLOWED_COMMANDS = undefined;
  });

  it('should list execute_command tool', async () => {
    const result = await client.listTools();
    expect(result.tools).toBeDefined();
    expect(result.tools.some((t) => t.name === 'execute_command')).toBe(true);
  });

  it('should execute allowed command', async () => {
    process.env.ALLOWED_COMMANDS = 'echo';
    const result = await client.callTool({
      name: 'execute_command',
      arguments: { command: 'echo hello' },
    });

    expect(result.content).toBeDefined();
    expect((result.content as any)[0].type).toBe('text');
    const text = (result.content as any)[0].text;
    const output = load(text) as any;
    expect(output.exit_code).toBe(0);
    expect(output.stdout).toContain('hello');
  });

  it('should fail for disallowed command', async () => {
    process.env.ALLOWED_COMMANDS = 'ls';
    const result = await client.callTool({
      name: 'execute_command',
      arguments: { command: 'echo hello' },
    });

    expect(result.isError).toBe(true);
    expect((result.content as any)[0].text).toContain('not allowed');
  });

  it('should allow all commands with wildcard', async () => {
    process.env.ALLOWED_COMMANDS = '*';
    const result = await client.callTool({
      name: 'execute_command',
      arguments: { command: 'echo hello' },
    });

    expect(result.content).toBeDefined();
    const text = (result.content as any)[0].text;
    const output = load(text) as any;
    expect(output.exit_code).toBe(0);
  });
});
