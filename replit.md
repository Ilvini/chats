# Overview

This is a modern chat platform application that enables businesses to create and manage embeddable chat widgets for their websites. The application provides a dashboard for managing chat rooms, real-time messaging capabilities via WebSocket connections, and generates customizable embed codes for integration into external websites. The platform supports multiple chat rooms with participant management and message history.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript, utilizing Vite for development and build tooling
- **UI Library**: Comprehensive shadcn/ui component system built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod schema validation for type-safe form handling

## Backend Architecture
- **Server Framework**: Express.js with TypeScript running in ESM mode
- **Real-time Communication**: WebSocket Server for live chat functionality with connection management and room-based messaging
- **API Design**: RESTful endpoints for chat room CRUD operations, message retrieval, and participant management
- **Data Storage**: In-memory storage implementation with interface abstraction for future database integration

## Database Schema
The application uses Drizzle ORM with PostgreSQL-compatible schema definitions:
- **Chat Rooms**: Core entities with status management and JSON settings storage
- **Messages**: User messages with type classification (user/system/bot) and timestamp tracking
- **Participants**: Chat room membership tracking with active status monitoring
- **Schema Validation**: Zod schemas generated from Drizzle tables for runtime type safety

## Real-time Features
- **WebSocket Integration**: Bidirectional communication for instant message delivery
- **Typing Indicators**: Real-time typing status broadcasts to room participants
- **Connection Management**: Automatic reconnection handling with exponential backoff
- **Room-based Messaging**: Isolated communication channels per chat room

## Embedding System
- **Configurable Widgets**: Customizable chat widgets with theme and positioning options
- **Iframe Integration**: Secure embedding via iframe with configurable dimensions
- **JavaScript Widget**: Advanced embedding option with floating chat interface
- **URL Parameter Support**: Pre-filled user names and configuration via query parameters

# External Dependencies

## Core Libraries
- **@neondatabase/serverless**: PostgreSQL database connectivity (configured but using in-memory storage)
- **drizzle-orm**: Type-safe database operations and schema management
- **@tanstack/react-query**: Server state management and data synchronization
- **ws**: WebSocket server implementation for real-time communication

## UI Framework
- **@radix-ui/***: Comprehensive set of accessible, unstyled UI primitives
- **tailwindcss**: Utility-first CSS framework for styling
- **class-variance-authority**: Type-safe component variant management
- **shadcn/ui**: Pre-built component library with consistent design system

## Development Tools
- **vite**: Modern build tool with HMR and TypeScript support
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **tsx**: TypeScript execution for server development
- **esbuild**: Fast bundling for production builds

## Form and Validation
- **react-hook-form**: Performant form library with minimal re-renders
- **@hookform/resolvers**: Integration layer for validation libraries
- **zod**: Runtime type validation and schema definition
- **drizzle-zod**: Automatic Zod schema generation from database schemas

## Utilities
- **date-fns**: Modern date manipulation library
- **clsx**: Conditional className utility
- **nanoid**: Secure, URL-safe unique string generation
- **embla-carousel-react**: Touch-friendly carousel component