# MCP TypeScript Minimal Server

A minimal Model Context Protocol (MCP) server implementation in TypeScript that demonstrates basic tool functionality with `hello` and `echo` commands.

## Features

- **Hello Tool**: Returns a simple greeting message
- **Echo Tool**: Echoes back any message you provide
- Built with TypeScript and the official MCP SDK
- Input validation using Zod schemas
- Development tools: Ultracite for linting/formatting, Husky for git hooks

## Installation

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd mcp-ts-minimal
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### Running the Server

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

### Available Tools

#### 1. Hello Tool
- **Name**: `hello`
- **Description**: Responds with a greeting message
- **Parameters**: None
- **Example Response**: "Hello from MCP server"

#### 2. Echo Tool
- **Name**: `echo`
- **Description**: Echoes the provided message
- **Parameters**:
  - `message` (string, required): The message to echo back
- **Example Response**: "Echo: Your message here"

## MCP Client Configuration

To use this server with an MCP client, add the following configuration to your MCP settings:

### Using with npx (Recommended)

If you publish this package to npm, you can use it with npx:

```json
{
  "mcpServers": {
    "mcp-ts-minimal": {
      "command": "npx",
      "args": ["mcp-ts-minimal@latest"],
      "disabled": false
    }
  }
}
```

## Development

### Available Scripts

- `npm run build` - Build the TypeScript project
- `npm run dev` - Run in development mode with ts-node
- `npm start` - Run the built JavaScript version
- `npm run check` - Check code with Ultracite
- `npm run fix` - Check and fix issues with Ultracite
- `npm run typecheck` - Run TypeScript type checking
- `npm run quality` - Run typecheck and check

### Project Structure

```
mcp-ts-minimal/
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Built JavaScript files
├── .husky/              # Git hooks
├── biome.json           # Biome configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Project dependencies and scripts
└── README.md           # This file
```

### Adding New Tools

To add a new tool to the server:

1. Define the input schema using Zod:
```typescript
const MyToolInputSchema = z.object({
  param1: z.string(),
  param2: z.number().optional(),
});
```

2. Add the tool handler in the `CallToolRequestSchema` handler:
```typescript
case 'my-tool': {
  const parsed = MyToolInputSchema.safeParse(args);
  if (!parsed.success) {
    return {
      content: [{ type: 'text', text: `Invalid arguments: ${parsed.error}` }],
      isError: true,
    };
  }
  
  // Your tool logic here
  return {
    content: [{ type: 'text', text: 'Tool response' }],
  };
}
```

3. Add the tool definition in the `ListToolsRequestSchema` handler:
```typescript
{
  name: 'my-tool',
  description: 'Description of what your tool does',
  inputSchema: zodToJsonSchema(MyToolInputSchema),
}
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run quality` to ensure code quality
5. Commit your changes (Husky will run pre-commit hooks)
6. Push to your branch
7. Create a Pull Request

## Troubleshooting

### Common Issues

1. **Server not starting**: Ensure all dependencies are installed and the project is built
2. **Tools not appearing**: Check that the MCP client configuration points to the correct path
3. **Permission errors**: Make sure the built JavaScript file has execute permissions

### Debug Mode

To enable debug logging, set the environment variable:
```bash
DEBUG=mcp* npm start
```