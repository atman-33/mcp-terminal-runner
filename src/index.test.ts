import { mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { load } from 'js-yaml';
import { server } from './index.js';
import { registerTools } from './tools/index.js';

describe('MCP Server', () => {
  let client: Client;

  beforeAll(() => {
    registerTools(server);
  });

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
    process.env.ALLOWED_COMMANDS = '';
    process.env.ALLOWED_CWD_ROOTS = '';
  });

  it('should list execute_command tool', async () => {
    const result = await client.listTools();
    expect(result.tools).toBeDefined();
    expect(result.tools.some((t) => t.name === 'execute_command')).toBe(true);
    expect(result.tools.some((t) => t.name === 'execute_process')).toBe(true);
  });

  it('should execute allowed command', async () => {
    process.env.ALLOWED_COMMANDS = 'echo';
    const result = await client.callTool({
      name: 'execute_command',
      arguments: { command: 'echo hello', cwd: process.cwd() },
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
      arguments: { command: 'echo hello', cwd: process.cwd() },
    });

    expect(result.isError).toBe(true);
    expect((result.content as any)[0].text).toContain('not allowed');
  });

  it('should allow all commands with wildcard', async () => {
    process.env.ALLOWED_COMMANDS = '*';
    const result = await client.callTool({
      name: 'execute_command',
      arguments: { command: 'echo hello', cwd: process.cwd() },
    });

    expect(result.content).toBeDefined();
    const text = (result.content as any)[0].text;
    const output = load(text) as any;
    expect(output.exit_code).toBe(0);
  });

  it('should execute command with input', async () => {
    process.env.ALLOWED_COMMANDS = 'cat';
    const result = await client.callTool({
      name: 'execute_command',
      arguments: {
        command: 'cat',
        cwd: process.cwd(),
        input: 'hello world',
      },
    });

    expect(result.content).toBeDefined();
    const text = (result.content as any)[0].text;
    const output = load(text) as any;
    expect(output.exit_code).toBe(0);
    expect(output.stdout).toContain('hello world');
  });

  it('should execute command within absolute cwd', async () => {
    process.env.ALLOWED_COMMANDS = 'node';

    const cwdDir = await mkdtemp(join(tmpdir(), 'mcp-terminal-runner-cwd-'));

    const result = await client.callTool({
      name: 'execute_command',
      arguments: {
        command: "node -p 'process.cwd()'",
        cwd: cwdDir,
      },
    });

    if (result.isError) {
      const message = (result.content as any)?.[0]?.text ?? 'unknown error';
      throw new Error(message);
    }

    expect(result.isError).not.toBe(true);
    const text = (result.content as any)[0].text;
    const output = load(text) as any;
    expect(output.exit_code).toBe(0);
    expect(String(output.stdout)).toContain(cwdDir);
  });

  it('should execute command within relative cwd', async () => {
    process.env.ALLOWED_COMMANDS = 'node';

    const baseDir = join(process.cwd(), '.tmp');
    await mkdir(baseDir, { recursive: true });
    const cwdDir = await mkdtemp(join(baseDir, 'mcp-terminal-runner-cwd-rel-'));
    const relativeCwd = relative(process.cwd(), cwdDir);

    const result = await client.callTool({
      name: 'execute_command',
      arguments: {
        command: "node -p 'process.cwd()'",
        cwd: relativeCwd,
      },
    });

    if (result.isError) {
      const message = (result.content as any)?.[0]?.text ?? 'unknown error';
      throw new Error(message);
    }

    expect(result.isError).not.toBe(true);
    const text = (result.content as any)[0].text;
    const output = load(text) as any;
    expect(output.exit_code).toBe(0);
    expect(String(output.stdout)).toContain(cwdDir);
  });

  it('should fail when cwd does not exist', async () => {
    process.env.ALLOWED_COMMANDS = 'node';

    const result = await client.callTool({
      name: 'execute_command',
      arguments: {
        command: 'node -p process.cwd()',
        cwd: 'does-not-exist',
      },
    });

    expect(result.isError).toBe(true);
    expect((result.content as any)[0].text).toContain('cwd does not exist');
  });

  it('should restrict cwd when ALLOWED_CWD_ROOTS is set', async () => {
    process.env.ALLOWED_COMMANDS = 'node';

    const rootDir = await mkdtemp(join(tmpdir(), 'mcp-terminal-runner-root-'));
    const childDir = join(rootDir, 'frontend');
    await mkdir(childDir, { recursive: true });

    process.env.ALLOWED_CWD_ROOTS = rootDir;

    const allowedResult = await client.callTool({
      name: 'execute_command',
      arguments: {
        command: "node -p 'process.cwd()'",
        cwd: childDir,
      },
    });

    expect(allowedResult.isError).not.toBe(true);
    const allowedText = (allowedResult.content as any)[0].text;
    const allowedOutput = load(allowedText) as any;
    expect(allowedOutput.exit_code).toBe(0);
    expect(String(allowedOutput.stdout)).toContain(childDir);

    const disallowedResult = await client.callTool({
      name: 'execute_command',
      arguments: {
        command: 'node -p process.cwd()',
        cwd: tmpdir(),
      },
    });

    expect(disallowedResult.isError).toBe(true);
    expect((disallowedResult.content as any)[0].text).toContain(
      'ALLOWED_CWD_ROOTS'
    );
  });

  it('should fail with configuration error when ALLOWED_CWD_ROOTS contains invalid root', async () => {
    process.env.ALLOWED_COMMANDS = 'node';

    const rootDir = await mkdtemp(
      join(tmpdir(), 'mcp-terminal-runner-root-invalid-')
    );
    const childDir = join(rootDir, 'frontend');
    await mkdir(childDir, { recursive: true });

    process.env.ALLOWED_CWD_ROOTS = `${rootDir},${join(rootDir, 'does-not-exist')}`;

    const result = await client.callTool({
      name: 'execute_command',
      arguments: {
        command: 'node -p process.cwd()',
        cwd: childDir,
      },
    });

    expect(result.isError).toBe(true);
    expect((result.content as any)[0].text).toContain('Invalid configuration');
    expect((result.content as any)[0].text).toContain('ALLOWED_CWD_ROOTS');
  });

  it('should execute chained commands with &&', async () => {
    process.env.ALLOWED_COMMANDS = 'echo';
    const result = await client.callTool({
      name: 'execute_command',
      arguments: {
        command: 'echo hello && echo world',
        cwd: process.cwd(),
      },
    });

    expect(result.isError).not.toBe(true);
    const text = (result.content as any)[0].text;
    const output = load(text) as any;
    expect(output.exit_code).toBe(0);
    expect(output.stdout).toContain('hello');
    expect(output.stdout).toContain('world');
  });

  it('should time out execute_command and return error', async () => {
    process.env.ALLOWED_COMMANDS = 'sleep';

    const result = await client.callTool({
      name: 'execute_command',
      arguments: {
        command: 'sleep 2',
        cwd: process.cwd(),
        timeout_ms: 50,
      },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as any)[0].text;
    const output = load(text) as any;
    expect(output.exit_code).toBe(124);
    expect(String(output.stderr)).toContain('Timed out after 50ms');
  });

  it('should execute argv-based process with execute_process', async () => {
    process.env.ALLOWED_COMMANDS = 'python3';

    const result = await client.callTool({
      name: 'execute_process',
      arguments: {
        file: 'python3',
        args: ['-c', 'print("hello")'],
        cwd: process.cwd(),
      },
    });

    if (result.isError) {
      const message = (result.content as any)?.[0]?.text ?? 'unknown error';
      throw new Error(message);
    }

    const text = (result.content as any)[0].text;
    const output = load(text) as any;
    expect(output.exit_code).toBe(0);
    expect(String(output.stdout)).toContain('hello');
  });

  it('should reject disallowed execute_process file', async () => {
    process.env.ALLOWED_COMMANDS = 'echo';

    const result = await client.callTool({
      name: 'execute_process',
      arguments: {
        file: 'python3',
        args: ['-c', 'print("hello")'],
        cwd: process.cwd(),
      },
    });

    expect(result.isError).toBe(true);
    expect((result.content as any)[0].text).toContain('not allowed');
  });
});
