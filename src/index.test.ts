import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
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
  });

  it('should list tools', async () => {
    const result = await client.listTools();
    expect(result.tools).toBeDefined();
    expect(result.tools.length).toBeGreaterThan(0);
    expect(result.tools.some((t) => t.name === 'hello')).toBe(true);
    expect(result.tools.some((t) => t.name === 'echo')).toBe(true);
  });

  it('should call hello tool', async () => {
    const result = await client.callTool({
      name: 'hello',
      arguments: {},
    });

    expect(result.content).toBeDefined();
    expect((result.content as any)[0].type).toBe('text');

    const content = (result.content as any)[0];
    if (content.type === 'text') {
      expect(content.text).toBe('Hello from MCP server');
    } else {
      throw new Error('Expected text content');
    }
  });

  it('should call echo tool', async () => {
    const message = 'Hello, World!';
    const result = await client.callTool({
      name: 'echo',
      arguments: { message },
    });

    expect(result.content).toBeDefined();
    expect((result.content as any)[0].type).toBe('text');

    const content = (result.content as any)[0];
    if (content.type === 'text') {
      expect(content.text).toBe(`Echo: ${message}`);
    } else {
      throw new Error('Expected text content');
    }
  });
});
