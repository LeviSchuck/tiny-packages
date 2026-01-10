# tiny-html Client Example

A live demo application showcasing the `@levischuck/tiny-html` library in a React application.

## Features

- **Live HTML Parsing**: Type HTML on the left and see it rendered in real-time on the right
- **Flexbox Layout**: Responsive side-by-side layout with beautiful styling
- **Dark Mode Support**: Automatically adapts to your system's color scheme
- **Error Handling**: Displays parsing errors in a user-friendly way

## Running the App

```bash
# Install dependencies (if not already done)
bun install

# Start the development server
bun run dev
```

The app will be available at [http://localhost:5173/](http://localhost:5173/)

## Building for Production

```bash
bun run build
```

## How It Works

The application uses `readHtml` from `@levischuck/tiny-html` to parse HTML input strings into React elements, which are then rendered directly in the React component tree.

```typescript
import { readHtml } from '@levischuck/tiny-html';

const result = readHtml('<div>Hello World</div>');
// result.node is now a ReactNode that can be rendered
```

## Tech Stack

- React 19
- TypeScript
- Vite
- Bun
- @levischuck/tiny-html
