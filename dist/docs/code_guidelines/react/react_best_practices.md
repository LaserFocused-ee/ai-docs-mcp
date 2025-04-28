# React Best Practices

## Project Structure

### Feature-based Organization

- Organize code by feature/domain rather than by type
- Use consistent file naming conventions (kebab-case or camelCase)
- Create index files to simplify imports
- Group related components in dedicated directories
- Separate UI components from container/page components
- Place reusable components in a shared/common directory
- Use relative paths for imports within a feature, absolute paths for cross-feature imports
- Keep business logic separate from UI components

## TypeScript Best Practices

- Use TypeScript consistently throughout the project
- Define explicit return types for functions and methods
- Use interface for public API contracts and type for complex internal types
- Avoid using `any` - use `unknown` for truly unknown types
- Leverage union types and type narrowing instead of type assertions
- Create dedicated type files (`types.ts`) for shared types
- Use generics to create reusable components and hooks
- Define prop types for React components using interfaces

## React Patterns

### Hooks Best Practices

- Follow React's Rules of Hooks:
  - Only call hooks at the top level, never inside loops, conditions, or nested functions
  - Only call hooks from React function components or custom hooks
  - Name custom hooks starting with "use" to follow convention
- Use functional components with hooks instead of class components
- Keep components small and focused on a single responsibility
- Extract reusable logic into custom hooks
- Use the Context API for data that needs to be accessed by many components
- Leverage React.memo for performance optimization when appropriate
- Handle side effects in useEffect hooks with proper dependency arrays
- Use refs (useRef) for values that shouldn't trigger re-renders
- Implement proper error boundaries
- Use React.lazy and Suspense for code splitting
- Adopt controlled components for form inputs when possible

## State Management

Choose ONE state management solution for your project - don't mix different state management libraries.

### Redux Toolkit Patterns

- Use createSlice instead of writing reducers and action creators manually
- Prefer the builder callback pattern for handling actions in reducers
- Use proper immutable update patterns (either via Immer or manual spreading)
- Avoid directly mutating state without returning it (common mistake with Immer)
- Use createAsyncThunk for handling async operations
- Leverage RTK Query for data fetching and cache management
- Extract selectors for accessing state in components
- Organize store by domain/feature with slice pattern
- Follow the ducks pattern for file organization

### MobX/MobX-State-Tree Patterns

- Use makeObservable/makeAutoObservable to define observable state
- Wrap state modifications in actions
- Use runInAction for async operations
- Create dedicated stores for different concerns
- Use computed properties for derived state
- Use the observer HOC to make React components reactive to MobX observables
- Use reactions (autorun, reaction, when) sparingly and clean them up properly
- When using MST:
  - Define models with types and actions in a structured way
  - Use references and identifiers for relationships between models
  - Create custom hooks to access and work with MST stores in components
  - Leverage snapshots for persistence and time-travel debugging
  - Use composition and references to model relationships
  - Use middleware for logging, validation, and persistence
  - Structure stores in a domain-driven way

## Styling

### Styled-Components Best Practices

- Always use styled-components for component styling
- Place styled components in dedicated `styles.ts` files within their module directories
- Follow component naming conventions with styled components (e.g., `StyledButton` instead of `Button`)
- Use theme provider and access theme variables instead of hardcoding values
- Establish a consistent styling system (spacing, colors, typography)
- Use global styles sparingly, prefer component-level styling
- Create reusable style components for common patterns
- Use props for style variations
- Apply responsive design using theme breakpoints
- Leverage CSS props for simple styling needs
- Follow a consistent naming convention for all style-related files

## Testing Best Practices

- Write tests for business logic and UI components
- Use React Testing Library for component tests (avoid testing implementation details)
- Test user interactions and accessibility
- Mock API calls and external dependencies
- Use test-driven development (TDD) for critical features
- Create reusable testing utilities
- Separate unit, integration, and end-to-end tests
- Test error states and edge cases
- Use snapshot testing sparingly and intentionally
- Aim for meaningful test coverage, not just high percentages
- Mock state management stores for component testing